#!/usr/bin/env bash
# Sets up continuous deployment on the UB VM, once, as root (docs/24 "Continuous deployment"):
# cosign (pinned and checksummed), /etc/ubite, and the ubite-cd timer that runs deploy/cd.sh.
#   sudo /opt/ubite/deploy/install-cd.sh            install, and leave deploys paused
#   sudo /opt/ubite/deploy/cd.sh --status           then check, and
#   sudo /opt/ubite/deploy/cd.sh --resume           let the timer deploy
# Running it again upgrades cosign and the units; it never touches .env or the containers.
set -euo pipefail
[ "$(id -u)" = 0 ] || { echo "run as root (sudo)"; exit 1; }
cd "$(dirname "$0")"

COSIGN_VERSION=v3.1.4
COSIGN_SHA256=424e2c97d0b45fd7a6b608a87f090f35633f4c23ece5f092d48bba11aaf4bbfa   # cosign-linux-amd64, cosign_checksums.txt

if [ "$(cosign version 2>/dev/null | sed -n 's/^GitVersion: *//p')" != "$COSIGN_VERSION" ]; then
  tmp=$(mktemp)
  curl -fsSL -o "$tmp" "https://github.com/sigstore/cosign/releases/download/$COSIGN_VERSION/cosign-linux-amd64"
  echo "$COSIGN_SHA256  $tmp" | sha256sum -c --quiet - || { rm -f "$tmp"; echo "cosign checksum mismatch"; exit 1; }
  install -m 0755 "$tmp" /usr/local/bin/cosign && rm -f "$tmp"
fi
cosign version | sed -n 's/^GitVersion: */cosign /p'

install -d -m 0755 /etc/ubite
install -d -m 0700 /var/lib/ubite-cd
if [ ! -f /etc/ubite/cd.env ]; then
  cat > /etc/ubite/cd.env <<'CONF'
# Overrides for /opt/ubite/deploy/cd.sh (its defaults suit this VM). Examples:
# CD_VISION=no                     # never touch the counter
# GHCR_AUTH=user:ghp_…             # only if the ghcr.io packages are private (read:packages)
CONF
  chmod 600 /etc/ubite/cd.env
  # The first deploy is watched by a person: the timer starts paused.
  touch /etc/ubite/cd-paused
fi

install -m 0644 ubite-cd.service ubite-cd.timer /etc/systemd/system/
systemctl daemon-reload
systemctl enable --now ubite-cd.timer
systemctl list-timers ubite-cd.timer --no-pager | head -n 2
[ -f /etc/ubite/cd-paused ] && echo "paused: sudo /opt/ubite/deploy/cd.sh --resume when ready"
