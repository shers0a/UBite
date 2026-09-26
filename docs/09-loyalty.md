# Loyalty — "5 menus bought, the 6th free"

Objective **O.4** in the application form. Results **R13** (system built), **R14** (minimum 50
students enrolled), **R15** (effectiveness analysis).

## The two hard problems

This feature is not difficult to build. It is difficult to make real, because of two
constraints that have nothing to do with code:

1. **Someone must pay for the free meal.** Currently unresolved. The intended answer is DCCAS,
   agreed in writing. There is no written agreement, only *"they will talk to Circiumaru"*.
2. **The system must know a purchase happened**, in a canteen with two tills, cash and card
   payments, and staff willing to spend about two minutes a day on the whole application.

Every other design decision here follows from constraint 2.

## Chosen mechanism: photograph the fiscal receipt

The student photographs their fiscal receipt in the app. The app extracts the receipt number,
total, and line items, then records a visit.

### Why this and not the alternatives

| Approach | Staff effort | Fraud resistance | Extra data |
|---|---|---|---|
| **Receipt photo** | **None** | **High** — receipts are unique and numbered | **Total and items, free** |
| Cashier taps a button | A second per student | High | None |
| Rotating code at the till | None | Low — proves presence, not purchase | None |

The receipt is the only option that proves an actual purchase while requiring nothing from the
canteen. It also delivers, at no extra cost, the data needed for two other confirmed features:
**monthly spend** and **what I ate, by day**. No other approach does that.

The trade-off is OCR quality on thermal receipts, which is genuinely variable.

## Rules

| Rule | Implementation |
|---|---|
| One point per calendar day | Unique index on `(user_id, occurred_on)` where counted |
| Only during opening hours | Rejected outside Mon–Fri 11:30–17:00 |
| One account per person | Email verified at a UB address (`…unibuc.ro`) |
| A receipt counts once, globally | `receipt_hash` unique across all users |
| Points do not expire during the pilot | Simplicity; revisit afterwards |

The first and fourth rules together defeat the obvious attacks: photographing one receipt
repeatedly, sharing a receipt with friends, and farming points in a single visit.

## Student flow

1. Buys lunch, receives a fiscal receipt
2. Opens UBite, taps **Add visit**, photographs the receipt
3. App parses it and confirms: *"Visit recorded · 4 of 5"*
4. On the fifth, a **single-use reward code** is issued
5. Shows the code at the till; staff redeems it with one tap
6. Counter resets

### Progress display

Five dots that fill, **on the home screen**, not buried in a profile. Visible progress is the
entire motor of the mechanism — hidden progress is forgotten progress, and R14 requires fifty
enrolled students.

### Loyalty QR

The student's identifying code is a QR generated **locally from account data**, so it works
offline. This matters: the till is the weakest Wi-Fi spot in the building.

## Redemption

Reward codes are single-use and short-lived — a few minutes — so a screenshot shared in a group
chat is worthless by the time it arrives.

Staff redemption is one screen with one field and one button. It is the only loyalty
interaction the canteen ever touches, and it must survive a queue forming behind it.

## OCR

Extract from the receipt image: fiscal receipt number, date and time, total, line items.

- Validate the date matches today and the time falls within opening hours
- Normalise the receipt number before hashing
- If parsing fails, ask for a clearer photo — **never** silently accept or silently reject
- Delete the image immediately after parsing; retain only hash and parsed fields

> **DEGRADATION** — If OCR accuracy proves insufficient, fall back to recording the visit from
> a manually typed receipt number plus total. The loyalty count still works; `items_json`
> becomes unavailable and the "what I ate" part of personal history degrades to visit count
> only. Design the ledger so this fallback needs no schema change — it does not, because
> `items_json` is nullable.

## The soft variant

If DCCAS will not integrate at the till, the pilot can still deliver R13, R14 and R15:

- The app counts visits and shows progress exactly as specified
- Rewards are issued in the app
- DCCAS honours them manually, or in a single batch at the end of the pilot

This delivers the results without requiring any change to canteen operations. The team's
position is that this depends on what Cîrciumaru accepts — so **build the ledger first**, and
treat till redemption as a layer on top. The ledger is the part that satisfies the objective.

## What DCCAS will actually ask

Have these numbers ready before the meeting.

- A full menu costs about **10 RON**
- "Five bought, sixth free" is therefore roughly **10 RON given per 50 RON spent** — about a
  **16,7% discount** on the sixth cycle, and only for students who reach it
- With fifty enrolled students (R14) over a ~2,5 week pilot, the realistic exposure is **a few
  hundred RON at most**
- The dashboard reports exactly how many free meals were given, so there is never a surprise

Their real concern will not be the cost. It will be how a free meal is accounted for. That is a
question for DCCAS's own accounting, and it is the reason a written agreement is required
before this feature goes live.

## Open items

- [ ] Written agreement from DCCAS on who bears the cost — **blocks R13–R15**
- [ ] Confirm the canteen issues fiscal receipts, and photograph one
- [ ] Confirm receipts carry a unique number
- [ ] Decide whether till redemption or the soft variant runs in the pilot
- [ ] Agree how free meals are recorded in the canteen's accounts
