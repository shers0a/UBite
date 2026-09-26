import React from 'react';

/* The UBite mark, drawn as geometry — no raster file, no generator.
   It is a LIVE mark: the three counters fill with the current queue level, so the app icon,
   the header and the kiosk corner all show today's canteen. The word is always elsewhere on
   screen; the mark never carries the level on its own.
   The team chose A, the tray-U. The other variants stay for the logo explorations only. */

const FILLED = { closed: 0, low: 1, moderate: 2, high: 3 };
const LEVEL_TONE = {
  low: 'var(--crowd-low-fill)', moderate: 'var(--crowd-moderate-fill)',
  high: 'var(--crowd-high-fill)', closed: 'var(--crowd-closed-fill)',
};

function Counters({ variant, filled, tone, favicon }) {
  const dotR = favicon ? 5 : 4;
  if (variant === 'signal') {
    const bars = [{ x: 17, y: 10, h: 8 }, { x: 28, y: 6, h: 12 }, { x: 39, y: 2, h: 16 }];
    return bars.map((b, i) => (
      <rect key={i} x={b.x} y={b.y} width="8" height={b.h} rx="2"
        className={i < filled ? 'ub-logo-c ub-logo-c--on' : 'ub-logo-c'}
        style={{ animationDelay: `${i * 70}ms` }}
        fill={i < filled ? (tone || 'currentColor') : 'none'}
        stroke={i < filled ? 'none' : 'currentColor'} strokeWidth={favicon ? 4 : 3} />
    ));
  }
  return [21, 32, 43].map((cx, i) => (
    <circle key={cx} cx={cx} cy="12" r={dotR}
      className={i < filled ? 'ub-logo-c ub-logo-c--on' : 'ub-logo-c'}
      style={{ animationDelay: `${i * 70}ms` }}
      fill={i < filled ? (tone || 'currentColor') : 'none'}
      stroke={i < filled ? 'none' : 'currentColor'} strokeWidth={favicon ? 4 : 3} />
  ));
}

/* The chosen lockup (logo A, 22 Sep 2026): the tray-U followed directly by "Bite", so the
   word reads UBite with the mark as its first letter. Built by the repo's scripts/brand.mjs:
   the U's height is Archivo's cap height, its stroke Archivo Bold's stem, and "Bite" is
   Archivo Bold converted to outlines — the lockup never waits for a font. */
const LOCKUP = {
  vb: '-24 14 2994 1022', w: 2994, h: 1022, sw: 145, r: 85,
  u: 'M72.5 378.5V734.5A203 203 0 0 0 275.5 937.5H719.5A203 203 0 0 0 922.5 734.5V378.5',
  heads: [[263.8,123],[497.5,123],[731.3,123]],
  word: 'M1538 1000L1145 1000L1145 314L1537 314Q1591 314 1634.5 335Q1678 356 1703 394Q1728 432 1728 483Q1728 524 1713 556Q1698 588 1672.5 609Q1647 630 1615 640L1615 644Q1653 652 1682.5 674Q1712 696 1729.5 730.5Q1747 765 1747 812Q1747 874 1718.5 916Q1690 958 1643 979Q1596 1000 1538 1000M1294 707L1294 878L1509 878Q1546 878 1569.5 857Q1593 836 1593 792Q1593 766 1583 747Q1573 728 1553 717.5Q1533 707 1502 707L1294 707M1294 433L1294 591L1492 591Q1519 591 1537.5 580.5Q1556 570 1565.5 552.5Q1575 535 1575 512Q1575 473 1553.5 453Q1532 433 1497 433L1294 433M1994 397L1855 397L1855 277L1994 277L1994 397M1994 1000L1855 1000L1855 474L1994 474L1994 1000M2279 1012Q2229 1012 2198 994Q2167 976 2153 945.5Q2139 915 2139 878L2139 581L2074 581L2074 474L2144 474L2170 324L2278 324L2278 474L2374 474L2374 581L2278 581L2278 855Q2278 879 2289 891.5Q2300 904 2325 904L2374 904L2374 996Q2362 1000 2346 1003.5Q2330 1007 2312 1009.5Q2294 1012 2279 1012M2703 1012Q2616 1012 2557 982.5Q2498 953 2468 892Q2438 831 2438 737Q2438 642 2468 581.5Q2498 521 2556.5 491.5Q2615 462 2700 462Q2780 462 2835 490.5Q2890 519 2918 578.5Q2946 638 2946 732L2946 768L2579 768Q2581 814 2593.5 846Q2606 878 2632.5 893.5Q2659 909 2703 909Q2727 909 2746.5 903Q2766 897 2780 885Q2794 873 2802 855Q2810 837 2810 814L2946 814Q2946 864 2928 901Q2910 938 2878 962.5Q2846 987 2801.5 999.5Q2757 1012 2703 1012M2581 680L2803 680Q2803 650 2795.5 628Q2788 606 2775 592Q2762 578 2743.5 571.5Q2725 565 2702 565Q2664 565 2638.5 577.5Q2613 590 2599.5 615.5Q2586 641 2581 680',
};

function Lockup({ size, filled, counterTone, colour, wordColour, intro }) {
  return (
    <svg viewBox={LOCKUP.vb} width={Math.round(size * LOCKUP.w / LOCKUP.h)} height={size}
      role="img" aria-label="UBite" className={intro ? 'ub-lockup ub-lockup--intro' : 'ub-lockup'}
      style={{ display: 'block', flex: 'none' }}>
      <path className="ub-lockup-u" d={LOCKUP.u} pathLength="1" fill="none" stroke={colour}
        strokeWidth={LOCKUP.sw} strokeLinecap="round" strokeLinejoin="round" />
      {LOCKUP.heads.map(([cx, cy], i) => {
        const on = i < filled;
        return (
          <circle key={i} cx={cx} cy={cy} r={on ? LOCKUP.r : LOCKUP.r - 30}
            className={on ? 'ub-logo-c ub-logo-c--on' : 'ub-logo-c'}
            style={{ animationDelay: `${(intro ? 240 : 0) + i * 80}ms` }}
            fill={on ? (counterTone || colour) : 'none'} stroke={on ? 'none' : colour} strokeWidth={on ? 0 : 60} />
        );
      })}
      <path className="ub-lockup-w" d={LOCKUP.word} fill={wordColour} />
    </svg>
  );
}

export function Logo({
  variant = 'tray', size = 34, level, tone = 'accent', favicon = false,
  intro = false, withText = false, style,
}) {
  const uid = React.useId().replace(/:/g, '');
  const filled = level ? FILLED[level] ?? 2 : variant === 'plate' || variant === 'bite' ? 0 : 2;
  const counterTone = level && tone === 'level' ? LEVEL_TONE[level] : undefined;
  const colour = tone === 'mono' ? 'var(--text-primary)' : tone === 'inverse' ? 'var(--surface-raised)'
    : tone === 'on-accent' ? 'var(--text-on-accent)' : 'var(--accent)';
  const wordColour = tone === 'inverse' ? 'var(--text-inverse)' : tone === 'on-accent' ? 'var(--text-on-accent)' : 'var(--text-primary)';
  const sw = favicon ? 7 : 5;

  const mark = (
    <svg viewBox="0 0 64 64" width={size} height={size} fill="none"
      stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"
      role="img" aria-label="UBite" className={intro ? 'ub-logo-intro' : undefined}
      style={{ color: colour, display: 'block', flex: 'none' }}>
      {variant === 'tray' && (<>
        <path d="M12 22v14a8 8 0 0 0 8 8h24a8 8 0 0 0 8-8V22" />
        <Counters variant="tray" filled={filled} tone={counterTone} favicon={favicon} />
      </>)}
      {variant === 'signal' && (<>
        <path d="M12 24v12a8 8 0 0 0 8 8h24a8 8 0 0 0 8-8V24" />
        <Counters variant="signal" filled={filled} tone={counterTone} favicon={favicon} />
      </>)}
      {variant === 'bite' && (<>
        <mask id={`m${uid}`} stroke="none">
          <rect width="64" height="64" fill="#fff" />
          <circle cx="50" cy="14" r="13" fill="#000" />
        </mask>
        <circle cx="32" cy="32" r="24" fill="currentColor" stroke="none" mask={`url(#m${uid})`} />
        {!favicon && <circle cx="50" cy="14" r="5" fill="currentColor" stroke="none" />}
      </>)}
      {variant === 'plate' && (<>
        <mask id={`m${uid}`} stroke="none">
          <rect width="64" height="64" fill="#fff" />
          <circle cx="56" cy="8" r="11" fill="#000" />
        </mask>
        <rect x="6" y="6" width="52" height="52" rx={favicon ? 10 : 14} fill="currentColor" stroke="none" mask={`url(#m${uid})`} />
        <text x="30" y={favicon ? 45 : 43} textAnchor="middle" fontFamily="var(--font-sans)"
          fontSize={favicon ? 32 : 28} fontWeight="800" fill="var(--surface-raised)" stroke="none">UB</text>
      </>)}
    </svg>
  );

  const css = (
    <style>{`
      .ub-logo-c{transition:fill var(--motion-slow) var(--ease-out),stroke var(--motion-slow) var(--ease-out)}
      .ub-logo-c--on{animation:ub-logo-fill var(--motion-slow) var(--ease-out)}
      @keyframes ub-logo-fill{from{transform:scale(.55);opacity:.35}to{transform:none;opacity:1}}
      .ub-logo-c{transform-box:fill-box;transform-origin:center}
      .ub-logo-intro{animation:ub-logo-in 620ms var(--ease-out)}
      @keyframes ub-logo-in{0%{opacity:0;transform:scale(.82) translateY(6px)}60%{opacity:1;transform:scale(1.02)}100%{transform:none}}
      .ub-lockup--intro .ub-lockup-u{stroke-dasharray:1;animation:ub-lockup-draw 400ms var(--ease-out) both}
      @keyframes ub-lockup-draw{from{stroke-dashoffset:1}to{stroke-dashoffset:0}}
      .ub-lockup--intro .ub-lockup-w{animation:ub-lockup-word 360ms var(--ease-out) 180ms both}
      @keyframes ub-lockup-word{from{opacity:0;transform:translateX(-140px)}to{opacity:1;transform:none}}
      .ub-lockup--intro .ub-logo-c{animation:ub-logo-fill 280ms var(--ease-out) both}
      @media (prefers-reduced-motion:reduce){.ub-logo-c,.ub-logo-c--on,.ub-logo-intro,.ub-lockup--intro .ub-lockup-u,.ub-lockup--intro .ub-lockup-w,.ub-lockup--intro .ub-logo-c{animation:none;transition:none}}
    `}</style>
  );

  if (!withText) return <>{mark}{css}</>;
  // The tray-U is the U of UBite: the word follows it directly, in one drawing. `size` is the
  // lockup's height, counters included.
  if (variant === 'tray') {
    return (
      <span style={{ display: 'inline-flex', ...style }}>
        <Lockup size={size} filled={filled} counterTone={counterTone} colour={colour} wordColour={wordColour} intro={intro} />
        {css}
      </span>
    );
  }
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: Math.round(size * 0.28), ...style }}>
      {mark}
      <span style={{
        fontSize: Math.round(size * 0.82), fontWeight: 'var(--weight-bold)',
        letterSpacing: '-.035em', color: tone === 'inverse' ? 'var(--text-inverse)' : 'var(--text-primary)',
        lineHeight: 1,
      }}>{variant === 'plate' ? 'ite' : 'UBite'}</span>
      {css}
    </span>
  );
}

/* The first open: the U draws itself, "Bite" slides out of it, the counters fill to the
   current level, and it is gone in a second. No logo screen, no loading bar — the home screen
   is already behind it. `pattern` lays the doodle wallpaper faintly behind the lockup. */
export function LogoSplash({ level = 'moderate', variant = 'tray', onDone, duration = 1000, pattern }) {
  React.useEffect(() => {
    const t = setTimeout(() => onDone && onDone(), duration);
    return () => clearTimeout(t);
  }, [duration, onDone]);
  return (
    <>
      <div className="ub-splash" style={{
        position: 'absolute', inset: 0, zIndex: 80, display: 'grid', placeItems: 'center',
        background: 'var(--surface-page)',
      }}>
        {pattern && (
          <span aria-hidden="true" style={{
            position: 'absolute', inset: 0, background: 'var(--accent)', opacity: 0.07,
            WebkitMask: `url(${pattern}) 0 0 / 375px 375px repeat`, mask: `url(${pattern}) 0 0 / 375px 375px repeat`,
          }} />
        )}
        <span style={{ position: 'relative' }}>
          {variant === 'tray'
            ? <Logo variant="tray" size={64} level={level} intro withText />
            : <Logo variant={variant} size={96} level={level} intro withText={false} />}
        </span>
      </div>
      <style>{`
        .ub-splash{animation:ub-splash-out ${duration}ms var(--ease-out) forwards}
        @keyframes ub-splash-out{0%,72%{opacity:1}100%{opacity:0;visibility:hidden}}
        @media (prefers-reduced-motion:reduce){.ub-splash{animation:none;display:none}}
      `}</style>
    </>
  );
}
