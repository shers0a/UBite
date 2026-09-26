import React from 'react';
import { Icon } from '../icons/Icon.jsx';
import { Skeleton } from '../core/Input.jsx';

/* The signature component. Three rules it never breaks:
   1. the level is a WORD, always — colour is only ever a second carrier
   2. the estimate carries its age
   3. a quality badge appears ONLY when the estimate is degraded, so it means something

   The aura behind the card is the fourth, redundant carrier: a colour field that GROWS and
   warms as the queue grows. It is decorative reinforcement of information that is already
   spelled out in words — never the carrier itself. */

const LEVELS = ['low', 'moderate', 'high'];

const COPY = {
  ro: {
    eyebrow: 'Coada acum', low: 'Mică', moderate: 'Medie', high: 'Mare',
    // Romanian counts: un minut · 2–19 minute · 20 de minute and up.
    wait: (m) => (m <= 1 ? 'Aștepți cam un minut' : m >= 20 ? `Aștepți cam ${m} de minute` : `Aștepți cam ${m} minute`), waitShort: (m) => `~${m} min`,
    updated: (s) => (s < 60 ? `actualizat acum ${s}s` : `actualizat acum ${Math.round(s / 60)} min`),
    degraded: 'aproximativ', estimated: 'obișnuit la ora asta',
    closedTitle: 'Închis', closedNext: (t) => `Se deschide ${t}`, hours: 'L–V 11:30–17:00',
    noData: 'Nu avem date acum', report: 'Cât ai așteptat?',
  },
  en: {
    eyebrow: 'Queue right now', low: 'Low', moderate: 'Moderate', high: 'High',
    wait: (m) => (m <= 1 ? "You'll wait about a minute" : `You'll wait about ${m} minutes`), waitShort: (m) => `~${m} min`,
    updated: (s) => (s < 60 ? `updated ${s}s ago` : `updated ${Math.round(s / 60)} min ago`),
    degraded: 'approximate', estimated: 'usual for this time',
    closedTitle: 'Closed', closedNext: (t) => `Opens ${t}`, hours: 'Mon–Fri 11:30–17:00',
    noData: 'No estimate right now', report: 'How long did you wait?',
  },
};

const SIZES = {
  hero:    { pad: 26, word: 'var(--text-display)', wait: 'var(--text-xl)', meta: 'var(--text-sm)', glyph: 44, radius: 'var(--radius-lg)' },
  compact: { pad: 14, word: 'var(--text-xl)', wait: 'var(--text-base)', meta: 'var(--text-xs)', glyph: 20, radius: 'var(--radius-md)' },
  kiosk:   { pad: 56, word: 'var(--text-display-kiosk)', wait: 'var(--text-3xl)', meta: 'var(--text-xl)', glyph: 104, radius: 'var(--radius-lg)' },
};

const AURA = { low: 0.52, moderate: 0.82, high: 1.18, closed: 0.4 };

function tone(level) {
  const l = LEVELS.includes(level) ? level : 'closed';
  return { text: `var(--crowd-${l}-text)`, fill: `var(--crowd-${l}-fill)`, quiet: `var(--crowd-${l}-quiet)` };
}

/* The three figures stand together, overlapping, and arrive one after another. */
export function PersonMeter({ level, size = 28, lang = 'ro', align = 'center' }) {
  const active = LEVELS.indexOf(level) + 1;
  const t = tone(level);
  return (
    <>
      <div key={level} className="ub-meter" style={{
        display: 'flex', justifyContent: align, alignItems: 'flex-end',
        paddingLeft: Math.round(size * 0.3),
      }} aria-hidden="true">
        {[1, 2, 3].map((n) => {
          const on = n <= active;
          return (
            <span key={n} className={`ub-meter-p${on ? ' ub-meter-p--on' : ''}`} style={{
              marginLeft: -Math.round(size * 0.3),
              animationDelay: `${(n - 1) * 70}ms`,
              color: on ? t.fill : 'var(--text-muted)',
              filter: on ? 'none' : 'none',
            }}>
              <Icon name="user" size={size} stroke={on ? 2.25 : 1.75} />
            </span>
          );
        })}
      </div>
      <style>{`
        .ub-meter-p{display:block;transition:color var(--motion-slow) var(--ease-out)}
        .ub-meter .ub-meter-p{animation:ub-person-in var(--motion-slow) var(--ease-out) backwards}
        @keyframes ub-person-in{from{opacity:0;transform:translateY(8px) scale(.82)}to{opacity:1;transform:none}}
        .ub-meter-p--on{animation-name:ub-person-in}
        @media (prefers-reduced-motion:reduce){.ub-meter .ub-meter-p{animation:none}.ub-meter-p{transition:none}}
      `}</style>
    </>
  );
}

export function QualityBadge({ quality, lang = 'ro' }) {
  if (quality === 'live') return null;
  const c = COPY[lang] || COPY.ro;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6, padding: '3px 9px',
      borderRadius: 'var(--radius-xs)', background: 'var(--status-warning-quiet)',
      color: 'var(--status-warning-text)', fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)',
      letterSpacing: '.01em', whiteSpace: 'nowrap',
    }}>
      <Icon name="circle-alert" size={13} stroke={2.25} />
      {quality === 'estimated' ? c.estimated : c.degraded}
    </span>
  );
}

export function FreshnessStamp({ seconds = 0, quality = 'live', stale = false, lang = 'ro', size = 'var(--text-sm)' }) {
  const c = COPY[lang] || COPY.ro;
  const live = quality === 'live' && !stale;
  return (
    <>
      <span className="ub-numeric" style={{
        display: 'inline-flex', alignItems: 'center', gap: 7,
        fontSize: size, color: stale ? 'var(--status-warning-text)' : 'var(--text-muted)', whiteSpace: 'nowrap',
      }}>
        <span className={live ? 'ub-pulse' : undefined} style={{
          width: 8, height: 8, borderRadius: '50%', flex: 'none',
          background: live ? 'var(--crowd-low-fill)' : 'var(--border-strong)',
        }} />
        {c.updated(seconds)}
      </span>
      <style>{`
        .ub-pulse{position:relative}
        .ub-pulse::after{content:"";position:absolute;inset:0;border-radius:50%;background:inherit;animation:ub-ping 2.4s var(--ease-out) infinite}
        @keyframes ub-ping{0%{transform:scale(1);opacity:.55}70%,100%{transform:scale(2.6);opacity:0}}
        @media (prefers-reduced-motion:reduce){.ub-pulse::after{animation:none;display:none}}
      `}</style>
    </>
  );
}

export function CrowdingIndicator({
  level = 'moderate', waitMinutes = 6, quality = 'live', updatedSecondsAgo = 40,
  size = 'hero', lang = 'ro', opensAtLabel = 'mâine la 11:30', hoursLabel, loading = false, error = false, onReport,
  surface = 'raised', underlay = null,
}) {
  const s = SIZES[size] || SIZES.hero;
  const c = COPY[lang] || COPY.ro;
  // The schedule is configurable without a deploy (docs/05 canteen_schedule): the real hours
  // come in from the caller; the copy above is only the confirmed default.
  const hours = hoursLabel || c.hours;
  const closed = level === 'closed';
  const t = tone(level);
  const hero = size === 'hero' || size === 'kiosk';

  // surface="glass": the card turns translucent and the caller's underlay (a glass layer) sits
  // between the level's colour field and the words — the colour becomes part of the glass.
  const glass = surface === 'glass';
  const layer = (content) => (glass ? <>{underlay}<div style={{ position: 'relative', zIndex: 1 }}>{content}</div></> : content);
  const shell = {
    background: glass ? 'color-mix(in srgb, var(--surface-raised) 28%, transparent)' : 'var(--surface-raised)', borderRadius: s.radius, padding: s.pad,
    // Glass must see the page through the card, so the card is not a stacking context of its own
    // (its colour field then sits behind the page's content, clipped to the card).
    position: 'relative', overflow: 'hidden', isolation: glass ? 'auto' : 'isolate',
  };

  const aura = hero && (
    <span aria-hidden="true" className={glass ? 'ub-aura ub-aura--glass' : 'ub-aura'} style={{
      position: 'absolute', left: '50%', top: size === 'kiosk' ? '46%' : '38%',
      width: size === 'kiosk' ? 900 : 420, height: size === 'kiosk' ? 900 : 420,
      marginLeft: size === 'kiosk' ? -450 : -210, marginTop: size === 'kiosk' ? -450 : -210,
      borderRadius: '50%', background: t.fill, zIndex: -1,
      transform: `scale(${AURA[LEVELS.includes(level) ? level : 'closed']})`,
    }} />
  );

  if (loading) {
    return (
      <div style={shell} aria-busy="true">
        {layer(<div style={{ display: 'flex', flexDirection: 'column', gap: 14, alignItems: hero ? 'center' : 'flex-start' }}>
          <Skeleton width={104} height={13} />
          <Skeleton width={hero ? 96 : 52} height={hero ? 44 : 20} radius="var(--radius-md)" />
          <Skeleton width={hero ? '52%' : '64%'} height={hero ? 46 : 22} radius="var(--radius-sm)" />
          <Skeleton width={hero ? '68%' : '42%'} height={20} />
          <Skeleton width={148} height={14} />
        </div>)}
      </div>
    );
  }

  if (error) {
    return (
      <div style={shell} role="status">
        {layer(<><span className="ub-eyebrow">{c.eyebrow}</span>
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginTop: 12 }}>
          <Icon name="triangle-alert" size={24} style={{ color: 'var(--status-warning-text)', marginTop: 2 }} />
          <div>
            <div style={{ fontSize: 'var(--text-md)', fontWeight: 'var(--weight-semibold)' }}>{c.noData}</div>
            <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginTop: 2 }}>{hours}</div>
          </div>
        </div></>)}
      </div>
    );
  }

  if (closed) {
    return (
      <div style={shell}>
        {aura}
        {layer(<><div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
          <span className="ub-eyebrow">{c.eyebrow}</span>
          <Icon name="clock" size={18} style={{ color: 'var(--text-muted)' }} />
        </div>
        <div style={{ textAlign: hero ? 'center' : 'left', marginTop: hero ? 18 : 8 }}>
          <div style={{ fontSize: s.word, lineHeight: 'var(--leading-tight)', letterSpacing: 'var(--tracking-display)', fontWeight: 'var(--weight-bold)', color: 'var(--crowd-closed-text)' }}>
            {c.closedTitle}
          </div>
          <div style={{ fontSize: s.wait, color: 'var(--text-primary)', fontWeight: 'var(--weight-medium)', marginTop: 6 }}>{c.closedNext(opensAtLabel)}</div>
          <div className="ub-numeric" style={{ fontSize: s.meta, color: 'var(--text-muted)', marginTop: 10 }}>{hours}</div>
        </div></>)}
      </div>
    );
  }

  if (!hero) {
    return (
      <div style={shell}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <PersonMeter level={level} size={s.glyph} align="flex-start" />
          <div style={{ minWidth: 0 }}>
            <div key={level} className="ub-crowd-word" style={{ fontSize: s.word, fontWeight: 'var(--weight-bold)', letterSpacing: 'var(--tracking-tight)', color: t.text, lineHeight: 1.1 }}>{c[level]}</div>
            <div className="ub-numeric" style={{ fontSize: s.wait, color: 'var(--text-secondary)' }}>{c.waitShort(waitMinutes)}</div>
          </div>
          <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
            <QualityBadge quality={quality} lang={lang} />
            <div style={{ marginTop: 4 }}><FreshnessStamp seconds={updatedSecondsAgo} quality={quality} lang={lang} size={s.meta} /></div>
          </div>
        </div>
        <style>{`.ub-crowd-word{animation:ub-crowd-in var(--motion-slow) var(--ease-out)}@keyframes ub-crowd-in{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}@media (prefers-reduced-motion:reduce){.ub-crowd-word{animation:none}}`}</style>
      </div>
    );
  }

  return (
    <div style={shell}>
      {aura}
      {layer(<><div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <span className="ub-eyebrow">{c.eyebrow}</span>
        <QualityBadge quality={quality} lang={lang} />
      </div>

      <div style={{ textAlign: 'center', marginTop: size === 'kiosk' ? 24 : 16 }}>
        <PersonMeter level={level} size={s.glyph} />
        <div key={level} className="ub-crowd-word" style={{
          fontSize: s.word, lineHeight: 'var(--leading-tight)', letterSpacing: 'var(--tracking-display)',
          fontWeight: 'var(--weight-bold)', color: t.text, marginTop: size === 'kiosk' ? 16 : 8,
        }}>{c[level]}</div>
        <div className="ub-numeric" style={{ fontSize: s.wait, color: 'var(--text-primary)', fontWeight: 'var(--weight-medium)', marginTop: 4 }}>
          {c.wait(waitMinutes)}
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginTop: size === 'kiosk' ? 28 : 18 }}>
        <FreshnessStamp seconds={updatedSecondsAgo} quality={quality} lang={lang} size={s.meta} />
        {onReport && size !== 'kiosk' && (
          <button onClick={onReport} className="ub-crowd-report" style={{
            background: 'transparent', border: 0, padding: '6px 2px', minHeight: 'auto',
            color: 'var(--accent)', fontSize: s.meta, fontWeight: 'var(--weight-semibold)', cursor: 'pointer', whiteSpace: 'nowrap',
          }}>{c.report}</button>
        )}
      </div></>)}

      <style>{`
        .ub-aura{opacity:.16;filter:blur(46px);transition:transform var(--motion-slow) var(--ease-out),background var(--motion-slow) var(--ease-out)}
        :root[data-theme="dark"] .ub-aura{opacity:.3}
        @media (prefers-color-scheme:dark){:root:not([data-theme="light"]) .ub-aura{opacity:.3}}
        .ub-aura.ub-aura--glass{opacity:.42;filter:blur(34px)}
        :root[data-theme="dark"] .ub-aura.ub-aura--glass{opacity:.62}
        @media (prefers-color-scheme:dark){:root:not([data-theme="light"]) .ub-aura.ub-aura--glass{opacity:.62}}
        .ub-crowd-word{animation:ub-crowd-in var(--motion-slow) var(--ease-out)}
        @keyframes ub-crowd-in{from{opacity:0;transform:translateY(8px) scale(.96)}to{opacity:1;transform:none}}
        .ub-crowd-report:hover{text-decoration:underline;text-underline-offset:3px}
        @media (prefers-reduced-motion:reduce){.ub-crowd-word{animation:none}.ub-aura{transition:none}}
      `}</style>
    </div>
  );
}
