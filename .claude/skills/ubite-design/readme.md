# UBite Design System

UBite is a progressive web app for the **Cantina Mihail Kogălniceanu**, the University of
Bucharest's canteen (Bd. Mihail Kogălniceanu 36–46, sector 5; Monday–Friday 11:30–17:00;
roughly a thousand people a day). Three student developers, a five-week build, a public
repository, real users from mid-October.

The app answers two questions for a student standing in a hallway at 12:40 with twenty minutes
free: **will I get through the queue in time**, and **is today's food worth it**. Everything in
this system is arranged around those two answers.

## Surfaces

| Surface | Who uses it | Design consequence |
|---|---|---|
| **Student phone app** | a student with a short break | one scrolling surface, importance descending, density increasing |
| **Staff menu editor** | canteen staff, shared account, in a kitchen, in a hurry | finishable in under two minutes without reading anything |
| **Wall kiosk** | anyone walking past, from three metres | large type, rotating panels, a QR code that earns the device's budget |
| **DCCAS dashboard** | the canteen directorate | read-only evidence, in plain language, not a default admin table |

## Sources this system was built from

- **GitHub — [github.com/shers0a/UBite](https://github.com/shers0a/UBite)** (branch `main`).
  The repository is documentation only; there is no application code yet. The system was built
  from these files in particular, and they remain the authority:
  - [`docs/19-design-system-brief.md`](https://github.com/shers0a/UBite/blob/main/docs/19-design-system-brief.md) — personality, foundations, component list
  - [`docs/18-screen-specs.md`](https://github.com/shers0a/UBite/blob/main/docs/18-screen-specs.md) — what each screen contains and why
  - [`docs/07-crowding-module.md`](https://github.com/shers0a/UBite/blob/main/docs/07-crowding-module.md) — where `live` / `degraded` / `estimated` come from
  - [`docs/08-kiosk.md`](https://github.com/shers0a/UBite/blob/main/docs/08-kiosk.md) — rotation, timings, three-metre legibility
  - [`docs/inspo/`](https://github.com/shers0a/UBite/tree/main/docs/inspo) — reference images
  **Read the repository directly before extending this system** — the docs carry constraints
  (privacy rules, the fusion algorithm, the pilot's success measures) that a design file cannot.
- **Inspiration images** supplied by the team (`uploads/`): a canteen ordering app, a cats app,
  a coffee-shop app, a Five Guys app concept, and an illustrated bakery app. They were read for
  mood and layout only; none of their visual identities were copied.
- **No University of Bucharest brand manual was supplied.** UBite therefore has its own
  identity, as the brief intends, and every colour and type decision is a CSS variable so a
  late institutional palette is a one-file change.

## Design direction

Chosen by the team from three candidates: the **departure board** — dark-first, high contrast,
numerals that read like an arrivals display, no decoration. It suits a queue-status product,
survives a dim dining hall and a wall tablet, and does not look like a stock component library.

Its data stays that way. Its warmth now comes from copy, a few small animations and — since
22 Sep 2026, at the team's request — **a brand illustration layer**: brush-ink characters, a
doodle wallpaper, flat onboarding scenes and drawn menu pictograms, in the product's own
palette. The crowding card, the numbers and the menu rows stay undecorated; the illustrations
live around them (banners, onboarding, empty states, splash, kiosk, footer).

---

## CONTENT FUNDAMENTALS

**Voice: short sentences, second person, plain language.** The app talks to one student, not to
a user base.

| Write | Don't write |
|---|---|
| „Coada e mică, cam 3 minute." | „Nivel de ocupare curent: redus." |
| „Aștepți cam 6 minute." | „Timp estimat de așteptare: 6,2 minute." |
| „Informație indisponibilă." | (nothing at all) |
| „Meniul de azi nu e publicat încă. De obicei apare până la 10:30." | „Nu există date." |
| „Mulțumim. Estimarea s-a actualizat." | „Feedback-ul dumneavoastră a fost înregistrat cu succes!" |

Rules:

- **Romanian first, English second.** Both are first-class. Romanian strings run 15–20% longer,
  so no component may be sized to a tight text box.
- **Second person, informal (`tu`).** „Aștepți", „ai așteptat", „pune UBite pe ecran". Never
  `dumneavoastră` in the student app; the staff and DCCAS surfaces stay neutral but still plain.
- **Sentence case everywhere.** Uppercase is reserved for the small eyebrow labels
  (`.ub-eyebrow`, 13px, letter-spaced) and nothing else. No title case, ever.
- **No exclamation marks. No jargon. No apology.** An error says what happened and what to do:
  „Nu am putut citi bonul. Încearcă o poză mai apropiată."
- **Numbers are minutes, never percentages.** A percentage implies a precision this system does
  not have. Approximation is stated in words: „cam", „aproximativ", „de obicei".
- **Every estimate carries its age**: „actualizat acum 40s". Old data is labelled, never hidden.
- **Missing data is stated, never implied.** Allergens with no source read „Informație
  indisponibilă" plus a line naming the canteen as the authority.
- **No emoji anywhere** — with one deliberate exception: the kiosk's three-face feedback row,
  which uses *icons* (`face-slightly-smiling`, `face-neutral`, `face-slightly-frowning`), not
  emoji characters, each with a word beneath it.
- Quotation marks in Romanian copy are „…" (low-high), not "…".

---

## VISUAL FOUNDATIONS

### Colour

Semantic names only — `--surface-raised`, never `--grey-100`. Full list in
[`tokens/colors.css`](tokens/colors.css); contrast evidence in
[`guidelines/contrast.md`](guidelines/contrast.md).

- **Dark-first, both themes equal.** Light is the base declaration; dark is the same token names
  redefined under `@media (prefers-color-scheme: dark)` and `[data-theme="dark"]`. One file, not
  a second stylesheet. `[data-theme]` on `<html>` overrides the system preference.
- **Four surface steps** — `--surface-sunken`, `--surface-page`, `--surface`,
  `--surface-raised`. Layers separate **by colour value**: no card borders, no card shadows.
- **One accent**, `#1F4FD8` in light and a lifted `#7BA5FF` in dark. It appears on primary
  buttons, links, focus, the loyalty dots and the wordmark plate — nowhere decorative.
- **Three crowding colours, cool to warm**: teal → amber → terracotta. This is the only place in
  the system where colour carries meaning, and even there the word always appears, plus a
  person-count glyph. Colour is never the sole carrier of anything.
- **Hairlines** (`--border-subtle`, `--border-strong`) exist for dividers, checkbox rings and
  input outlines — never as a card's edge.
- Backgrounds are flat colour. **No gradients** except `--scrim`, the single protection gradient
  laid over photography so text and controls keep their contrast.

### Type

**Archivo Variable**, self-hosted, one family throughout — see
[`tokens/fonts.css`](tokens/fonts.css).

Why a webfont at all, when the brief argues for a system stack: the crowding figure is the
product's identity and a system stack renders it four different ways across four devices.
Archivo is a grotesk with tall x-height and unusually strong tabular numerals, which is exactly
what a wait time and a price list need. The cost is one variable woff2 per subset (~30 KB
total, latin + latin-ext for Romanian diacritics), `font-display: swap`, and a system-stack
fallback that is metrically close. **For production, commit the two woff2 files into the repo
and change the `src` urls to relative paths** — the current CDN reference is for prototyping
only, and a DNS lookup is the slowest thing on the canteen's Wi-Fi.

Scale is fixed, in [`tokens/typography.css`](tokens/typography.css): 12 · 13 · 14 · **16 (body
floor)** · 18 · 20 · 24 · 30 · 38 · 48 · 64 · 132 (kiosk). Body never goes below 16px — smaller
triggers iOS input zoom. Tracking tightens as size grows (`-.03em` at display). Numbers that
tick or align use `.ub-numeric` (tabular lining figures).

### Spacing, density, shape

- 4px grid, `--space-1` … `--space-20`; `--gutter` is 16px at phone width.
- The home screen's **density gradient is a system rule**: `--density-zone-1` (28px) at the
  crowding block down to `--density-zone-7` (8px) at the footer. Importance descending, density
  increasing.
- Radii: 4 / 6 / 10 / 16. 16 is reserved for the crowding hero and dish photography.
- **Exactly two elevation levels**, both expressed as surface colour. `--shadow-overlay` exists
  only for things that genuinely float: the bottom sheet, the install prompt, a toast.

### Motion

150–250ms, `--ease-out` `cubic-bezier(.22,.7,.25,1)`. Motion confirms; it never entertains. Two
places earn it: **the crowding level changing** (6px rise + fade, 250ms) and **a loyalty dot
filling** (scale from 0.6, staggered 40ms). Everything else is a colour or background
transition at 150ms. `prefers-reduced-motion` **disables** transitions entirely rather than
shortening them — enforced globally in `tokens/motion.css`.

### Interaction states

- **Hover**: primary buttons darken one accent step; everything else takes `--hover-wash`
  (5% ink in light, 6% paper in dark). Never opacity.
- **Active**: `translateY(1px)` plus `--active-wash`. The favourite heart scales to 0.96.
- **Focus**: one indicator for the whole system — 3px `--focus-ring` outline, 2px offset, plus a
  `--focus-ring-contrast` halo so it survives on a filled button. Designed, never the browser
  default, never removed.
- **Disabled**: 45% opacity and `cursor: not-allowed`; the label stays readable.
- **Loading**: skeletons shaped like the final content. Never a spinner over blank space.
- **Error**: a danger ring plus a sentence that says what to do.

### Imagery and depth

Generated imagery is **allowed and art-directed** (team decision, 22 Sep 2026). The enemy is
the generic AI look, and the cure is consistency: every image comes from one of the presets
in the repo's `scripts/art-direction.mjs` — the brand layer's `spot`, `doodles`, `picto`, `flat`
and `sketch` (below), and `mark` (logo sketches, redrawn as vector before
use), `line` (monoline illustrations in one ink, vectorised to `currentColor`), `food` (dish
photos: overhead, one tray, one window light), `cutout` (sticker cut-outs keyed off a cobalt
backdrop) and `ambient` (atmosphere for marketing and the kiosk, never people). Generated dish
photos are **placeholders** until the canteen's real ones arrive; the manifest tracks which is
which. Photo positions without an asset stay live `image-slot` drop targets
(`assets/image-slot.js`) with a caption saying what belongs there.

**The brand illustration layer** (see [`explorations/illustrations.html`](explorations/illustrations.html)
for all of it, reviewable) — **approved and locked on 22 Sep 2026**: new drawings match the
reference sheets in the repo's `assets/style/`, and `npm run assets:check` fails if an approved
file or a brand preset's wording changes. Every piece is SVG or a mask PNG in the repo's `assets/`, drawn
through `Illustration` / `Pattern` so it takes token colours and follows the theme:

| Kind | Preset | Where | How it ships |
|---|---|---|---|
| Characters (`spots/`) | `spot` — one brush ink, lively pose | `Spotlight` banners, onboarding, loyalty card, kiosk | potrace → SVG, drawn as a CSS mask in any token colour |
| Flat scenes (`scenes/`) | `flat` — five flat colours | onboarding | `asset.mjs flatten` → one traced layer per colour, each filled with `var(--token)` |
| Pictograms (`picto/`) | `picto` — outline + one fill | menu category pills | `asset.mjs picto` → outline in `currentColor`, fill in `--accent` |
| Doodle wallpaper (`patterns/canteen.svg`) | `doodles` — sheets of small doodles | splash, onboarding, kiosk | `asset.mjs pattern` → seamless tile, CSS mask at 6–8% |
| City sketch (`sketch-city.png`) | `sketch` | above the footer | 4-colour alpha PNG, CSS mask at 35% in `--text-muted` |

Characters are people, drawn — never photographs of people. Illustrations never carry
information: the level, the wait and the menu are always in words and figures beside them.

Four depth and motion moments in the data, and no others:

1. **The crowding aura.** A soft colour field behind the crowding card that *grows* and warms
   as the queue grows (scale 0.52 → 0.82 → 1.18, teal → amber → terracotta, 250ms). It is
   redundant reinforcement of information already given in words and figures — it never carries
   meaning alone, and it is the one place blur is allowed.
2. **The parallax hall photo.** It sits behind the crowding card, which overlaps it by 64px,
   and drifts at 40% of scroll with a slight scale-up.
3. **The sticky mini answer.** Once the hero scrolls away, a pill drops in from the top with
   the level word, the wait and a tap-to-top control.
4. **Shimmering skeletons.** Every loading shape carries a sheen sweep on a 1.4s cycle, so a
   slow canteen connection looks like loading rather than like breakage.

Decorative motion is allowed only in the brand layer, and only three kinds: the **boil** (a
character's line wobbles like hand animation, 7 frames a second), the **wallpaper drift** (one
tile a minute, splash and kiosk only) and the **logo intro** (the U draws, "Bite" slides out,
the counters fill — splash, kiosk, `assets/motion/logo-intro.mp4`).

There is no glass, no decorative transparency, no gradient background. `--scrim` over
photography is the only gradient in the system, and everything above turns off entirely under
`prefers-reduced-motion`.

### Layout rules

- Phone-first: the app is designed at 400px and must not scroll horizontally there or at 200%
  zoom. `--max-phone` is 440px.
- The header is sticky and painted with `--surface-page`; category headings are sticky within
  the menu surface.
- Touch targets are 44×44 minimum everywhere, which also serves the kiosk.
- Sibling groups (chips, buttons, tags) use flex/grid with `gap` — never inline spacing.

---

## ICONOGRAPHY

- **Lucide outline**, 24px grid, 2px stroke, round caps — 59 glyphs, copied into
  [`assets/icons/`](assets/icons) and inlined in [`components/icons/Icon.jsx`](components/icons/Icon.jsx)
  so a glyph inherits `currentColor` and costs no request.
  *Substitution flagged:* the source repository contains no icon set of its own, so Lucide was
  chosen for its neutral, slightly technical outline — replace it wholesale if the team adopts
  another set; everything routes through the single `Icon` component.
- **No icon font, no sprite sheet, no PNG icons, no emoji, no Unicode glyphs as icons.**
- Glyph sizes: 16 (inline metadata), 18 (buttons), 20–22 (header actions), 56–72 (kiosk, at
  `stroke={2.25}` so the weight holds).
- An icon never carries meaning alone. `PersonMeter` (1/2/3 person glyphs) is a *second* carrier
  beside the crowding word; dietary tags always show their word.
- **Menu pictograms are illustrations, not icons.** The category pills use the drawn
  pictograms (`Illustration kind="picto"`); every action, navigation and status glyph stays
  Lucide.
- **The logo is A, the tray-U, followed directly by "Bite"** (team decision, 22 Sep 2026): the
  mark is the U of UBite. It is drawn geometry plus Archivo Bold converted to outlines, built by
  the repo's `scripts/brand.mjs` into `assets/brand/` (lockup in four colourways, the PWA icons
  with the whole lockup on the accent, and a U-only favicon — five letters do not survive 16px),
  and implemented as [`components/brand/Logo.jsx`](components/brand/Logo.jsx) (`withText`).
  The other candidates (*signal*, *bite*, *plate*) stay only as explorations.
  It is a **live mark**: its three counters fill with the current queue level, so the header,
  the app icon and the kiosk corner all show today's canteen. The counters never carry the level
  alone — the word is always on screen beside them. The reasoning and an AI prompt (if you want
  to compare) are in [`guidelines/logo-brief.md`](guidelines/logo-brief.md); the six explored
  directions are in [`explorations/logo-lab.html`](explorations/logo-lab.html). If the University
  mandates its own mark, it sits beside this one with clear space, never inside it.

---

## Index

**Foundations** — [`styles.css`](styles.css) is the single entry point; it imports
[`tokens/fonts.css`](tokens/fonts.css), [`colors.css`](tokens/colors.css),
[`typography.css`](tokens/typography.css), [`spacing.css`](tokens/spacing.css),
[`shape.css`](tokens/shape.css), [`motion.css`](tokens/motion.css) and
[`base.css`](tokens/base.css).
[`guidelines/`](guidelines) holds the specimen cards and [`contrast.md`](guidelines/contrast.md).

**Components**

| Component | Where | What it is |
|---|---|---|
| `CrowdingIndicator`, `PersonMeter`, `QualityBadge`, `FreshnessStamp` | `components/crowding/` | the signature component: level word, wait in minutes, freshness, quality badge, closed / loading / error, in hero, compact and kiosk sizes |
| `Button`, `IconButton` | `components/core/` | primary, secondary, quiet, danger, all states |
| `Card`, `SectionHeader` | `components/core/` | the two surfaces and section headings |
| `Chip`, `Badge`, `DietaryTag` | `components/core/` | filters, status markers, food claims |
| `Input`, `Skeleton` | `components/core/` | the text field and the loading shape |
| `DishRow`, `DishPhoto`, `CategoryHeader` | `components/menu/` | the menu list |
| `DishDetailHeader` | `components/menu/` | dish detail, with the allergen disclosure rule |
| `RatingStars`, `LoyaltyDots` | `components/menu/` | ratings and the five filling dots |
| `EmptyState`, `OfflineBanner`, `WaitReport`, `CrowdingByHour` | `components/feedback/` | the states every screen must define, plus two home-screen controls |
| `AppShell`, `AppHeader`, `AppFooter`, `Announcement`, `Sheet`, `Toast` | `components/layout/` | app chrome and the page wrapper |
| `Icon`, `GLYPHS` | `components/icons/` | the only icon primitive |
| `Wordmark` | `components/brand/` | the chosen lockup as a drop-in (`full`), the app-icon tile (`mark`), plain text (`inline`) |
| `Logo`, `LogoSplash` | `components/brand/` | the drawn mark and the U+Bite lockup — counters that fill with the queue level, favicon sizes, and the one-second first-open splash over the doodle wallpaper |
| `Illustration`, `Pattern` | `components/brand/` | the brand illustration layer: characters, flat scenes, pictograms, the wallpaper; `boil` and `drift` |
| `Spotlight` | `components/core/` | a feature card with a character, for things UBite really does (never invented offers) |

**Production entry** — [`index.js`](index.js) (with [`index.d.ts`](index.d.ts)) exports every
component; the apps in the repo import from it, the UI kits from `_ds_bundle.js`. After changing a
component, run the repo's `node scripts/ds-bundle.mjs --all` so both stay identical.

**UI kits** — [`ui_kits/student-app/`](ui_kits/student-app) (home, dish detail, account, add a
visit, install prompt, first-open onboarding, with live state switches), [`ui_kits/staff-editor/`](ui_kits/staff-editor),
[`ui_kits/kiosk/`](ui_kits/kiosk), [`ui_kits/dccas-dashboard/`](ui_kits/dccas-dashboard).

**Other** — [`INSTALL.md`](INSTALL.md) installs this system as a skill in Claude Code;
[`SKILL.md`](SKILL.md) is the skill manifest; [`CLAUDE.md`](CLAUDE.md) carries the hard rules
for agents working in the repo; [`guidelines/asset-pipeline.md`](guidelines/asset-pipeline.md)
is the asset workflow and [`guidelines/logo-brief.md`](guidelines/logo-brief.md) the logo brief
(six drawn candidates live in [`explorations/logo-lab.html`](explorations/logo-lab.html));
[`scripts/`](scripts) holds `asset.sh` (generate), `photo.sh` (fetch), `manifest-add.js` and
`check-assets.js`; [`github.md`](github.md) records the upstream repository and sync state;
[`assets/`](assets) holds the icon set, the image-slot script and `manifest.json`.

### Intentional additions

The brief's component list was followed exactly. These items were added, each with a reason:

1. **`Icon`** — a wrapper for the glyph set, so icon usage is one component and one substitution point.
2. **`Wordmark`** — the brief left the identity open and a header needs something. Since the logo decision it renders the chosen U+Bite lockup.
4. **`Illustration`, `Pattern`, `Spotlight`** — the team asked for a visual language of its own on top of the brief (22 Sep 2026).
3. **`CrowdingByHour`** — Zone 5 is specified in the screen specs but not named in the component list.

### Open items for the team

- Real canteen photography (hall, queue, the kiosk wall, dishes) — every photo position is a
  waiting drop slot.
- A decision on the UB brand manual: whether the University's mark must appear at all.
- The QR code image for the kiosk download panel.
- Confirmation of the real dish catalogue and prices; the ones used throughout the kits are
  plausible placeholders drawn from the docs, not the canteen's actual menu.
