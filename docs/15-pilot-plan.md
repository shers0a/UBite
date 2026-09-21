# Pilot Plan

Objective **O.3**. The pilot must produce, by 31 October: **300 unique users (R9)**, **100
feedback responses (R11)**, **50 loyalty enrolments (R14)**, **3 promotional materials (R10)**
and **a behaviour report (R12)**.

Launch target: **13 October**, leaving roughly thirteen operating days.

## The arithmetic is favourable

The canteen serves about **1.000 people per day**. Over thirteen operating days that is
~13.000 visits. The target is 300 unique users — roughly **2,3% of visits**, or about
**23 new users per operating day**.

This is comfortably achievable from canteen footfall alone, before any promotion, provided one
thing is true: **the QR codes are visible and the app is worth opening twice.**

The earlier fear — that 300 testers might exceed the canteen's entire clientele — came from an
assumed venue of under 200 people a day. The real figure removes that concern entirely.

| Target | Required rate | Assessment |
|---|---|---|
| 300 unique users | ~23/day | Achievable from footfall |
| 100 feedback responses | ~8/day, 33% of users | **The hard one** |
| 50 loyalty enrolments | ~4/day | Achievable if progress is visible |

R11 is the binding constraint, not R9. A 33% feedback rate does not happen by accident.

## Acquisition channels

All four were selected by the team.

### 1 · QR in the canteen — the primary channel

Posters and stickers where people already queue. Budgeted: 10 A3 posters (50 RON), 125 A5
flyers (100 RON), 100 stickers (200 RON) — these also satisfy **R10**.

Placement matters more than quantity: at eye level in the queue, on the tables, at the till. A
person standing in a queue with nothing to do is the most receptive audience this project will
ever have.

### 2 · The kiosk

Rotates a download QR every cycle. Highest-conversion single surface, because it reaches people
at the exact moment of need. See [08-kiosk.md](08-kiosk.md).

### 3 · Faculty groups and ASMI

Instant reach to thousands of students at Mathematics & Informatics, at zero cost.

> ASMI currently has **no formal role** in the project. This is the cheapest unexploited asset
> available — worth a conversation with Fabian. It also offers a natural answer to the
> maintenance question after 31 October.

### 4 · UB and FAA social media

Nae Nicolae Alexandru is Promotion Officer and Lemnaru Alexandru-Mihăiță is Institutional
Communication. This is their role in the signed application, and it frees the dev team
entirely.

## Reaching 100 feedback responses

A 33% response rate requires the ask to be well-timed and very short.

- **In-app form**, as the application form requires. Four questions, under thirty seconds:
  satisfaction with food (1–5), usefulness of the app (1–5), what feature is missing (free
  text), and whether the app influenced the decision to come.
- **Offered after several visits**, never on first open. Someone who has used it three times
  has an opinion; someone who just arrived does not.
- **Anonymous permitted** — requiring sign-in would halve the volume.
- **Kiosk emoji tap** as a parallel low-effort channel, contributing volume from people who
  never installed anything.

The fourth question — *did the app bring you here?* — is the only one that evidences behavioural
impact rather than usage. It is the single most valuable field for R12 and for any future
funding application.

## Reaching 50 loyalty enrolments

Progress is shown as five filling dots **on the home screen**, not inside a profile. Visible
progress is the entire mechanism.

A notification at four visits ("one more for a free meal") closes the loop.

If DCCAS agreement is slow, the soft variant in [09-loyalty.md](09-loyalty.md) still delivers
R13, R14 and R15.

## Measurement — must exist on day one

**R9, R11, R12 and R14 cannot be reconstructed retroactively.** Self-hosted, cookie-free
analytics must be running before the first public user.

Tracked: unique visitors per day, feature usage, peak hours, PWA installation rate.

Export weekly. Do not assume a dashboard will still be there on 30 October.

## Timeline

| Week | Dates | Focus |
|---|---|---|
| Pre-launch | 22 Sep – 12 Oct | Build. Site visit in week one. Promotional materials designed and printed. Analytics live. |
| Week 1 | 13 – 17 Oct | Launch. Posters up, kiosk live. Watch adoption daily. Crowding runs on reports and history; hourly prediction hidden. |
| Week 2 | 20 – 24 Oct | Prediction switched on. Feedback prompts begin. First numbers reviewed against targets. |
| Week 3 | 27 – 31 Oct | Push to close any gap on targets. Freeze features. Collect evidence. Write R4, R8, R12, R15. |

A staged launch is worth considering: menu and status live around 1 October to start
accumulating users and crowding history, with the full feature set on 13 October. Feature flags
already support this — see [12](12-infrastructure-and-deployment.md).

## Support

A contact form, checked daily by the team, was the chosen mechanism.

With 300 users in under three weeks there will be complaints. Silence damages the pilot's
reputation faster than bugs do. Nae and Lemnaru can absorb non-technical questions on the
communication channels and escalate only what is genuinely technical.

## The opening event

DCCAS proposed an event when the first working version is ready. If it happens, it belongs in
week one, and it is worth a promotional push and photographs for the final report.

The dev team should not organise it.

## Weekly check

Three numbers, every Friday, against target:

| | Week 1 | Week 2 | Week 3 |
|---|---|---|---|
| Unique users (target 300) | ~100 | ~200 | 300 |
| Feedback (target 100) | ~25 | ~60 | 100 |
| Loyalty enrolments (target 50) | ~15 | ~35 | 50 |

If week one lands under half of its interim target, the problem is almost certainly visibility,
not the product. Move the posters, enlarge the kiosk QR, and push the faculty groups again
before changing anything in the application.
