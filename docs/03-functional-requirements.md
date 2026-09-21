# Functional Requirements

User stories with acceptance criteria, grouped by role. IDs match the feature numbers in
[02-vision-and-scope.md](02-vision-and-scope.md).

Priority: **P0** contractual (needed for R2), **P1** confirmed and planned, **P2** confirmed
but first to be cut under time pressure.

---

## Student — anonymous (no account)

### F1 · Daily menu — P0
*As a student, I want to see today's menu and prices so I can decide whether to go.*

- Menu is visible without an account, without any intermediate screen
- Dishes grouped by category: soup, main + side, dessert & salad, drinks & extras
- All categories on one scrolling screen, not behind tabs
- Each dish shows name and price
- If today's menu is unpublished, the previous menu is shown, **clearly marked as outdated**,
  with an explanation — never an empty screen
- Loads from cache when offline, with the cache timestamp visible

### F3 · Crowding — P0
*As a student with a twenty-minute break, I want to know if I will make it.*

- Shows one of three levels — **low / moderate / high** — as required by the application form
- Shows estimated wait in minutes alongside the level
- Shows how fresh the data is ("updated 40s ago")
- Shows a quality badge when the estimate is degraded or historical
- Refreshes every 30 seconds while the screen is open
- When the canteen is closed, shows opening hours instead of a crowding level
- Never shows a percentage — it implies precision the system does not have

### F8 · Typical crowding by hour — P1
*As a student, I want to know when to come, not just how it is now.*

- Shows today's expected pattern by hour, from historical data
- Available even with no camera and no live reports
- During the first week of the pilot, this section is hidden while data accumulates, rather
  than showing a misleading flat line

### F2 · Dish details — P0
- Price, weight, photo, dietary tags, allergens
- Average rating and number of ratings
- Allergen information displays its source; when unknown, it says "information not available",
  never "contains no allergens"
- A visible disclaimer naming the canteen as the authority on allergen data

### F11 · Dietary filters — P1
- Filter buttons above the menu, usable without an account
- Logged-in users have a saved preference applied automatically
- A saved preference filters by default but never hides the option to see everything
- Tags: vegetarian, vegan, fasting, no pork, gluten-free, lactose-free

### F13 · Status and announcements — P1
- Open/closed now, with today's hours
- Canteen announcements when active
- Confirmed hours: Monday–Friday 11:30–17:00, closed weekends

### F6 · Report your wait — P1
*As a student who just queued, I want to tell others how long it took.*

- Single question: "How long did you wait?" answered in minutes
- Available only during opening hours
- Maximum one accepted report per user per hour
- Works offline; queued and submitted on reconnect, preserving the original time
- Submitting takes one interaction and returns the user to where they were

### F5 · Feedback — P0
- Four questions: satisfaction with food (1–5), usefulness of the app (1–5), what feature is
  missing (free text), and whether the app influenced the decision to come
- Offered after several visits, not on first use
- May be submitted anonymously
- Completable in under thirty seconds

---

## Student — with an account

Accounts are requested only at the moment a feature needs one. Authentication: see
[10-auth-and-roles.md](10-auth-and-roles.md).

### F4 · Loyalty 5+1 — P0
*As a regular, I want my sixth meal free.*

- Progress shown as five filling dots, visible on the home screen, not buried in a profile
- A visit is recorded by photographing the fiscal receipt
- One point maximum per calendar day
- Duplicate receipts are rejected globally, not just per user
- On the fifth point, a single-use reward code is issued
- The reward code and the loyalty QR both work offline
- Full mechanics and fraud handling: [09-loyalty.md](09-loyalty.md)

### F10 · Favourites — P1
- A heart on any dish, anywhere it appears
- Tapping the heart while signed out prompts sign-in, then completes the action
- Notification when a favourite dish is on today's menu

### F12 · Ratings — P1
- 1–5 stars, account required
- One rating per dish per person, changeable
- Feeds "top dishes of the month" and the DCCAS dashboard

### F9 · Personal history — P2
- Spend this month
- Number of canteen visits
- What was eaten, by day
- Amount saved through loyalty

> **DEPENDENCY** — "What was eaten" and "spend this month" both require parsing receipt line
> items. If receipt OCR does not reach sufficient quality, these degrade to visit count and
> loyalty savings only, and the feature still ships.

### F5b · Notification preferences — P1
- Each notification type toggles independently
- A user-defined time window ("only between 12:00 and 14:00") for crowding alerts
- Types: menu published, favourite dish today, canteen is empty now, one meal from a free one

---

## Canteen staff

Single shared account. Every workflow below must complete in **under two minutes**.

### F14 · Menu editor — P0
*As whoever is on duty, I want to publish today's menu without it becoming a chore.*

- Opens with a checklist of the dish catalogue (under 40 items)
- Yesterday's selection is preloaded; most days require only a few changes
- Prices default to the catalogue price, overridable per day
- Optional field for portions prepared, next to each dish — leaving it empty never blocks
  publishing
- One action publishes
- Dishes not yet in the catalogue can be added inline; the catalogue grows as it is used

### F15 · Announcements — P1
- Short message with a start and end date
- Appears on the student home screen and the kiosk

---

## DCCAS

### F16 · Dashboard — P1
*As the DCCAS director, I want to see things I have never been able to see.*

- Footfall by day and by hour
- Best and worst rated dishes
- Aggregated student feedback
- Loyalty programme usage, including the cost of free meals given
- Exportable as a simple table

### F17 · Food-waste analysis — P2
- Portions prepared versus observed demand, by dish
- Present only for days where portions were entered
- Where data is incomplete, presented honestly as demand analysis rather than waste measurement

---

## Kiosk

Full specification: [08-kiosk.md](08-kiosk.md).

### Kiosk display — P1
- Rotates between today's menu, current crowding, and a download QR code
- Readable from three metres
- Requires no interaction to be useful
- Offers three-emoji feedback with a single tap
- Recovers to the rotating display automatically after inactivity

---

## Platform

### F18 · Analytics — P0 (infrastructure)
Not user-visible, but **R9, R11 and R12 cannot be evidenced without it**, and it must be in
place from the first public day.

- Unique visitors per day
- Which features are used
- Peak usage hours
- PWA installation rate
- Self-hosted, cookie-free, no personal data, no third-party transfer

### F19 · Romanian and English — P1
- Language switch in the interface, defaulting to browser language
- Dish catalogue carries both names
- Because the catalogue is fixed and small, translation is a one-time task

### F20 · Offline — P1
- Cached: today's menu, dish catalogue, loyalty QR, last crowding estimate with timestamp
- Queued: wait reports, feedback
- Every cached value displays its age

---

## Cross-cutting rules

1. **No screen is ever empty.** Every list, every estimate, every panel has a defined state for
   no-data, stale-data and offline.
2. **Every displayed estimate carries its age.**
3. **Sign-in is requested at the point of need**, never as a gate.
4. **Nothing in the app moves money.** The app records that a purchase happened; it never
   processes payment.
5. **Every feature must work, or degrade gracefully, when the camera does not exist.**
