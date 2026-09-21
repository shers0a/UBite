# Non-Functional Requirements

## Performance

The usage context is specific: a student on a phone, possibly on weak canteen Wi-Fi or mobile
data, deciding in seconds whether to walk somewhere.

| Requirement | Target |
|---|---|
| First meaningful content | Under 2s on a mid-range phone, 4G |
| Cached repeat open | Under 1s |
| Crowding refresh | Every 30s while the screen is open |
| API response, read endpoints | Under 300ms at the server |
| Initial JavaScript payload | As small as the design allows; measure it and keep it honest |
| Images | Dish photos served in a modern format, sized for their display, lazy-loaded below the fold |

The crowding number and today's menu must render from cache **before** the network responds,
then update in place. This is the single most important performance behaviour in the
application.

## Availability

| Requirement | Target |
|---|---|
| Uptime during opening hours (Mon–Fri 11:30–17:00) | Best effort, monitored, alerted |
| Outside opening hours | Lower stakes; deploys belong here |
| Planned deployments | Never between 11:00 and 17:30 on a weekday |

Alerting is configured for: application unreachable, camera silent, and no menu published by
10:00. See [12-infrastructure-and-deployment.md](12-infrastructure-and-deployment.md).

## Offline and resilience

Weak Wi-Fi is a confirmed condition, not a hypothetical.

- Today's menu, dish catalogue, loyalty QR and last crowding estimate are cached and usable
  offline
- The loyalty QR generates locally — it must work at the till, the worst signal point in the
  building
- Wait reports and feedback compose offline and flush on reconnect, preserving original
  timestamps
- Every cached value displays its age
- The application never shows a browser error page; this matters most on the kiosk

## Security

- HTTPS everywhere, mandatory — a PWA will not install otherwise
- No passwords exist in the system, therefore none can be stolen
- Session cookies `httpOnly`, `Secure`, `SameSite=Lax`
- Role checks enforced server-side on every endpoint
- Rate limiting on authentication, wait reports and receipt uploads
- The vision service holds a rotatable service token, never database credentials
- No secrets in the repository; the repository is public after launch
- Dependencies pinned, with automated vulnerability alerts enabled

## Privacy

Fully specified in [11-privacy-gdpr-accessibility.md](11-privacy-gdpr-accessibility.md).
Summarised as engineering constraints:

- No camera frame is ever persisted
- Receipt images are deleted immediately after parsing
- Accounts store email, role, locale and dietary preference only
- Analytics are self-hosted, cookie-free, aggregate only
- Account deletion is available in-app

## Accessibility

Target: **documented WCAG 2.1 AA**. Built into components rather than reviewed at the end.
Details in [11](11-privacy-gdpr-accessibility.md) and [19](19-design-system-brief.md).

The rule with the most practical consequence: **crowding level is conveyed by text, never by
colour alone.**

## Internationalisation

- Romanian and English, complete interface and dish catalogue
- Default from browser language, switchable and remembered
- All user-facing strings externalised from day one — retrofitting this is expensive and
  the structure costs nothing if present from the start
- Dish names translated once, since the catalogue is fixed and under 40 items
- Dates, times and currency formatted per locale; `Europe/Bucharest` throughout

## Browser and device support

| Target | Requirement |
|---|---|
| Mobile | Recent iOS Safari and Android Chrome — the overwhelming majority of use |
| Desktop | Recent Chrome, Firefox, Edge, Safari — mainly staff and DCCAS |
| Kiosk | Android tablet, Chrome, locked to one URL |
| Minimum width | 400px, no horizontal scroll |
| Zoom | Usable at 200% |

iOS note: push notifications require the PWA to be installed to the home screen, on a recent
iOS version. The contextual install prompt exists for this reason.

## Maintainability

- TypeScript across `web` and `api`, with shared types in `packages/shared`
- Consistent formatting and linting, enforced in CI
- Environment configuration through environment variables, never committed
- Database migrations versioned and committed
- README hand-written, per the team's explicit decision

### Testing

The team's stated aim is broad coverage across backend and frontend. The minimum that must
exist regardless of time pressure:

- **Fusion algorithm** — decay weighting, weighted median, confidence scaling, outlier
  rejection, and every degradation path. An error here is invisible and publishes a wrong
  number to every user.
- **Loyalty ledger** — one point per day, global receipt uniqueness, reward issuance and
  single-use redemption. An error here gives away free meals or denies earned ones.

Everything else is visible to the eye during use. These two are not.

## Observability

- Error tracking with a free-tier service
- Uptime monitoring with alerting
- Alert when the camera stops reporting
- Alert when no menu is published by 10:00 on an operating day
- Structured server logs; never log personal data

## Reporting capability

A non-functional requirement that the funding contract creates:

The system must, at any moment, be able to produce unique visitors per day, feature usage,
peak hours, PWA installation count, feedback exports and loyalty enrolment.

**This capability must exist from the first public day.** R9, R11, R12 and R14 cannot be
reconstructed retroactively. See [13-traceability-matrix.md](13-traceability-matrix.md).
