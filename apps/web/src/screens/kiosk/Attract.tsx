/* The attract loop (docs/08, ui_kits/kiosk/attract.html): one 11-second story for someone
   walking past at three metres — who we are, how long the queue is, what is cooking, how to get
   the app — on live data. The one surface where motion invites; still slow, nothing bounces. */
import React from 'react';
import type { MenuItem } from '@ubite/shared';
import { formatLei, hoursSummary } from '@ubite/shared';
import { CrowdingIndicator, Icon, Illustration, Logo, Pattern } from '@ds';
import { formatDayLong } from '../../i18n';
import { A } from '../../assets';
import { Qr } from '../../components/Qr';
import { glyphFor } from '../../components/Menu';
import { crowdingView } from '../student/crowding';
import { useKioskData, useKioskTheme, useWakeLock } from './data';
import '../../styles/kiosk.css';

const SCENES = [
  { id: 'brand', ms: 2000 },
  { id: 'queue', ms: 3000 },
  { id: 'dishes', ms: 3200 },
  { id: 'qr', ms: 3000 },
] as const;

function slugOf(nameRo: string) {
  return nameRo.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z]+/g, '-');
}

function DishImage({ item }: { item: MenuItem }) {
  const [ok, setOk] = React.useState(true);
  // Prefer the sticker cut-out from the brand set; else the catalogue photo; else the glyph.
  const cutout = Object.entries({ 'ciorba-perisoare': 'ciorba-de-perisoare', 'pui-cartofi': 'pui-la-cuptor', papanasi: 'papanasi', sarmale: 'sarmale' })
    .find(([, prefix]) => slugOf(item.dish.nameRo).startsWith(prefix))?.[0];
  const src = (cutout && A.cutout(cutout)) || item.dish.photo?.url;
  return ok && src
    ? <img src={src} alt="" onError={() => setOk(false)} />
    : <span style={{ color: 'var(--text-muted)' }}><Icon name={glyphFor(item.dish.category)} size={96} stroke={1.75} /></span>;
}

export function Attract() {
  useKioskTheme();
  useWakeLock();
  const { menu, crowding, status, qrUrl, displayUrl } = useKioskData();
  const [i, setI] = React.useState(0);
  const scene = SCENES[i % SCENES.length];
  React.useEffect(() => {
    const t = window.setTimeout(() => setI((n) => n + 1), scene.ms);
    return () => window.clearTimeout(t);
  }, [i, scene.ms]);

  const view = crowdingView(crowding.data, crowding.fetchedAt, status.data, 'ro', Date.now());
  const level = view.noEstimate ? undefined : view.level;
  const items = menu.data?.outdated ? [] : menu.data?.menu?.items ?? [];
  const today = [...items].sort((a, b) => (b.dish.rating.average ?? 0) - (a.dish.rating.average ?? 0)).slice(0, 3);
  const hours = status.data ? hoursSummary(status.data.schedule, 'ro') : 'L–V 11:30–17:00';

  let body: React.ReactNode;
  if (scene.id === 'brand') {
    body = (
      <div className="scene"><div className="brand">
        <Logo variant="tray" size={190} level={level} intro withText />
        <p className="in in-3">Cantina Mihail Kogălniceanu · {hours}</p>
      </div>
      <span className="runner"><Illustration src={A.spot('run')} tone="accent" boil width={260} height={260} /></span>
      </div>
    );
  } else if (scene.id === 'queue') {
    body = (
      <div className="scene"><div className="in" style={{ width: 'min(900px, 100%)' }}>
        <CrowdingIndicator size="kiosk" level={view.level} waitMinutes={view.waitMinutes} quality={view.quality} updatedSecondsAgo={view.updatedSecondsAgo}
          opensAtLabel={view.opensAtLabel} hoursLabel={view.hoursLabel} error={view.noEstimate} lang="ro" />
      </div></div>
    );
  } else if (scene.id === 'dishes') {
    body = (
      <div className="scene"><div className="dishes">
        <h2 className="in">Azi la prânz<span>{formatDayLong(status.data?.today ?? new Date().toISOString().slice(0, 10), 'ro')}</span></h2>
        {today.length ? (
          <div className="plates">
            {today.map((d, n) => (
              <div key={d.dish.id} className={`plate in in-${n + 2}`}>
                <div className="plate-img"><DishImage item={d} /></div>
                <b>{d.dish.nameRo}</b><span className="ub-numeric">{formatLei(d.priceBani, 'ro')} lei</span>
              </div>
            ))}
          </div>
        ) : <p className="in in-2" style={{ fontSize: 32, color: 'var(--text-secondary)' }}>Meniul apare de obicei până la 10:30.</p>}
      </div></div>
    );
  } else {
    body = (
      <div className="scene"><div className="qr">
        <div className="qr-left">
          <h2 className="in">Vezi coada înainte să vii</h2>
          <p className="in in-2">Scanează și pui UBite pe telefon. Nu trebuie cont.</p>
          <p className="url ub-numeric in in-3">{displayUrl}</p>
          <span className="qr-spot in in-4"><Illustration src={A.spot('phone')} tone="accent" boil width={250} height={250} /></span>
        </div>
        <div className="qr-box ub-qr in in-2"><Qr value={qrUrl} label={`Cod QR către ${displayUrl}`} size={320} /></div>
      </div></div>
    );
  }

  return (
    <div className="ub-attract">
      <Pattern src={A.pattern} opacity={0.07} size={450} drift />
      {scene.id !== 'brand' && <div className="corner in"><Logo variant="tray" size={40} level={level} withText /></div>}
      <React.Fragment key={i}>{body}</React.Fragment>
      <div className="progress" aria-hidden="true">
        {SCENES.map((s, n) => (
          <i key={s.id} data-state={n < i % SCENES.length ? 'done' : n === i % SCENES.length ? 'now' : 'next'} style={{ '--d': `${s.ms}ms` } as React.CSSProperties}><b key={i} /></i>
        ))}
      </div>
    </div>
  );
}
