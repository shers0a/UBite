# Infrastructure & Deployment

## The governing decision

**Do not wait for University infrastructure.** Launch on free hosting, migrate when UB
provisioning arrives.

Server access, SSO and the `unibuc.ro` subdomain are all verbal promises. Nobody has
credentials, nobody knows the specification, and none has a date. Between "we have servers" and
a working SSH session can sit three weeks of institutional process — which is more than half of
the project.

Because PostgreSQL runs locally, on free tiers and on a UB server alike, migration is a
connection-string change rather than a rewrite. This risk is therefore cheap to neutralise, and
neutralising it unblocks everything else.

## Environments

| Environment | Purpose | Hosting | Database |
|---|---|---|---|
| Local | Development | Docker Compose | Postgres in Docker |
| Staging | Pre-release verification | Free tier | Free managed Postgres |
| Production | The pilot | Free tier initially, UB server when ready | Managed Postgres |

## Domain and TLS

Requested: **`ubite.unibuc.ro`**, for institutional credibility and zero cost.

Request it now, through Andra to UB digitalisation. Until it exists, run on the hosting
provider's subdomain.

HTTPS is not optional — a PWA will not install without it, and push notifications will not
work. Free automatic certificates are standard on every candidate host.

> **OPEN** — If the UB subdomain proves slow, a `.ro` domain costs roughly 50 RON a year and is
> available immediately. Unbudgeted, but trivially small.

## Deployment

- **CI on every pull request**: typecheck, lint, tests, build
- **Automatic deploy to staging** from the main branch
- **Manual promotion to production**, deliberately — a student project should not auto-deploy
  into a live lunch service
- **Never deploy between 11:00 and 17:30 on a weekday.** That is the entire operating window.
- Database migrations run as a separate, explicit step

## The vision service

Deployed independently of everything else, because it is the component most likely to be
delayed or cancelled.

Runs as a long-lived process next to the camera, or on the UB server if that turns out to be
viable. It needs only outbound HTTPS to the API and a service token. It holds no database
credentials.

> **CONFLICT — read before buying hardware.** Inference was chosen to run on the UB server,
> which is assumed to be a VM without a GPU, while canteen Wi-Fi is weak. Streaming two camera
> feeds across a weak network to a CPU-only machine does not work.
>
> **Edge inference** resolves it: the process runs beside the camera, and only a few hundred
> bytes per observation cross the network. It is also the strongest privacy argument available,
> since video never leaves the room. Cost ~600 RON, unbudgeted.
>
> **Alternative:** specify cameras that count people in firmware. If DCCAS is purchasing
> anyway, this costs nothing extra and removes the problem entirely.
>
> Measure the actual Wi-Fi strength during the site visit before committing to either.

## Configuration

Everything environment-specific comes from environment variables: database URL, session secret,
email provider credentials, vision service token, analytics endpoint, feature flags.

Nothing secret enters the repository. The repository becomes public at launch, so this is not
merely hygiene.

A committed `.env.example` documents every variable without values.

## Feature flags

Simple environment-driven flags, so that incomplete or blocked features can be hidden without
branching:

- `FEATURE_CAMERA` — camera-based crowding
- `FEATURE_LOYALTY` — pending DCCAS agreement
- `FEATURE_WASTE` — pending portion data
- `FEATURE_PREDICTION` — hidden during week one while history accumulates

This is what makes the staged launch possible: ship the menu and reports on time, switch on the
camera when it exists.

## Backups

- Managed Postgres with daily automated backups
- A manual export before each production migration
- One restore rehearsed before launch, so the procedure is known rather than assumed

Loyalty data cannot be reconstructed from anywhere else. Losing it means losing R13 and R14.

## Monitoring and alerting

| Alert | Why |
|---|---|
| Application unreachable | Most critical between 11:30 and 17:00 |
| Error rate spike | Error tracking, free tier |
| Camera silent for over 15 minutes | Otherwise a frozen estimate is published for days |
| No menu published by 10:00 on an operating day | Catches canteen abandonment before students do |

The last alert needs a **named recipient who will act on it.** An alert nobody acts on changes
nothing — see R-03 in [16-risk-register.md](16-risk-register.md).

## Migration to UB infrastructure

When access materialises:

1. Confirm the specification — CPU, RAM, GPU, OS, inbound internet access
2. Provision Postgres there, restore from backup
3. Deploy `api` and `web`
4. Point the domain
5. Decide where `services/vision` lives, guided by the conflict above
6. Keep the free-tier environment as a fallback for the remainder of the pilot

Do not attempt this during the final week.

## Open items

- [ ] Request `ubite.unibuc.ro` through Andra — long lead time, start now
- [ ] Obtain the UB server specification
- [ ] Choose hosting provider and managed Postgres tier
- [ ] Choose and test a transactional email provider against `@s.unibuc.ro`
- [ ] Stand up self-hosted analytics before the first public day
- [ ] Name the person who receives the "no menu by 10:00" alert
