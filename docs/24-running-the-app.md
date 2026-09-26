# Running the App

How to run, test and deploy the code that implements docs 01–23. Written for the three
developers; the README stays hand-written (D-26).

## What is where

```
apps/web/          React PWA — student app, staff tools, DCCAS dashboard, admin, kiosk (routes)
apps/api/          Express API, the only writer to PostgreSQL; jobs run in-process
  migrations/      versioned SQL (docs/05 schema, plus the implementation tables below)
  src/crowding/    docs/07 as pure functions: fusion, Theil–Sen calibration, levels + hysteresis
  src/services/    database-side logic: menu, loyalty ledger, receipts (OCR), auth, notifications
  test/            fusion, loyalty ledger, HTTP flows — the tests docs/04 says must exist
packages/shared/   API contract types, docs/05 vocabulary, Bucharest time, reward codes
services/vision/   camera → count → POST (docs/23)
.claude/skills/ubite-design/   the design system; the app imports its components through index.js
```

The app draws every screen with the design system's own components (`@ds` → the skill's
`index.js`) and its `styles.css` tokens. Where the docs asked for more than a component did, the
component was extended in the design system itself, and `_ds_bundle.js` regenerated so the UI kits
and the mockup stay in step (`node scripts/ds-bundle.mjs --all`).

## Local development

```bash
npm install
npm run db:seed -- --demo      # three weeks of demo data in an embedded PGlite database
npm run dev                    # API on :8080, web on :5173 (proxies /api)
```

No Docker needed: without `DATABASE_URL` the API uses PGlite (real PostgreSQL in WebAssembly) in
`apps/api/.data/`. For a server PostgreSQL: `docker compose up -d` and
`DATABASE_URL=postgres://ubite:ubite@localhost:5432/ubite`.

In development, sign-in codes are printed to the API log (no SMTP needed). Demo accounts:

| Account | Role |
|---|---|
| `ubite.demo.1@s.unibuc.ro` | student at 4 of 5 dots |
| `ubite.demo.2@s.unibuc.ro` | student with a free meal waiting |
| `cantina@ubite.local` | canteen staff → `/staff` |
| `dccas@ubite.local` | DCCAS → `/dashboard` |
| `admin@ubite.local` | tech admin → `/admin` |

The kiosk is `/kiosk` (rotation) and `/kiosk/attract` (the 11-second loop).

## Checks — all run in CI on every pull request

```bash
npm run typecheck
npm run lint          # oxlint + no raw colours or fonts outside the design-system tokens
npm test              # shared (11) · api (92: fusion, simulated service day, ledger, receipts, HTTP) · web (6)
npm run build
npm run assets:check  # the locked style and the asset manifest
npm run screens       # screenshots of every surface into dist/screens (R1/R2 evidence)
npm run e2e -- <url> [receipt.jpg]   # every docs/03 feature through the UI in a real browser
npm run ocr:bench -- <dir>           # the receipt reader, field by field (see "Measured" below)
```

`npm run screens` needs the API running with demo data and `API_LOG` pointing at its log file.
`npm run e2e` needs a server with demo data, open at the time of the run, and `DEMO_SHOW_CODES=1`
(it signs in through the sign-in sheet); it changes the data, so point it at a throwaway instance.

## Deploying (docs/12)

One image serves the API and the PWA. On free hosting, run it with a managed PostgreSQL; on the UB
VM, use `docker-compose.prod.yml` (Caddy gets the certificate for `DOMAIN` automatically — ports 80
and 443 must be reachable from the internet).

```bash
cp .env.example .env                 # fill SESSION_SECRET, POSTGRES_PASSWORD, SMTP_URL, VAPID_*, DOMAIN
npm run cli -w @ubite/api -- vapid   # once, for VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY
docker compose -f docker-compose.prod.yml up -d --build
docker compose -f docker-compose.prod.yml run --rm app node apps/api/dist/cli.js migrate
docker compose -f docker-compose.prod.yml run --rm app node apps/api/dist/cli.js seed
docker compose -f docker-compose.prod.yml run --rm app node apps/api/dist/cli.js user:add cantinakogalniceanu@unibuc.ro canteen_staff
```

Rules that come from the docs:

- **Never deploy between 11:00 and 17:30 on a weekday.** Migrations are their own step, after a
  manual backup (`deploy/backup.sh`).
- **Uptime monitoring** watches `GET /api/health`; alerts for "no menu by 10:00" and "camera silent
  15 minutes" go to `ALERT_EMAILS` — name the person who acts on them.
- **Test email delivery to `@s.unibuc.ro` before launch** (docs/10): institutional servers are strict.
- **Rehearse one restore** before launch (commands at the top of `deploy/backup.sh`).
- **Feature flags** in `.env`: `FEATURE_CAMERA`, `FEATURE_LOYALTY`, `FEATURE_WASTE`,
  `FEATURE_PREDICTION` (the typical-hours chart also hides itself in week one).

### On the UB VM: Podman

The ACC-UB VM runs Podman and podman-compose instead of Docker. The compose file runs unchanged, but
there are three differences:

- **Run it as root** (`sudo -i`). Rootless Podman cannot bind ports 80/443, and its port forwarder
  hides the client's IP, which the per-IP limits on wait reports need.
- **Name the services.** podman-compose 1.0 has no `--profile`, so a bare `up` would also try to
  build the vision service.
- **Reboots:** `podman-restart.service` brings back containers whose policy is `restart: always`.

```bash
git clone https://github.com/shers0a/UBite.git /opt/ubite && cd /opt/ubite
cp .env.example .env && chmod 600 .env   # DOMAIN, DOMAIN_ALIASES, POSTGRES_PASSWORD, SESSION_SECRET, VAPID_*, SMTP_URL
podman-compose -f docker-compose.prod.yml build app
podman-compose -f docker-compose.prod.yml up -d db
podman-compose -f docker-compose.prod.yml run --rm app node apps/api/dist/cli.js migrate
podman-compose -f docker-compose.prod.yml run --rm app node apps/api/dist/cli.js seed
podman-compose -f docker-compose.prod.yml up -d db app caddy
crontab -e                               # 30 3 * * * /opt/ubite/deploy/backup.sh
```

To update: `git pull`, rebuild `app`, run `migrate` (after a backup), then `up -d app`.

While the final domain is pending, `DOMAIN` is the address that works now and `DOMAIN_ALIASES` lists
the others. Caddy gets certificates for all of them and sends the aliases to `DOMAIN`.

### Free hosting: Vercel

The same app runs on Vercel as static files plus one function, with a managed PostgreSQL (Neon,
from the Vercel marketplace). A function has no timers between requests, so `JOBS=requests`: each
API request runs what is due — the 30-second fusion, the minute tick with the nightly and weekly
work — at most once per slot across instances (`claimEvery` in `job_runs`), and the platform's
daily cron calls `/api/cron` with `CRON_SECRET`.

```bash
npx vercel link --project ubite
npx vercel integration add neon             # sets DATABASE_URL on the project
npx vercel env add SESSION_SECRET production # and PUBLIC_URL, CRON_SECRET, VAPID_*, SMTP_URL …
DATABASE_URL=… npm run cli -w @ubite/api -- migrate
npm run vercel:build && npx vercel deploy --prebuilt --prod
```

`scripts/vercel-build.ts` writes `.vercel/output`: the PWA with the same security headers the
container sends, and the API bundled with esbuild beside a Linux build of sharp, tesseract.js, the
migrations and the Romanian OCR model. The demo lives at **https://ubite.vercel.app** (project `ubite`, Neon database `ubite-db` in
Frankfurt). `DEMO_SHOW_CODES=1` turns a deployment into a public demo:
sign-in codes are shown on screen instead of emailed, and search engines are told to stay away.
Never set it on the real service.

### The camera

With the `camera` profile the vision service runs next to the app and reads the camera's RTSP
stream; only `{observed_at, zone, person_count, confidence}` reaches the API. The queue polygon is
drawn in `/admin` and fetched by the service every ten minutes. Rotate its token by adding the new
one to `VISION_TOKENS`, redeploying vision with it, then removing the old one.

```bash
CAMERA_RTSP_URL=rtsp://user:pass@camera/stream VISION_TOKEN=… \
  docker compose -f docker-compose.prod.yml --profile camera up -d vision
```

## Choices made while implementing

| Where the docs left it open | What the code does |
|---|---|
| Reward codes must be "single-use, short-lived" and work offline | Four letters naming the reward plus four digits the phone computes every minute from a per-reward secret; valid ±3 minutes, redeemed once |
| The loyalty QR's purpose | Shows the reward code at the till; without a reward, the card QR lets the cashier confirm today's visit (`staff_confirmed`) |
| Manual receipt entry, the OCR fallback | Recorded as `receipt_manual`, so R15 can say how often OCR failed |
| Receipt uniqueness | SHA-256 of the day, the till's fiscal series and the receipt number — the number alone restarts daily on every till. The series is folded to digits, so two scans that read "O" and "0" agree; the fiscal code and Z number are left out because every extra field is another chance for two scans of one receipt to disagree |
| "The receipt must be the canteen's" | `RECEIPT_FISCAL_CODES` (the canteen's fiscal code, from the first real receipt, docs/17 D6): another shop's receipt is refused, one misread digit is forgiven. Empty accepts any shop |
| "Validate the date matches today" | A date one look-alike digit away from today (0/8, 0/6, 0/9, 1/7, 3/8, 5/6) is today: thermal zeros are often slashed and read as 8. Without a readable number and date the student is asked for a clearer photo |
| Camera arbitration compares the report with "W_cam" | W_cam when the student joined the queue (t − W), as calibration pairs them. Compared with the queue at payment, a student who waited through a queue that has just cleared is rejected for telling the truth — 18 of 234 honest reports in the simulation |
| Hysteresis state between cycles | Stored in `app_config` (`crowding_state`), so a restart or a serverless instance neither resets nor forks it; a pending change older than five minutes is dropped |
| Onboarding: none (docs/18) vs the kit's slides | No gate; the slides live at `/about`, linked from the footer; the one-second splash plays once per session |
| Kiosk feedback faces | Stored as `feedback.source = kiosk` with food rating 5 / 3 / 1 |
| Unique visitors over the pilot | Daily salted hashes, deleted nightly, for visitors per day; a one-time "first open" event per device for the pilot total — no identifier ever leaves the phone |
| Generated dish photos | Stored with `placeholder = true`; dish detail says the photo is illustrative |
| Staff email domain unknown (D13) | Non-student accounts exist only when an admin creates them; any domain |

## Measured

**Crowding (docs/07), `apps/api/test/crowding-sim.test.ts`.** A simulated lunch service through the
real database path: two tills at 8 people a minute, peaks at 12:30 and 14:00, a camera that misses
7 % of people and sometimes returns a bad frame, 15 % of students reporting (rounded, noisy), 4 %
of reports nonsense. The published minutes against the wait a student joining at that moment
actually had:

| Sources | Mean error | Level right |
|---|---|---|
| Camera + reports (the 70/30 blend) | 1.1 min | 84 % |
| Reports only | 2.1 min | 76 % |
| Camera silent from 13:30 | 1.6 min | 73 % |
| History only (same weekday a week earlier) | 1.3 min | 86 % |

The calibration learns the till speed (0.133 min a person — 1/8, seen through a camera that misses
7 %) with a cross-validated error of 0.65 min; every nonsense report more than 5 minutes off is
rejected, no honest one is. The calibrated camera alone is within 0.4 min: the 70/30 blend is worse
at the peaks because a report describes the queue its author joined W minutes earlier, so the
estimate trails a building queue and overstates a clearing one. Worth revisiting with real data —
using reports only to calibrate while the camera is fresh would follow the queue more closely.

**Receipts (docs/09), `npm run ocr:bench`.** Until the canteen's receipt is photographed (D6), the
reader is measured on synthetic receipts (`scripts/receipt-samples.py`): four layouts with the label
variants of Romanian fiscal printers, printed at 203 dpi, photographed tilted, in uneven light,
slightly out of focus. Each photo is read three times (whole frame; the paper cut out and
straightened; the same in black and white) and each field is taken by majority. On 60 photos the
tuning never saw: **93 % give the number, today's date and the canteen's fiscal code** (the visit
counts), 92 % hash exactly as another scan of the same receipt would; about 1.7 s a photo. The rest
ask for a clearer photo, with manual entry as the fallback. Thermal printers often slash their
zeros, and Tesseract reads a slashed zero as 6, 8 or 9: across the three readings a 0 wins over its
look-alikes digit by digit, and a receipt number past what a till prints in a day (4999) is taken
as zero padding. Run the benchmark on the first real receipts before launch.

## Look and motion

The student app sits on the brand's doodle wallpaper (`Wallpaper`, the same `Pattern` as the kiosk),
which drifts at a quarter of the scroll; the hall photo dissolves into it through a frosted band.
Motion follows the design system's tokens and stops entirely under `prefers-reduced-motion`
(`apps/web/src/motion.ts`):

- **Page transitions** — the View Transitions API around every in-app navigation: tabs slide
  towards the tab chosen, a dish opens forward and closes back; the nav stays put.
- **The bottom nav folds** to its icons while scrolling down and opens on the way up (Revolut).
- Sections rise into view once; pictures fade in when they arrive; pull to refresh on the home
  screen; a short haptic tap when a report or a visit is confirmed; a thin loading bar while a
  screen's code arrives.

**Liquid glass** (`liquid-glass-react`, `apps/web/src/components/Glass.tsx`) uses the library's own
button template everywhere — displacement 64, blur 0.1, saturation 130 %, aberration 2, elasticity
0.35, round corners: the bottom nav, the mini answer, the header buttons over the photo and the
crowding card (the level's colour field sits under the glass, so the card is tinted by the level).
Measured in Chromium: the glass only sees what is behind it when no ancestor between them is a
stacking context — no `z-index`, `isolation` or `view-transition-name` above it (the nav is named
only for the length of a page transition). It refracts in Chromium on devices with six cores or
more; Safari, Firefox and slower phones get the same shapes frosted in CSS, and never download it.

This goes beyond the design system's "motion only confirms" and "no card shadows": it was asked
for by the team on 25 Sep 2026, and it is kept out of every piece of information — the level is
still a word first, the wait still minutes, and everything works with motion turned off.

## PWA

Installable (manifest with shortcuts to the menu, the card and "add a receipt", and screenshots for
Android's install sheet — `node scripts/pwa-screenshots.mjs`), works offline (precached shell,
last good menu and estimate, queued reports and feedback), updates itself with a prompt. Web push:
four notification types, a monochrome badge, a new subscription sent to the server when the
browser rotates it (`pushsubscriptionchange`), and **"Trimite o notificare de test"** in the account
so a student can prove the whole chain on their own phone. A free meal waiting shows as a badge on
the installed app's icon. On iPhone push needs the app on the home screen; the app says so.

## Implementation tables

Tables the running system needs beyond docs/05's entities: `auth_codes`, `sessions`,
`notification_prefs`, `push_subscriptions`, `dish_photos`, `retired_receipt_hashes`,
`schedule_exceptions`, `app_config`, `historical_baseline`, `analytics_*`, `job_runs`. Each is
commented in `apps/api/migrations/001_init.sql` with the reason it exists.
