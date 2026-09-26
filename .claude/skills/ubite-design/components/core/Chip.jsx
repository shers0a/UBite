import React from 'react';
import { Icon } from '../icons/Icon.jsx';

/* Chip = a filter the user can toggle. Badge = a read-only status marker.
   They look different on purpose: a chip is tappable (44px target), a badge is not. */

export function Chip({ children, selected = false, disabled = false, icon, count, onClick, size = 'md' }) {
  const h = size === 'sm' ? 32 : 40;
  return (
    <>
      <button type="button" onClick={disabled ? undefined : onClick} disabled={disabled}
        aria-pressed={selected} className="ub-chip"
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 7, height: h, minHeight: h,
          padding: size === 'sm' ? '0 10px' : '0 14px', borderRadius: 'var(--radius-pill)',
          border: 0, cursor: disabled ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap',
          fontSize: size === 'sm' ? 'var(--text-sm)' : 'var(--text-base)',
          fontWeight: 'var(--weight-medium)', opacity: disabled ? 0.45 : 1,
          background: selected ? 'var(--accent)' : 'var(--surface-raised)',
          color: selected ? 'var(--text-on-accent)' : 'var(--text-secondary)',
          boxShadow: selected ? 'none' : 'inset 0 0 0 1px var(--border-subtle)',
          transition: 'background var(--motion-fast) var(--ease-out), color var(--motion-fast) var(--ease-out)',
        }}>
        {icon && <Icon name={icon} size={16} />}
        {children}
        {count != null && <span className="ub-numeric" style={{ fontSize: 'var(--text-xs)', opacity: .75 }}>{count}</span>}
        {selected && <Icon name="x" size={14} />}
      </button>
      <style>{`.ub-chip:not(:disabled):hover{background:var(--hover-wash)}.ub-chip[aria-pressed="true"]:hover{background:var(--accent-hover)}.ub-chip:not(:disabled):active{transform:translateY(1px)}@media (prefers-reduced-motion:reduce){.ub-chip{transition:none}.ub-chip:active{transform:none}}`}</style>
    </>
  );
}

const BADGE_TONES = {
  neutral: { bg: 'var(--surface-sunken)', fg: 'var(--text-secondary)' },
  accent: { bg: 'var(--accent-quiet)', fg: 'var(--accent-quiet-text)' },
  low: { bg: 'var(--crowd-low-quiet)', fg: 'var(--crowd-low-text)' },
  moderate: { bg: 'var(--crowd-moderate-quiet)', fg: 'var(--crowd-moderate-text)' },
  high: { bg: 'var(--crowd-high-quiet)', fg: 'var(--crowd-high-text)' },
  warning: { bg: 'var(--status-warning-quiet)', fg: 'var(--status-warning-text)' },
  danger: { bg: 'var(--status-danger-quiet)', fg: 'var(--status-danger-text)' },
  success: { bg: 'var(--status-success-quiet)', fg: 'var(--status-success-text)' },
};

export function Badge({ children, tone = 'neutral', icon, size = 'md' }) {
  const t = BADGE_TONES[tone] || BADGE_TONES.neutral;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: size === 'sm' ? '2px 7px' : '3px 9px', borderRadius: 'var(--radius-xs)',
      background: t.bg, color: t.fg, fontSize: size === 'sm' ? 'var(--text-2xs)' : 'var(--text-xs)',
      fontWeight: 'var(--weight-semibold)', letterSpacing: '.01em', whiteSpace: 'nowrap',
    }}>
      {icon && <Icon name={icon} size={13} stroke={2.25} />}
      {children}
    </span>
  );
}

/* Dietary information is a claim about food safety: it always carries a word,
   never a colour or a glyph alone. The first six kinds are the docs/05 `dish_diet_tags`;
   they originate from the canteen, never from the team. */
export function DietaryTag({ kind = 'vegetarian', lang = 'ro', size = 'md' }) {
  const MAP = {
    vegetarian: { icon: 'leaf', ro: 'Vegetarian', en: 'Vegetarian' },
    vegan: { icon: 'salad', ro: 'Vegan', en: 'Vegan' },
    fasting: { icon: 'sprout', ro: 'De post', en: 'Fasting' },
    no_pork: { icon: 'ban', ro: 'Fără porc', en: 'No pork' },
    gluten_free: { icon: 'wheat-off', ro: 'Fără gluten', en: 'Gluten-free' },
    lactose_free: { icon: 'milk-off', ro: 'Fără lactoză', en: 'Lactose-free' },
    gluten: { icon: 'wheat', ro: 'Conține gluten', en: 'Contains gluten' },
    lactose: { icon: 'milk', ro: 'Conține lactoză', en: 'Contains lactose' },
    egg: { icon: 'egg', ro: 'Conține ou', en: 'Contains egg' },
    fish: { icon: 'fish', ro: 'Conține pește', en: 'Contains fish' },
    pork: { icon: 'utensils', ro: 'Conține porc', en: 'Contains pork' },
    unknown: { icon: 'circle-alert', ro: 'Informație indisponibilă', en: 'Information not available' },
  };
  const m = MAP[kind] || MAP.unknown;
  const tone = kind === 'vegetarian' || kind === 'vegan' || kind === 'fasting' ? 'success' : kind === 'unknown' ? 'warning' : 'neutral';
  return <Badge tone={tone} icon={m.icon} size={size}>{m[lang] || m.ro}</Badge>;
}
