#!/bin/sh
# Daily PostgreSQL dump on the UB VM (docs/12 "Backups"). Loyalty data cannot be rebuilt from
# anywhere else; keep 14 days. Install with: crontab -e →  30 3 * * * /opt/ubite/deploy/backup.sh
# Restore (rehearse once before launch):
#   gunzip -c backups/ubite-YYYY-MM-DD.sql.gz | docker compose -f docker-compose.prod.yml exec -T db psql -U ubite ubite
set -eu
cd "$(dirname "$0")/.."
mkdir -p backups
docker compose -f docker-compose.prod.yml exec -T db pg_dump -U ubite --clean --if-exists ubite | gzip > "backups/ubite-$(date +%F).sql.gz"
find backups -name 'ubite-*.sql.gz' -mtime +14 -delete
