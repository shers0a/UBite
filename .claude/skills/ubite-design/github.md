repo: shers0a/UBite
branch: main
path: docs

## Last sync

date: 2026-09-21T11:57:05Z

### Updated in this project

- Built the token layer (colour, type, spacing, shape, motion) from `docs/19-design-system-brief.md`.
- Designed the crowding indicator — three levels × three quality states, closed, loading, error — from `docs/07-crowding-module.md`.
- Built four UI kits: student app, staff menu editor, kiosk and DCCAS dashboard, from `docs/18-screen-specs.md` and `docs/08-kiosk.md`.
- Documented contrast in both themes in `guidelines/contrast.md`.

## Screen map

| Screen / artefact | Built from |
|---|---|
| `tokens/*.css`, `guidelines/*` | `docs/19-design-system-brief.md` |
| `components/crowding/CrowdingIndicator.jsx` | `docs/07-crowding-module.md`, `docs/18-screen-specs.md` |
| `ui_kits/student-app/` | `docs/18-screen-specs.md`, `docs/09-loyalty.md` |
| `ui_kits/staff-editor/` | `docs/18-screen-specs.md` (canteen staff — menu editor) |
| `ui_kits/kiosk/` | `docs/08-kiosk.md` |
| `ui_kits/dccas-dashboard/` | `docs/18-screen-specs.md` (DCCAS dashboard) |
| `readme.md` content fundamentals | `docs/19-design-system-brief.md`, `docs/21-glossary.md` |

Note: the repository currently contains documentation only — no application code. Everything
here was designed from those documents, not recreated from an existing UI.
