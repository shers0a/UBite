#!/usr/bin/env bash
# UBite — generate an on-brand image and register it.
#
#   ./scripts/asset.sh <slug> "<subject prompt>" [--no-style] [--size 1024x1024]
#
# Example:
#   ./scripts/asset.sh papanasi "a plate of papanasi with sour cream on a canteen tray"
#
# Writes assets/generated/<slug>.png, resizes it to max 1600px, and appends a row to
# assets/manifest.json with the full prompt, the model, the date and the licence.
# Needs HF_TOKEN in .env. Nothing else.

set -euo pipefail
cd "$(dirname "$0")/.."

[ -f .env ] && set -a && . ./.env && set +a

SLUG="${1:-}"
SUBJECT="${2:-}"
SIZE="1024x1024"
STYLE=1
shift 2 || true
while [ $# -gt 0 ]; do
  case "$1" in
    --no-style) STYLE=0 ;;
    --size) SIZE="$2"; shift ;;
  esac
  shift
done

if [ -z "$SLUG" ] || [ -z "$SUBJECT" ]; then
  echo "usage: ./scripts/asset.sh <slug> \"<subject prompt>\" [--no-style] [--size WxH]" >&2
  exit 1
fi
if [ -z "${HF_TOKEN:-}" ]; then
  echo "HF_TOKEN missing. Copy .env.example to .env and paste a free token from" >&2
  echo "https://huggingface.co/settings/tokens" >&2
  exit 1
fi

MODEL="${HF_MODEL:-black-forest-labs/FLUX.1-schnell}"

# The house style block. Keep this in sync with guidelines/asset-pipeline.md.
STYLE_TEXT="Palette: deep blue #1F4FD8, ink #11161B, paper #F7F8FA, one accent of teal #128A6B, amber #C47A0A or terracotta #D1512F. Flat, calm, institutional, student not corporate. Natural window light, real portions, slightly imperfect, eye level. No gradient mesh, no glass, no glow, no 3D render, no lens flare, no text, no watermark, no mascot, no stock-photo smiling, no people's faces."
if [ "$STYLE" -eq 1 ]; then PROMPT="$SUBJECT. $STYLE_TEXT"; else PROMPT="$SUBJECT"; fi

W="${SIZE%x*}"; H="${SIZE#*x}"
OUT="assets/generated/$SLUG.png"
mkdir -p assets/generated

echo "→ $MODEL  ($W×$H)"
PAYLOAD=$(SUBJ="$PROMPT" WIDTH="$W" HEIGHT="$H" node -e '
  process.stdout.write(JSON.stringify({
    inputs: process.env.SUBJ,
    parameters: { width: +process.env.WIDTH, height: +process.env.HEIGHT }
  }));
')

HTTP=$(curl -sS -w "%{http_code}" -o "$OUT.tmp" \
  -H "Authorization: Bearer $HF_TOKEN" \
  -H "Content-Type: application/json" \
  -d "$PAYLOAD" \
  "https://api-inference.huggingface.co/models/$MODEL")

if [ "$HTTP" != "200" ]; then
  echo "generation failed (HTTP $HTTP):" >&2
  head -c 400 "$OUT.tmp" >&2; echo >&2
  echo "if it says the model is loading, wait ~20s and run it again." >&2
  rm -f "$OUT.tmp"; exit 1
fi
mv "$OUT.tmp" "$OUT"

# Resize to a sane weight for a weak canteen connection.
if command -v magick >/dev/null 2>&1; then
  magick "$OUT" -resize '1600x1600>' -strip "$OUT"
elif command -v sips >/dev/null 2>&1; then
  sips -Z 1600 "$OUT" >/dev/null
fi

node scripts/manifest-add.cjs "$OUT" "generated" "$MODEL" "$PROMPT" "see model card (FLUX.1-schnell: Apache-2.0 weights, outputs usable commercially)"
echo "✓ $OUT"
echo "  point a slot at it:  <image-slot id=\"$SLUG\" src=\"assets/generated/$SLUG.png\"></image-slot>"
