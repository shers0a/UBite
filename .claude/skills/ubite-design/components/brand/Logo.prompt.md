The UBite logo — **A, the tray-U, followed directly by "Bite"** (chosen 22 Sep 2026). Geometry, not a raster file, and **live**: its three counters fill with the current queue level.

```jsx
<Logo variant="tray" size={30} level={level} withText />         {/* app header: the lockup */}
<Logo variant="tray" size={190} level={level} intro withText />  {/* kiosk, intro played once */}
<Logo variant="tray" size={20} favicon />                        {/* 16–24px: the U alone */}
<LogoSplash level={level} pattern={A.pattern} onDone={hide} />   {/* first open, one second */}
```

- With `withText` the U **is** the first letter: "Bite" is Archivo Bold converted to outlines and drawn in the same SVG, so the lockup never waits for a font. `size` is then the lockup's height.
- The mark never carries the level alone — the word is always on screen beside it. Counters are reinforcement.
- Below 24px use the U alone (`favicon`): five letters do not survive 16px. The PWA icons (`assets/brand/icon-*.png` in the repo) carry the whole lockup, white on the accent.
- `signal`, `bite` and `plate` remain for the logo explorations only.
- Animations respect `prefers-reduced-motion` (nothing animates).
