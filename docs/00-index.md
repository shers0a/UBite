# UBite — Documentation Index

Single source of truth for the UBite project. Written for three audiences: the dev team
(Marius, Rareș, Radu), the project lead (Andra / UNIHUB reporting), and any AI assistant
working on this codebase.

**Language:** English, except `for-andra-summary.md`, which is Romanian because its readers are.

## How to read this

| # | Document | Read it when |
|---|---|---|
| [01](01-context-and-stakeholders.md) | Context & stakeholders | You need to know who decides what |
| [02](02-vision-and-scope.md) | Vision & scope | You want the feature list and what is explicitly out |
| [03](03-functional-requirements.md) | Functional requirements | You are implementing a feature |
| [04](04-non-functional-requirements.md) | Non-functional requirements | You care about performance, a11y, i18n |
| [05](05-domain-model.md) | Domain model & schema | You are touching the database |
| [06](06-architecture.md) | Architecture | You are wiring services together |
| [07](07-crowding-module.md) | Crowding estimation & fusion | You are building the AI / occupancy feature |
| [08](08-kiosk.md) | Kiosk | You are building the tablet experience |
| [09](09-loyalty.md) | Loyalty (5+1) | You are building points / receipts |
| [10](10-auth-and-roles.md) | Auth & roles | You are touching accounts or permissions |
| [11](11-privacy-gdpr-accessibility.md) | Privacy, GDPR, accessibility | Before the camera goes live. **Read this early.** |
| [12](12-infrastructure-and-deployment.md) | Infrastructure & deployment | You are deploying |
| [13](13-traceability-matrix.md) | R1–R17 traceability | You are reporting to UNIHUB. **Most valuable doc at the end.** |
| [14](14-budget-and-procurement.md) | Budget | Money questions |
| [15](15-pilot-plan.md) | Pilot plan | You are chasing the 300 users |
| [16](16-risk-register.md) | Risk register | Weekly, honestly |
| [17](17-open-questions.md) | Open questions | Before asking anyone anything |
| [18](18-screen-specs.md) | Screen specifications | You are designing UI. Conceptual only — no markup. |
| [19](19-design-system-brief.md) | Design system brief | You are building the visual language |
| [prompt](design-system-prompt.md) | Claude Design prompt | You are starting the design system |
| [inspo/](inspo/) | Inspiration references | You have images to add, or are designing |
| [20](20-canteen-field-facts.md) | Canteen field facts | You need real numbers about the place |
| [21](21-glossary.md) | Glossary | Someone said a word you didn't recognise |
| [22](22-decision-log.md) | Decision log | You want to know *why* something is the way it is |
| [23](23-camera-research.md) | Camera research | You are choosing a camera, or deciding where counting runs |
| [24](24-running-the-app.md) | Running the app | You are running, testing or deploying the code |
| [for-andra](for-andra-summary.md) | One-page summary (RO) | You are talking to Andra, DCCAS or UNIHUB |

## Conventions used in these documents

- `> **ASSUMPTION**` — a decision made without confirmed facts. Safe to build on, must be
  verified. Every one of these is also listed in [17-open-questions.md](17-open-questions.md).
- `> **OPEN**` — genuinely unresolved. Do not build on it without asking.
- `> **CONFLICT**` — two confirmed decisions that cannot both hold. Needs a human call.

## Project at a glance

| | |
|---|---|
| **Name** | UBite |
| **What** | PWA for the University of Bucharest canteen: daily menu, live crowding, loyalty |
| **Where** | Cantina Mihail Kogălniceanu, Bd. M. Kogălniceanu 36-46, Sector 5 |
| **Funding** | UNIHUB student project competition, 3.000 RON |
| **Project window** | 25 September – 31 October 2026 |
| **Pilot launch target** | 13 October 2026 |
| **Team** | Marius Manea, Rareș-Ioan Papacioc, Radu-Andrei Chelu (dev); Andra Duțu (lead) |
| **Stack** | React PWA + TypeScript, Express API, Python vision service, PostgreSQL |
