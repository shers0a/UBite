/* Liquid glass, exactly as liquid-glass-react's own "Log Out" button template
   (rdev/liquid-glass-react, liquid-glass-example/src/pages/index.tsx): displacement 64, blur 0.1,
   saturation 130 %, chromatic aberration 2, elasticity 0.35, fully round corners, standard
   refraction. The same template holds the bars and the crowding card.

   Two ways to hold it, because the library draws a pill positioned by its centre:
   - GlassFloat: the library as designed — a fixed pill with its content inside, so the content
     stretches with the glass (the bottom nav, the mini answer).
   - GlassLayer: a layer under content that keeps its own layout (the crowding card).
   The header buttons are not liquid: GlassIcon is frosted black glass with white lines.

   Measured in a real Chromium: the glass only sees what lies behind it if no ancestor between
   them is a stacking context — so these never sit inside a z-index or `isolation`.

   Phones with Chrome get the library's lighter fork (vendor/liquid-glass-lite.tsx): the same
   look, a quarter of the work per scroll frame. Where the refraction cannot run it is not faked:
   Safari and Firefox do not bend a backdrop through an SVG filter, so iPhones and Firefox get
   frosted glass in plain CSS, the same shape and blur. */
import React from 'react';
import { useApp } from '../state/app';

// Loaded only where it will refract, and only the one this device draws.
const LiquidGlass = React.lazy(() => import('liquid-glass-react'));
const LiteGlass = React.lazy(() => import('../../vendor/liquid-glass-lite'));

/** The repo's button template, verbatim. */
export const GLASS_BUTTON = {
  displacementScale: 64,
  blurAmount: 0.1,
  saturation: 130,
  aberrationIntensity: 2,
  elasticity: 0.35,
  cornerRadius: 100,
  mode: 'standard' as const,
};

/** Which glass this device draws: the library on a desktop Chromium, its lighter fork on a phone
 *  with Chrome (scrolling Home on an emulated Pixel 5, the library dropped 17–24 frames and the
 *  fork 1–2, as many as frosted glass; measured 26 Sep 2026), frosted glass everywhere else —
 *  Safari and Firefox, a phone without the headroom, or someone asking for less transparency. */
function glassMode(): 'liquid' | 'lite' | 'frost' {
  if (typeof window === 'undefined') return 'frost';
  const ua = navigator.userAgent;
  const chromium = /Chrome\/|Chromium\/|Edg\//.test(ua) && !/Firefox\//.test(ua);
  const phone = /Android|iPhone|iPad|iPod|Mobile/.test(ua) || !window.matchMedia?.('(hover: hover) and (pointer: fine)').matches;
  const cores = navigator.hardwareConcurrency ?? 8;
  const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 8;
  const lessTransparency = window.matchMedia?.('(prefers-reduced-transparency: reduce)').matches;
  if (!chromium || cores < 6 || memory < 4 || lessTransparency) return 'frost';
  return phone ? 'lite' : 'liquid';
}
const GLASS = glassMode();
const REFRACT = GLASS !== 'frost';
const LIBRARY = GLASS === 'liquid';

interface RefractProps {
  children?: React.ReactNode;
  overLight: boolean;
  padding: string;
  className: string;
  style: React.CSSProperties;
  cornerRadius?: number;
  mouseContainer?: React.RefObject<HTMLElement | null>;
}
/** The refracting pill for this device: the library, or its lighter fork. */
function Refract(p: RefractProps) {
  if (LIBRARY) return <LiquidGlass {...GLASS_BUTTON} {...p}>{p.children}</LiquidGlass>;
  return <LiteGlass {...GLASS_BUTTON} {...p} className={`${p.className} ub-lg-lite`} />;
}

function useLightTheme() {
  const { theme } = useApp();
  const [systemDark, setSystemDark] = React.useState(() => window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? true);
  React.useEffect(() => {
    const m = window.matchMedia?.('(prefers-color-scheme: dark)');
    const on = () => setSystemDark(m.matches);
    m?.addEventListener('change', on);
    return () => m?.removeEventListener('change', on);
  }, []);
  return theme === 'light' || (theme === 'system' && !systemDark);
}

/** The library measures itself on mount and on window resize only; when what it holds changes
 *  size (the nav folding, an estimate arriving), make it measure again. Takes the element itself,
 *  not a ref: the library loads lazily, so the element it wraps is replaced once it arrives. */
function useRemeasure(el: HTMLElement | null) {
  React.useEffect(() => {
    if (!el || typeof ResizeObserver === 'undefined' || !LIBRARY) return;
    let first = true;
    const ro = new ResizeObserver(() => {
      if (first) { first = false; return; }
      window.dispatchEvent(new Event('resize'));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [el]);
}

/* ── A fixed pill with its content inside ─────────────────────────────────────────────── */

export interface GlassFloatProps {
  children: React.ReactNode;
  /** Where the pill's centre sits: position fixed, top or bottom, left (and zIndex). */
  style: React.CSSProperties;
  padding?: string;
  className?: string;
  /** Hidden: no pointer events, out of the accessibility tree. */
  hidden?: boolean;
}

export function GlassFloat({ children, style, padding = '8px 16px', className = '', hidden = false }: GlassFloatProps) {
  const light = useLightTheme();
  const [inner, setInner] = React.useState<HTMLDivElement | null>(null);
  useRemeasure(inner);
  const content = <div ref={setInner} className="ub-lg-content" aria-hidden={hidden || undefined} inert={hidden || undefined}>{children}</div>;
  /* A pill held by `bottom` stays glued to the bottom edge while a phone browser's address bar
     slides in and out: the compositor moves it with the bar. Held by `top: calc(100% - …)`, it
     is laid out again only once the bar has settled, and then trails behind it. */
  const fromBottom = style.bottom !== undefined;
  const frosted = (
    <div className={`ub-lg-frost ${className}`} style={{ ...style, padding, transform: fromBottom ? 'translate(-50%, 50%)' : 'translate(-50%, -50%)', pointerEvents: hidden ? 'none' : undefined }}>
      {content}
    </div>
  );
  if (!REFRACT) return frosted;
  // The library places the pill by its centre from the top only; the fork can hold it by the bottom.
  const { bottom, ...rest } = style;
  const placed = !fromBottom ? style
    : LIBRARY ? { ...rest, top: `calc(100% - (${bottom}))` } : { ...style, transform: 'translate(-50%, 50%)' };
  return (
    <React.Suspense fallback={frosted}>
      <Refract overLight={light} padding={padding} className={`ub-lg ${className}`}
        style={{ ...placed, pointerEvents: hidden ? 'none' : undefined }}>
        {content}
      </Refract>
    </React.Suspense>
  );
}

/* ── An icon button on frosted black glass ────────────────────────────────────────────── */

/** White lines on heavily frosted black glass, the same on every device and in both themes. The
 *  refracting pill read as a soap bubble over the bright hall windows (Marius, 3 Oct 2026). */
export function GlassIcon({ children, size = 48 }: { children: React.ReactNode; size?: number }) {
  return <span className="ub-glass-icon" style={{ width: size, height: size }}>{children}</span>;
}

/* ── A layer under content that keeps its own layout ──────────────────────────────────── */

export interface GlassLayerProps {
  /** The box the glass fills; the content inside it must sit above (position relative, z-index 1). */
  box: React.RefObject<HTMLElement | null>;
  /** A radius token, e.g. "--radius-lg" — the card's own corners. */
  radius: string;
}

export function GlassLayer({ box, radius }: GlassLayerProps) {
  const light = useLightTheme();
  const [boxEl, setBoxEl] = React.useState<HTMLElement | null>(null);
  React.useEffect(() => { setBoxEl(box.current); }, [box]);
  useRemeasure(boxEl);
  const r = parseFloat(getComputedStyle(document.documentElement).getPropertyValue(radius)) || 24;
  const frosted = <span className="ub-glass ub-glass--frost" aria-hidden="true" style={{ borderRadius: `var(${radius})` }} />;
  if (!REFRACT) return frosted;
  return (
    <React.Suspense fallback={frosted}>
      <span className="ub-glass ub-glass--liquid" aria-hidden="true">
        <Refract cornerRadius={r} overLight={light} mouseContainer={box} padding="0" className=""
          style={{ position: 'absolute', top: '50%', left: '50%', width: '100%', height: '100%' }} />
      </span>
    </React.Suspense>
  );
}
