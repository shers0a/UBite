# Context & Stakeholders

## Why this project exists

DCCAS and the student association ran a survey among UB students. A canteen app was one of
the most requested items, and live crowding information ("can I make it in a short break?")
was among the most frequent specific answers. A UNIHUB funding call opened at the same time,
and Andra Duțu assembled a team through Fabian to apply.

The application form was submitted **19 September 2026**. Results were expected 22–23 September.

> **OPEN** — The raw results of that student survey are the only real user research that
> already exists, and the dev team has never seen them. Ask Andra for the raw responses. This
> is the highest-value, lowest-effort item in the whole project.

## The people

### Project team (as filed in the application)

| Name | Role in application | Faculty | Year |
|---|---|---|---|
| Duțu Andra Iustina-Mirabela | Project manager, responsible person | Administration & Business | II |
| Nae Nicolae Alexandru | Promotion officer | Administration & Business | I |
| Lemnaru Alexandru-Mihăiță | Institutional communication | Orthodox Theology | II |
| **Manea Marius** | Software development | Mathematics & Informatics | II |
| **Papacioc Rareș-Ioan** | Software development | Mathematics & Informatics | I |
| **Chelu Radu-Andrei** | Software development | Mathematics & Informatics | I |

Andra signed the application. She carries the formal accountability to UNIHUB.

### External decision-makers

| Who | Controls | Why you care |
|---|---|---|
| **Cîrciumaru Cosmin Octavian**, DCCAS Director | The canteen, the cameras, the loyalty scheme | Holds an effective veto over half the project |
| **Ana Oneață**, canteen contact | Day-to-day canteen operations | The person whose staff must enter the menu |
| **Rareș Cristea**, UB digitalisation | Servers, SSO, `unibuc.ro` subdomain | Three critical-path dependencies, all verbal so far |
| **UB Data Protection Officer** | Whether a camera may operate at all | Identity currently unknown to anyone on the team |
| UNIHUB evaluators | The money, the final report | Will ask for evidence against R1–R17 |

Contact details are in [20-canteen-field-facts.md](20-canteen-field-facts.md).

### Team working style

Decided in the group chat and confirmed in requirements:

- **No fixed technical ownership.** Everyone works on everything.
- **No fixed hours commitment.** "I'll give what I can."
- Task tracking in **GitHub Projects**, kanban. Explicitly not Jira.
- Monorepo, documentation in `docs/` so both humans and AI assistants have context.
- The README is to be written by hand, not generated.

> **RISK** — "Everyone on everything" plus no hours commitment means the vision module, the
> only item with a genuinely long critical path, has no named owner. Radu has YOLO experience
> from RoSpin and is the natural fit, but he is also in first year, doing a practice placement,
> and has had family commitments. See [16-risk-register.md](16-risk-register.md).

## Governance

The team's explicit instruction during requirements gathering was to stay focused on the
application and not on administrative process. That is respected throughout this
documentation. Administrative unknowns are collected once, in
[17-open-questions.md](17-open-questions.md), addressed to Andra, and not repeated elsewhere.

Two governance facts still worth recording because they affect engineering:

1. **No acceptance criteria were agreed** for what "the MVP is done" means. The team's own
   answer was "everything we confirmed in the requirements session" — approximately fifteen
   features. See the scope conflict in [02-vision-and-scope.md](02-vision-and-scope.md).
2. **ASMI has no formal role.** Fabian made the introduction, nothing more. This is a missed
   opportunity: ASMI is a student association at the exact faculty the dev team attends, and
   could supply both promotion reach for the 300-user target and a succession path for
   maintenance after 31 October.

## Constraints that shape everything

| Constraint | Consequence |
|---|---|
| Project window 25 Sep – 31 Oct 2026 | Roughly five weeks, from an empty repository |
| Pilot launch 13 October | ~2,5 weeks of pilot to gather 300 users and 100 feedback responses |
| 3.000 RON total, no contingency left | Any surprise cost displaces something else |
| Cameras not in the budget | The AI module depends on a verbal promise from DCCAS |
| Canteen staff will give ~2 minutes a day | Every admin workflow must fit inside that |
| Canteen open 11:30–17:00, Mon–Fri only | ~27,5 operating hours per week to collect all data |
| Nobody has visited the canteen | All physical assumptions are unverified |

## Naming

The project is called **UBite** — suggested by Rareș, chosen unanimously over "All U(B) can
eat!" and "UBon-Appétit". The name is already in the signed application form and must not
change.

The GitHub repository lives on Radu's personal account, renamed to UBite. It is to be made
**private until launch, then public under an MIT licence**.

> **RISK** — Single-owner repository. GitHub does not allow shared ownership of personal
> repositories, which Radu already discovered. A GitHub Organisation would solve this and cost
> nothing. Recorded as a risk rather than a decision, because the team chose to keep the
> current arrangement.
