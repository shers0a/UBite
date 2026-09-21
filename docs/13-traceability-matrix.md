# Traceability Matrix — R1 to R17

**The most important document at the end of the project.** The UNIHUB evaluators will ask for
evidence against each result in the signed application form. This maps every one to what
delivers it, who owns it, and what proof will exist.

Collect the evidence **as you go**. Reconstructing it on 30 October is how projects fail their
reporting.

Status: ⬜ not started · 🟡 in progress · ✅ done

## O.1 — Functional MVP with at least 5 features

| Result | What it requires | Delivered by | Evidence to collect | Owner | Status |
|---|---|---|---|---|---|
| **R1** | A working MVP of UBite | The application itself | Live URL, screenshots, repository history | Dev team | ⬜ |
| **R2** | Minimum 5 student features | F1 menu, F2 dish details, F3 crowding, F4 loyalty, F5 feedback+notifications | Screenshots of each; feature list agreed with Andra | Dev team | ⬜ |
| **R3** | Kiosk installed and configured | [08-kiosk.md](08-kiosk.md) | Photo of the mounted tablet in the canteen, in use | Dev team | ⬜ |
| **R4** | At least one technical test and optimisation stage | Pre-launch test pass | Written test report with before/after notes | Dev team | ⬜ |

**R2 is the contractual floor.** Nineteen features were planned; if time runs short, these five
are the ones that cannot be cut.

## O.2 — AI crowding component

| Result | What it requires | Delivered by | Evidence to collect | Owner | Status |
|---|---|---|---|---|---|
| **R5** | AI module developed and integrated | `services/vision` + fusion | Code, architecture diagram, screenshots of live output | Radu + team | ⬜ |
| **R6** | 3 crowding levels defined and displayed | Low / Moderate / High, with thresholds | Screenshots of all three states; documented thresholds | Dev team | ⬜ |
| **R7** | Tested across at least 10 time slots | Continuous operation over the pilot | Export from `crowd_estimates` grouped by time slot | Dev team | ⬜ |
| **R8** | Analysis of function and accuracy | Calibration MAE + 3 manual counting sessions | Accuracy report: conversion error and counting error, separately | Dev team | ⬜ |

> **Critical note on R5–R8.** These do not require a camera. The application form commits to
> *estimating* crowding, not to a specific sensor. Reports plus history deliver all four
> results, and R7 and R8 are actually **easier** to evidence that way, because wait reports
> accumulate continuously across every time slot the canteen is open. If cameras arrive, they
> improve the estimate. If they do not, the objective is still met. See
> [07-crowding-module.md](07-crowding-module.md).

## O.3 — Pilot with at least 300 students

| Result | What it requires | Delivered by | Evidence to collect | Owner | Status |
|---|---|---|---|---|---|
| **R9** | Minimum 300 UB students tested/used the app | Pilot + promotion | Analytics export of unique visitors. **Definition agreed: 300 unique visitors.** | Dev team + Nae | ⬜ |
| **R10** | Minimum 3 promotional materials | A3 posters, A5 flyers, stickers — all budgeted | The designed files plus photos of them in place | Nae, Lemnaru | ⬜ |
| **R11** | Minimum 100 feedback responses | In-app form + kiosk emoji | Export from `feedback` | Dev team | ⬜ |
| **R12** | Report on user behaviour and feedback | Analytics + feedback + dashboard | The written report | Whole team | ⬜ |

**R9 depends entirely on analytics existing from the first public day.** There is no way to
reconstruct unique visitors afterwards. This makes F18 a day-one requirement, not a
nice-to-have.

The canteen serves ~1.000 people daily, so 300 unique users over ~13 operating days is
achievable from footfall alone — provided the QR codes are visible and the kiosk is working.

## O.4 — Loyalty and sustainability

| Result | What it requires | Delivered by | Evidence to collect | Owner | Status |
|---|---|---|---|---|---|
| **R13** | Digital loyalty system developed | [09-loyalty.md](09-loyalty.md) | Screenshots of the full flow; ledger schema | Dev team | ⬜ |
| **R14** | Minimum 50 students enrolled/tested | Loyalty in the pilot | Count of distinct users with at least one recorded visit | Dev team | ⬜ |
| **R15** | Analysis of loyalty effectiveness | Dashboard data | Written analysis: enrolment, completion rate, cost | Dev team + Andra | ⬜ |
| **R16** | Sustainability and scaling plan | A document | The plan itself | Andra + team | ⬜ |
| **R17** | Business partnership proposal | A document | The proposal itself | **Unassigned** | ⬜ |

> **R13–R15 are blocked** on a written agreement from DCCAS about who funds the free meal. The
> soft variant in [09-loyalty.md](09-loyalty.md) delivers all three without operational
> integration, and should be the fallback if agreement is slow.

> **R17 has never been discussed by anyone.** It is an assumed result in a signed document, and
> nobody owns it. It is a document, not software — a few hours of writing — but it needs an
> owner and a date. Raise this with Andra early rather than discovering it on 29 October.

## Documents versus software

A triage that protects the project. Six of the seventeen results are **written deliverables**,
producible in a day or two each by the non-technical half of the team:

| Type | Results | Realistic effort |
|---|---|---|
| **Software** | R1, R2, R3, R5, R6, R13 | Weeks — the dev team's whole workload |
| **Data collection** | R7, R9, R11, R14 | Automatic, if analytics exists from day one |
| **Written analysis** | R4, R8, R12, R15 | A day each, from collected data |
| **Pure documents** | R10, R16, R17 | A day each, no dependency on the software |

R10, R16 and R17 can be written **now**, before the application exists. Assigning them to Nae,
Lemnaru and Andra frees the dev team entirely and de-risks the final week.

## Evidence collection habits

1. Screenshot every feature the day it works. Not later.
2. Export analytics weekly — do not rely on a dashboard still being there at the end.
3. Photograph the kiosk and the posters in place, with the canteen visible.
4. Keep the accuracy report as a running document, updated as calibration improves.
5. Keep a dated log of what shipped when — it becomes R4 and half of R12 for free.
