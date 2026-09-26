# Logo brief — and the prompt to generate it

> **Decided 22 Sep 2026: A, the tray-U, with "Bite" directly after it** — the mark is the U of
> UBite, in the header and in the app icon alike. Favourites kept on record: N5 (the bitten U),
> N7 (signal in a bowl), N8 (flap tile), B (signal). The lockup is built by the repo's
> `scripts/brand.mjs` (U height = Archivo's cap height, stroke = Archivo Bold's stem, "Bite" in
> outlines) into `assets/brand/`, and drawn live by `Logo withText`. The rest of this file is
> the brief that led there.

## The idea worth using: the tray-U

A **U shape drawn as a canteen tray seen from the side** — flat bottom, two short vertical
walls — with **three dots sitting above it** like heads in a queue.

Why it works for this product:

- The U is literally the letter of the brand and the shape of a tray. One form, two readings.
- The three dots are the crowding meter that the whole app is built on. **The mark is the
  product's core information**, not a decorative food icon.
- It animates for free: one dot on = quiet, three = busy. The app icon and the splash can
  show today's queue. No other canteen app can do that.
- It survives a 16px favicon, a monochrome print run, and a 3-metre kiosk corner.
- It is geometric, so it can be drawn with a ruler — which is what keeps it out of
  AI-illustration territory.

Second option, if the tray reads too abstract: **the bitten spoon** — a plain circle with a
single wedge bite taken out of the upper right, next to the wordmark. "UBite" as a visual pun,
one shape, zero detail. Cheap to render at any size, but weaker: it says food, not queue.

## Prompt for an AI image generator

Paste this as-is. Generate several, pick the cleanest, then have the winner redrawn as a real
vector (Figma or Illustrator) before it ships — AI output is a sketch, never the final file.

```
Flat vector logo mark, minimal geometric icon, no text, no letters, centred on a plain
white background, generous margin.

Subject: a stylised canteen tray shown in cross-section — a wide flat horizontal base with
two short vertical walls turning up at each end, forming a clean rounded "U". Above the
tray, three small solid circles in a row, evenly spaced, like three heads standing in a
queue. The leftmost two circles are filled in a deep blue; the third circle is an outline
only.

Style: single-weight geometric line work, rounded line caps, stroke weight roughly one
eighth of the icon's height, drawn as if with a compass and ruler. Exactly two colours —
deep blue #1F4FD8 and nothing else on white. Completely flat: no gradient, no shadow, no
highlight, no 3D, no texture, no glow, no perspective. Solid shapes, hard edges, perfectly
symmetrical, optically centred, sits comfortably inside a square.

Reference feeling: Swiss transit pictogram, airport wayfinding sign, a symbol stamped on a
door — institutional, calm, confident.

Not: no illustration, no mascot, no cartoon, no face, no chef hat, no fork and knife
crossed, no speech bubble, no leaf, no location pin, no shield, no circle badge around the
mark, no gradient mesh, no glassmorphism, no drop shadow, no 3D render, no lettering, no
watermark, no photorealism, no hand-drawn or sketchy line, no AI-art flourish.
```

Variations worth generating alongside it:

- swap "three small solid circles" for **three short vertical bars of increasing height** —
  a signal-strength reading of the same idea
- ask for the **third circle filled too**, so you can compare the "full queue" state
- ask for a **one-colour black version** to check it holds without the blue

## What to do with the file

1. Save the vector as `assets/logo.svg` (mark only) and `assets/logo-lockup.svg` (mark +
   "UBite" set in Archivo SemiBold, mark height = cap height, gap = half the mark's width).
2. Keep the mark on a square artboard with ~12% padding so the app icon needs no rework.
3. Point `components/brand/Wordmark.jsx` at the file: add a `variant="mark"` branch that
   renders the SVG instead of the `UB` plate. Everything else in the system already flows
   from the `--accent` token, so a palette change stays a one-file change.
4. Tell me when the file exists and I will wire it through the kits, the kiosk corner, the
   install prompt and `thumbnail.html`.

## Rules for whoever draws it

- The mark must read at **16px** and at **three metres**. Test both before choosing.
- It must work in **one colour**. If it needs the blue to be legible, it is not finished.
- Never place the University of Bucharest's coat of arms inside or beside this mark without
  written permission — and never redraw it from memory.

---

## Status — 22 September 2026

Four variants were drawn as SVG geometry rather than generated, and the team shortlisted all
four: **A tray**, **B signal**, **C bite**, **F plate**. They live in `assets/logo/` (plus a
`-favicon` version of each, with thicker strokes and detail removed) and are implemented in
`components/brand/Logo.jsx`.

Two decisions are already built:

- **The mark is live.** `<Logo level={level} />` fills one, two or three counters, so the header,
  the app icon and the kiosk corner show the current queue. Set `tone="level"` to tint the
  counters with the crowding colour.
- **Both animations exist.** The counters animate on a level change (250ms, staggered 70ms), and
  `<LogoSplash />` draws the mark on first open and is gone in under a second. Both stop
  entirely under `prefers-reduced-motion`.

Switch between the four in the student app's toolbar ("Marca") to see them in context, then
tell me which one stays — I will delete the other three and generate the favicon set.
