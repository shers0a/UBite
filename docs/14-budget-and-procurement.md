# Budget & Procurement

Total awarded: **3.000 RON** from the UNIHUB competition. Submitted 19 September 2026.

The team's explicit instruction was to keep focus on the application rather than on
administrative process. This document therefore records the budget as it stands, names the gaps
that have engineering consequences, and stops there. Administrative questions live once in
[17-open-questions.md](17-open-questions.md), addressed to Andra.

## As submitted

| Line | Unit | Qty | Total | Purpose |
|---|---|---|---|---|
| Tablet (kiosk) | 900 RON | 1 | 900 RON | R3 |
| Anti-theft mount / case | 350 RON | 1 | 350 RON | Protects the tablet |
| Cables and connectors | 33,3 RON | 6 | 200 RON | Camera connectivity |
| AI service subscriptions / API (Claude) | 600 RON | 2 | 1.200 RON | Development |
| A3 posters | 5 RON | 10 | 50 RON | R10 |
| A5 flyers | 0,80 RON | 125 | 100 RON | R10 |
| Custom stickers | 2 RON | 100 | 200 RON | R10 |
| **Total** | | | **3.000 RON** | |

## Gaps with engineering consequences

### Cameras — not in the budget

The AI module depends on hardware that appears nowhere in the budget, based on a verbal
statement relayed through Andra that DCCAS "will buy them".

The six cable lines are the only trace of cameras in the budget, and they imply five or six
devices — while the application form's narrative describes **one**.

**Engineering response:** the crowding module is designed so that cameras are an optional input.
Reports and history deliver R5–R8 without them. Decision point: **10 October**. See
[07-crowding-module.md](07-crowding-module.md).

### Edge compute — not in the budget

Inference was assigned to the UB server, assumed to be a VM without a GPU, while the canteen's
Wi-Fi is weak. That configuration cannot stream two camera feeds.

A small machine beside the camera costs roughly **600 RON** and resolves it — while also being
the strongest privacy argument available, since video never leaves the room.

The cheaper resolution costs nothing: **specify cameras that count in firmware**. If DCCAS is
purchasing anyway, asking for this is free.

### Domain, TLS, hosting — not in the budget

All have free paths. A `.ro` domain, if the UB subdomain proves slow, is around 50 RON a year.
Hosting, managed Postgres, error tracking, uptime monitoring and self-hosted analytics all have
free tiers adequate for this scale.

Not a real risk, but worth recording that it was never budgeted.

### Contingency — zero

The original 350 RON contingency became posters, flyers and stickers when the evaluators
required every line to be explicit. Those three lines now satisfy **R10**, so the money is not
wasted — but there is no buffer left.

The only flexible line is the 1.200 RON for AI subscriptions.

## The 1.200 RON line

This is the largest line that produces no physical object, and it is the one an evaluator is
most likely to question. All three developers already hold personal Claude Pro subscriptions,
which Marius noted in the group chat.

What it buys has not been decided. It needs an answer that Andra — who signed the form — can
give without hesitation. The two defensible options:

1. **API credits consumed by the project's AI module and development**, invoiced to the
   project. Directly connected to O.2.
2. **Redirected to hardware** — a camera, or the edge compute machine. Produces physical assets,
   trivially justified, and fills the two real gaps above. Requires the grid to be amendable.

Option 2 is worth exploring precisely because it converts the weakest line in the budget into
the two things the project actually lacks.

## Procurement realities

Unresolved and owned by Andra: whether money arrives in advance or by reimbursement, who makes
purchases, and whose name appears on invoices. All three are in
[17-open-questions.md](17-open-questions.md), section A.

One engineering note: if reimbursement is the model, someone fronts 3.000 RON. That changes the
order in which things get bought, and therefore what can be built when.

## Assets after 31 October

| Asset | Value | Destination |
|---|---|---|
| Tablet | 900 RON | Unresolved — must land in someone's inventory |
| Mount | 350 RON | With the tablet |
| Cameras | DCCAS-funded | DCCAS |
| Code | — | MIT licensed, public after launch |

Agree the tablet's destination **before** purchase, not after. It is the most stealable item in
the project and the one an auditor will ask about.

## What costs nothing and should start today

- Repository, design system, schema, PWA shell
- Free-tier hosting and database
- Self-hosted analytics
- Requesting the UB subdomain
- Identifying the DPO
- The site visit
- Drafting R16 and R17

None of it requires a single leu, and all of it is on the critical path.
