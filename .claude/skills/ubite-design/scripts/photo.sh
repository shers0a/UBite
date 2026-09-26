#!/usr/bin/env bash
# UBite — find a real photograph, download it, record its licence.
#
#   ./scripts/photo.sh <slug> "<search terms>" [--source openverse|pexels] [--index 1]
#
# Default source is Openverse: no key, CC-licensed only, attribution captured automatically.
# Pexels needs PEXELS_KEY in .env.
#
# NOTE: no photograph on the internet is a photograph of Cantina Mihail Kogălniceanu.
# Use this for mood and placeholders only, and replace it with the site-visit photos.

set -euo pipefail
cd "$(dirname "$0")/.."
[ -f .env ] && set -a && . ./.env && set +a

SLUG="${1:-}"; QUERY="${2:-}"; SOURCE="openverse"; INDEX=1
shift 2 || true
while [ $# -gt 0 ]; do
  case "$1" in
    --source) SOURCE="$2"; shift ;;
    --index) INDEX="$2"; shift ;;
  esac
  shift
done

if [ -z "$SLUG" ] || [ -z "$QUERY" ]; then
  echo "usage: ./scripts/photo.sh <slug> \"<search terms>\" [--source openverse|pexels] [--index N]" >&2
  exit 1
fi

mkdir -p assets/photos
OUT="assets/photos/$SLUG.jpg"
ENCODED=$(QQ="$QUERY" node -e 'process.stdout.write(encodeURIComponent(process.env.QQ))')

if [ "$SOURCE" = "pexels" ]; then
  [ -z "${PEXELS_KEY:-}" ] && { echo "PEXELS_KEY missing in .env" >&2; exit 1; }
  JSON=$(curl -sS -H "Authorization: $PEXELS_KEY" "https://api.pexels.com/v1/search?query=$ENCODED&per_page=10&orientation=landscape")
  read -r URL CREDIT PAGE LICENCE < <(IDX="$INDEX" node -e '
    let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{
      const j=JSON.parse(s), p=j.photos[(+process.env.IDX||1)-1];
      if(!p){console.error("no result at that index");process.exit(1);}
      console.log([p.src.large2x, p.photographer.replace(/\s+/g,"_"), p.url, "Pexels_License"].join(" "));
    });' <<< "$JSON")
else
  JSON=$(curl -sS "https://api.openverse.org/v1/images/?q=$ENCODED&license_type=commercial&page_size=10")
  read -r URL CREDIT PAGE LICENCE < <(IDX="$INDEX" node -e '
    let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{
      const j=JSON.parse(s), p=j.results[(+process.env.IDX||1)-1];
      if(!p){console.error("no result at that index");process.exit(1);}
      console.log([p.url, String(p.creator||"unknown").replace(/\s+/g,"_"), p.foreign_landing_url, p.license+"-"+(p.license_version||"")].join(" "));
    });' <<< "$JSON")
fi

curl -sSL "$URL" -o "$OUT"
if command -v magick >/dev/null 2>&1; then magick "$OUT" -resize '1600x1600>' -strip "$OUT"
elif command -v sips >/dev/null 2>&1; then sips -Z 1600 "$OUT" >/dev/null; fi

node scripts/manifest-add.cjs "$OUT" "$SOURCE" "${CREDIT//_/ }" "$QUERY" "$LICENCE" "$PAGE"
echo "✓ $OUT  — ${CREDIT//_/ }, $LICENCE"
echo "  credit it:  <image-slot id=\"$SLUG\" src=\"$OUT\" credit=\"Photo by ${CREDIT//_/ }\" credit-href=\"$PAGE\"></image-slot>"
