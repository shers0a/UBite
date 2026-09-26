/* A QR code drawn on the phone from data it already has — so the loyalty code works at the till
   with no signal (docs/09 "Loyalty QR"). Rendered as SVG in the text colour: it follows the theme. */
import React from 'react';
import QRCode from 'qrcode';

export function Qr({ value, label, size = 208 }: { value: string; label: string; size?: number }) {
  const [path, setPath] = React.useState<{ d: string; n: number } | null>(null);
  React.useEffect(() => {
    let live = true;
    try {
      const qr = QRCode.create(value, { errorCorrectionLevel: 'M' });
      const n = qr.modules.size;
      let d = '';
      for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if (qr.modules.get(y, x)) d += `M${x} ${y}h1v1h-1z`;
      if (live) setPath({ d, n });
    } catch { if (live) setPath(null); }
    return () => { live = false; };
  }, [value]);
  if (!path) return null;
  const quiet = 2;
  return (
    <svg role="img" aria-label={label} viewBox={`${-quiet} ${-quiet} ${path.n + quiet * 2} ${path.n + quiet * 2}`} width={size} height={size}
      shapeRendering="crispEdges">
      <rect x={-quiet} y={-quiet} width={path.n + quiet * 2} height={path.n + quiet * 2} style={{ fill: 'var(--qr-paper, var(--surface-raised))' }} />
      <path d={path.d} style={{ fill: 'var(--qr-ink, var(--text-primary))' }} />
    </svg>
  );
}
