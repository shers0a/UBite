The single icon primitive: renders one Lucide outline glyph inline, inheriting `currentColor`.

```jsx
<Icon name="clock" size={18} />
<Icon name="wifi-off" size={20} label="Fără conexiune" />
```

- 48 glyphs are available; `GLYPHS` holds the full map. There is no second icon system and no emoji anywhere in UBite.
- Decorative glyphs (next to a visible label) omit `label` and become `aria-hidden`.
- Never scale a glyph below 16px or above 56px without raising `stroke` — at kiosk sizes use `stroke={2.25}`.
