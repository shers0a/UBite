import React from 'react';
import { Icon } from '../icons/Icon.jsx';
import { Illustration, useReducedMotion } from '../brand/Illustration.jsx';

/* A feature card with a character — the "special offers" slot of the reference apps, used only
   for things UBite really does: the quiet hour, the wait report, the menu alert. Never for an
   offer the canteen has not made. The drawing takes the card's text colour and bleeds off the
   bottom-right corner; the text keeps the left 58%, so it never sits on the drawing.
   `video` (a path without extension, e.g. assets/motion/spot-run) is the same character
   animated: white lines on black, blended into the card so it takes the card's text colour in
   both themes. It replaces the still drawing once it plays; reduced motion keeps the still. */
export function Spotlight({ eyebrow, title, action, onAction, art, video, boil = true, tone = 'accent', style }) {
  const reduce = useReducedMotion();
  const [playing, setPlaying] = React.useState(false);
  const moving = video && tone === 'accent' && !reduce;
  const bg = tone === 'inverse' ? 'var(--surface-inverse)' : tone === 'quiet' ? 'var(--accent-quiet)' : 'var(--accent)';
  const fg = tone === 'inverse' ? 'var(--text-inverse)' : tone === 'quiet' ? 'var(--accent-quiet-text)' : 'var(--text-on-accent)';
  return (
    <div className="ub-spotlight" style={{
      position: 'relative', overflow: 'hidden', minHeight: 172, display: 'flex',
      background: bg, color: fg, borderRadius: 'var(--radius-lg)', padding: '18px 18px 16px', ...style,
    }}>
      <div style={{ position: 'relative', zIndex: 1, width: '58%', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 6 }}>
        {eyebrow && <span style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)', opacity: 0.88 }}>{eyebrow}</span>}
        <strong style={{ fontSize: 'var(--text-md)', fontWeight: 'var(--weight-semibold)', lineHeight: 1.3 }}>{title}</strong>
        {action && (
          <button type="button" onClick={onAction} className="ub-spotlight-btn" style={{
            marginTop: 'auto', display: 'inline-flex', alignItems: 'center', gap: 10, minHeight: 44,
            padding: '0 6px 0 16px', border: 0, borderRadius: 'var(--radius-pill)', background: fg, color: bg,
            font: 'inherit', fontSize: 'var(--text-base)', fontWeight: 'var(--weight-semibold)', cursor: 'pointer', whiteSpace: 'nowrap',
          }}>
            {action}
            <span style={{ width: 32, height: 32, borderRadius: '50%', display: 'grid', placeItems: 'center', background: bg, color: fg }}>
              <Icon name="arrow-right" size={16} />
            </span>
          </button>
        )}
      </div>
      {art && !(moving && playing) && (
        <Illustration src={art} tone={fg} boil={boil} width="48%"
          style={{ position: 'absolute', right: -24, bottom: -20, maxWidth: 176 }} />
      )}
      {moving && (
        <video className="ub-spotlight-video" autoPlay muted loop playsInline aria-hidden="true"
          onPlaying={() => setPlaying(true)}
          style={{ position: 'absolute', right: -24, bottom: -20, width: '48%', maxWidth: 176, aspectRatio: '1', opacity: playing ? 1 : 0 }}>
          <source src={`${video}.webm`} type="video/webm" />
          <source src={`${video}.mp4`} type="video/mp4" />
        </video>
      )}
      <style>{`
        .ub-spotlight-btn{transition:transform var(--motion-fast) var(--ease-out)}
        .ub-spotlight-btn:hover{transform:translateX(2px)}
        .ub-spotlight-btn:focus-visible{outline:3px solid var(--focus-ring);outline-offset:2px;box-shadow:0 0 0 6px var(--focus-ring-contrast)}
        @media (prefers-reduced-motion:reduce){.ub-spotlight-btn{transition:none}}
        .ub-spotlight-video{mix-blend-mode:screen;pointer-events:none}
        :root[data-theme="dark"] .ub-spotlight-video{filter:invert(1);mix-blend-mode:multiply}
        @media (prefers-color-scheme:dark){:root:not([data-theme="light"]) .ub-spotlight-video{filter:invert(1);mix-blend-mode:multiply}}
      `}</style>
    </div>
  );
}
