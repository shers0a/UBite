#!/usr/bin/env bash
# Shortcut kept for the command the design system documents:
#   ./scripts/asset.sh <slug> "<subject>" [--style food] [--n 4]
# Everything else (sheet, cutout, vectorize, promote) lives in scripts/asset.mjs.
set -euo pipefail
cd "$(dirname "$0")/.."
exec node scripts/asset.mjs gen "$@"
