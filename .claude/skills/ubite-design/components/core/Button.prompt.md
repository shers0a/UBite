The only button in UBite — and `IconButton` for glyph-only actions.

```jsx
<Button variant="primary" size="md">Publică meniul</Button>
<Button variant="secondary" iconLeft="camera">Adaugă o vizită</Button>
<Button variant="quiet" size="sm">Vezi tot</Button>
<IconButton name="heart" label="Adaugă la favorite" />
```

- One primary per screen. Secondary is the accent wash; quiet is the text-only weight.
- `md` is 44px tall — never go below it on a touch surface. `kiosk` is 72px.
- States: hover (darker accent / wash), active (1px press), `disabled` (45% opacity), `loading` (spinner replaces the left icon), `error` (danger ring on a failed submit).
- Focus comes from the global `:focus-visible` ring; do not restyle it per button.
