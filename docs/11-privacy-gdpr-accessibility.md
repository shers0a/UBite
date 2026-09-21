# Privacy, GDPR and Accessibility

**Read this before the camera is switched on, not after.** Nothing in this document is
optional, and one item in it can stop the AI module days before launch.

This is written by developers, not lawyers. Every item marked **must be confirmed** requires
sign-off from the University's Data Protection Officer.

## Current status: the largest unmanaged risk

As of the requirements session:

- **Nobody knows who the UB Data Protection Officer is.** No one has contacted them.
- **Nobody has been assigned** to write the privacy policy or the entrance signage.
- The team's initial position was to **retain images for training and debugging**.

Meanwhile the signed application form states the module will operate
*"fără utilizarea tehnologiilor de recunoaștere facială și fără identificarea persoanelor"*.

Storing images of identifiable people sits in direct tension with the document Andra signed.
Resolving this is the first action item of the project.

## Why a camera is a data-protection matter at all

A camera pointed at a canteen records images of identifiable people. Those images are personal
data while they exist, even when the purpose is only to count. Not performing facial
recognition reduces the risk substantially — it does not remove the obligation.

What makes this manageable is the system design: if frames are processed in memory and
discarded, and the only thing that persists is an integer, the processing is brief, minimal and
anonymous in its output. That is a defensible position and it is the one to present.

## Mandatory technical requirements

These are architectural constraints, enforced in code.

1. **No image is ever written to the database.** `crowd_observations` contains a count, never a
   frame. See [05-domain-model.md](05-domain-model.md).
2. **Frames are discarded immediately after inference**, within the same function call.
3. **Only `{timestamp, zone, person_count, confidence}` leaves the vision service.**
4. **No identification, no tracking, no re-identification** between frames or across time. A
   person is an anonymous increment.
5. **A configured zone polygon** limits counting to the queue area, so the system processes as
   little of the room as possible.
6. **Edge inference preferred**, so video never traverses the network at all. This is both the
   best privacy posture and the only configuration that works over the canteen's weak Wi-Fi.

### The calibration-images exception

The team elected to keep a few dozen images for initial calibration. If that goes ahead, all of
the following apply:

- Captured with the canteen **empty**, or with the explicit consent of everyone present
- Stored encrypted, on a single machine, never in the repository, never in the database
- A written retention limit — deleted immediately after calibration, and in any case before the
  pilot ends
- Documented in the DPIA with justification
- **Confirmed in advance with the DPO**

Simpler and strongly recommended: **skip it.** A pre-trained detector counts people without any
canteen images at all, which removes this entire category of risk for no loss of capability.

## Required paperwork

| Item | What it is | Owner | Status |
|---|---|---|---|
| DPO contact | Identify and brief the UB DPO | Andra | **Not started** |
| Controller designation | Confirm UB is the data controller, in writing | Andra | Not started |
| Lawful basis | Which basis covers the camera | DPO | Not started |
| DPIA | Impact assessment for the camera | Team drafts, DPO approves | Not started |
| Entrance signage | Notice that counting occurs and no one is identified | Team drafts, DCCAS mounts | Not started |
| Privacy policy | In-app, plain Romanian and English | Team drafts, UB legal approves | Not started |
| Retention schedule | How long each data category is kept | Team | Drafted below |

**The team is not the data controller.** The University is. This is not a formality: it
determines who is accountable for the personal data of thousands of students. Get it in writing
before the first real user.

A DPIA is likely to be required here, because systematic monitoring of a publicly accessible
area is one of the standard triggers. Assume it is needed and be pleasantly surprised.

## Data retention

| Data | Retention | Reason |
|---|---|---|
| Camera frames | **Zero** — never stored | Design constraint |
| Person counts | Duration of pilot + reporting period | Needed for R7, R8, R12 |
| Receipt images | Deleted immediately after parsing | Only hash and totals persist |
| Receipt hashes | Duration of loyalty programme | Duplicate prevention |
| Wait reports | Duration of pilot + reporting | Feeds calibration and R8 |
| Accounts | Until deletion requested, or end of project | |
| Feedback | Duration of pilot + reporting | R11, R12 |
| Analytics | Aggregate only, no individual records | R9 |

## Data minimisation

The account model deliberately stores **email, role, locale and dietary preference only**. Not
name, not faculty, not year, not phone — even though the application form collected those for
the team members themselves.

Every field not collected is a field that cannot leak and does not need protecting.

The menu and crowding are public without an account. Most users will therefore never create one
at all, which is both the right product decision and the right privacy decision.

## Rights that must actually work

- **Access** — a user can see their own data (this is the personal history feature)
- **Erasure** — a user can delete their account from within the app, not by emailing someone
- **Objection** — the camera counts anonymously; there is nothing to object to individually,
  which is precisely the point of the design

## Analytics

Self-hosted, cookie-free, no personal identifiers, no transfer to third parties. Aggregate
counts only.

This is not only a privacy choice. It is the only way to produce the unique-visitor figure that
evidences R9 without creating a second pile of personal data to defend.

## Accessibility

Target: **WCAG 2.1 level AA, documented.**

The University is a public institution, and public-sector websites and mobile applications in
the EU fall under accessibility requirements (Directive 2016/2102, technical standard
EN 301 549). Confirm the specific obligation with UB, but build to AA regardless.

Practical requirements, cheap if done from the start and expensive if retrofitted:

- Contrast at least 4.5:1 for body text, 3:1 for large text and interface components — verified
  in **both** light and dark themes
- Every interactive element reachable and operable by keyboard, with a visible focus indicator
- Proper semantic structure and labels; the crowding level must be conveyed by **text**, not by
  colour alone — "Moderate · ~5 min", never just an amber dot
- Touch targets at least 44×44 px, which also matters at the kiosk
- Respect `prefers-reduced-motion`
- Language attribute set correctly, and switched with the interface language
- Works at 400px width and at 200% zoom without horizontal scrolling

> **NOTE** — Full documented AA conformance, broad test coverage and nineteen features in the
> time available is an aggressive combination. See the scope conflict in
> [02-vision-and-scope.md](02-vision-and-scope.md). The accessibility items above are ordered
> by value: the first four deliver most of the benefit.

## Food information

Allergen and dietary data carry real consequences.

- The **canteen is the source**. The team must never infer allergen content from a dish name.
- Where data is absent, display "information not available" — **never** imply absence of an
  allergen.
- Every dish detail screen carries a disclaimer naming the canteen as the authority.
- `gluten_free` and `lactose_free` are held to the same standard as allergens.

## First actions

1. Andra asks UB who the Data Protection Officer is. One email.
2. The team drafts the DPIA and the privacy policy — they know what the system does.
3. Confirm in writing that UB is the controller.
4. Decide, and record, whether any calibration images are captured at all.
5. Draft the entrance signage together with DCCAS.

Items 1–3 have long lead times and zero cost. Starting them today costs nothing and protects
the entire O.2 objective.
