#!/usr/bin/env bash
# Continuous deployment on the UB VM (docs/24 "Continuous deployment"). A systemd timer runs this as
# root every 5 minutes (deploy/install-cd.sh). The VM pulls: GitHub holds no key to this machine and
# no inbound port is opened.
#
#  1. Asks ghcr.io which image `main` points to. CI moves `main` only after both images of a commit
#     are built, published and signed. The same digest as the running app → nothing to do.
#  2. Holds while the canteen serves: never between 11:00 and 17:30 on a weekday (docs/12), never
#     while /etc/ubite/cd-paused exists.
#  3. Pulls the image by digest and checks its signature with cosign: the certificate must name
#     .github/workflows/ci.yml on refs/heads/main of shers0a/UBite, and the commit the image says it
#     was built from. An image built anywhere else, or from another branch, never runs here.
#  4. Checks out that commit (compose file, Caddyfile, this script), backs up the database, migrates,
#     replaces caddy, app and the counter, and waits until /api/health names the commit, directly and
#     through Caddy with the real certificate.
#  5. If the new version does not come up, the previous images come back. The alert addresses
#     (ALERT_EMAILS) hear about every deploy and every failure; a failed digest is not retried.
#
#   deploy/cd.sh               what the timer runs
#   deploy/cd.sh --status      what runs, what main is, and why it waits
#   deploy/cd.sh --now         deploy now, even during the lunch hold (an urgent fix)
#   deploy/cd.sh --retry       forget a failed digest and try it again
#   deploy/cd.sh --rollback    back to the previous version, and pause
#   deploy/cd.sh --pause | --resume
#
# Settings come from /etc/ubite/cd.env when it exists (the defaults below suit the UB VM). The app's
# own settings (DOMAIN, POSTGRES_PASSWORD, SMTP_URL, MAIL_FROM, ALERT_EMAILS) come from .env.
#
# The whole script is one block: bash reads all of it before it runs, so checking out a new commit
# (which may change this file) cannot change the run that is in progress.
{
set -euo pipefail
umask 022
export PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin

REPO_DIR=/opt/ubite
COMPOSE_FILE=docker-compose.prod.yml
GITHUB_REPO=shers0a/UBite
IMAGE=ghcr.io/shers0a/ubite
VISION_IMAGE=ghcr.io/shers0a/ubite-vision
SIGNER="https://github.com/$GITHUB_REPO/.github/workflows/ci.yml@refs/heads/main"
ISSUER=https://token.actions.githubusercontent.com
STATE_DIR=/var/lib/ubite-cd
PAUSE_FILE=/etc/ubite/cd-paused
# The counter is deployed with the app when its container exists (auto), always (yes) or never (no).
CD_VISION=auto
# "user:token" (a classic token with read:packages) only if the packages on ghcr.io are private.
GHCR_AUTH=
# shellcheck source=/dev/null
[ -f /etc/ubite/cd.env ] && . /etc/ubite/cd.env
SIGNER="${CD_SIGNER:-$SIGNER}"

ACCEPT='application/vnd.oci.image.manifest.v1+json, application/vnd.docker.distribution.manifest.v2+json, application/vnd.oci.image.index.v1+json, application/vnd.docker.distribution.manifest.list.v2+json'

log() { printf '%s\n' "$*"; }
die() { log "error: $*"; exit 1; }
record() { printf '%s %s\n' "$(date -Is)" "$*" >> "$STATE_DIR/history"; }

# A value from the app's .env, without surrounding quotes.
env_get() {
  sed -n "s/^$1=//p" "$REPO_DIR/.env" | tail -n 1 | sed -e 's/^"\(.*\)"$/\1/' -e "s/^'\(.*\)'$/\1/"
}

compose() { (cd "$REPO_DIR" && podman-compose -f "$COMPOSE_FILE" "$@"); }

# The digest a tag points to on ghcr.io, without pulling anything.
registry_digest() { # <owner/name> <tag>
  local body token
  local -a auth=()
  [ -n "$GHCR_AUTH" ] && auth=(-u "$GHCR_AUTH")
  body=$(curl -fsS --max-time 20 "${auth[@]}" "https://ghcr.io/token?scope=repository:$1:pull&service=ghcr.io") || return 1
  token=$(printf '%s' "$body" | sed -n 's/.*"token":"\([^"]*\)".*/\1/p')
  [ -n "$token" ] || return 1
  curl -fsS --max-time 20 -I -H "Authorization: Bearer $token" -H "Accept: $ACCEPT" \
      "https://ghcr.io/v2/$1/manifests/$2" \
    | tr -d '\r' | sed -n 's/^[Dd]ocker-[Cc]ontent-[Dd]igest: *//p' | grep -E '^sha256:[0-9a-f]{64}$'
}

# The image reference a container was created from ("" when it does not exist).
container_ref() { podman container inspect "$1" --format '{{.ImageName}}' 2>/dev/null || true; }
exists() { podman container exists "$1" 2>/dev/null; }

vision_managed() {
  case "$CD_VISION" in
    yes) return 0 ;;
    no) return 1 ;;
    *) exists ubite_vision_1 ;;
  esac
}

# The version /api/health names inside the app container ("" when it does not answer).
app_version() {
  podman exec ubite_app_1 node -e "fetch('http://127.0.0.1:8080/api/health').then(r=>r.json()).then(j=>console.log(j.ok?j.version:'')).catch(()=>console.log(''))" 2>/dev/null || true
}

verify() { # <image@digest> <commit>
  cosign verify \
    --certificate-identity "$SIGNER" \
    --certificate-oidc-issuer "$ISSUER" \
    --certificate-github-workflow-repository "$GITHUB_REPO" \
    --certificate-github-workflow-ref refs/heads/main \
    --certificate-github-workflow-sha "$2" \
    "$1" > /dev/null 2> "$STATE_DIR/cosign.log"
}

# Pull by digest, read the commit from the label, check the signature. Prints the commit.
pull_verified() { # <image@digest>
  local sha
  podman pull -q "$1" > /dev/null || return 2
  sha=$(podman image inspect "$1" --format '{{ index .Labels "org.opencontainers.image.revision" }}' 2>/dev/null || true)
  [[ $sha =~ ^[0-9a-f]{40}$ ]] || { log "$1 names no commit" >&2; return 1; }
  verify "$1" "$sha" || { log "$1: the signature is not ci.yml on main for $sha: $(tail -n 3 "$STATE_DIR/cosign.log")" >&2; return 1; }
  printf '%s\n' "$sha"
}

alert() { # <subject> <body>
  local url from to addr a
  local -a rcpts=() list=()
  url=$(env_get SMTP_URL); from=$(env_get MAIL_FROM); to=$(env_get ALERT_EMAILS)
  [ -n "$url" ] && [ -n "$to" ] || { log "no SMTP_URL or ALERT_EMAILS in .env: nobody was told"; return 0; }
  addr=$(printf '%s' "$from" | sed -n 's/.*<\([^>]*\)>.*/\1/p'); [ -n "$addr" ] || addr=$from
  IFS=', ' read -r -a list <<< "$to"
  for a in "${list[@]}"; do [ -n "$a" ] && rcpts+=(--mail-rcpt "$a"); done
  printf 'From: %s\r\nTo: %s\r\nSubject: =?UTF-8?B?%s?=\r\nMIME-Version: 1.0\r\nContent-Type: text/plain; charset=UTF-8\r\n\r\n%s\r\n' \
      "$from" "$to" "$(printf '%s' "$1" | base64 -w0)" "$2" \
    | curl -sS --max-time 30 --ssl-reqd --url "$url" --mail-from "$addr" "${rcpts[@]}" --upload-file - \
    || log "the alert email could not be sent"
}

in_hold() {
  local dow hm
  dow=$(TZ=Europe/Bucharest date +%u); hm=$(TZ=Europe/Bucharest date +%H%M)
  [ "$dow" -le 5 ] && (( 10#$hm >= 1100 && 10#$hm < 1730 ))
}

# Replace caddy, the counter and the app with these images. caddy and the counter depend on the app,
# so they go first; a counter that exists is always recreated (with its own image when none is given).
swap() { # <app image> <vision image or "">
  local vision=${2:-}
  [ -z "$vision" ] && exists ubite_vision_1 && vision=$(container_ref ubite_vision_1)
  podman rm -f ubite_caddy_1 > /dev/null 2>&1 || true
  podman rm -f ubite_vision_1 > /dev/null 2>&1 || true
  podman rm -f ubite_app_1 > /dev/null 2>&1 || true
  local -a services=(db app caddy)
  [ -n "$vision" ] && services+=(vision)
  # db is already running: podman-compose 1.0 reports its name as taken, which is harmless.
  UBITE_IMAGE="$1" UBITE_VISION_IMAGE="${vision:-localhost/ubite_vision:latest}" \
    compose up -d --no-build "${services[@]}" > "$STATE_DIR/compose.log" 2>&1 || true
}

healthy() { # <expected version, or "" for any> <with vision: 1 or "">
  local v="" ip domain
  for _ in $(seq 1 40); do
    v=$(app_version)
    if [ -n "$v" ] && { [ -z "$1" ] || [ "$v" = "$1" ]; }; then break; fi
    v=""; sleep 3
  done
  [ -n "$v" ] || { log "the app does not answer /api/health${1:+ with $1}"; return 1; }
  # Through Caddy with the real certificate (the VM cannot reach its own public IP, so straight to Caddy).
  domain=$(env_get DOMAIN)
  for _ in $(seq 1 40); do
    ip=$(podman container inspect ubite_caddy_1 --format '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' 2>/dev/null || true)
    if [ -n "$ip" ] && curl -fsS --max-time 10 --resolve "$domain:443:$ip" "https://$domain/api/health" > /dev/null 2>&1; then break; fi
    ip=""; sleep 3
  done
  [ -n "$ip" ] || { log "Caddy does not serve https://$domain/api/health"; return 1; }
  if [ -n "$2" ]; then
    sleep 20
    [ "$(podman container inspect ubite_vision_1 --format '{{.State.Running}} {{.RestartCount}}' 2>/dev/null)" = "true 0" ] \
      || { log "the counter does not stay up: $(podman logs --tail 5 ubite_vision_1 2>&1 | tr '\n' ' ')"; return 1; }
  fi
}

save_state() { # <file> <app ref> <vision ref> <commit>
  printf 'APP_REF=%q\nVISION_REF=%q\nSHA=%q\n' "$2" "$3" "$4" > "$STATE_DIR/$1"
}

# Keep the images of the running version and of the one before it.
prune() {
  local repo d keep
  keep="$(cat "$STATE_DIR/current" "$STATE_DIR/previous" 2>/dev/null || true)"
  for repo in "$IMAGE" "$VISION_IMAGE"; do
    podman images --noheading --digests --filter "reference=$repo" --format '{{.Digest}}' 2>/dev/null | sort -u | while read -r d; do
      case "$keep" in *"$d"*) ;; *) podman rmi "$repo@$d" > /dev/null 2>&1 || true ;; esac
    done
  done
  podman image prune -f > /dev/null 2>&1 || true
}

fail_release() { # <digest> <reason>
  printf '%s\n' "$1" > "$STATE_DIR/failed"
  record "failed $1 $2"
  log "error: $2"
  alert "UBite: deploy oprit" "Versiunea de pe main ($IMAGE@$1) nu a fost instalată pe VM.

Motiv: $2

Rulează în continuare versiunea de dinainte: $(app_version).
Timerul nu mai încearcă această imagine. După remediere: sudo /opt/ubite/deploy/cd.sh --retry
Jurnal: journalctl -u ubite-cd -n 100"
  exit 1
}

deploy() { # <digest of main>
  local digest=$1 ref="$IMAGE@$1" sha rc vref="" vsha prev_app prev_vision prev_head cur_sha domain
  log "main is $ref: deploying"
  set +e; sha=$(pull_verified "$ref"); rc=$?; set -e
  [ $rc -eq 2 ] && die "could not pull $ref (network?); trying again on the next run"
  [ $rc -eq 0 ] || fail_release "$digest" "the image is not signed by ci.yml on main of $GITHUB_REPO"

  if vision_managed; then
    local vdigest
    vdigest=$(registry_digest "${VISION_IMAGE#ghcr.io/}" "sha-$sha") || fail_release "$digest" "no counter image for $sha on ghcr.io"
    vref="$VISION_IMAGE@$vdigest"
    set +e; vsha=$(pull_verified "$vref"); rc=$?; set -e
    [ $rc -eq 2 ] && die "could not pull $vref (network?); trying again on the next run"
    [ $rc -eq 0 ] && [ "$vsha" = "$sha" ] || fail_release "$digest" "the counter image for $sha is not signed by ci.yml on main"
  fi

  # The checkout follows the image: compose file, Caddyfile and scripts of the same commit.
  git -C "$REPO_DIR" fetch -q origin main || die "git fetch failed (network?); trying again on the next run"
  git -C "$REPO_DIR" merge-base --is-ancestor "$sha" origin/main || fail_release "$digest" "$sha is not on main"
  cur_sha=$(app_version)
  if [[ $cur_sha =~ ^[0-9a-f]{7,40}$ ]] && git -C "$REPO_DIR" cat-file -e "$cur_sha^{commit}" 2>/dev/null \
     && ! git -C "$REPO_DIR" merge-base --is-ancestor "$cur_sha" "$sha"; then
    fail_release "$digest" "$sha is not newer than the running $cur_sha"
  fi
  [ -z "$(git -C "$REPO_DIR" status --porcelain --untracked-files=no)" ] \
    || fail_release "$digest" "the checkout in $REPO_DIR has local changes: $(git -C "$REPO_DIR" status --short --untracked-files=no | head -n 5 | tr '\n' ' ')"
  prev_head=$(git -C "$REPO_DIR" rev-parse HEAD)
  prev_app=$(container_ref ubite_app_1); prev_vision=""
  [ -n "$vref" ] && prev_vision=$(container_ref ubite_vision_1)

  git -C "$REPO_DIR" -c advice.detachedHead=false checkout -q --detach "$sha"
  if ! "$REPO_DIR/deploy/backup.sh" > "$STATE_DIR/backup.log" 2>&1; then
    git -C "$REPO_DIR" checkout -q --detach "$prev_head"
    fail_release "$digest" "the backup before the deploy failed: $(tail -n 2 "$STATE_DIR/backup.log" | tr '\n' ' ')"
  fi
  if ! podman run --rm --network ubite_default --env-file "$REPO_DIR/.env" -e NODE_ENV=production \
        -e DATABASE_URL="postgres://ubite:$(env_get POSTGRES_PASSWORD)@db:5432/ubite" \
        "$ref" node apps/api/dist/cli.js migrate < /dev/null > "$STATE_DIR/migrate.log" 2>&1; then
    git -C "$REPO_DIR" checkout -q --detach "$prev_head"
    fail_release "$digest" "the migration failed: $(tail -n 3 "$STATE_DIR/migrate.log" | tr '\n' ' ')"
  fi

  swap "$ref" "$vref"
  if ! healthy "$sha" "${vref:+1}"; then
    log "rolling back to $prev_app"
    git -C "$REPO_DIR" checkout -q --detach "$prev_head"
    swap "$prev_app" "$prev_vision"
    if healthy "" "${prev_vision:+1}"; then
      fail_release "$digest" "$sha did not come up; the previous version runs again (a migration, if any, stays applied)"
    fi
    fail_release "$digest" "$sha did not come up, AND THE ROLLBACK DID NOT EITHER: the site may be down"
  fi

  [ -f "$STATE_DIR/current" ] && cp "$STATE_DIR/current" "$STATE_DIR/previous"
  [ -f "$STATE_DIR/previous" ] || save_state previous "$prev_app" "$prev_vision" "$prev_head"
  save_state current "$ref" "$vref" "$sha"
  rm -f "$STATE_DIR/failed" "$STATE_DIR/held"
  record "deployed $sha $ref${vref:+ $vref}"
  prune
  domain=$(env_get DOMAIN)
  log "deployed $sha"
  alert "UBite: ${sha:0:7} instalat" "https://$domain rulează acum ${sha:0:7}:
https://github.com/$GITHUB_REPO/commit/$sha

Imaginea: $ref${vref:+
Numărătorul: $vref}
Semnată de ci.yml pe main; verificarea e în docs/24."
}

rollback() {
  [ -f "$STATE_DIR/previous" ] || die "no previous version is recorded"
  local APP_REF VISION_REF SHA
  # shellcheck source=/dev/null
  . "$STATE_DIR/previous"
  touch "$PAUSE_FILE"
  log "rolling back to $SHA ($APP_REF); deploys are paused until --resume"
  git -C "$REPO_DIR" -c advice.detachedHead=false checkout -q --detach "$SHA"
  [ -n "$VISION_REF" ] && ! exists ubite_vision_1 && VISION_REF=""
  swap "$APP_REF" "$VISION_REF"
  healthy "" "${VISION_REF:+1}" || die "the previous version does not come up either"
  [ -f "$STATE_DIR/current" ] && mv "$STATE_DIR/current" "$STATE_DIR/rolled-back"
  save_state current "$APP_REF" "$VISION_REF" "$SHA"
  record "rolled back to $SHA $APP_REF"
  log "running $(app_version); sudo $REPO_DIR/deploy/cd.sh --resume deploys main again"
}

status() {
  local main
  main=$(registry_digest "${IMAGE#ghcr.io/}" main || echo "unreachable")
  log "running:  $(container_ref ubite_app_1) (version $(app_version))"
  exists ubite_vision_1 && log "counter:  $(container_ref ubite_vision_1)"
  log "main:     $IMAGE@$main"
  [ -f "$PAUSE_FILE" ] && log "paused:   $PAUSE_FILE exists (--resume)"
  in_hold && log "hold:     lunch, 11:00–17:30 on weekdays (--now overrides)"
  [ -f "$STATE_DIR/failed" ] && log "failed:   $(cat "$STATE_DIR/failed") is not retried (--retry)"
  [ -f "$STATE_DIR/history" ] && { log "history:"; tail -n 5 "$STATE_DIR/history" | sed 's/^/  /'; }
  return 0
}

main() {
  local now=""
  mkdir -p "$STATE_DIR" "$(dirname "$PAUSE_FILE")"
  case "${1:-}" in
    --status) status; return ;;
    --pause) touch "$PAUSE_FILE"; log "paused"; return ;;
    --resume) rm -f "$PAUSE_FILE"; log "resumed"; return ;;
    --retry) rm -f "$STATE_DIR/failed" "$STATE_DIR/held"; log "the failed digest will be tried again" ;;
    --now) now=1 ;;
    --rollback) ;;
    "") ;;
    *) die "unknown option $1 (see the top of $0)" ;;
  esac

  exec 9> "$STATE_DIR/lock"
  flock -n 9 || { log "another run is in progress"; return 0; }
  if [ "${1:-}" = "--rollback" ]; then rollback; return; fi
  [ -f "$PAUSE_FILE" ] && return 0

  local target current
  target=$(registry_digest "${IMAGE#ghcr.io/}" main) \
    || die "cannot read $IMAGE:main from ghcr.io (offline, or the package is private: set GHCR_AUTH in /etc/ubite/cd.env)"
  current=$(container_ref ubite_app_1)
  [ "$current" = "$IMAGE@$target" ] && return 0
  [ "$(cat "$STATE_DIR/failed" 2>/dev/null)" = "$target" ] && return 0
  if [ -z "$now" ] && in_hold; then
    if [ "$(cat "$STATE_DIR/held" 2>/dev/null)" != "$target" ]; then
      printf '%s\n' "$target" > "$STATE_DIR/held"
      log "main is $IMAGE@$target; it waits for 17:30 (lunch hold)"
    fi
    return 0
  fi
  deploy "$target"
}

main "$@"; exit $?
}
