# Contrast — verified in both themes

Every pair below was computed from the token values in `tokens/colors.css` (WCAG 2.1 relative
luminance). Body text targets **4.5:1**; large text and non-text UI components target **3:1**.
Re-run these numbers whenever a colour token changes — this table is the evidence for the
project's documented WCAG AA claim.

| Pair | Required | Light | Dark | Result |
|---|---|---|---|---|
| text-primary | 4.5:1 | 17.12:1 | 15.11:1 | pass |
| text-primary | 4.5:1 | 18.19:1 | 13.48:1 | pass |
| text-primary | 4.5:1 | 15.77:1 | 16.67:1 | pass |
| text-secondary | 4.5:1 | 7.27:1 | 9.08:1 | pass |
| text-muted | 4.5:1 | 5.19:1 | 5.58:1 | pass |
| text-muted | 4.5:1 | 4.78:1 | 6.15:1 | pass |
| accent link | 4.5:1 | 6.24:1 | 7.09:1 | pass |
| accent link | 4.5:1 | 5.75:1 | 7.82:1 | pass |
| on-accent label | 4.5:1 | 6.63:1 | 7.77:1 | pass |
| crowd low word | 4.5:1 | 6.48:1 | 8.69:1 | pass |
| crowd moderate word | 4.5:1 | 6.33:1 | 8.90:1 | pass |
| crowd high word | 4.5:1 | 6.39:1 | 7.02:1 | pass |
| crowd low on quiet | 4.5:1 | 5.42:1 | 8.64:1 | pass |
| crowd moderate on quiet | 4.5:1 | 5.39:1 | 8.99:1 | pass |
| crowd high on quiet | 4.5:1 | 5.17:1 | 7.55:1 | pass |
| danger on quiet | 4.5:1 | 5.79:1 | 7.70:1 | pass |
| person meter fill (UI) | 3:1 | 4.31:1 | 6.59:1 | pass |
| person meter fill mod (UI) | 3:1 | 3.42:1 | 6.75:1 | pass |
| person meter fill high (UI) | 3:1 | 4.26:1 | 4.95:1 | pass |
| inactive meter glyph (UI) | 3:1 | 5.52:1 | 4.97:1 | pass |
| focus ring (UI) | 3:1 | 5.75:1 | 7.82:1 | pass |

## Rules that go beyond ratios

- **Colour is never the only carrier.** The crowding level is a word first, a person-count
  glyph second, and a colour third.
- **No alpha-muted text.** Secondary and muted text are opaque tokens, not opacity on
  `--text-primary`, so contrast is predictable on every surface.
- **Photos always carry `--scrim`** before any text or control sits on them.
- **Focus** is a 3px `--focus-ring` outline with a 2px `--focus-ring-contrast` halo, so it
  holds against both the page and a filled button.
- **Touch targets** are 44×44 minimum even when the glyph inside is 20px.
- Checked at 400px width and 200% browser zoom: no horizontal scrolling, no clipped text.
