# Open Questions

Everything unresolved, with an owner and a deadline. Most of it closes with **one site visit
and three emails.**

Grouped by who can answer, so each group can be sent as a single message rather than dripped
out over weeks.

Status: ⬜ open · 🟡 asked · ✅ answered

---

## A · For Andra — send as one message

| # | Question | Why it matters | Needed by | Status |
|---|---|---|---|---|
| A1 | **Raw results of the student survey** you ran | The only real user research that already exists, and the dev team has never seen it | Immediately | ⬜ |
| A2 | Who is the UB **Data Protection Officer**? | Blocks the camera entirely. See [11](11-privacy-gdpr-accessibility.md) | This week | ⬜ |
| A3 | Confirm in writing that **UB is the data controller** | Otherwise three students are personally accountable for thousands of students' data | Before first real user | ⬜ |
| A4 | The **Google Doc with the phased outline** you shared on 19 Sept | The dev team has not seen it | Immediately | ⬜ |
| A5 | Does UB have a **brand manual**? | Needed before the design system is finalised | This week | ⬜ |
| A6 | Is money paid **in advance or by reimbursement**? | Determines whether anyone must front 3.000 RON | Before any purchase | ⬜ |
| A7 | What do the **1.200 RON for "AI subscriptions"** actually buy, and who is invoiced? | You signed this line; you will be the one asked | Before purchase | ⬜ |
| A8 | Can the **budget grid be amended** after approval? | Cameras and edge compute are unbudgeted | This week | ⬜ |
| A9 | The form says **one camera**; the team plans two. Acceptable deviation? | Avoids a discrepancy in the final report | Before ordering | ⬜ |
| A10 | Who owns **R16** (sustainability plan) and **R17** (business partnership proposal)? | R17 has never been discussed by anyone, and it is in the signed form | This week | ⬜ |
| A11 | What exactly counts as **"the MVP is done"**? | No acceptance criteria were ever agreed | Before 13 Oct | ⬜ |

> A1 and A2 are the two highest-value items in this entire document. Both are a single email.

---

## B · For DCCAS — Cîrciumaru Cosmin Octavian

`cosmin.circiumaru@rectorat.unibuc.ro` · +4021 3059749

| # | Question | Why it matters | Needed by | Status |
|---|---|---|---|---|
| B1 | **Written confirmation** that DCCAS buys the cameras, with a date and specification | Currently a verbal promise relayed second-hand. Blocks O.2 | **10 Oct decision point** | ⬜ |
| B2 | Can the cameras **count people in firmware**? | Would resolve the Wi-Fi/GPU conflict at zero cost | Before purchase | ⬜ |
| B3 | **Written agreement on loyalty**: who funds the free meal, and how it is accounted for | Blocks R13, R14, R15 | Before 13 Oct | ⬜ |
| B4 | **Permission to mount** a camera and a tablet on the wall | The team chose to mount them personally | Before installation | ⬜ |
| B5 | Who **owns the tablet** after 31 October? | 900 RON of public money must land somewhere | Before purchase | ⬜ |
| B6 | Can we get **till counts per time slot**? | Free, exact ground truth for R8 | Before pilot | ⬜ |
| B7 | Is there an existing **dish or recipe list** we can import? | Would seed the catalogue instantly | Before 13 Oct | ⬜ |

Take numbers to B3, not concepts: ~10 RON per menu, roughly 10 RON given per 50 RON spent,
total exposure a few hundred RON, all of it visible in a dashboard built for him.

---

## C · For UB digitalisation — Rareș Cristea

| # | Question | Why it matters | Needed by | Status |
|---|---|---|---|---|
| C1 | **Server specification**: CPU, RAM, GPU, OS, inbound access | Determines whether server-side inference is possible at all | This week | ⬜ |
| C2 | **Credentials and a date** for server access | "We have servers" is not access | This week | ⬜ |
| C3 | Is **institutional SSO** available, on what protocol, by when? | Fallback already chosen, but SSO is better if it arrives | Before 13 Oct | ⬜ |
| C4 | Can we have **`ubite.unibuc.ro`**? | Long lead time, zero cost, start now | This week | ⬜ |
| C5 | Will the **firewall** permit a camera to reach the server? | Only relevant if inference stays server-side | Before installation | ⬜ |

None of these block launch — [12](12-infrastructure-and-deployment.md) removes that dependency
deliberately. They determine how good the final setup is, not whether it exists.

---

## D · Site visit — one trip, thirty minutes

Full checklist in [20-canteen-field-facts.md](20-canteen-field-facts.md). The items that change
engineering decisions:

| # | Question | What it changes | Status |
|---|---|---|---|
| D1 | **Time ten people through the till** | The throughput prior in the fusion algorithm | ⬜ |
| D2 | Queue geometry and a photo from ceiling height | Camera position and zone polygon | ⬜ |
| D3 | **Actual Wi-Fi strength** at entrance, queue and till | Decides edge vs server inference, and whether offline mode is load-bearing | ⬜ |
| D4 | Power socket and ethernet availability | Camera and kiosk feasibility | ⬜ |
| D5 | Wall position for the kiosk | R3 | ⬜ |
| D6 | **Photograph a fiscal receipt** | The entire loyalty mechanism depends on its format | ⬜ |
| D7 | Does the receipt carry a unique number? | Duplicate prevention | ⬜ |
| D8 | Who writes today's menu, and on what? | The menu editor design | ⬜ |
| D9 | What device does the office have? | Whether the admin panel is used on a phone or a PC | ⬜ |
| D10 | Is there an electronic till/POS, and which? | Any future integration | ⬜ |
| D11 | Real seat count and peak occupancy | Crowding thresholds, and whether a hall camera is worth it | ⬜ |
| D12 | **Is there evening service?** Sources disagree | Opening hours gate reports and loyalty | ⬜ |
| D13 | Staff email domain | Auth allowlist | ⬜ |
| D14 | **Who is the one person willing to spend two minutes a day?** | The single biggest adoption risk | ⬜ |

---

## E · Team decisions — nobody else can answer these

| # | Decision | Deadline | Status |
|---|---|---|---|
| E1 | **Named owner and backup for the vision module** | This week | ⬜ |
| E2 | Who acts on the "no menu published by 10:00" alert | Before launch | ⬜ |
| E3 | Do we capture **any calibration images at all**? Recommended: no | Before camera install | ⬜ |
| E4 | GitHub Organisation, or keep the personal repository? | This week | ⬜ |
| E5 | **Feature freeze date** | Set it now, honour it later | ⬜ |
| E6 | Single launch on 13 Oct, or staged — menu earlier, crowding later? | This week | ⬜ |
| E7 | Typeface for the design system | With the design system | ⬜ |
| E8 | Who enters the menu if the canteen does not | Before launch | ⬜ |

---

## Assumptions currently in force

These are decisions made **without** confirmed facts. The system is built on them. Each is safe
to build on and must eventually be verified.

| Assumption | Where it lives | Verified by |
|---|---|---|
| Queue is the bottleneck, not seating | [07](07-crowding-module.md) | D2, D11 |
| ~10 people/minute till throughput | [07](07-crowding-module.md) | D1 |
| Fiscal receipts exist and carry unique numbers | [09](09-loyalty.md) | D6, D7 |
| Kiosk goes at the entrance | [08](08-kiosk.md) | D5 |
| Power and network exist at the camera position | [08](08-kiosk.md), [12](12-infrastructure-and-deployment.md) | D4 |
| UB server is a VM without a GPU | [12](12-infrastructure-and-deployment.md) | C1 |
| SSO will not arrive in time | [10](10-auth-and-roles.md) | C3 |
| Catalogue stays under 40 dishes | [05](05-domain-model.md) | B7, D8 |
| Opening hours Mon–Fri 11:30–17:00 | Confirmed via unibuc.ro | D12 |
| Canteen serves ~1.000 people/day | Confirmed via unibuc.ro | D11 |
