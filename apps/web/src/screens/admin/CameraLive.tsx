/* The camera live view (docs/11, the live-view exception): the frame the counter just counted, with every
   person it found and the queue zone, so the tech team can check that it counts right. Frames stay in the
   API's memory for seconds and are never stored; the view closes itself after five minutes, and every
   opening is recorded (who, when). */
import React from 'react';
import type { LiveFrame, LiveViewState } from '@ubite/shared';
import { localDate } from '@ubite/shared';
import { Badge, Button, Chip, Skeleton } from '@ds';
import { apiGet, apiSend } from '../../api/client';
import { useNow } from '../../api/cache';
import { formatTime, useI18n } from '../../i18n';
import { useApp } from '../../state/app';
import { useL } from '../staff/common';

const POLL_MS = 2500;
const NO_FRAME_AFTER_MS = 15_000;

export function CameraLive() {
  const L = useL();
  const { lang } = useI18n();
  const { toast } = useApp();
  const [state, setState] = React.useState<LiveViewState | null>(null);
  const [openedAt, setOpenedAt] = React.useState<number | null>(null);
  const [ended, setEnded] = React.useState(false);
  const [boxes, setBoxes] = React.useState(true);
  const now = useNow(1000);
  const open = !!state?.open;

  React.useEffect(() => {
    apiGet<LiveViewState>('/admin/camera/live').then((s) => { setState(s); if (s.open) setOpenedAt(Date.now()); }).catch(() => setState(null));
  }, []);

  // While open: ask every 2.5 s (asking keeps the view open), only while the tab is visible.
  React.useEffect(() => {
    if (!open) return;
    let stop = false;
    const t = window.setInterval(() => {
      if (document.hidden || stop) return;
      apiGet<LiveViewState>('/admin/camera/live').then((s) => {
        if (stop) return;
        setState(s);
        if (!s.open) setEnded(true);
      }).catch(() => {});
    }, POLL_MS);
    return () => { stop = true; window.clearInterval(t); };
  }, [open]);

  // Leaving the screen closes the view at once instead of after 20 s.
  React.useEffect(() => () => { apiSend('DELETE', '/admin/camera/live').catch(() => {}); }, []);

  const start = async () => {
    try {
      const s = await apiSend<LiveViewState>('POST', '/admin/camera/live');
      setState(s); setOpenedAt(Date.now()); setEnded(false);
    } catch { toast(L('Nu am putut deschide imaginea live.', 'Could not open the live view.'), { tone: 'danger' }); }
  };
  const stop = async () => {
    await apiSend('DELETE', '/admin/camera/live').catch(() => {});
    setState(await apiGet<LiveViewState>('/admin/camera/live').catch(() => null));
    setOpenedAt(null);
  };

  const left = state?.closesAt ? Math.max(0, new Date(state.closesAt).getTime() - now) : 0;
  const mmss = `${Math.floor(left / 60_000)}:${String(Math.floor((left % 60_000) / 1000)).padStart(2, '0')}`;
  const when = (iso: string) => `${localDate(new Date(iso))} ${formatTime(iso, lang)}`;
  const waiting = open && state?.frames.length === 0;
  const silent = waiting && openedAt !== null && now - openedAt > NO_FRAME_AFTER_MS;

  return (
    <section className="ub-staff-card">
      <div className="ub-staff-section-title">
        <h2>{L('Camera, în direct', 'Camera, live')}</h2>
        {open && <Badge tone="accent">{L(`Se închide în ${mmss}`, `Closes in ${mmss}`)}</Badge>}
      </div>
      {!state ? <Skeleton width="100%" height={80} /> : !open ? (
        <div style={{ display: 'grid', gap: 'var(--space-3)' }}>
          {ended && <p className="ub-note" style={{ marginTop: 0 }}>{L('Imaginea live s-a închis după 5 minute.', 'The live view closed after 5 minutes.')}</p>}
          <p className="ub-note" style={{ marginTop: 0 }}>
            {L('Vezi imaginea pe care numărătoarea tocmai a numărat-o, cu fiecare persoană găsită și zona cozii. Imaginea stă doar în memoria serverului câteva secunde și nu se salvează nicăieri. Se închide singură după 5 minute. Fiecare deschidere se notează: cine și când.',
              'See the frame the counter just counted, with every person it found and the queue zone. The image stays in the server’s memory for a few seconds and is never saved. It closes itself after 5 minutes. Every opening is recorded: who and when.')}
          </p>
          <div><Button iconLeft="camera" onClick={start}>{L('Deschide imaginea live', 'Open the live view')}</Button></div>
          <Recent recent={state.recent} when={when} L={L} />
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 'var(--space-3)' }}>
          <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap', alignItems: 'center' }}>
            <Chip size="sm" selected={boxes} onClick={() => setBoxes(!boxes)}>{L('Arată detecțiile', 'Show detections')}</Chip>
            <span style={{ marginLeft: 'auto' }}><Button variant="secondary" size="sm" iconLeft="x" onClick={stop}>{L('Închide', 'Close')}</Button></span>
          </div>
          {waiting && (
            <p className="ub-note" style={{ marginTop: 0 }} role="status">
              {silent
                ? L('Informație indisponibilă: camera nu a trimis nicio imagine. Verifică dacă serviciul de numărare rulează.', 'Information unavailable: the camera has sent no image. Check that the counting service is running.')
                : L(`Aștept prima imagine. Camera trimite una la ${state.everySeconds} secunde.`, `Waiting for the first image. The camera sends one every ${state.everySeconds} seconds.`)}
            </p>
          )}
          <div className="ub-live-grid">
            {state.frames.map((f) => <Frame key={f.camera} frame={f} boxes={boxes} now={now} L={L} />)}
          </div>
          <Legend zone={state.frames.some((f) => f.zone)} hall={state.frames.some((f) => f.detections.some((d) => d.kind === 'hall'))} L={L} />
        </div>
      )}
    </section>
  );
}

function Frame({ frame: f, boxes, now, L }: { frame: LiveFrame; boxes: boolean; now: number; L: (ro: string, en: string) => string }) {
  const counted = f.detections.filter((d) => d.kind !== null).length;
  const seen = f.detections.length;
  const age = Math.max(0, Math.round((now - new Date(f.observedAt).getTime()) / 1000));
  const people = f.personCount ?? counted;
  const W = f.width, H = f.height;
  return (
    <figure className="ub-live-frame">
      <figcaption className="ub-live-caption">
        <strong>{f.camera}</strong>
        <span className="ub-numeric">{L(`${people} la coadă`, `${people} in the queue`)}</span>
        <span className="ub-numeric" style={{ color: 'var(--text-muted)' }}>{L(`${seen} văzute`, `${seen} seen`)}</span>
        <span className="ub-numeric" style={{ marginLeft: 'auto', color: 'var(--text-muted)' }}>{L(`acum ${age} s`, `${age} s ago`)}</span>
      </figcaption>
      <div className="ub-live-image">
        <img src={f.image} width={W} height={H} alt={L(`Imaginea camerei ${f.camera}: ${seen} persoane găsite, ${counted} numărate.`, `Camera ${f.camera}: ${seen} people found, ${counted} counted.`)} />
        {boxes && (
          <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" aria-hidden="true">
            {f.zone && <polygon className="ub-live-zone" points={f.zone.map(([x, y]) => `${x * W},${y * H}`).join(' ')} />}
            {f.detections.map((d, i) => {
              const [x1, y1, x2, y2] = d.box;
              const cls = d.kind === 'queue' ? 'is-queue' : d.kind === 'hall' ? 'is-hall' : 'is-out';
              return (
                <g key={i} className={`ub-live-box ${cls}`}>
                  <title>{`${Math.round(d.score * 100)}%`}</title>
                  <rect x={x1 * W} y={y1 * H} width={(x2 - x1) * W} height={(y2 - y1) * H} />
                  {/* the point the zone test uses: where the person stands */}
                  {f.zone && <circle cx={((x1 + x2) / 2) * W} cy={y2 * H} r={Math.max(4, W * 0.004)} />}
                </g>
              );
            })}
          </svg>
        )}
      </div>
    </figure>
  );
}

function Legend({ zone, hall, L }: { zone: boolean; hall: boolean; L: (ro: string, en: string) => string }) {
  return (
    <ul className="ub-live-legend">
      <li><span className="ub-live-key is-queue" aria-hidden="true" />{L('Numărat la coadă (linie plină)', 'Counted in the queue (solid line)')}</li>
      {hall && <li><span className="ub-live-key is-hall" aria-hidden="true" />{L('Numărat în sală (linie plină)', 'Counted in the hall (solid line)')}</li>}
      <li><span className="ub-live-key is-out" aria-hidden="true" />{L('Văzut, nenumărat: în afara zonei (linie întreruptă)', 'Seen, not counted: outside the zone (dashed line)')}</li>
      {zone && <li><span className="ub-live-key is-zone" aria-hidden="true" />{L('Zona cozii. Contează punctul de la picioare.', 'The queue zone. The point at the feet is what counts.')}</li>}
    </ul>
  );
}

function Recent({ recent, when, L }: { recent: LiveViewState['recent']; when: (iso: string) => string; L: (ro: string, en: string) => string }) {
  if (recent.length === 0) return <p className="ub-note" style={{ marginTop: 0 }}>{L('Nu a fost deschisă până acum.', 'Not opened so far.')}</p>;
  return (
    <div>
      <h3 className="ub-eyebrow">{L('Deschideri recente', 'Recent openings')}</h3>
      <div className="ub-list">
        {recent.map((r, i) => (
          <div key={i} className="ub-list-row">
            <span style={{ flex: 1, minWidth: 0, wordBreak: 'break-all' }}>{r.email ?? L('cont șters', 'deleted account')}</span>
            <span className="ub-numeric">{when(r.openedAt)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
