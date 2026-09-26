/* The wall kiosk (docs/08): useful untouched, readable from three metres, one tap for the full
   menu and a three-face feedback row, back to rotating after 45 seconds. Built as the kit's
   ui_kits/kiosk. Panels: menu 8 s · crowding 5 s · download 5 s (shortened 22 Sep 2026). */
import React from 'react';
import type { MenuItem } from '@ubite/shared';
import { formatLei, hoursSummary } from '@ubite/shared';
import { CrowdingIndicator, Icon, Pattern, Wordmark } from '@ds';
import { A } from '../../assets';
import { GlassLayer } from '../../components/Glass';
import { apiSend } from '../../api/client';
import { enqueue } from '../../api/outbox';
import { formatTime } from '../../i18n';
import { track } from '../../analytics';
import { groupMenu } from '../../components/Menu';
import { Qr } from '../../components/Qr';
import { crowdingView } from '../student/crowding';
import { useClock, useKioskData, useKioskTheme, useWakeLock } from './data';
import '../../styles/kiosk.css';

const PANELS = ['menu', 'crowding', 'download'] as const;
const DURATION = { menu: 8000, crowding: 5000, download: 5000 };
const FACES: Array<[string, string, number]> = [
  ['face-slightly-smiling', 'bine', 5], ['face-neutral', 'acceptabil', 3], ['face-slightly-frowning', 'slab', 1],
];

function KioskMenu({ items }: { items: MenuItem[] }) {
  const groups = groupMenu(items);
  if (!groups.length) return <div className="ub-kiosk-empty">Meniul de azi nu e publicat încă. De obicei apare până la 10:30.</div>;
  return (
    <div className="ub-kiosk-menu">
      {groups.map(({ group, items: rows }) => (
        <div key={group.key}>
          <h2 className="ub-kiosk-cat">{group.ro}</h2>
          {rows.map((i) => (
            <div key={i.dish.id} className="ub-kiosk-row"><span>{i.dish.nameRo}</span><span className="ub-numeric">{formatLei(i.priceBani, 'ro')} lei</span></div>
          ))}
        </div>
      ))}
    </div>
  );
}

export function Kiosk() {
  const cardRef = React.useRef<HTMLDivElement>(null);
  useKioskTheme();
  useWakeLock();
  const { menu, crowding, status, qrUrl, displayUrl } = useKioskData();
  const now = useClock();
  const [i, setI] = React.useState(0);
  const [paused, setPaused] = React.useState(false);
  const [vote, setVote] = React.useState<string | null>(null);
  const panel = PANELS[i % PANELS.length];

  React.useEffect(() => {
    if (paused) return undefined;
    const t = window.setTimeout(() => setI((n) => n + 1), DURATION[panel]);
    return () => window.clearTimeout(t);
  }, [i, paused, panel]);

  React.useEffect(() => {
    if (!paused) return undefined;
    const t = window.setTimeout(() => { setPaused(false); setVote(null); }, 45_000);
    return () => window.clearTimeout(t);
  }, [paused, vote]);

  const sendVote = (icon: string, rating: number) => {
    setVote(icon);
    track('kiosk_feedback');
    const body = { foodRating: rating, source: 'kiosk' as const };
    if (!navigator.onLine) { enqueue({ kind: 'feedback', body }); return; }
    apiSend('POST', '/feedback', body).catch(() => enqueue({ kind: 'feedback', body }));
  };

  const items = menu.data?.outdated ? [] : menu.data?.menu?.items ?? [];
  const view = crowdingView(crowding.data, crowding.fetchedAt, status.data, 'ro', Date.now());
  const offline = crowding.stale || menu.stale;
  const hours = status.data ? hoursSummary(status.data.schedule, 'ro') : 'L–V 11:30–17:00';

  return (
    <div className="ub-kiosk" onClick={() => { if (!paused) track('kiosk_tap'); setPaused(true); }} role="application" aria-label="UBite">
      <div className="ub-wall" aria-hidden="true"><Pattern src={A.pattern} opacity={0.07} size={450} drift /></div>
      <header className="ub-kiosk-head">
        <Wordmark size={54} />
        <span className="ub-numeric ub-kiosk-clock">{formatTime(now, 'ro')}</span>
        <span className="ub-kiosk-place">Cantina Mihail Kogălniceanu · {hours}</span>
      </header>

      {paused ? (
        <div className="ub-kiosk-body ub-kiosk-full">
          <KioskMenu items={items} />
          <div className="ub-kiosk-vote">
            <span className="ub-kiosk-voteq">Cum a fost azi?</span>
            <div className="ub-kiosk-faces">
              {FACES.map(([g, l, rating]) => (
                <button key={g} type="button" className="ub-face" data-on={vote === g} disabled={!!vote}
                  onClick={(e) => { e.stopPropagation(); sendVote(g, rating); }}>
                  <Icon name={g} size={56} stroke={2.25} /><span>{l}</span>
                </button>
              ))}
            </div>
            {vote && <span className="ub-kiosk-thanks" role="status">Mulțumim.</span>}
          </div>
        </div>
      ) : (
        <div className="ub-kiosk-body" key={panel}>
          {panel === 'menu' && <div className="ub-fadein"><KioskMenu items={items} /></div>}
          {panel === 'crowding' && (
            <div className="ub-fadein" style={{ display: 'grid', placeItems: 'center', height: '100%' }}>
              <div ref={cardRef} style={{ width: 'min(880px, 100%)', position: 'relative', borderRadius: 'var(--radius-lg)' }}>
                <CrowdingIndicator size="kiosk" level={view.level} waitMinutes={view.waitMinutes} quality={view.quality}
                  updatedSecondsAgo={view.updatedSecondsAgo} opensAtLabel={view.opensAtLabel} hoursLabel={view.hoursLabel}
                  error={view.noEstimate} loading={crowding.loading && !crowding.data} lang="ro"
                  surface="glass" underlay={<GlassLayer box={cardRef} radius="--radius-lg" />} />
              </div>
            </div>
          )}
          {panel === 'download' && (
            <div className="ub-fadein ub-kiosk-qr">
              <div>
                <h2 className="ub-kiosk-qr-title">Vezi coada înainte să vii</h2>
                <p className="ub-kiosk-qr-body">Scanează și pui UBite pe telefon. Nu trebuie cont.</p>
                <p className="ub-kiosk-qr-url ub-numeric">{displayUrl}</p>
              </div>
              <div className="ub-kiosk-qr-box ub-qr"><Qr value={qrUrl} label={`Cod QR către ${displayUrl}`} size={300} /></div>
            </div>
          )}
        </div>
      )}

      <footer className="ub-kiosk-foot">
        <div className="ub-kiosk-dots">{PANELS.map((p, n) => <span key={p} data-on={!paused && n === i % PANELS.length} />)}</div>
        <span>{paused ? 'Revine la rotație în 45 de secunde' : 'Atinge ecranul pentru meniul complet'}</span>
        {offline && crowding.fetchedAt && <span className="ub-kiosk-stamp ub-numeric">Actualizat la {formatTime(new Date(crowding.fetchedAt), 'ro')}</span>}
      </footer>
    </div>
  );
}
