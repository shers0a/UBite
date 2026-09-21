# Glossary

Written so that anyone on the project — technical or not — can read any other document here.

## People and organisations

| Term | Meaning |
|---|---|
| **UB / UniBuc** | Universitatea din București |
| **DCCAS** | Direcția Cămine-Cantine și Activități Studențești — runs the halls and canteens |
| **Cîrciumaru Cosmin Octavian** | Director of DCCAS. Controls the canteen, the cameras and the loyalty scheme |
| **UNIHUB** | Societatea Antreprenorială Studențească — the competition funding this project |
| **ASMI** | Student association at Mathematics & Informatics. No formal role yet |
| **DPO** | Data Protection Officer — the person at UB who must approve the camera. Identity currently unknown |

## Project terms

| Term | Meaning |
|---|---|
| **UBite** | The project name, fixed in the signed application form |
| **Fișa de aplicație** | The signed funding application. Functions as the contract |
| **O.1 – O.4** | The four objectives in that form |
| **R1 – R17** | The seventeen results the project committed to. See [13](13-traceability-matrix.md) |
| **MVP** | The minimum version that delivers the five contractual features |
| **Pilot** | 13–31 October, when real students use the app and the numbers are gathered |

## Product terms

| Term | Meaning |
|---|---|
| **Crowding level** | Low / Moderate / High. Required by the form |
| **Wait estimate** | Expected queue time in minutes. What students actually want |
| **Wait report** | A student answering "how long did you wait?" |
| **Fusion** | Combining camera, reports and history into one published estimate. See [07](07-crowding-module.md) |
| **Calibration** | Learning how many minutes of wait one queued person represents |
| **Quality flag** | `live` / `degraded` / `estimated` — how trustworthy the current number is |
| **Cold start** | The first week, when there is no history to predict from |
| **Catalogue** | The fixed list of dishes the canteen serves. Under 40 items |
| **Daily menu** | A selection from the catalogue for one date, with prices |
| **Kiosk** | The tablet mounted in the canteen |
| **Loyalty ledger** | The record of visits. Progress is derived from it, never stored as a counter |
| **Soft loyalty** | Variant where the app counts and DCCAS honours rewards manually |

## Technical terms

| Term | Meaning |
|---|---|
| **PWA** | Progressive Web App — a website that installs on a phone like an app. One codebase for iOS and Android |
| **Service worker** | The browser component that makes offline mode possible |
| **Monorepo** | All parts of the project in one repository |
| **YOLO** | A family of object-detection models. Used pre-trained, to count people |
| **Inference** | Running the model on an image to get a result |
| **Edge inference** | Running it on a machine beside the camera, so video never crosses the network |
| **OCR** | Optical Character Recognition — reading text from a photograph, here from fiscal receipts |
| **Theil–Sen** | A robust way to fit a line that tolerates outliers. Used in calibration |
| **Weighted median** | A middle value where recent inputs count more. Resists nonsense reports |
| **Half-life** | How long until a report counts for half as much. Set to 20 minutes |
| **Hysteresis** | Requiring a threshold to be clearly crossed before changing state, so the display does not flicker |
| **Polling** | Asking the server for updates on a timer, here every 30 seconds |
| **Feature flag** | A switch that hides an unfinished feature without removing the code |
| **SSO** | Single Sign-On — logging in with an existing institutional account |
| **OTP** | One-Time Password — the six-digit code sent by email |
| **Soft delete** | Marking a record deleted while retaining it briefly, for safe erasure |
| **Ground truth** | A known-correct measurement used to judge the system's accuracy |
| **MAE** | Mean Absolute Error — average size of the mistakes, in minutes |

## Compliance terms

| Term | Meaning |
|---|---|
| **GDPR** | EU data protection regulation |
| **Data controller** | The organisation legally responsible for personal data. Must be UB, not the students |
| **DPIA** | Data Protection Impact Assessment — the written analysis likely required before the camera operates |
| **Lawful basis** | The legal justification for processing personal data |
| **Data minimisation** | Collecting only what is needed. Why accounts store an email and nothing else |
| **WCAG AA** | The accessibility standard targeted |
| **EN 301 549** | The European accessibility standard applying to public-sector digital services |
