import React from 'react';
import { Icon } from '../icons/Icon.jsx';
import { Button } from '../core/Button.jsx';

/* Every screen defines loading, empty, stale, offline and error. These are those states. */

/* `art` is a line illustration (an SVG from assets/illustrations/). It is drawn through a CSS
   mask so it takes the accent colour and follows the theme; without it the icon stands in. */
export function EmptyState({ icon = 'utensils', art, title, body, action, onAction, compact = false }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 8,
      padding: compact ? '20px 16px' : '32px 20px', background: 'var(--surface)',
      borderRadius: 'var(--radius-md)',
    }}>
      {art ? (
        <span aria-hidden="true" style={{
          width: compact ? 96 : 136, height: compact ? 96 : 136, marginBottom: 4, background: 'var(--accent)',
          WebkitMask: `url(${art}) center / contain no-repeat`, mask: `url(${art}) center / contain no-repeat`,
        }} />
      ) : <Icon name={icon} size={compact ? 22 : 28} style={{ color: 'var(--text-muted)', marginBottom: 4 }} />}
      <div style={{ fontSize: compact ? 'var(--text-base)' : 'var(--text-md)', fontWeight: 'var(--weight-semibold)' }}>{title}</div>
      {body && <p style={{ fontSize: 'var(--text-base)', color: 'var(--text-secondary)', maxWidth: '46ch' }}>{body}</p>}
      {action && <div style={{ marginTop: 8 }}><Button variant="secondary" size="sm" onClick={onAction}>{action}</Button></div>}
    </div>
  );
}

export function OfflineBanner({ lang = 'ro', updatedLabel, variant = 'offline', onRetry, queued }) {
  const t = lang === 'ro'
    ? { offline: 'Ești offline. Arătăm ce am salvat ultima dată.', stale: 'Datele sunt vechi.',
        error: 'Nu am putut încărca. Încearcă din nou.', retry: 'Reîncarcă', queuedLabel: (n) => `${n} acțiuni trimise când revine semnalul` }
    : { offline: 'You are offline. Showing what we last saved.', stale: 'This data is old.',
        error: 'We could not load that. Try again.', retry: 'Reload', queuedLabel: (n) => `${n} actions will be sent when you are back online` };
  const tone = variant === 'error'
    ? { bg: 'var(--status-danger-quiet)', fg: 'var(--status-danger-text)', icon: 'triangle-alert' }
    : variant === 'stale'
      ? { bg: 'var(--status-warning-quiet)', fg: 'var(--status-warning-text)', icon: 'clock' }
      : { bg: 'var(--status-offline-fill)', fg: 'var(--status-offline-text)', icon: 'wifi-off' };
  return (
    <div role="status" style={{
      display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px',
      background: tone.bg, color: tone.fg, borderRadius: 'var(--radius-sm)',
      fontSize: 'var(--text-sm)', flexWrap: 'wrap',
    }}>
      <Icon name={tone.icon} size={17} stroke={2.25} />
      <span style={{ flex: 1, minWidth: '14ch' }}>
        {t[variant] || t.offline}
        {updatedLabel && <span className="ub-numeric" style={{ opacity: .85 }}> {updatedLabel}</span>}
        {queued != null && <span style={{ display: 'block', opacity: .85 }}>{t.queuedLabel(queued)}</span>}
      </span>
      {onRetry && (
        <button type="button" onClick={onRetry} style={{
          background: 'transparent', border: 0, color: 'inherit', textDecoration: 'underline',
          textUnderlineOffset: 3, fontWeight: 'var(--weight-semibold)', cursor: 'pointer',
          fontSize: 'var(--text-sm)', minHeight: 'auto', padding: '4px 0',
        }}>{t.retry}</button>
      )}
    </div>
  );
}

/* Zone 4: one interaction, then straight back to where the user was. */
export function WaitReport({ options = [2, 5, 10, 15], lang = 'ro', onSubmit, state = 'idle' }) {
  const t = lang === 'ro'
    ? { q: 'Cât ai așteptat?', other: 'Altă durată', thanks: 'Mulțumim. Estimarea s-a actualizat.', sending: 'Se trimite…', min: 'min' }
    : { q: 'How long did you wait?', other: 'Another time', thanks: 'Thanks. The estimate just moved.', sending: 'Sending…', min: 'min' };
  if (state === 'done') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px', background: 'var(--status-success-quiet)', color: 'var(--status-success-text)', borderRadius: 'var(--radius-md)', fontSize: 'var(--text-base)' }}>
        <Icon name="circle-check" size={19} stroke={2.25} />{t.thanks}
      </div>
    );
  }
  return (
    <>
      <div style={{ padding: 16, background: 'var(--surface)', borderRadius: 'var(--radius-md)' }}>
        <div style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--weight-semibold)', marginBottom: 12 }}>{t.q}</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {options.map((m) => (
            <button key={m} type="button" className="ub-wait" disabled={state === 'sending'}
              onClick={() => onSubmit && onSubmit(m)}
              style={{
                minWidth: 64, minHeight: 44, padding: '0 14px', borderRadius: 'var(--radius-sm)',
                border: 0, background: 'var(--surface-raised)', color: 'var(--text-primary)',
                boxShadow: 'inset 0 0 0 1px var(--border-subtle)', cursor: 'pointer',
                fontSize: 'var(--text-base)', fontWeight: 'var(--weight-semibold)',
                fontVariantNumeric: 'tabular-nums',
              }}>{m} {t.min}</button>
          ))}
          <button type="button" className="ub-wait" onClick={() => onSubmit && onSubmit(null)}
            style={{
              minHeight: 44, padding: '0 14px', borderRadius: 'var(--radius-sm)', border: 0,
              background: 'transparent', color: 'var(--accent)', cursor: 'pointer',
              fontSize: 'var(--text-base)', fontWeight: 'var(--weight-semibold)',
            }}>{state === 'sending' ? t.sending : t.other}</button>
        </div>
      </div>
      <style>{`.ub-wait:hover:not(:disabled){background:var(--hover-wash)}.ub-wait:active:not(:disabled){transform:translateY(1px)}@media (prefers-reduced-motion:reduce){.ub-wait:active{transform:none}}`}</style>
    </>
  );
}

/* Zone 5: typical crowding by hour. Hidden entirely in pilot week one —
   a flat, wrong chart costs more trust than an absent section.
   `coloured` (the crowding card's strip): every bar takes its own level's colour — by the
   estimate's `thresholds` in minutes when given — the hours still to come are dimmer, and the
   current one is ringed. The height carries the minutes, the colour only repeats them, and
   `summary` says it in words for a screen reader. */
export function CrowdingByHour({ data = [], nowIndex, lang = 'ro', height = 72, labelEvery, coloured = false, thresholds, summary }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  // A whole opening day is ten or eleven half-hours: at 400px only every other label fits. The
  // current slot always keeps its label; its neighbours give way so the two never touch.
  const every = labelEvery || (data.length > 8 ? 2 : 1);
  const showLabel = (i) => i === nowIndex || (i % every === 0 && (nowIndex == null || Math.abs(i - nowIndex) >= every));
  const levelOf = (v) => (thresholds
    ? (v >= thresholds.high ? 'high' : v >= thresholds.low ? 'moderate' : 'low')
    : (v / max > 0.66 ? 'high' : v / max > 0.33 ? 'moderate' : 'low'));
  return (
    <div role={summary ? 'img' : undefined} aria-label={summary}>
      <div aria-hidden={summary ? true : undefined} style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height }}>
        {data.map((d, i) => {
          const share = d.value / max;
          const tone = `var(--crowd-${levelOf(d.value)}-fill)`;
          const now = i === nowIndex;
          const later = nowIndex != null && i > nowIndex;
          return (
            <div key={d.label} style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', height: '100%' }}>
              <div title={`${d.label} · ${d.value} min`} style={coloured ? {
                height: `${Math.max(10, share * 100)}%`, background: tone, opacity: later ? 0.45 : 1, borderRadius: 'var(--radius-xs)',
                outline: now ? 'var(--focus-width) solid var(--text-primary)' : undefined, outlineOffset: now ? 2 : undefined,
              } : {
                height: `${Math.max(8, share * 100)}%`, background: now ? tone : 'var(--border-strong)',
                opacity: now ? 1 : 0.55, borderRadius: 'var(--radius-xs)',
              }} />
            </div>
          );
        })}
      </div>
      <div className="ub-numeric" aria-hidden={summary ? true : undefined} style={{ display: 'flex', gap: 4, marginTop: 6 }}>
        {data.map((d, i) => (
          <span key={d.label} style={{
            flex: 1, textAlign: 'center', fontSize: 'var(--text-2xs)',
            color: i === nowIndex ? 'var(--text-primary)' : 'var(--text-muted)',
            fontWeight: i === nowIndex ? 'var(--weight-semibold)' : 'var(--weight-regular)',
            whiteSpace: 'nowrap', minWidth: 0,
          }}>{showLabel(i) ? d.label : ''}</span>
        ))}
      </div>
    </div>
  );
}
