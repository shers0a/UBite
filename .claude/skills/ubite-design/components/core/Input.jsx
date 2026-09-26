import React from 'react';
import { Icon } from '../icons/Icon.jsx';

/* 16px minimum font size, always — below that iOS zooms the field on focus. */

export function Input({
  label, value, onChange, placeholder, hint, error, disabled = false, loading = false,
  type = 'text', suffix, icon, id, inputMode, lang = 'ro', ...rest
}) {
  const fid = id || `ub-${Math.random().toString(36).slice(2, 8)}`;
  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {label && (
          <label htmlFor={fid} style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)', color: 'var(--text-secondary)' }}>
            {label}
          </label>
        )}
        <div className="ub-field" style={{
          display: 'flex', alignItems: 'center', gap: 8, height: 48, padding: '0 12px',
          background: 'var(--surface-raised)', borderRadius: 'var(--radius-sm)',
          boxShadow: `inset 0 0 0 ${error ? 2 : 1}px ${error ? 'var(--status-danger-fill)' : 'var(--border-subtle)'}`,
          opacity: disabled ? 0.5 : 1,
          transition: 'box-shadow var(--motion-fast) var(--ease-out)',
        }}>
          {icon && <Icon name={icon} size={18} style={{ color: 'var(--text-muted)' }} />}
          <input id={fid} type={type} value={value} onChange={onChange} placeholder={placeholder}
            disabled={disabled} inputMode={inputMode} aria-invalid={!!error}
            aria-describedby={error || hint ? `${fid}-msg` : undefined}
            style={{
              flex: 1, minWidth: 0, border: 0, outline: 'none', background: 'transparent',
              fontSize: 'var(--text-base)', color: 'var(--text-primary)', height: '100%',
            }} {...rest} />
          {loading && <Icon name="loader-circle" size={16} style={{ color: 'var(--text-muted)', animation: 'ub-spin 900ms linear infinite' }} />}
          {suffix && <span className="ub-numeric" style={{ fontSize: 'var(--text-base)', color: 'var(--text-muted)' }}>{suffix}</span>}
        </div>
        {(error || hint) && (
          <span id={`${fid}-msg`} style={{
            display: 'flex', alignItems: 'center', gap: 6, fontSize: 'var(--text-sm)',
            color: error ? 'var(--status-danger-text)' : 'var(--text-muted)',
          }}>
            {error && <Icon name="circle-alert" size={14} stroke={2.25} />}
            {error || hint}
          </span>
        )}
      </div>
      <style>{`.ub-field:focus-within{box-shadow:inset 0 0 0 2px var(--accent),0 0 0 3px var(--focus-ring)}@keyframes ub-spin{to{transform:rotate(360deg)}}`}</style>
    </>
  );
}

export function Skeleton({ width = '100%', height = 16, radius = 'var(--radius-xs)', style }) {
  return (
    <>
      <div className="ub-skel" aria-hidden="true" style={{ width, height, borderRadius: radius, background: 'var(--skeleton-base)', flex: 'none', ...style }} />
      <style>{`
        .ub-skel{position:relative;overflow:hidden}
        .ub-skel::after{content:"";position:absolute;inset:0;transform:translateX(-100%);background:linear-gradient(90deg,transparent,var(--skeleton-sheen),transparent);animation:ub-sheen var(--skeleton-cycle) var(--ease-in-out) infinite}
        @media (prefers-reduced-motion:reduce){.ub-skel::after{animation:none;display:none}}
        @keyframes ub-sheen{0%{transform:translateX(-100%)}60%,100%{transform:translateX(100%)}}
      `}</style>
    </>
  );
}
