# Decision Log

Decisions taken during the requirements session of 21 September 2026, with the reasoning behind
each. Recorded so that nobody re-argues a settled point, and so that a decision can be reopened
knowingly rather than by accident.

Format: **D-nn · Decision · Why · Consequence**

---

## Product

**D-01 · The dish is the unit of the model, not the meal package.**
Everything else — dietary filters, per-dish ratings, favourites, statistics — becomes possible
only if dishes are first-class entities. *Consequence:* a fixed catalogue is required, and the
canteen's small repeating rotation makes it viable.

**D-02 · Menu and crowding are public; accounts are requested at the point of need.**
The pilot needs 300 unique users in under three weeks. Every screen before the value costs a
share of them. *Consequence:* most users never create an account, which is also the better
privacy posture.

**D-03 · Do not build features that require canteen staff effort.**
Pre-ordering, real-time "sold out" marking, weekly menus and daily photos were all rejected on
this ground. *Consequence:* the single remaining staff dependency — entering the daily menu —
becomes the project's largest adoption risk and is managed as such.

**D-04 · Three crowding levels *and* an estimated wait in minutes.**
The three levels are contractual; the minutes are what a student actually needs.
*Consequence:* the system must convert people into minutes, which motivates D-06.

**D-05 · Student wait reports are collected in minutes, not as a three-way "how full is it".**
Minutes are directly useful and directly comparable to a camera count. *Consequence:* reports
become a calibration signal rather than merely a second opinion.

---

## Crowding module

**D-06 · Reports calibrate the camera-to-minutes conversion.**
A camera counts people; students report minutes. Pairing them learns the throughput instead of
guessing it. *Consequence:* R8's accuracy analysis is produced continuously and for free.

**D-07 · Nominal 70/30 camera/report weighting, scaled by each source's confidence.**
A single expression yields 70/30 when both are healthy, 100% reports when the camera is down,
100% camera when nobody reports, and history when neither exists. *Consequence:* no branching
logic, and the launch does not depend on hardware.

**D-08 · 20-minute half-life decay on reports, weighted median.**
Decay that is "not too fast", per the team, and a median because a public reporting feature will
contain nonsense. *Consequence:* one absurd report cannot move the published number.

**D-09 · Pre-trained detection; no model training on the critical path.**
Counting people needs no bespoke model. *Consequence:* removes weeks of work and removes the
only reason to store images. Fine-tuning remains possible later if measured accuracy demands it.

**D-10 · The queue is measured, not the room.**
Field evidence says tables are almost never all occupied, while the queue is a recurring
complaint. *Consequence:* one well-placed camera beats two poorly-placed ones, and the form's
"one camera" wording is honoured.

---

## Loyalty

**D-11 · Purchases are proven by photographing the fiscal receipt.**
The only mechanism that proves an actual purchase while requiring nothing from the canteen —
and it yields the receipt total and line items for free, which two other confirmed features
need. *Consequence:* depends on OCR quality; manual entry is the documented fallback.

**D-12 · One point per calendar day; receipts are globally unique.**
Enforced by database constraints, not application code. *Consequence:* defeats receipt sharing
and repeat photography without any manual moderation.

---

## Platform

**D-13 · React PWA, TypeScript everywhere, Express API, Python vision service, PostgreSQL.**
Two of three developers know Express; Python is the only serious vision ecosystem; Postgres runs
identically on a laptop, a free tier and a UB server. *Consequence:* migration between hosts is
a connection-string change.

**D-14 · The vision service is a separate, isolated service.**
It is the only component depending on hardware that may never arrive and approval nobody has
requested. *Consequence:* if it slips or is cancelled, nothing else moves.

**D-15 · Launch on free hosting; migrate to UB infrastructure when it exists.**
Server, SSO and domain are all verbal promises with no dates. *Consequence:* institutional
delay can no longer threaten the launch date.

**D-16 · Email codes to `@s.unibuc.ro` rather than waiting for SSO.**
One day of work, no external dependency, verifies exactly what matters. *Consequence:* SSO can
be added later against the same accounts, because they are keyed on email.

**D-17 · Polling every 30 seconds, not persistent connections.**
Three levels do not change second to second, and polling survives weak Wi-Fi.

**D-18 · Analytics self-hosted and cookie-free, live from day one.**
R9, R11 and R12 cannot be reconstructed retroactively. *Consequence:* this is a launch blocker,
not a nice-to-have.

---

## Design

**D-19 · Custom design system, not a component library.**
The repository is public portfolio work; stock libraries make every app look the same.
*Consequence:* more work, and the crowding indicator is the component worth building first.

**D-20 · Dark mode from the start, through CSS variables.**
Retrofitting means rebuilding every component. *Consequence:* also makes a late UB palette
imposition a one-file change.

**D-21 · Home screen ordered by importance, with density increasing down the scroll.**
Crowding, then menu, then loyalty, then reporting, then prediction, then announcements.
*Consequence:* the two questions a student has are answered above the fold.

**D-22 · Own visual identity, not a UB sub-brand — but built on variables.**
Freedom now, compliance later if required.

---

## Process

**D-23 · Monorepo, GitHub Projects kanban, documentation in `docs/`.**
*Consequence:* both humans and AI assistants work from the same context.

**D-24 · Private repository until launch, then public under MIT.**
Protects credentials and camera details before DPO approval; good for portfolios afterwards.

**D-25 · Documentation in English; the summary for Andra in Romanian.**
Each document in the language of its readers.

**D-26 · The README is written by hand, not generated.**
An explicit team decision, recorded so it is not accidentally violated.

**D-27 · No de-scoping mindset. "Done" means everything confirmed.**
The team chose to aim high deliberately. *Consequence:* recorded as the primary schedule risk
rather than silently corrected — see R-04 in [16-risk-register.md](16-risk-register.md).

---

## Decisions deliberately deferred

| Question | Why deferred | Deadline |
|---|---|---|
| Who enters the menu if the canteen does not | Depends on the site visit | Before launch |
| Whether any calibration images are captured | Recommended: none | Before camera install |
| Named owner for the vision module | Team conversation | This week |
| GitHub Organisation vs personal repository | Team chose to keep current arrangement; recorded as a risk | This week |
| Single or staged launch | Depends on build progress | This week |
