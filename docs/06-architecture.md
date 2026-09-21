# Architecture

## Shape

```
                    ┌──────────────────────────────┐
   Student phone ──▶│  apps/web  (React PWA, TS)   │
   Kiosk tablet  ──▶│  service worker, offline     │
                    └──────────────┬───────────────┘
                                   │ REST/JSON
                    ┌──────────────▼───────────────┐
                    │  apps/api  (Express, TS)     │
                    │  auth, menu, loyalty,        │
                    │  reports, fusion, dashboard  │
                    └───────┬──────────────┬───────┘
                            │              │
              ┌─────────────▼───┐   ┌──────▼─────────────────┐
              │  PostgreSQL     │   │  services/vision       │
              │                 │   │  (Python, YOLO)        │
              └─────────────────┘   │  counts → POST /obs    │
                                    └──────▲─────────────────┘
                                           │ RTSP / local capture
                                    ┌──────┴─────────────────┐
                                    │  Camera (queue zone)   │
                                    └────────────────────────┘
```

## Monorepo layout

```
ubite/
├── apps/
│   ├── web/          React + TypeScript PWA (students, staff, DCCAS, kiosk)
│   └── api/          Express + TypeScript REST API
├── services/
│   └── vision/       Python: capture → detect → count → POST
├── packages/
│   └── shared/       TypeScript types shared by web and api
├── docs/             This documentation
└── README.md         Hand-written, not generated
```

**Why `services/vision` is separate:** it is the only component that depends on hardware that
may never arrive, on a DPO approval nobody has requested yet, and on a language the rest of the
stack does not use. Isolating it means that if it slips — or is cancelled outright — nothing
else in the project moves. The API treats camera observations as an optional input stream.

## Technology decisions

| Layer | Choice | Reason |
|---|---|---|
| Frontend | React + TypeScript, PWA | One codebase for iOS and Android; the team has PWA experience |
| Styling | Custom design system, CSS variables | See [19](19-design-system-brief.md) |
| Backend | Express + TypeScript | Two of three developers know it |
| Vision | Python | The only serious ecosystem for computer vision |
| Database | PostgreSQL | Same engine locally, on free hosting, and on UB servers — migration is trivial |
| Types | TypeScript everywhere in JS-land | Three people editing the same code in a hurry |
| Realtime | HTTP polling, 30s | Robust on weak Wi-Fi; three levels do not need a socket |

TypeScript across `web` and `api` with shared types in `packages/shared` means an API contract
change breaks the build rather than the pilot.

## Service boundaries

### `apps/api` — the only writer

Everything reaches PostgreSQL through the API. The vision service does not hold database
credentials; it posts counts to an authenticated endpoint. That keeps the machine sitting in a
canteen from being a database client.

Responsibilities: authentication, menu CRUD, catalogue, loyalty ledger, receipt processing,
wait reports with rate limiting and outlier rejection, the fusion job, the dashboard
aggregations, announcements, feedback.

### `services/vision` — dumb on purpose

Loop: capture a frame → run detection → count persons in the configured zone polygon →
discard the frame → post `{observed_at, zone, person_count, confidence}`.

It holds no state, stores no images, and knows nothing about students, menus or loyalty. If it
dies, the API keeps serving estimates from reports and history.

Authentication to the API is a single service token, rotatable.

### `apps/web` — four experiences, one bundle

Student, canteen staff, DCCAS dashboard and kiosk are routes within the same application,
gated by role. The kiosk is a route in kiosk mode, not a separate build.

## Key flows

### Publishing a menu
Staff opens the editor → previous menu is preloaded → adjusts dishes and prices → optionally
enters portions prepared → publishes → students see it within 30 seconds.

### Estimating crowding
Vision posts counts every ~5s → API aggregates to 1-minute medians → fusion job runs every 30s
→ combines camera, reports and history → writes `crowd_estimates` → clients poll.

Detailed algorithm: [07-crowding-module.md](07-crowding-module.md).

### Recording a visit
Student photographs the fiscal receipt → client uploads image → API runs OCR → extracts
receipt number, total, line items → hashes the receipt number → rejects duplicates → writes a
`visits` row → recomputes loyalty progress.

The receipt image is deleted immediately after parsing. Only the hash and parsed fields are
kept.

### Offline
Service worker caches today's menu, the dish catalogue, the user's loyalty QR and the last
crowding estimate with its timestamp. Wait reports composed offline are queued and flushed on
reconnect, preserving `client_reported_at`.

This is not a nicety: Wi-Fi in the canteen is weak, and the loyalty code is needed at the till,
which is the worst spot in the building for signal.

## API surface

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/api/menu/today` | public | Today's menu with prices and tags |
| GET | `/api/menu/:date` | public | Historical menu |
| GET | `/api/dishes` | public | Catalogue |
| GET | `/api/dishes/:id` | public | Detail, allergens, rating |
| GET | `/api/crowding/current` | public | Level, wait minutes, quality, freshness |
| GET | `/api/crowding/typical` | public | Hourly baseline for today |
| POST | `/api/crowding/report` | optional | Submit waited minutes |
| GET | `/api/status` | public | Open/closed, hours, announcements |
| POST | `/api/auth/request-code` | public | Email OTP to `@s.unibuc.ro` |
| POST | `/api/auth/verify` | public | Exchange code for session |
| GET | `/api/me` | student | Profile, preferences |
| GET | `/api/me/loyalty` | student | Progress, QR payload, rewards |
| POST | `/api/me/visits` | student | Upload receipt photo |
| GET | `/api/me/history` | student | Spend, visits, dishes |
| PUT | `/api/me/favorites/:dishId` | student | Toggle |
| PUT | `/api/dishes/:id/rating` | student | 1–5 stars |
| POST | `/api/feedback` | optional | Feedback form |
| POST | `/api/staff/menu` | staff | Publish a menu |
| POST | `/api/staff/announcements` | staff | Post an announcement |
| POST | `/api/staff/rewards/redeem` | staff | Consume a reward code |
| GET | `/api/dashboard/*` | dccas | Aggregations |
| POST | `/api/vision/observations` | service | Camera counts |

## Environments

| Environment | Purpose | Hosting |
|---|---|---|
| Local | Development | Docker Compose, Postgres |
| Staging | Pre-release | Free tier |
| Production | Pilot | UB server if available; free tier otherwise |

The decision to run on free hosting until UB provisioning arrives is deliberate — see
[12-infrastructure-and-deployment.md](12-infrastructure-and-deployment.md). Using PostgreSQL
everywhere makes that migration a connection-string change.

## The Wi-Fi problem

> **CONFLICT** — Three confirmed decisions collide:
> 1. Wi-Fi in the canteen is *"present, but weak/partial"*
> 2. Inference runs *on the UB server*
> 3. The server is assumed to be *a VM without a GPU*
>
> Running inference on the server means streaming video continuously from two cameras, over
> weak Wi-Fi, to a machine without a GPU. That configuration cannot work as described.
>
> Two resolutions, either of which works:
> - **Edge inference.** A small machine next to the camera counts locally and posts a number
>   every few seconds — a few hundred bytes instead of a video stream. Also the strongest
>   possible privacy argument, since video never leaves the room. Cost ~600 RON, unbudgeted.
> - **A camera that counts on its own.** Some network cameras do people-counting in firmware.
>   If DCCAS is buying anyway, specifying this costs nothing extra.
>
> The architecture above is drawn for edge inference because it is the only variant that
> survives contact with a weak network. `services/vision` runs identically on a mini-PC or on
> the UB server — only its deployment target changes.
