/* A lighter liquid glass: liquid-glass-react 1.1.1 (MIT, Copyright 2025 Max Rovensky) with the same
   displacement map, the same template values, the same way of bending the backdrop and the same
   rims, minus what a phone cannot afford on every scroll frame:

   - The library bends each colour channel separately (three displacement passes, then blends
     them) for the coloured fringe at the rim. Here it is one pass, no fringe. Most of the saving
     is here: with the fringe kept, the fork still dropped 5–7 frames.
   - The library's two rim highlights use mix-blend-mode, which makes the browser read back the
     page under them every frame. A screen blend of white is the same as a plain white overlay,
     so the first rim is drawn plainly; the second (overlay) is approximated the same way.
   - No mouse tracking, no elastic stretch, no measuring on resize: there is no mouse on a phone,
     and the rims sit inside the pill, so they never need its size.

   Kept as the library does: blur the backdrop, then bend the result over 170 % of the pill. Bent
   over the pill only (one backdrop-filter chain) it costs the same and the rim darkens, having no
   light from just outside the pill to pull in.

   Measured on an emulated Pixel 5 scrolling Home (26 Sep 2026): the library 47–49 fps with 17–24
   dropped frames; this 59 fps with 1–2, next to 59 for frosted CSS glass.

   Kept outside apps/web/src on purpose: the library's own shadow and rim colours stay as they are,
   like the rest of the library in node_modules; the app's components use tokens only. */
import React from 'react';
import { DISPLACEMENT_MAP } from './liquid-glass-map';

export interface LiteGlassProps {
  children?: React.ReactNode;
  displacementScale?: number;
  blurAmount?: number;
  saturation?: number;
  cornerRadius?: number;
  overLight?: boolean;
  padding?: string;
  className?: string;
  style?: React.CSSProperties;
  /** Accepted for the library's prop shape: unused without the fringe and without a mouse. */
  aberrationIntensity?: number;
  elasticity?: number;
  mouseContainer?: unknown;
  mode?: string;
}

const RIM: React.CSSProperties = {
  position: 'absolute', inset: 0, pointerEvents: 'none', padding: '1.5px',
  WebkitMask: 'linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)',
  WebkitMaskComposite: 'xor', maskComposite: 'exclude',
  boxShadow: '0 0 0 0.5px rgba(255, 255, 255, 0.5) inset, 0 1px 3px rgba(255, 255, 255, 0.25) inset, 0 1px 4px rgba(0, 0, 0, 0.35)',
};
const rimGradient = (mid: number, end: number) =>
  `linear-gradient(135deg, rgba(255, 255, 255, 0) 0%, rgba(255, 255, 255, ${mid}) 33%, rgba(255, 255, 255, ${end}) 66%, rgba(255, 255, 255, 0) 100%)`;

export default function LiteGlass({
  children, displacementScale = 70, blurAmount = 0.0625, saturation = 140,
  cornerRadius = 999, overLight = false, padding = '24px 32px', className = '', style = {},
}: LiteGlassProps) {
  const id = `lg${React.useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;
  // "standard" mode, as the library: the map pushes outwards, half as far over a light page.
  const scale = -(overLight ? displacementScale * 0.5 : displacementScale);
  const blur = (overLight ? 12 : 4) + blurAmount * 32;
  const backdrop = `blur(${blur}px) saturate(${saturation}%)`;
  return (
    <div className={className} style={{ ...style, transform: style.transform ?? 'translate(-50%, -50%)' }}>
      <svg aria-hidden="true" width="0" height="0" style={{ position: 'absolute' }}>
        <filter id={id} x="-35%" y="-35%" width="170%" height="170%" colorInterpolationFilters="sRGB">
          <feImage href={DISPLACEMENT_MAP} x="0" y="0" width="100%" height="100%" preserveAspectRatio="xMidYMid slice" result="map" />
          <feDisplacementMap in="SourceGraphic" in2="map" scale={scale} xChannelSelector="R" yChannelSelector="B" />
        </filter>
      </svg>
      <div className="glass" style={{
        borderRadius: `${cornerRadius}px`, position: 'relative', display: 'flex', alignItems: 'center', gap: '24px', padding, overflow: 'hidden',
        boxShadow: overLight ? '0px 16px 70px rgba(0, 0, 0, 0.75)' : '0px 12px 40px rgba(0, 0, 0, 0.25)',
      }}>
        <span className="glass__warp" style={{ position: 'absolute', inset: 0, backdropFilter: backdrop, WebkitBackdropFilter: backdrop, filter: `url(#${id})` }} />
        <div style={{ position: 'relative', zIndex: 1, font: '500 20px/1 system-ui', textShadow: overLight ? '0px 2px 12px rgba(0, 0, 0, 0)' : '0px 2px 12px rgba(0, 0, 0, 0.4)' }}>
          {children}
        </div>
      </div>
      <span aria-hidden="true" style={{ ...RIM, borderRadius: `${cornerRadius}px`, opacity: 0.2, background: rimGradient(0.12, 0.4) }} />
      <span aria-hidden="true" style={{ ...RIM, borderRadius: `${cornerRadius}px`, opacity: 0.5, background: rimGradient(0.32, 0.6) }} />
    </div>
  );
}
