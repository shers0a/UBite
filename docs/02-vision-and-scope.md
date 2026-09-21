# Vision & Scope

## The thesis

A student has a twenty-minute break. Two questions decide whether they eat: **"will I make
it?"** and **"is it worth it?"** UBite answers both in one glance, before they leave the
building.

Everything else in this project is support for those two questions.

A canteen reviewer put it better than any requirements document could: service is *"usually
fast, but depends on the crowd of students and when they finish/enter their courses."* The
crowd is predictable, because timetables are predictable. That is the opportunity.

## Product principles

These emerged from the requirements session and should settle future arguments.

1. **Never depend on canteen staff effort beyond two minutes a day.** Every feature that
   required more was deliberately rejected. The one remaining dependency — entering the daily
   menu — is the project's largest adoption risk and is treated as such.
2. **Value before friction.** The menu and crowding are public, no account needed. Accounts
   are requested only when the user wants something that requires one.
3. **Degrade, never disappear.** No camera, no reports, no menu — the app still shows
   something honest and useful. This matters doubly because the camera may never arrive.
4. **The signed application form is the contract.** Where the form and a good idea disagree,
   the form wins unless renegotiated with Andra.

## In scope

Nineteen features were confirmed. The five that satisfy **R2** ("minimum 5 functionalities")
are marked **[R2]** — these are the contractual floor.

### Core student experience

| # | Feature | Notes |
|---|---|---|
| F1 | **[R2]** Daily menu with prices | Grouped by category, single scrolling screen |
| F2 | **[R2]** Dish details | Price, weight, allergens, dietary tags, photo |
| F3 | **[R2]** Crowding level | Three levels from the form + estimated wait in minutes |
| F4 | **[R2]** Loyalty 5+1 | Receipt-photo based, see [09](09-loyalty.md) |
| F5 | **[R2]** Feedback + notifications | In-app form, push notifications |
| F6 | Student wait reports | "How long did you wait?" in minutes |
| F7 | Estimated wait time | Derived, calibrated by F6 |
| F8 | Hourly crowding prediction | From history; works with no camera at all |
| F9 | Personal history | Spend this month, visit count, what was eaten, savings |
| F10 | Favourites + alerts | Heart on a dish; notify when it is on the menu |
| F11 | Dietary filters | Filter buttons **and** a saved account preference |
| F12 | Dish ratings | 1–5 stars, account required, feeds "top of the month" |
| F13 | Canteen status & schedule | Open/closed, hours, announcements |

### Canteen and DCCAS

| # | Feature | Notes |
|---|---|---|
| F14 | Menu editor | Dish-list with checkboxes, must fit in two minutes |
| F15 | Canteen announcements | "Closed tomorrow", special menus |
| F16 | DCCAS dashboard | Daily/hourly footfall, best and worst dishes, aggregated feedback, loyalty usage |
| F17 | Food-waste analysis | Portions prepared vs. demand; optional field, never blocking |

### Platform

| # | Feature | Notes |
|---|---|---|
| F18 | Analytics | Privacy-respecting, self-hosted. **Without this, R9/R11/R12 cannot be proven.** |
| F19 | Romanian and English | Interface and dish catalogue, translated by the team |
| F20 | Offline mode | Today's menu, loyalty code, last known crowding, queued reports |

Yes, that is twenty entries for nineteen features — F13 merges two related items.

## Explicitly out of scope

Rejected during requirements, with the reason. Do not reopen without a decision.

| Not building | Why |
|---|---|
| Pre-order / meal reservation | Requires real canteen workflow change |
| Real-time "sold out" marking | Requires staff to press a button during service |
| Week-ahead menu | Requires the canteen to plan and publish ahead |
| Daily real food photos | Requires daily staff effort |
| Automatic UNIHUB report export | Not selected; report assembled manually from the dashboard |
| Payments of any kind | Never in scope. The app records purchases, it never processes money |
| Facial recognition or person identification | Explicitly excluded by the signed application form |
| Native iOS/Android apps | PWA covers both; decided in the group chat |
| Google Play distribution | Same |

## The scope conflict

> **CONFLICT** — Three decisions cannot all hold:
> 1. "Done" is defined as **everything confirmed in the requirements session** (~19 features)
> 2. Pilot launch is **13 October**, leaving ~2,5 weeks of pilot
> 3. Quality bar is **full WCAG AA, documented** and **broad test coverage, backend and frontend**
>
> With three part-time student developers and roughly ten working days before launch, the time
> budget does not cover all three simultaneously. This is recorded, not resolved — the team
> chose to aim high deliberately.
>
> If something has to give, the recommended order of sacrifice is: broad test coverage first
> (keep tests on fusion logic and loyalty, where errors are invisible and serious), then the
> longer tail of F9–F17, and never F1–F5, which are the contractual floor.
>
> The fallback that protects the project regardless: **F1, F8, F13, F18 need no camera, no
> DCCAS agreement, and no DPO approval.** They can ship on day one.

## Delivery shape

Two things are true at once: the camera may arrive late or never, and the pilot needs users
early. The architecture therefore treats crowding as a *pluggable estimate* with three
independent sources (see [07](07-crowding-module.md)), so the launch date does not depend on
hardware procurement.

| Milestone | Target | Depends on |
|---|---|---|
| Repository, design system, schema | Now — no funding needed | Nothing |
| Menu + catalogue + PWA shell live | ~1 October | Hosting |
| Public pilot launch | **13 October** | Menu data, analytics |
| Crowding from reports + history | 13 October | Users reporting |
| Crowding from camera | When hardware and DPO allow | DCCAS, DPO |
| Loyalty live | When DCCAS agrees in writing | DCCAS |
| Reporting pack for UNIHUB | 31 October | Analytics from day one |

## Beneficiary numbers

The application form claims ~37.000 UB students as the potential beneficiary pool. The honest
operational number is different and better: the canteen serves **~1.000 people per day**, and
the pilot needs **300 unique users**. Over roughly thirteen operating days between launch and
31 October, that is a reachable target from canteen footfall alone — before any promotion.
