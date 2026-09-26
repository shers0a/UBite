Shows how busy the canteen is right now — the top of the home screen and the thing screenshots will show.

```jsx
<CrowdingIndicator level="moderate" waitMinutes={6} quality="live" updatedSecondsAgo={40} size="hero" lang="ro" />
<CrowdingIndicator level="closed" opensAtLabel="mâine la 11:30" size="hero" />
<CrowdingIndicator level="high" waitMinutes={12} quality="estimated" size="kiosk" />
```

Rules that are not negotiable:
- The level is always a **word** (Mică / Medie / Mare). Colour is a second carrier, never the only one; `PersonMeter` adds a third (1, 2 or 3 filled person glyphs).
- The wait is in **minutes**, never a percentage.
- Every estimate shows its **age**. `FreshnessStamp` turns amber with `stale` when the data came from cache.
- `QualityBadge` renders nothing when `quality="live"` — its presence is the signal.
- `level="closed"` shows opening hours instead of a level. Never a stale number.

Sizes: `hero` (Zone 1, 64px figure), `compact` (inline, 24px), `kiosk` (132px, three-metre legibility). Also has `loading` (skeleton matching the final layout) and `error` states.
