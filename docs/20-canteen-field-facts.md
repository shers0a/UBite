# Canteen Field Facts

Everything we currently know about the physical place the app is built for. Facts from
public sources are cited. Facts that need a site visit are marked.

**Nobody on the dev team has been to the canteen yet.** That is the single cheapest gap to
close and it unblocks roughly a third of [17-open-questions.md](17-open-questions.md).

## Identity and location

| Field | Value | Source |
|---|---|---|
| Name | Cantina Mihail Kogălniceanu | unibuc.ro |
| Address | Bd. Mihail Kogălniceanu nr. 36-46, Sector 5, 050107 București | unibuc.ro |
| Situated in | Căminul M. Kogălniceanu, Law Faculty campus | unibuc.ro |
| Coordinates | 44.4350362, 26.080395 | Google Maps |
| Nearest metro | Eroilor | public sources |
| Buses | 61, 69, 90, 91, 122, 137, 268, 336 | public sources |
| Google rating | 4.0 (218 reviews) | Google Maps |

## Operating hours — CONFIRMED

**Monday–Friday 11:30 – 17:00. Closed Saturday and Sunday.**

Source: [unibuc.ro canteen page](https://unibuc.ro/student-ub/campus/cantina-ub/), corroborated
by Google Maps ("Open · Closes 5 pm").

Some secondary sources mention an evening service (18:00–19:00 or 18:00–20:00). This is
likely stale. Treat evening service as **not operating** until confirmed on site.

This matters beyond display: opening hours gate the "report your wait" feature and the
loyalty scan window.

## Capacity and traffic

| Field | Value | Confidence |
|---|---|---|
| People served per day | **~1.000** | Stated by unibuc.ro |
| Seating | "Numerous 4–6 person tables", spacious | Reviews |
| Seat occupancy | Tables are "almost never all occupied" | Reviews |

> **CONFLICT** — During the requirements session the team assumed "~80 seats, under 200
> people per day". The official figure is ~1.000 people per day and the room is described as
> spacious. Consequences:
> 1. Crowding thresholds must be calibrated from real data, not from the assumed small-venue
>    numbers. See [07-crowding-module.md](07-crowding-module.md).
> 2. The 300-student pilot target is **much easier** than feared — roughly a third of a single
>    day's footfall, spread over ~13 operating days.
> 3. The case for a second camera pointed at the dining hall weakens considerably: if seats are
>    almost never all taken, seating is not the bottleneck. The queue is.

A note on the "maximum 50 persons in the dining room" figure on the UB page: that is a
physical-distancing rule from the pandemic era. Do not use it as seating capacity.

## Service model — CONFIRMED

**Self-service.** Students take a tray, serve themselves, pay at the till.

This is good news for the vision module: a self-service line forms a well-defined queue in a
predictable place, which is far easier to count than people scattered across a hall.

Disposable cutlery is mandatory (`tacâmuri de unică folosință`).
Dine-in and takeaway both available. No delivery.

## Prices

| Item | Price | Source |
|---|---|---|
| Full menu (soup + main + dessert) | ~10 RON | Reviews, multiple years |
| Range per person | 1–20 RON | Google Maps, reported by 8 people |
| Tap water | Free | Reviews |

Implication for loyalty: "5 menus bought, 6th free" costs the canteen roughly **10 RON per
50 RON spent — a 16,7% discount** on the sixth meal cycle. That is the number Cîrciumaru will
actually care about. Have it ready before the meeting.

Implication for the spending history feature: at ~10 RON a meal, a regular student spends
~200 RON/month. That is a number worth showing them.

## Menu composition

Reviews consistently describe a **small, repeating rotation**: chicken with mashed potatoes,
various soups, peas, stewed cabbage, pork, salad, traditional Romanian desserts. "Similar
dishes appear daily with minor variations."

This independently validates two decisions already made:
- A **fixed dish catalogue under 40 items** is realistic ([05-domain-model.md](05-domain-model.md)).
- **Preloading yesterday's menu** for the staff editor will be right most days
  ([18-screen-specs.md](18-screen-specs.md)).

## Access rules

Officially: `Accesul în cantina Mihail Kogălniceanu este permis doar studenților și
angajaților` — students and employees only.

In practice, reviewers report that nobody checks. One review from a visitor: "You're supposed
to be a member of the university community to eat there, but nobody will ever ask you to prove
it."

Implication: the people the camera counts are *mostly* but not exclusively UB students. Do not
build any logic that assumes a 1:1 mapping between people counted and app accounts.

## Queue behaviour

Google Maps review topic tags include **"queue" (4 mentions)** alongside "meatballs",
"friendly staff" and "desserts". Reviewers say service is "usually fast, but depends on the
crowd of students and when they finish/enter their courses."

That sentence is the entire product thesis in one line, and it also validates the
timetable-based prediction approach: crowding is driven by when classes let out, which is a
known, repeating schedule.

## Contacts

| Role | Person | Contact |
|---|---|---|
| DCCAS Director ("Circiumaru" in the chats) | **Cîrciumaru Cosmin Octavian** | cosmin.circiumaru@rectorat.unibuc.ro, +4021 3059749 |
| DCCAS secretariat | Simona Samuru | contactdccas@unibuc.ro, +4021 3059749 |
| Canteen contact | Ana Oneață | cantinakogalniceanu@unibuc.ro, 021-315 55 23 |
| General canteen inbox | — | cantina@rectorat.unibuc.ro |
| DCCAS office | — | Șos. Panduri nr. 90, etaj 3, camera 313 |

## Site visit checklist

Take this list, go once, answer all of it in 30 minutes.

**Layout and queue**
- [ ] Photograph the queue area from the angle a ceiling camera would have
- [ ] Where does the queue start and end? Does it bend or leave the room at peak?
- [ ] How many tills are there? (assumed: 2)
- [ ] Time 10 people through the till — this gives throughput in people/minute, which the
      crowding module needs as its starting prior
- [ ] Count seats properly
- [ ] Is there a second entrance/exit?

**Infrastructure**
- [ ] Is there a power socket near the proposed camera position?
- [ ] Is there an ethernet port anywhere in the room?
- [ ] Test the Wi-Fi with a phone at: the entrance, the queue, the till. Record signal and speed.
- [ ] Which wall can hold the kiosk tablet, near a socket, visible from the door?

**Operations**
- [ ] Who physically writes today's menu, and on what?
- [ ] Ask to see the dish list / recipe list — can they export or photocopy it?
- [ ] What device does the office have: PC, tablet, phone?
- [ ] Is there an electronic till / POS? Make and model?
- [ ] Do they print fiscal receipts? Get a photo of one — the loyalty feature depends on it
- [ ] Payment methods actually accepted (assumed: cash and card)
- [ ] Who would be the one person willing to spend two minutes a day in an admin panel?

**Permissions**
- [ ] Who authorises mounting something on the wall?
- [ ] Who to notify before photographing the space?
