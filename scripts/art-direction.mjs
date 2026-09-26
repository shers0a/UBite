/* UBite art direction — the reason generated assets look like one product and not like
   twenty prompts. Every image goes through exactly one of these presets.

   FLUX has no negative prompt: writing "no gradients" tends to ADD gradients. So each preset
   describes what we want, positively and concretely — camera, light, surface, palette — and
   the subject is slotted into the same sentence every time. Consistency is the anti-slop
   device: same angle, same light, same surface, same two colours.

   Palette (from tokens/colors.css): accent #1F4FD8, ink #11161B, paper #F7F8FA,
   crowding teal #128A6B, amber #C47A0A, terracotta #D1512F. */

export const PRESETS = {
  /* Logo exploration. Output is a sketch for a human to redraw as vector — never shipped. */
  mark: {
    size: [1024, 1024],
    build: (s) =>
      `A minimal geometric logo symbol: ${s}. Flat vector pictogram in a single solid deep cobalt blue (#1F4FD8) on a pure white background, centred with a wide empty margin. ` +
      `Bold uniform stroke weight with rounded ends, built only from circles, arcs and straight lines as if drawn with a compass and a ruler, in the spirit of a Swiss railway pictogram or an airport wayfinding sign. ` +
      `Perfectly flat colour, crisp hard edges, symmetrical, lots of white space, reads clearly at small sizes.`,
  },

  /* Empty states, onboarding, install prompt, kiosk idle. Vectorised with potrace so the
     shipped file is an SVG in currentColor and follows the theme. Objects, never faces. */
  line: {
    size: [1024, 1024],
    build: (s) =>
      `A single-line ink drawing of ${s}. Continuous monoline marker stroke of even weight in deep cobalt blue on a plain flat white background. ` +
      `Loose, confident and slightly imperfect, like a quick sketch in a designer's notebook; minimal detail, open shapes, generous empty space around the drawing. ` +
      `Pure line art: two colours only, blue lines and white paper, flat, editorial illustration.`,
  },

  /* Dish placeholders until the site-visit photos exist. One camera, one light, one surface
     for every dish, so the menu reads as a set. */
  food: {
    size: [1024, 1024],
    build: (s) =>
      `An overhead food photograph shot straight down at 90 degrees: ${s}, a single honest canteen portion served in plain white ceramic, placed on a pale grey plastic canteen tray. ` +
      `Soft natural daylight from a window on the left, gentle soft shadows, true-to-life colours, matte, realistic home-style Romanian cooking, appetising but unstyled. ` +
      `The dish fills the centre of the frame with even space around it.`,
  },

  /* Sticker cut-outs (the "Brew" look from the inspo). Shot on a flat cobalt backdrop so the
     background keys out cleanly — no food on the menu is saturated blue. */
  cutout: {
    size: [1024, 1024],
    build: (s) =>
      `A studio packshot of ${s} in a plain white ceramic dish, seen from a 40 degree angle, the whole dish fully in frame with wide space around it. ` +
      `Isolated on a seamless, perfectly flat, solid saturated cobalt blue (#1F4FD8) backdrop that fills the entire background evenly. ` +
      `Soft even studio light, crisp clean edges, realistic, true-to-life food colours.`,
  },

  /* Marketing, kiosk attract loop, hero placeholders. Atmosphere, never an identifiable room
     and never people — a public university's app cannot show a place that does not exist. */
  ambient: {
    size: [1280, 768],
    build: (s) =>
      `A quiet documentary photograph: ${s}. Late-morning daylight through tall windows, muted palette of cool greys and deep blue with a single warm accent, ` +
      `lots of negative space, calm and still, shallow depth of field, 35mm film with fine grain, slightly desaturated, honest and unstaged.`,
  },

  /* ---- The brand illustration layer: what makes the site look like UBite and nobody else.
     LOCKED 22 Sep 2026 — approved by the team as "perfect, keep it this way". The wording of
     spot, doodles, picto, flat and sketch is fingerprinted in assets/style/lock.json and
     `npm run assets:check` fails if it changes. New drawings = new subjects in briefs.mjs,
     never new wording here. Reference sheets of the approved hand: assets/style/*.png.
     Everything here is drawn black on white so it vectorises cleanly, then ships as SVG in
     currentColor (or in token colours for `flat` and `picto`) and follows the theme. ---- */

  /* Characters for banners, onboarding and empty states: one hand, one ink, one attitude. */
  spot: {
    size: [1024, 1024],
    build: (s) =>
      `A hand-drawn character illustration of ${s}. Bold, expressive brush-pen ink drawing in solid black on a plain flat white background: ` +
      `confident thick-and-thin outlines, simple rounded shapes, long bendy limbs, slightly oversized hands and shoes, a lively exaggerated pose, ` +
      `hair and shoes filled solid black, everything else left white inside the outlines. No shading, no grey tones, no texture, no text. ` +
      `Minimal detail, the whole figure fully in frame with generous white space around it. A modern, playful brand spot illustration, like a contemporary café's mascot drawings.`,
  },

  /* A sheet of small doodles, cut apart by `asset.mjs pattern` and scattered into a seamless
     wallpaper tile. The spacing instruction matters: doodles must not touch. */
  doodles: {
    size: [1024, 1024],
    build: (s) =>
      `A sheet of small hand-drawn doodles: ${s}. Each doodle is a simple outline drawing in one black monoline marker stroke of even medium weight, ` +
      `slightly wobbly like a quick sketch in a notebook, with the odd tiny accent mark such as a steam wisp or a sparkle. ` +
      `The doodles are scattered in a loose grid with wide white gaps between them, none touching another, all roughly the same size. ` +
      `Plain flat white background, black lines only, no fills, no shading, no text, no labels.`,
  },

  /* Menu category pictograms, drawn as one set so they match. Two inks: an outline that
     becomes currentColor and a fill that becomes --accent. */
  picto: {
    size: [1024, 1024],
    build: (s) =>
      `A matching set of friendly food pictograms: ${s}. Arranged in a neat grid of 4 columns and 2 rows with wide white gaps between them. ` +
      `Each pictogram has a thick, uniform, rounded near-black (#11161B) outline and one flat cobalt blue (#1F4FD8) fill on a few areas, the rest white; ` +
      `simple geometric shapes, the same line weight and size throughout, seen from the front or slightly from above. ` +
      `Plain flat white background, no shadows, no gradients, no text, no labels.`,
  },

  /* Onboarding and hero scenes: flat colour, cut to the palette by `asset.mjs flatten` so every
     shape becomes a token colour. */
  flat: {
    size: [1280, 1024],
    build: (s) =>
      `A flat vector illustration of ${s}. Mid-century modern flat illustration built from simple geometric shapes, no outlines, ` +
      `in a strictly limited palette of flat colours: deep cobalt blue (#1F4FD8), pale blue (#DCE5FB), near-black navy (#11161B) and white, ` +
      `with a few small touches of warm amber (#E0A03A). Solid flat fills only, no gradients, no texture, no shading, crisp clean edges. ` +
      `Centred composition on a plain white background with generous empty space around it, wordless.`,
  },

  /* A faint architectural line for headers and the splash, like the city sketch behind the
     coffee app in the team's reference. */
  sketch: {
    size: [1536, 640],
    build: (s) =>
      `A wide panoramic pen-and-ink sketch of ${s}. Loose single-weight black fineliner lines on plain white paper, an architect's sketchbook drawing, ` +
      `light and airy with lots of open white space, no shading, no hatching, no people, no text.`,
  },

  /* Escape hatch: the subject is sent as written. */
  raw: { size: [1024, 1024], build: (s) => s },
};

export const STYLE_NAMES = Object.keys(PRESETS);
