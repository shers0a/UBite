import React from 'react';
import { Logo } from './Logo.jsx';

/* The UBite lockup as a drop-in: the tray-U followed directly by "Bite" (logo A, chosen by the
   team on 22 Sep 2026), drawn by Logo. `mark` is the app-icon tile — the same lockup in the
   on-accent colour on a solid accent square, as on the phone's home screen.
   If the University later supplies a mandated mark, it goes beside this, not inside it. */

export function Wordmark({ size = 28, variant = 'full', tone = 'accent', style }) {
  if (variant === 'mark') {
    return (
      <span aria-label="UBite" role="img" style={{
        display: 'inline-grid', placeItems: 'center', flex: 'none',
        width: size, height: size, borderRadius: Math.round(size * 0.22),
        background: tone === 'mono' ? 'var(--text-primary)' : 'var(--accent)', ...style,
      }}>
        <Logo variant="tray" size={Math.round(size * 0.27)} tone={tone === 'mono' ? 'inverse' : 'on-accent'} withText />
      </span>
    );
  }
  if (variant === 'inline') {
    return (
      <span style={{ fontSize: Math.round(size * 0.62), fontWeight: 700, letterSpacing: '-.035em', ...style }}>
        <span style={{ color: tone === 'mono' ? 'inherit' : 'var(--accent)' }}>U</span>
        <span style={{ color: tone === 'inverse' ? 'var(--text-inverse)' : 'inherit' }}>Bite</span>
      </span>
    );
  }
  // `size` keeps its old meaning (the height of the type box); the lockup's cap height matches it.
  return <Logo variant="tray" size={Math.round(size * 0.9)} tone={tone} withText style={style} />;
}
