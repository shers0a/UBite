# Claude Design — starting prompt

Paste the block below into Claude Design. It is self-contained: it carries every decision made
during requirements, so Claude Design does not need the rest of this documentation.

Add your inspiration images from [`inspo/`](inspo/) to the same conversation before sending, if
you have them. Especially any UB brand material.

---

```
I'm building the design system for UBite, a progressive web app for the University of
Bucharest's canteen. Three student developers, five-week build, public repository, real
users from mid-October.

WHO USES IT

A student standing in a hallway at 12:40 with a twenty-minute break, deciding whether to
walk to the canteen. They open the app and need two answers in one glance: will I get
through the queue in time, and is today's food worth it?

Two secondary surfaces:
- Canteen staff publishing the day's menu in under two minutes, on a shared account, in a
  kitchen, in a hurry.
- A tablet mounted on the canteen wall, read from three metres away by people walking past.

PERSONALITY

Clean and functional, close to neutral, with a little warmth. Student, not corporate. Never
childish. The restraint has to hold up in front of a university and a funding jury; the
warmth comes from copy and micro-interaction, not from decoration.

Its own identity, not a University sub-brand. Build everything on CSS variables so a late
institutional palette would be a one-file change.

Voice: short sentences, second person, plain language. "Queue is short, about 3 minutes",
never "Current occupancy level: reduced".

WHAT I WANT FROM YOU

Lay these out as separate artboards on one canvas:

1. TOKEN SHEET — the full palette as semantic tokens (surface, raised surface, border, text
   primary/secondary/muted, accent, and three crowding states), type scale, spacing scale,
   radii, elevation, motion durations. Semantic names only, never literal ones.

2. LIGHT AND DARK — the same key screen in both themes, side by side. Dark mode is built from
   day one by redefining variables, not as a second stylesheet.

3. THE CROWDING INDICATOR — the signature component, designed first and designed hardest.
   This is the top of the most important screen and the thing screenshots will show.
   It must show:
     - the level as a WORD: Low / Moderate / High. Never colour alone.
     - an estimated wait in minutes, beside or beneath it
     - how fresh the data is ("updated 40s ago")
     - a quality badge ONLY when degraded: "approximate" or "usual for this time"
   Show all variants: three levels x three quality states (live / degraded / estimated),
   plus a closed-canteen state that shows opening hours instead of a level.
   It should be legible while walking.

4. COMPONENT INVENTORY — button (primary, secondary, quiet), card, chip, badge, text input,
   skeleton loader, dish row, dish detail header, category section header, loyalty progress
   dots (five dots that fill), rating stars, dietary tag, freshness timestamp, empty state,
   offline banner. Every one with default, hover, focus, active, disabled, loading and error
   states. Focus indicators must be designed, not browser defaults.

5. HOME SCREEN — one tall artboard showing the full scroll. The organising rule is
   importance descending, density increasing:
     Zone 1  Crowding now — maximum breathing room, above the fold, unmissable
     Zone 2  Today's menu — grouped by category (soup / main+side / dessert+salad /
             drinks+extras), all on one scrolling surface, never behind tabs. Dish name,
             price, dietary tags, small photo. Filter chips above the list.
     Zone 3  Loyalty progress — five filling dots, one line of context, compact
     Zone 4  "How long did you wait?" — a quick report control, compact
     Zone 5  Typical crowding by hour — denser
     Zone 6  Canteen announcements — dense, only when present
     Zone 7  Footer — hours, address, language switch, feedback, account. Densest.

6. DISH DETAIL — photo, name, price, weight, dietary tags, allergens with their source,
   rating stars, favourite heart. Where allergen data is missing it must read "information
   not available" and never imply absence.

7. STAFF MENU EDITOR — the whole screen exists to be finished in under two minutes.
   Yesterday's menu preloaded, the dish catalogue below as a checklist (under 40 items, so
   no search needed), price prefilled and overridable, an optional "portions prepared"
   field, one action to publish. Someone in a hurry should manage it without reading
   anything.

8. KIOSK — large-type variants of the crowding indicator and the menu list, sized to be read
   from three metres. It rotates between menu, crowding, and a large download QR code.

HARD CONSTRAINTS

- Phone first. Must work at 400px wide with no horizontal scroll, and at 200% zoom.
- WCAG AA, documented: 4.5:1 for body text, 3:1 for large text and UI components, verified
  in BOTH themes. This is a public university's app.
- Touch targets at least 44x44px. This also serves the kiosk.
- Body text minimum 16px, or iOS zooms the input.
- Respect prefers-reduced-motion by disabling transitions entirely, not shortening them.
- Motion is 150-250ms, and only confirms that something happened. The two places it earns
  its keep: the crowding level changing, and a loyalty dot filling.
- Romanian and English. Romanian strings run roughly 15-20% longer, so nothing can be
  designed to a tight text box.
- A system font stack is a legitimate choice here — it loads instantly, which matters on the
  canteen's weak Wi-Fi. If you propose a webfont, justify the cost.
- The same system must hold up in bright daylight outside, in a dim dining hall, and on a
  wall tablet at three metres.
- Every screen needs defined loading, empty, stale, offline and error states. Skeletons that
  match the final layout, never a spinner over blank space.

WHAT TO AVOID

- Anything that looks like a stock component library. The repository is public and this is
  portfolio work.
- Colour as the only carrier of meaning, anywhere.
- Percentages for crowding — they imply a precision the system does not have.
- Gradients, glass effects and decoration for their own sake.
- More than two elevation levels.

Start with the token sheet and the crowding indicator. Once those are right, everything else
follows from them.
```

---

## After the first pass

Things worth asking for in follow-up rounds, once the foundations are settled:

- The crowding indicator at three sizes: home screen hero, compact inline, kiosk
- The onboarding-free first open, and the contextual PWA install prompt
- The "Add a visit" receipt camera screen
- The DCCAS dashboard — this is the screen that turns the canteen director from gatekeeper
  into ally, so it deserves real attention rather than a default admin table
- An empty-state pass across every screen, which is the part most commonly skipped and most
  visible when the canteen forgets to publish a menu

## Related

- [Design system brief](19-design-system-brief.md) — the reasoning behind these decisions
- [Screen specifications](18-screen-specs.md) — what each screen contains, conceptually
- [Crowding module](07-crowding-module.md) — where the quality states come from
- [`inspo/`](inspo/) — reference images
