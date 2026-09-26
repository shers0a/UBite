import React from 'react';

/* The brand illustration layer — what makes UBite look like itself and not like a template.
   Every file is an SVG (or a mask PNG) in the repo's assets/, recorded in assets/manifest.json:

   - spot   characters in one brush ink (assets/illustrations/spots/). Drawn through a CSS mask,
            so they take any token colour: ink on a surface, on-accent inside a Spotlight.
   - line   the empty-state line drawings — same treatment as a spot.
   - scene  flat onboarding scenes whose shapes are filled with the colour tokens themselves
            (var(--accent), var(--accent-quiet)…). Inlined, so they recolour with the theme.
   - picto  menu category pictograms: an outline in currentColor over a fill in --accent.

   `boil` gives a drawing the wobble of a hand-animated line: three displacement filters swapped
   seven times a second. It is decoration, so reduced motion switches it off. */

const TONES = {
  ink: 'var(--text-primary)', accent: 'var(--accent)', 'on-accent': 'var(--text-on-accent)',
  muted: 'var(--text-muted)', inverse: 'var(--text-inverse)', current: 'currentColor',
};

const svgCache = new Map();
function useInlineSvg(src) {
  const [text, setText] = React.useState(() => (src && svgCache.get(src)) || '');
  React.useEffect(() => {
    if (!src) return undefined;
    if (svgCache.has(src)) { setText(svgCache.get(src)); return undefined; }
    let live = true;
    fetch(src).then((r) => (r.ok ? r.text() : '')).then((t) => {
      // A single <svg> root from our own assets folder; anything else is dropped.
      const ok = /^\s*<svg[\s>]/.test(t) && !/<script|\son\w+=/i.test(t);
      const clean = ok ? t.replace('<svg ', '<svg width="100%" height="100%" ') : '';
      svgCache.set(src, clean);
      if (live) setText(clean);
    }).catch(() => {});
    return () => { live = false; };
  }, [src]);
  return text;
}

export function useReducedMotion() {
  const query = typeof window !== 'undefined' && window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
  const [reduce, setReduce] = React.useState(query ? query.matches : false);
  React.useEffect(() => {
    if (!query) return undefined;
    const on = () => setReduce(query.matches);
    query.addEventListener('change', on);
    return () => query.removeEventListener('change', on);
  }, []);
  return reduce;
}

/* Three frozen noise fields, and a timer that swaps between them. Neither animating the seed
   inside the SVG nor a CSS animation of filter:url() repaints the element in Chromium. */
function BoilFilter({ id }) {
  return (
    <svg width="0" height="0" aria-hidden="true" focusable="false" style={{ position: 'absolute' }}>
      {[1, 2, 3].map((seed) => (
        <filter key={seed} id={`${id}-${seed}`} x="-4%" y="-4%" width="108%" height="108%">
          <feTurbulence type="fractalNoise" baseFrequency="0.03" numOctaves="2" seed={seed} result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale="3.5" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      ))}
    </svg>
  );
}

function useBoil(ref, id, on) {
  React.useEffect(() => {
    const el = ref.current;
    if (!on || !el) return undefined;
    let frame = 0;
    const t = setInterval(() => { frame = (frame + 1) % 3; el.style.filter = `url(#${id}-${frame + 1})`; }, 140);
    el.style.filter = `url(#${id}-1)`;
    return () => { clearInterval(t); el.style.filter = ''; };
  }, [on, id]);
}

export function Illustration({
  src, kind = 'spot', tone = 'ink', width, height, ratio = 1, boil = false, label, style,
}) {
  const reduce = useReducedMotion();
  const fid = `ub-boil-${React.useId().replace(/:/g, '')}`;
  const inline = kind === 'scene' || kind === 'picto';
  const svg = useInlineSvg(inline ? src : null);
  const wobble = boil && !reduce;
  const ref = React.useRef(null);
  useBoil(ref, fid, wobble);
  const colour = TONES[tone] || tone;
  const a11y = label ? { role: 'img', 'aria-label': label } : { 'aria-hidden': true };
  // The filter sits on a wrapper: CSS filters run before masks, so on the masked element itself
  // it would only shake a solid rectangle.
  const outer = {
    display: 'block', flex: 'none', width: width ?? '100%', height: height ?? 'auto',
    aspectRatio: height ? undefined : String(ratio), ...style,
  };
  if (!src) return null;
  if (inline) {
    return (
      <>
        {wobble && <BoilFilter id={fid} />}
        <span ref={ref} {...a11y} style={{ ...outer, color: colour }} dangerouslySetInnerHTML={{ __html: svg }} />
      </>
    );
  }
  const mask = `url("${src}") center / contain no-repeat`;
  return (
    <>
      {wobble && <BoilFilter id={fid} />}
      <span ref={ref} {...a11y} style={outer}>
        <span style={{ display: 'block', width: '100%', height: '100%', background: colour, WebkitMask: mask, mask }} />
      </span>
    </>
  );
}

/* The doodle wallpaper (assets/patterns/canteen.svg): a seamless tile, masked over a token
   colour at low opacity. The parent needs `position: relative`. `drift` slides it one tile a
   minute, for the splash and the kiosk; reduced motion keeps it still. */
export function Pattern({ src, tone = 'accent', opacity = 0.08, size = 320, drift = false, style }) {
  const reduce = useReducedMotion();
  if (!src) return null;
  const mask = `url("${src}") 0 0 / ${size}px ${size}px repeat`;
  return (
    <span aria-hidden="true" style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', opacity, ...style }}>
      <span style={{
        position: 'absolute', top: -size, left: -size, right: 0, bottom: 0,
        background: TONES[tone] || tone, WebkitMask: mask, mask,
        animation: drift && !reduce ? 'ub-pattern-drift 60s linear infinite' : undefined,
        '--ub-tile': `${size}px`,
      }} />
      <style>{'@keyframes ub-pattern-drift{to{transform:translate(var(--ub-tile),var(--ub-tile))}}'}</style>
    </span>
  );
}
