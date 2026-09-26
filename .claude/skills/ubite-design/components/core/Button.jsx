import React from 'react';
import { Icon } from '../icons/Icon.jsx';

const SIZES = {
  sm: { fontSize: 'var(--text-sm)', padding: '0 12px', height: 36, gap: 6 },
  md: { fontSize: 'var(--text-base)', padding: '0 16px', height: 44, gap: 8 },
  lg: { fontSize: 'var(--text-md)', padding: '0 22px', height: 52, gap: 10 },
  kiosk: { fontSize: 'var(--text-xl)', padding: '0 32px', height: 72, gap: 12 },
};

const VARIANTS = {
  primary: { background: 'var(--accent)', color: 'var(--text-on-accent)' },
  secondary: { background: 'var(--accent-quiet)', color: 'var(--accent-quiet-text)' },
  quiet: { background: 'transparent', color: 'var(--text-secondary)' },
  danger: { background: 'var(--status-danger-fill)', color: '#FFFFFF' },
};

export function Button({
  children, variant = 'primary', size = 'md', iconLeft, iconRight,
  loading = false, disabled = false, error = false, fullWidth = false,
  type = 'button', onClick, style, ...rest
}) {
  const s = SIZES[size] || SIZES.md;
  const v = VARIANTS[variant] || VARIANTS.primary;
  const off = disabled || loading;
  return (
    <>
      <button
        type={type} onClick={off ? undefined : onClick} disabled={off}
        aria-busy={loading || undefined}
        className={`ub-btn ub-btn--${variant}`}
        style={{
          ...v, ...s, minHeight: s.height,
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          width: fullWidth ? '100%' : undefined,
          border: 0, borderRadius: 'var(--radius-sm)', cursor: off ? 'not-allowed' : 'pointer',
          fontWeight: 'var(--weight-semibold)', letterSpacing: '.005em',
          opacity: disabled ? 0.45 : 1,
          boxShadow: error ? 'inset 0 0 0 2px var(--status-danger-fill)' : undefined,
          transition: 'background var(--motion-fast) var(--ease-out), transform var(--motion-fast) var(--ease-out)',
          ...style,
        }}
        {...rest}
      >
        {loading
          ? <Icon name="loader-circle" size={size === 'sm' ? 16 : 18} style={{ animation: 'ub-spin 900ms linear infinite', marginRight: s.gap }} />
          : iconLeft && <Icon name={iconLeft} size={size === 'sm' ? 16 : 18} style={{ marginRight: s.gap }} />}
        <span>{children}</span>
        {iconRight && !loading && <Icon name={iconRight} size={size === 'sm' ? 16 : 18} style={{ marginLeft: s.gap }} />}
      </button>
      <style>{`
        @keyframes ub-spin{to{transform:rotate(360deg)}}
        .ub-btn:not(:disabled):hover.ub-btn--primary{background:var(--accent-hover)}
        .ub-btn:not(:disabled):active.ub-btn--primary{background:var(--accent-active);transform:translateY(1px)}
        .ub-btn:not(:disabled):hover.ub-btn--secondary{background:color-mix(in oklab,var(--accent-quiet) 84%,var(--text-primary))}
        .ub-btn:not(:disabled):active.ub-btn--secondary{transform:translateY(1px)}
        .ub-btn:not(:disabled):hover.ub-btn--quiet{background:var(--hover-wash);color:var(--text-primary)}
        .ub-btn:not(:disabled):active.ub-btn--quiet{background:var(--active-wash)}
        .ub-btn:not(:disabled):hover.ub-btn--danger{filter:brightness(1.08)}
        @media (prefers-reduced-motion:reduce){.ub-btn{transition:none}.ub-btn:active{transform:none}}
      `}</style>
    </>
  );
}

export function IconButton({ name, label, size = 'md', variant = 'quiet', onClick, disabled, style, ...rest }) {
  const box = size === 'sm' ? 36 : size === 'lg' ? 52 : 44;
  const v = VARIANTS[variant] || VARIANTS.quiet;
  return (
    <button
      type="button" onClick={onClick} disabled={disabled} aria-label={label}
      className={`ub-btn ub-btn--${variant}`}
      style={{
        ...v, width: box, height: box, minHeight: box, display: 'inline-flex',
        alignItems: 'center', justifyContent: 'center', border: 0,
        borderRadius: 'var(--radius-sm)', cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.45 : 1, padding: 0,
        transition: 'background var(--motion-fast) var(--ease-out)', ...style,
      }}
      {...rest}
    >
      <Icon name={name} size={size === 'sm' ? 18 : size === 'lg' ? 26 : 20} />
    </button>
  );
}
