# syntax=docker/dockerfile:1
# UBite — one container for the API and the PWA it serves (docs/12). Runs the same on a free
# tier and on the UB VM: PostgreSQL comes in through DATABASE_URL, nothing else is stateful.
#
#   docker build -t ubite .
#   docker run --env-file .env -p 8080:8080 ubite

FROM node:22-bookworm-slim AS build
WORKDIR /app
COPY package.json package-lock.json tsconfig.base.json ./
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
COPY packages/shared/package.json packages/shared/
RUN npm ci --no-audit --no-fund
# The design system is the source of every colour, font and component the app draws.
COPY .claude/skills/ubite-design .claude/skills/ubite-design
COPY assets assets
COPY packages packages
COPY apps apps
RUN npm run build -w @ubite/web && npm run build -w @ubite/api

FROM node:22-bookworm-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
COPY packages/shared/package.json packages/shared/
RUN npm ci --omit=dev --no-audit --no-fund && mkdir -p apps/api/node_modules

# The integer "best" Romanian model tesseract.js ships with: on scripts/ocr-bench.ts it reads
# thermal receipts markedly better than tessdata_fast, at the same speed.
FROM node:22-bookworm-slim AS tessdata
ADD https://cdn.jsdelivr.net/npm/@tesseract.js-data/ron@1.0.0/4.0.0_best_int/ron.traineddata.gz /tessdata/ron.traineddata.gz
RUN gunzip /tessdata/ron.traineddata.gz && chmod 644 /tessdata/ron.traineddata

FROM node:22-bookworm-slim
ENV NODE_ENV=production     PORT=8080     WEB_DIST=/app/web     MIGRATIONS_DIR=/app/apps/api/migrations     OCR_LANG_PATH=/app/tessdata     OCR_CACHE_PATH=/tmp/tesseract
# The workspace layout is kept: a package another dependency pins to an older major version is
# installed under apps/api/node_modules, and Node resolves it from there.
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=build /app/apps/api/dist ./apps/api/dist
COPY apps/api/package.json ./apps/api/package.json
COPY apps/api/migrations ./apps/api/migrations
COPY --from=build /app/apps/web/dist ./web
COPY --from=tessdata /tessdata ./tessdata
# The generated placeholder dish photos the base seed attaches (status: placeholder).
COPY assets/manifest.json ./assets/manifest.json
COPY assets/photos ./assets/photos
USER node
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s   CMD node -e "fetch('http://127.0.0.1:8080/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "apps/api/dist/index.js"]
