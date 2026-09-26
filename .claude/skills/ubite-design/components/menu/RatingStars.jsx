import React from 'react';
import { Icon } from '../icons/Icon.jsx';

/* A rating is an opinion, so it is always accompanied by its sample size.
   Stars are never the only carrier: the numeric average sits beside them. */

export function RatingStars({
  value = 0, count, size = 20, interactive = false, onRate, lang = 'ro', disabled = false, pending = false,
}) {
  const [hover, setHover] = React.useState(0);
  const shown = hover || value;
  const label = lang === 'ro' ? 'Notează felul' : 'Rate this dish';
  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <div role={interactive ? 'radiogroup' : 'img'}
          aria-label={interactive ? label : `${value} / 5`}
          style={{ display: 'flex', gap: interactive ? 2 : 3, opacity: disabled ? 0.45 : 1 }}
          onMouseLeave={() => setHover(0)}>
          {[1, 2, 3, 4, 5].map((n) => {
            const on = n <= Math.round(shown);
            const glyph = (
              <Icon name="star" size={size} stroke={2}
                style={{ color: on ? 'var(--crowd-moderate-fill)' : 'var(--border-strong)', fill: on ? 'var(--crowd-moderate-fill)' : 'transparent', transition: 'color var(--motion-fast) var(--ease-out)' }} />
            );
            if (!interactive) return <span key={n}>{glyph}</span>;
            return (
              <button key={n} type="button" role="radio" aria-checked={n === Math.round(value)}
                aria-label={`${n}`} disabled={disabled || pending}
                onMouseEnter={() => setHover(n)} onClick={() => onRate && onRate(n)}
                className="ub-star"
                style={{ background: 'transparent', border: 0, padding: 6, margin: -2, minHeight: 44, minWidth: 44, display: 'grid', placeItems: 'center', cursor: 'pointer', borderRadius: 'var(--radius-sm)' }}>
                {glyph}
              </button>
            );
          })}
        </div>
        <span className="ub-numeric" style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
          {pending
            ? (lang === 'ro' ? 'Se trimite…' : 'Sending…')
            : count != null
              ? `${Number(value).toFixed(1)} · ${count} ${lang === 'ro' ? 'note' : 'ratings'}`
              : Number(value).toFixed(1)}
        </span>
      </div>
      <style>{`.ub-star:hover{background:var(--hover-wash)}`}</style>
    </>
  );
}

/* Five dots, filling. One of only two places in the system where motion earns its keep. */
/* Signed out it is one quiet line; `onSignIn` turns its last words into the sign-in link. */
export function LoyaltyDots({ filled = 0, total = 5, size = 16, lang = 'ro', signedIn = true, onAdd, onSignIn }) {
  if (!signedIn) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 'var(--text-base)', color: 'var(--text-secondary)' }}>
          {lang === 'ro' ? 'A șasea masă e gratuită.' : 'Every sixth meal is free.'}{' '}
          {onSignIn ? (
            <button type="button" onClick={onSignIn} className="ub-loyalty-add" style={{
              background: 'transparent', border: 0, padding: 0, minHeight: 44, color: 'var(--accent)',
              fontSize: 'var(--text-base)', fontWeight: 'var(--weight-semibold)', cursor: 'pointer', textAlign: 'left',
            }}>{lang === 'ro' ? 'Intră în cont ca să ținem socoteala.' : 'Sign in and we will keep count.'}</button>
          ) : (lang === 'ro' ? 'Intră în cont ca să ținem socoteala.' : 'Sign in and we will keep count.')}
        </span>
        <style>{`.ub-loyalty-add:hover{text-decoration:underline;text-underline-offset:3px}`}</style>
      </div>
    );
  }
  const left = total - filled;
  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: size * 0.45 }} role="img"
          aria-label={`${filled} ${lang === 'ro' ? 'din' : 'of'} ${total}`}>
          {Array.from({ length: total }, (_, i) => (
            <span key={i} className={i < filled ? 'ub-dot ub-dot--on' : 'ub-dot'} style={{
              width: size, height: size, borderRadius: '50%',
              background: i < filled ? 'var(--accent)' : 'transparent',
              boxShadow: i < filled ? 'none' : 'inset 0 0 0 2px var(--border-strong)',
              animationDelay: `${i * 40}ms`,
            }} />
          ))}
        </div>
        <span className="ub-numeric" style={{ fontSize: 'var(--text-base)', color: 'var(--text-secondary)' }}>
          {left === 0
            ? (lang === 'ro' ? 'Ai o masă gratuită.' : 'You have a free meal.')
            : `${filled} ${lang === 'ro' ? 'din' : 'of'} ${total} — ${left === 1
              ? (lang === 'ro' ? 'încă una și masa e gratuită' : 'one more for a free meal')
              : (lang === 'ro' ? `încă ${left} până la masa gratuită` : `${left} more to a free meal`)}`}
        </span>
        {onAdd && (
          <button type="button" onClick={onAdd} className="ub-loyalty-add" style={{
            marginLeft: 'auto', background: 'transparent', border: 0, color: 'var(--accent)',
            fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)', cursor: 'pointer',
            display: 'inline-flex', alignItems: 'center', gap: 6, minHeight: 44,
          }}>
            <Icon name="camera" size={16} />{lang === 'ro' ? 'Adaugă bon' : 'Add receipt'}
          </button>
        )}
      </div>
      <style>{`
        .ub-dot{transition:background var(--motion-slow) var(--ease-out),box-shadow var(--motion-slow) var(--ease-out)}
        .ub-dot--on{animation:ub-dot-fill var(--motion-slow) var(--ease-out)}
        @keyframes ub-dot-fill{from{transform:scale(.6);opacity:.4}to{transform:none;opacity:1}}
        .ub-loyalty-add:hover{text-decoration:underline;text-underline-offset:3px}
        @media (prefers-reduced-motion:reduce){.ub-dot,.ub-dot--on{animation:none;transition:none}}
      `}</style>
    </>
  );
}
