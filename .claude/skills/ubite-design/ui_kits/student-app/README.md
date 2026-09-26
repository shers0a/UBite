# Student app — UI kit

The phone surface, at 400px. Home, dish detail, account, add-a-visit, and the contextual
install prompt, all live: the panel on the left switches theme, crowding level, estimate
quality, and every system state (loading, offline, stale menu, signed out).

Files: `index.html` (frame, theme, styles) · `HomeScreen.jsx` (zones 1–7 and the menu data)
· `Screens.jsx` (dish detail, account, add a visit) · `app.jsx` (state, toolbar, sheet, toast).

Built on the system components — nothing here re-implements a primitive.

## What to look at

- **Zone order.** Crowding, menu, loyalty, wait report, hourly pattern, announcements, footer.
  Spacing tightens zone by zone via `--density-zone-*`.
- **The overlap.** The hall photo sits behind the crowding card, which overlaps it by 64px; the
  photo drifts at 40% of scroll. It is the only depth effect in the system.
- **Photo slots.** Every image is an `image-slot` drop target — drag a real canteen photo onto
  one and it stays.
- **States.** Toggle "Se încarcă", "Offline", "Meniu vechi", "Deconectat" and watch each zone
  answer. No spinner ever appears over blank space.
- **The report loop.** "Cât ai așteptat?" opens a sheet, one tap submits, the crowding estimate
  visibly moves, and a toast confirms.
