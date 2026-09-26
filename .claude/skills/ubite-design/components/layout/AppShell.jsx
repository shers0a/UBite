import React from 'react';
import { Icon } from '../icons/Icon.jsx';
import { Wordmark } from '../brand/Wordmark.jsx';

/* The app is one scrolling surface. There are no tabs over content: navigation moves you
   between the app, your account and the staff tools — never between parts of the menu. */

export function AppHeader({ title, onBack, right, lang = 'ro', sticky = true, brand, transparent = false }) {
  return (
    <header style={{
      position: sticky ? 'sticky' : 'static', top: 0, zIndex: 20,
      display: 'flex', alignItems: 'center', gap: 10, minHeight: 56,
      // transparent: over a photo (the home hall), which then shows behind the brand and buttons.
      padding: '8px 16px', background: transparent ? 'transparent' : 'var(--surface-page)',
    }}>
      {onBack ? (
        <button type="button" onClick={onBack} aria-label={lang === 'ro' ? 'Înapoi' : 'Back'} className="ub-hbtn"
          style={{ width: 44, height: 44, marginLeft: -10, display: 'grid', placeItems: 'center', background: 'transparent', border: 0, borderRadius: 'var(--radius-sm)', cursor: 'pointer', color: 'var(--text-primary)' }}>
          <Icon name="chevron-left" size={22} />
        </button>
      ) : (brand || <Wordmark size={26} />)}
      {title && <h1 style={{ fontSize: 'var(--text-md)', fontWeight: 'var(--weight-semibold)', flex: 1, minWidth: 0 }}>{title}</h1>}
      <div style={{ marginLeft: 'auto', display: 'flex', gap: 4 }}>{right}</div>
      <style>{`.ub-hbtn:hover{background:var(--hover-wash)}`}</style>
    </header>
  );
}

/* `links` replaces the three default labels with real destinations: { label, href, onClick }.
   `hoursLabel` carries the configured schedule; the copy below is the confirmed default. */
export function AppFooter({ lang = 'ro', onLang, links, hoursLabel }) {
  const t = lang === 'ro'
    ? { hours: 'L–V 11:30–17:00', addr: 'Bd. Mihail Kogălniceanu 36–46, sector 5', links: ['Trimite feedback', 'Confidențialitate', 'Contul meu'], lang: 'English' }
    : { hours: 'Mon–Fri 11:30–17:00', addr: 'Bd. Mihail Kogălniceanu 36–46, sector 5', links: ['Send feedback', 'Privacy', 'My account'], lang: 'Română' };
  const items = links || t.links.map((label) => ({ label, href: '#' }));
  return (
    <footer style={{ padding: '20px 16px 32px', display: 'flex', flexDirection: 'column', gap: 6, fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <Icon name="clock" size={15} /><span className="ub-numeric">{hoursLabel || t.hours}</span>
      </div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
        <Icon name="map-pin" size={15} style={{ marginTop: 2 }} /><span>{t.addr}</span>
      </div>
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginTop: 6 }}>
        {items.map((l) => (
          <a key={l.label} href={l.href || '#'} style={{ fontSize: 'var(--text-sm)' }}
            onClick={l.onClick ? (e) => { e.preventDefault(); l.onClick(); } : undefined}>{l.label}</a>
        ))}
        <button type="button" onClick={onLang} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'transparent', border: 0, color: 'var(--accent)', cursor: 'pointer', fontSize: 'var(--text-sm)', minHeight: 'auto', padding: 0, textDecoration: 'underline', textUnderlineOffset: 2 }}>
          <Icon name="languages" size={15} />{t.lang}
        </button>
      </div>
    </footer>
  );
}

export function Announcement({ title, body, date, tone = 'neutral' }) {
  const bg = tone === 'warning' ? 'var(--status-warning-quiet)' : 'var(--surface)';
  const fg = tone === 'warning' ? 'var(--status-warning-text)' : 'var(--text-primary)';
  return (
    <div style={{ display: 'flex', gap: 10, padding: 12, background: bg, borderRadius: 'var(--radius-sm)' }}>
      <Icon name={tone === 'warning' ? 'triangle-alert' : 'info'} size={17} style={{ color: fg, marginTop: 2, flex: 'none' }} />
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--weight-semibold)', color: fg }}>{title}</div>
        {body && <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginTop: 2 }}>{body}</p>}
        {date && <div className="ub-numeric" style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginTop: 4 }}>{date}</div>}
      </div>
    </div>
  );
}

/* `fixed` pins the sheet to the viewport instead of a positioned parent — the production app
   scrolls the document, the UI kits scroll a phone frame. It stays phone-width on a desktop. */
export function Sheet({ open = true, title, children, onClose, lang = 'ro', fixed = false }) {
  if (!open) return null;
  const pos = fixed ? 'fixed' : 'absolute';
  return (
    <>
      <div className="ub-sheet-scrim" style={{ position: pos, inset: 0, background: 'var(--surface-overlay)', zIndex: 40 }} onClick={onClose} />
      <div role="dialog" aria-modal="true" aria-label={title} className="ub-sheet" style={{
        position: pos, left: 0, right: 0, bottom: 0, zIndex: 41,
        margin: fixed ? '0 auto' : undefined, maxWidth: fixed ? 'var(--max-phone)' : undefined,
        background: 'var(--surface-raised)', borderRadius: 'var(--radius-lg) var(--radius-lg) 0 0',
        padding: 20, boxShadow: 'var(--shadow-overlay)', maxHeight: '86%', overflowY: 'auto',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
          <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-semibold)', flex: 1 }}>{title}</h2>
          <button type="button" onClick={onClose} aria-label={lang === 'ro' ? 'Închide' : 'Close'} className="ub-hbtn"
            style={{ width: 44, height: 44, marginRight: -8, display: 'grid', placeItems: 'center', background: 'transparent', border: 0, borderRadius: 'var(--radius-sm)', cursor: 'pointer', color: 'var(--text-secondary)' }}>
            <Icon name="x" size={20} />
          </button>
        </div>
        {children}
      </div>
      <style>{`
        .ub-sheet{animation:ub-sheet-up var(--motion-slow) var(--ease-out)}
        .ub-sheet-scrim{animation:ub-fade var(--motion-base) var(--ease-out)}
        @keyframes ub-sheet-up{from{transform:translateY(16px);opacity:.6}to{transform:none;opacity:1}}
        @keyframes ub-fade{from{opacity:0}to{opacity:1}}
        @media (prefers-reduced-motion:reduce){.ub-sheet,.ub-sheet-scrim{animation:none}}
      `}</style>
    </>
  );
}

export function Toast({ message, tone = 'neutral', icon, action, onAction }) {
  const bg = tone === 'success' ? 'var(--status-success-quiet)' : tone === 'danger' ? 'var(--status-danger-quiet)' : 'var(--surface-inverse)';
  const fg = tone === 'success' ? 'var(--status-success-text)' : tone === 'danger' ? 'var(--status-danger-text)' : 'var(--text-inverse)';
  return (
    <div role="status" style={{
      display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px',
      background: bg, color: fg, borderRadius: 'var(--radius-sm)', fontSize: 'var(--text-base)',
      boxShadow: 'var(--shadow-overlay)',
    }}>
      {icon && <Icon name={icon} size={18} stroke={2.25} />}
      <span style={{ flex: 1 }}>{message}</span>
      {action && (
        <button type="button" onClick={onAction} style={{ background: 'transparent', border: 0, color: 'inherit', fontWeight: 'var(--weight-semibold)', textDecoration: 'underline', textUnderlineOffset: 3, cursor: 'pointer', minHeight: 'auto', padding: 0 }}>{action}</button>
      )}
    </div>
  );
}

/* The page wrapper every screen sits in: one scrolling surface, phone-width, themed. */
export function AppShell({ children, header, footer, maxWidth = 'var(--max-phone)', style }) {
  return (
    <div style={{ background: 'var(--surface-page)', color: 'var(--text-primary)', minHeight: '100%', display: 'flex', flexDirection: 'column', ...style }}>
      {header}
      <main style={{ flex: 1, width: '100%', maxWidth, margin: '0 auto' }}>{children}</main>
      {footer}
    </div>
  );
}
