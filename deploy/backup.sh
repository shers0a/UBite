#!/bin/sh
# Daily PostgreSQL dump on the UB VM (docs/12 "Backups"). Loyalty data cannot be rebuilt from
# anywhere else; keep 14 days. Install for the user that runs the containers (root on the VM):
#   crontab -e  →  30 3 * * * /opt/ubite/deploy/backup.sh
# Restore (rehearse once before launch):
#   gunzip -c backups/ubite-YYYY-MM-DD.sql.gz | deploy/backup.sh --restore
set -eu
cd "$(dirname "$0")/.."
# Docker Compose where Docker exists; otherwise Podman, finding the db container by its compose label.
db() {
  if command -v docker >/dev/null 2>&1; then docker compose -f docker-compose.prod.yml exec -T db "$@"
  else podman exec -i "$(podman ps -q --filter label=com.docker.compose.service=db | head -n 1)" "$@"; fi
}
if [ "${1:-}" = "--restore" ]; then db psql -q -U ubite ubite; exit; fi
mkdir -p backups
db pg_dump -U ubite --clean --if-exists ubite | gzip > "backups/ubite-$(date +%F).sql.gz"
find backups -name 'ubite-*.sql.gz' -mtime +14 -delete
