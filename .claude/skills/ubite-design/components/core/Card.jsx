import React from 'react';
import { Icon } from '../icons/Icon.jsx';

/* Separation is by surface VALUE, never by border or shadow.
   Exactly two elevations exist: 1 = --surface (sections, rows), 2 = --surface-raised
   (the crowding hero, sheets). Anything that needs a third level needs rethinking. */

export function Card({ children, elevation = 1, padding = 'md', radius = 'md', as = 'div', style, ...rest }) {
  const Tag = as;
  const pad = { none: 0, sm: 12, md: 16, lg: 20, xl: 28 }[padding] ?? 16;
  return (
    <Tag style={{
      background: elevation === 2 ? 'var(--surface-raised)' : 'var(--surface)',
      borderRadius: radius === 'lg' ? 'var(--radius-lg)' : radius === 'sm' ? 'var(--radius-sm)' : 'var(--radius-md)',
      padding: pad, ...style,
    }} {...rest}>{children}</Tag>
  );
}

export function SectionHeader({ title, meta, icon, action, density = 'zone-2' }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12,
      marginBottom: `var(--density-${density})`,
    }}>
      <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-semibold)', letterSpacing: 'var(--tracking-tight)', display: 'flex', alignItems: 'center', gap: 8 }}>
        {icon && <Icon name={icon} size={18} style={{ color: 'var(--text-muted)' }} />}{title}
      </h2>
      {meta && <span className="ub-numeric" style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>{meta}</span>}
      {action}
    </div>
  );
}
