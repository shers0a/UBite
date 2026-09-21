# Screen Specifications — Conceptual

**This document describes what each screen contains, where, and why. It contains no markup and
no layout code.** The visual design will be produced separately; this is the brief it works
from.

## The organising principle

Requested explicitly: **most important at the top, decreasing in importance as you scroll**,
with density increasing as importance decreases.

The top of the home screen is airy and answers the question the user came with in one glance.
Further down, where only people actively looking will go, information packs tighter.

## Home — the only screen that really matters

A student opens the app at 12:40 with twenty minutes free. Everything above the fold must
answer *"will I make it?"* and *"is it worth it?"*

### Zone 1 — Crowding now *(above the fold, maximum breathing room)*

The single most important element on the screen. Large, unmissable, readable at arm's length.

Contains:
- **Level** as a word: Low / Moderate / High. Never colour alone — accessibility and clarity
  both demand the word.
- **Estimated wait in minutes**, immediately beside or beneath it. This is what people actually
  want; the three levels are the contractual requirement.
- **Freshness**: "updated 40s ago". Every estimate carries its age.
- **Quality badge**, only when degraded: "approximate" or "usual for this time". Absent when
  live, so it signals something rather than becoming furniture.
- When the canteen is closed: opening hours replace the level entirely. No stale number.

Design intent: this block should be legible while walking.

### Zone 2 — Today's menu *(immediately below, still generous)*

The second question, answered without a tap.

- Grouped by category in fixed order: soup → main + side → dessert & salad → drinks & extras
- All categories on one scrolling surface, never behind tabs
- Each row: dish name, price, dietary tags, a small photo
- Dietary filter chips sit directly above the list, usable without an account; a signed-in user
  with a saved preference sees it pre-applied, with a clear way to see everything
- If today's menu is not published: previous menu shown, clearly marked outdated, with a short
  explanation. Never an empty state.

### Zone 3 — Loyalty progress *(compact)*

Five dots, filling. One line of context: "4 of 5 — one more for a free meal."

Signed out, this becomes a single quiet line inviting sign-in, not a wall.

Placed high deliberately: progress that is visible is progress that motivates, and R14 needs
fifty enrolled students.

### Zone 4 — Report your wait *(compact, contextual)*

"How long did you wait?" with quick minute options and a free entry.

Shown only during opening hours, and suppressed for an hour after a report is accepted. One
interaction, then straight back to where the user was.

### Zone 5 — Typical crowding today *(denser)*

The hourly pattern: "usually busy at 13:00, quiet at 11:45."

Hidden entirely during the first week of the pilot while data accumulates — a flat, wrong chart
costs more trust than an absent section.

### Zone 6 — Announcements *(dense, only when present)*

Canteen notices. Absent when there are none.

### Zone 7 — Footer *(densest)*

Opening hours, address, language switch, feedback link, privacy policy, account or sign-in.

## Dish detail

Reached by tapping any dish.

- Photo, name, price, weight
- Dietary tags
- **Allergens, with their source.** Where unknown, "information not available" — never implied
  absence. A disclaimer names the canteen as the authority.
- Calories only when supplied
- Average rating and count
- Star control for signed-in users; tapping while signed out prompts sign-in and then completes
  the rating
- Heart to favourite, same behaviour

## Account

Everything requiring an account, in one place: loyalty detail and reward codes, personal
history (monthly spend, visit count, dishes eaten, savings), favourites, dietary preference,
notification settings per type plus the time window, language, account deletion.

Nothing here is required to use the app. This screen is a destination, not a checkpoint.

## Add a visit

Opened from the loyalty block.

Camera view with guidance for photographing the fiscal receipt, then a confirmation of what was
parsed before it is recorded. On failure, a clear request for a better photo — never silent
acceptance, never silent rejection.

## Canteen staff — menu editor

The whole screen exists to be finished in under two minutes.

- Opens with **yesterday's menu preloaded**, since the rotation repeats most days
- Below it, the full catalogue as a checklist — under 40 items, so no search is needed
- Each selected dish: price, prefilled from the catalogue, overridable
- Each selected dish: an optional portions-prepared field. Empty never blocks publishing.
- Add a new dish inline; the catalogue grows through use rather than through a setup phase
- One action publishes

Design intent: someone in a hurry, in a kitchen, on a shared account, should be able to do this
without reading anything.

Second staff screen: announcements. Third: redeem a reward code — one field, one button, usable
with a queue forming behind it.

## DCCAS dashboard

Read-only. Footfall by day and hour; best and worst rated dishes; aggregated feedback including
the "did the app bring you here" figure; loyalty usage with the count and cost of free meals
given; food-waste analysis where portion data exists. Simple table export.

Design intent: this is the screen that converts DCCAS from gatekeeper to ally. It shows them
things they have never had.

## Kiosk

Specified in [08-kiosk.md](08-kiosk.md). Rotating panels, three-metre legibility, one tap
reveals full menu and three-emoji feedback, returns to rotation after inactivity.

## States every screen must define

Not optional, and the most commonly forgotten part of a build:

| State | Requirement |
|---|---|
| Loading | Skeleton matching final layout, never a spinner over blank space |
| Empty | Explains why and what happens next |
| Stale | Shows the age of the data |
| Offline | Cached content with a visible timestamp; queued actions acknowledged |
| Error | Plain language, a way forward, never a raw error |
| Closed canteen | Hours and next opening, instead of a crowding level |

## Onboarding

There is none, by design. The first open goes straight to crowding and menu.

- **Install prompt** appears on the second or third visit, when the user has demonstrated the
  app is useful to them — or earlier, contextually, when they ask for something that needs
  notifications.
- **Sign-in** is requested only at the point of need, with the reason stated, returning the
  user to the action afterwards.

## Notifications

Four types, each independently toggleable, plus a user-defined time window for crowding alerts:

| Type | When | Why it matters |
|---|---|---|
| Menu published | Once each morning | Builds the daily habit R9 depends on |
| Your favourite is on today | Morning, when matched | The most personal, most welcome one |
| It's quiet now | Only inside the user's window | Without the window this becomes spam |
| One meal from a free one | On reaching four | Drives R14 |

On iOS, push requires the PWA to be installed to the home screen — which is why the install
prompt is contextual rather than absent.
