# Kiosk — UI kit

The wall tablet, 1280×800, read from three metres.

- Rotates **menu (12s) → crowding (8s) → download QR (8s)**, exactly as specified in
  `docs/08-kiosk.md`. The dots at the bottom show where it is in the rotation.
- Minimum body size on this surface is 24px; the menu rows are 32px and the crowding figure is
  132px. No thin weights anywhere.
- **One tap** pauses the rotation and shows the full menu plus a three-face feedback row
  (icons with words beneath, never emoji). It returns to rotation after 45 seconds.
- The QR panel is a real panel, not filler — it is the app's best acquisition channel. Drop the
  generated QR image into the slot.
- Offline, the kiosk keeps showing the cached menu and last estimate with a visible timestamp.
  It must never show a browser error page.

Files: `index.html`, `app.jsx`.
