/* Liquid glass, exactly as liquid-glass-react's own "Log Out" button template
   (rdev/liquid-glass-react, liquid-glass-example/src/pages/index.tsx): displacement 64, blur 0.1,
   saturation 130 %, chromatic aberration 2, elasticity 0.35, fully round corners, standard
   refraction. The same template is used everywhere — the buttons, the bars and the crowding card.

   Three ways to hold it, because the library draws a pill positioned by its centre:
   - GlassFloat: the library as designed — a fixed pill with its content inside, so the content
     stretches with the glass (the bottom nav, the mini answer).
   - GlassIcon: an icon button inside a pill, in a box of its own size (the header buttons).
   - GlassLayer: a layer under content that keeps its own layout (the crowding card).

   Measured in a real Chromium: the glass only sees what lies behind it if no ancestor between
   them is a stacking context — so these never sit inside a z-index or `isolation`.

   Where the refraction cannot run it is not faked: Safari and Firefox do not bend a backdrop
   through an SVG filter, and on a slow phone a filter re-evaluated on every scroll frame costs
   more than it gives. Those get frosted glass in plain CSS — the same shape and blur. */
import React from 'react';
import { useApp } from '../state/app';

// Loaded only where it will refract: iPhones and slower phones never download it.
const LiquidGlass = React.lazy(() => import('liquid-glass-react'));

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

/** Chromium on a device with some headroom, and nobody asking for less transparency. */
function canRefract() {
  if (typeof window === 'undefined') return false;
  const ua = navigator.userAgent;
  const chromium = /Chrome\/|Chromium\/|Edg\//.test(ua) && !/Firefox\//.test(ua);
  const iosWebKit = /iPhone|iPad|iPod/.test(ua); // every iOS browser is WebKit underneath
  const cores = navigator.hardwareConcurrency ?? 8;
  const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 8;
  const lessTransparency = window.matchMedia?.('(prefers-reduced-transparency: reduce)').matches;
  return chromium && !iosWebKit && cores >= 6 && memory >= 4 && !lessTransparency;
}
export const REFRACT = canRefract();

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
    if (!el || typeof ResizeObserver === 'undefined' || !REFRACT) return;
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
  /** Where the pill's centre sits: position fixed, top, left (and zIndex). */
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
  const frosted = (
    <div className={`ub-lg-frost ${className}`} style={{ ...style, padding, transform: 'translate(-50%, -50%)', pointerEvents: hidden ? 'none' : undefined }}>
      {content}
    </div>
  );
  if (!REFRACT) return frosted;
  return (
    <React.Suspense fallback={frosted}>
      <LiquidGlass {...GLASS_BUTTON} overLight={light} padding={padding} className={`ub-lg ${className}`}
        style={{ ...style, pointerEvents: hidden ? 'none' : undefined }}>
        {content}
      </LiquidGlass>
    </React.Suspense>
  );
}

/* ── An icon button in a pill ─────────────────────────────────────────────────────────── */

/** The box keeps the button's place in the row; the pill is centred in it. */
export function GlassIcon({ children, size = 48 }: { children: React.ReactNode; size?: number }) {
  const light = useLightTheme();
  const box = { position: 'relative' as const, display: 'inline-block', width: size, height: size, flex: 'none' };
  const frosted = <span style={box}><span className="ub-lg-frost ub-lg-frost--icon">{children}</span></span>;
  if (!REFRACT) return frosted;
  return (
    <span style={box}>
      <React.Suspense fallback={<span className="ub-lg-frost ub-lg-frost--icon">{children}</span>}>
        <LiquidGlass {...GLASS_BUTTON} overLight={light} padding="2px" className="ub-lg ub-lg--icon"
          style={{ position: 'absolute', top: '50%', left: '50%' }}>
          {children}
        </LiquidGlass>
      </React.Suspense>
    </span>
  );
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
        <LiquidGlass {...GLASS_BUTTON} cornerRadius={r} overLight={light} mouseContainer={box} padding="0"
          style={{ position: 'absolute', top: '50%', left: '50%', width: '100%', height: '100%' }}>
          {null}
        </LiquidGlass>
      </span>
    </React.Suspense>
  );
}
