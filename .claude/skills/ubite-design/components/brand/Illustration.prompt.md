The brand illustration layer — what makes UBite look like itself and not like a template.

```jsx
<Illustration src={A.spot('run')} tone="accent" boil width={160} height={160} />          {/* character */}
<Illustration kind="scene" src={A.scene('campus')} width={300} height={270} />            {/* onboarding */}
<Illustration kind="picto" src={A.picto('soup')} tone="current" width={34} height={34} /> {/* category pill */}
<div style={{ position: 'relative' }}><Pattern src={A.pattern} opacity={0.07} size={320} /></div>
```

- **Characters** (`spots/`: run, queue, cook, phone, friends, balance) are one brush ink; give them any token colour. White on the accent inside a `Spotlight`, accent on a surface.
- **Scenes** fill every shape with a colour token, so they are inlined (`kind="scene"`) to follow the theme.
- **Pictograms** are illustrations for menu categories, not UI icons — actions and navigation stay Lucide (`Icon`). To keep the fill visible on an accent background, override `--accent` on the illustration (`style={{ '--accent': 'var(--accent-quiet)' }}`).
- **Illustrations never carry information.** The level, the wait and the menu are always words and figures beside them. Without `label` a drawing is `aria-hidden`.
- `boil` and `drift` are the only decorative motion in the system; both switch off under `prefers-reduced-motion`.
- New drawings start as a brief in the repo's `scripts/briefs.mjs` (presets `spot`, `doodles`, `picto`, `flat`, `sketch`) — never an ad-hoc prompt.
