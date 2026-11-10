#!/usr/bin/env bash
# Daily PostgreSQL dump on the UB VM (docs/12 "Backups"). Loyalty data cannot be rebuilt from
# anywhere else; keep 14 days. Install for the user that runs the containers (root on the VM):
#   crontab -e  →  30 3 * * * /opt/ubite/deploy/backup.sh
# Restore (rehearse once before launch):
#   gunzip -c backups/ubite-YYYY-MM-DD.sql.gz | deploy/backup.sh --restore
#
# A dump is written to a temporary file and moved into place only once it is whole: pg_dump
# succeeded, the gzip reads back, pg_dump's closing line is there, and it is not tiny. Old dumps
# are pruned only after that, and the 14 newest always stay. Any failure exits non-zero (cron
# mails the output) and prunes nothing. BACKUP_MIN_BYTES (default 2048) is the smallest dump
# accepted; one under half the size of the previous dump is kept aside as *.small.sql.gz, and
# nothing is pruned, until someone has looked.
set -euo pipefail
umask 077
cd "$(dirname "$0")/.."

KEEP_DAYS=14
MIN_BYTES="${BACKUP_MIN_BYTES:-2048}"
fail() { echo "backup: $*; nothing was pruned" >&2; exit 1; }

# Docker Compose where Docker exists; otherwise Podman, finding the db container by its compose label.
db() {
  if command -v docker >/dev/null 2>&1; then docker compose -f docker-compose.prod.yml exec -T db "$@"
  else
    local id
    id="$(podman ps -q --filter label=com.docker.compose.service=db | head -n 1)"
    [ -n "$id" ] || fail "no running db container"
    podman exec -i "$id" "$@"
  fi
}
if [ "${1:-}" = "--restore" ]; then db psql -q -v ON_ERROR_STOP=1 -U ubite ubite; exit; fi

mkdir -p backups
chmod 700 backups
day="$(date +%F)"
final="backups/ubite-$day.sql.gz"
tmp="backups/.ubite-$day.sql.gz.partial.$$"
trap 'rm -f "$tmp"' EXIT

# pipefail: a pg_dump that fails halfway fails the pipeline, even though gzip succeeds.
db pg_dump -U ubite --clean --if-exists ubite < /dev/null | gzip > "$tmp" || fail "pg_dump failed"
gzip -t "$tmp" 2>/dev/null || fail "the dump does not read back as gzip"
case "$(gunzip -c "$tmp" | tail -n 8)" in
  *"PostgreSQL database dump complete"*) ;;
  *) fail "the dump is incomplete (no closing line from pg_dump)" ;;
esac
size="$(wc -c < "$tmp" | tr -d ' ')"
[ "$size" -ge "$MIN_BYTES" ] || fail "the dump is $size bytes, under BACKUP_MIN_BYTES ($MIN_BYTES)"

# The newest dump from an earlier day, to compare sizes with.
prev="$(ls -1t backups/ubite-*.sql.gz 2>/dev/null | grep -v -e "/ubite-$day\." -e '\.small\.sql\.gz$' | head -n 1 || true)"
if [ -n "$prev" ]; then
  prev_size="$(wc -c < "$prev" | tr -d ' ')"
  if [ $((size * 2)) -lt "$prev_size" ]; then
    mv -f "$tmp" "backups/ubite-$day.small.sql.gz"
    fail "the dump is $size bytes, under half of $prev ($prev_size); kept as backups/ubite-$day.small.sql.gz"
  fi
fi

mv -f "$tmp" "$final"
# Quiet on success, so cron mails only failures; a person at a terminal sees the result.
if [ -t 1 ]; then echo "backup: $final ($size bytes)"; fi

# Prune: older than KEEP_DAYS, and never one of the KEEP_DAYS newest.
ls -1t backups/ubite-*.sql.gz | tail -n +$((KEEP_DAYS + 1)) | while read -r old; do
  find "$old" -mtime +"$KEEP_DAYS" -delete
done
