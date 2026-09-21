# Design System Brief

A **custom design system**, built from scratch rather than assembled from a component library.
This was a deliberate choice: the repository will be public and shown as portfolio work, and a
stock component library makes every application look identical.

## Personality

> Clean and functional, close to neutral — with a little warmth. Student, not corporate; not
> childish.

The restraint carries the institutional credibility needed in front of UB and the funding
jury. The warmth comes from small things — copy, micro-interaction, one good accent — not from
decoration.

**Voice:** short sentences, second person, plain Romanian and plain English. "Queue is short,
about 3 minutes" rather than "Current occupancy level: reduced". Never jargon, never
exclamation marks, never apologetic.

## Relationship to UB identity

The application has its **own visual identity**. It is not a University sub-brand.

However: request the UB brand manual from Andra and respect its constraints where they apply —
logo usage, any mandated wordmark placement. Build every colour and type decision on **CSS
variables** so that if the University imposes a palette late, it changes in one file rather
than across every component.

The [`inspo/`](inspo/) folder collects references and any UB guidelines obtained. The starting
prompt for Claude Design lives in [design-system-prompt.md](design-system-prompt.md).

## Foundations

### Colour

Define the full palette as tokens on `:root`. Every colour gets a semantic name, never a literal
one — `--surface-raised`, not `--grey-100`.

**Dark mode from the start**, built through variable redefinition, not a second stylesheet.
Retrofitting dark mode means rebuilding every component; doing it from day one costs almost
nothing.

Required roles: background, surface, raised surface, border, text primary, text secondary, text
muted, accent, and three crowding states.

The three crowding colours are the only place in the system where colour carries meaning — and
even there, **the word always appears alongside**. Colour is never the sole carrier of
information. Verify contrast in both themes.

### Type

One typeface, used well, beats two used carelessly. A system font stack is a legitimate choice
here — it loads instantly, which matters on a weak canteen connection, and it looks native on
every device.

Fixed scale, no arbitrary sizes. The crowding figure at the top of the home screen is the
largest text in the application and should look deliberate at that size.

Minimum body text 16px — smaller triggers input zoom on iOS and fails accessibility.

### Spacing and density

A single spacing scale, applied consistently.

The home screen's density gradient is a system rule, not a one-off: **generous at the top,
tightening as importance decreases**. Zone 1 and Zone 2 get the most air; the footer gets the
least.

### Motion

Sparing and fast — 150–250ms. Motion confirms that something happened; it never entertains.

Respect `prefers-reduced-motion` by disabling transitions entirely, not by shortening them.

The one place motion earns its keep: the crowding level changing, and the loyalty dot filling.
Both are moments of genuine feedback.

### Elevation and shape

One or two elevation levels, no more. A consistent corner radius across the system, with larger
radii reserved for the primary cards.

## Components needed

Roughly in build order:

**Foundational** — button (primary, secondary, quiet), card, chip/tag, badge, icon set, text
input, skeleton loader.

**Domain-specific** — crowding indicator (the signature component), dish row, dish detail
header, category section header, loyalty progress dots, rating stars, dietary tag, freshness
timestamp, empty state, offline banner.

**Layout** — app shell with bottom or top navigation, scroll container, modal sheet, toast.

**Kiosk variants** — large-type versions of the crowding indicator and the menu list, sized for
three-metre legibility.

The crowding indicator is worth designing first and designing well. It is the top of the most
important screen, the thing screenshots will show, and the visual identity of the project.

## Accessibility is part of the system, not a review step

- Contrast at least 4.5:1 body, 3:1 large text and UI components — **in both themes**
- Visible focus indicator on every interactive element, designed rather than defaulted
- Touch targets at least 44×44px, which also serves the kiosk
- Semantic structure and labels; never colour alone
- Works at 400px width and 200% zoom without horizontal scroll

Target is documented WCAG AA. Building it into the components is the only way to reach that
without a separate remediation phase there is no time for.

## Two themes, three surfaces

The same system must hold up across: a phone in bright daylight outside the canteen, a phone in
a dim dining hall, and a wall-mounted tablet seen from three metres. The kiosk in particular
argues against a dark-only design and in favour of high contrast throughout.

## Deliverables

1. Token file — colour, type, spacing, radius, elevation, motion
2. Both theme definitions
3. Component inventory with all states: default, hover, focus, active, disabled, loading, error
4. The crowding indicator in all three levels and all three quality states
5. Home screen composition showing the density gradient
6. `docs/inspo/` with references and any UB guidelines obtained

## Open items

- [ ] Obtain the UB brand manual, or confirm none exists
- [ ] Confirm whether the UB logo may or must appear
- [ ] Decide on the typeface
- [ ] Populate `docs/inspo/`
