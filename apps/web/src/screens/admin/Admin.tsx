/* tech_admin (docs/10): configuration without a deploy — crowding thresholds, the camera zone,
   the opening schedule and its exceptions, the non-student accounts, and system health. */
import React from 'react';
import { Wallpaper } from '../../components/Chrome';
import type { AdminUser, CrowdingConfig, Role, ScheduleDay, ScheduleException } from '@ubite/shared';
import { formatLei, localDate, parseLei } from '@ubite/shared';
import { Badge, Button, Chip, IconButton, Input, Skeleton, Wordmark } from '@ds';
import { apiGet, apiSend } from '../../api/client';
import { formatTime, useI18n, weekdayName } from '../../i18n';
import { useApp } from '../../state/app';
import { Gate, LangChip, SignOutButton, ThemeChip, useL } from '../staff/common';

export function Admin() {
  return <Gate roles={['tech_admin']}><AdminView /></Gate>;
}

function AdminView() {
  const L = useL();
  return (
    <div className="ub-staff">
      <Wallpaper opacity={0.045} />
      <header className="ub-staff-head">
        <Wordmark size={26} />
        <span className="ub-eyebrow">{L('Administrare · echipa UBite', 'Administration · UBite team')}</span>
        <span style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}><ThemeChip /><LangChip /><SignOutButton /></span>
      </header>
      <main id="main" style={{ display: 'grid', gap: 'var(--space-5)' }}>
        <Health />
        <div className="ub-staff-grid">
          <CrowdingSettings />
          <ScheduleSettings />
        </div>
        <div className="ub-staff-grid">
          <Users />
          <ManualVisit />
        </div>
      </main>
    </div>
  );
}

function Health() {
  const L = useL();
  const { lang } = useI18n();
  const [h, setH] = React.useState<any>(null);
  React.useEffect(() => { apiGet('/admin/health').then(setH).catch(() => setH(false)); }, []);
  const when = (iso: string | null) => (iso ? `${localDate(new Date(iso))} ${formatTime(iso, lang)}` : '—');
  return (
    <section className="ub-staff-card">
      <div className="ub-staff-section-title"><h2>{L('Starea sistemului', 'System health')}</h2></div>
      {!h ? <Skeleton width="100%" height={80} /> : (
        <div className="ub-form-grid">
          <div className="ub-row"><span>{L('Ultima estimare', 'Last estimate')}</span><span className="ub-numeric">{when(h.lastEstimate)}</span></div>
          <div className="ub-row"><span>{L('Ultima observație a camerei', 'Last camera observation')}</span><span className="ub-numeric">{when(h.lastObservation)}</span></div>
          <div className="ub-row"><span>{L('Ultimul meniu publicat', 'Last menu published')}</span><span className="ub-numeric">{when(h.lastMenuPublished)}</span></div>
          <div className="ub-row"><span>{L('Calibrare', 'Calibration')}</span><span className="ub-numeric">{h.calibration ? `${h.calibration.n} ${L('perechi', 'pairs')}` : '—'}</span></div>
          <div className="ub-row"><span>Email</span><span>{h.mail ? <Badge tone="success">{L('activ', 'on')}</Badge> : <Badge tone="warning">{L('neconfigurat', 'not set')}</Badge>}</span></div>
          <div className="ub-row"><span>Push</span><span>{h.push ? <Badge tone="success">{L('activ', 'on')}</Badge> : <Badge tone="warning">{L('neconfigurat', 'not set')}</Badge>}</span></div>
          <div className="ub-row"><span>{L('Tokenuri cameră', 'Camera tokens')}</span><span className="ub-numeric">{h.visionTokens}</span></div>
          <div className="ub-row"><span>{L('Funcții', 'Features')}</span><span>{Object.entries(h.features).filter(([, v]) => v).map(([k]) => k).join(', ') || '—'}</span></div>
        </div>
      )}
    </section>
  );
}

function CrowdingSettings() {
  const L = useL();
  const { lang } = useI18n();
  const { toast } = useApp();
  const [cfg, setCfg] = React.useState<CrowdingConfig | null>(null);
  const [low, setLow] = React.useState('');
  const [high, setHigh] = React.useState('');
  const [zone, setZone] = React.useState('');
  const [meal, setMeal] = React.useState('');
  const [mode, setMode] = React.useState<'auto' | 'manual'>('auto');
  React.useEffect(() => {
    apiGet<CrowdingConfig>('/admin/config').then((c) => {
      setCfg(c); setLow(String(c.thresholds.low)); setHigh(String(c.thresholds.high)); setMode(c.thresholds.mode);
      setZone(JSON.stringify(c.zones.queue)); setMeal(formatLei(c.freeMealValueBani, lang));
    }).catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  if (!cfg) return <section><Skeleton width="100%" height={240} /></section>;
  const save = async () => {
    try {
      const queue = JSON.parse(zone);
      const next = await apiSend<CrowdingConfig>('PUT', '/admin/config', {
        thresholds: { mode, low: Number(low.replace(',', '.')), high: Number(high.replace(',', '.')) },
        zones: { queue, hall: cfg.zones.hall }, freeMealValueBani: parseLei(meal) ?? cfg.freeMealValueBani,
      });
      setCfg(next);
      toast(L('Salvat.', 'Saved.'), { tone: 'success', icon: 'circle-check' });
    } catch { toast(L('Nu am putut salva. Verifică valorile și zona (JSON).', 'Could not save. Check the values and the zone (JSON).'), { tone: 'danger' }); }
  };
  return (
    <section>
      <div className="ub-staff-section-title"><h2>{L('Aglomerație', 'Crowding')}</h2></div>
      <div style={{ display: 'grid', gap: 'var(--space-3)' }}>
        <div className="ub-chiprow" style={{ padding: 0 }}>
          <Chip size="sm" selected={mode === 'auto'} onClick={() => setMode('auto')}>{L('Praguri automate (p33 / p66)', 'Automatic thresholds (p33 / p66)')}</Chip>
          <Chip size="sm" selected={mode === 'manual'} onClick={() => setMode('manual')}>{L('Manuale', 'Manual')}</Chip>
        </div>
        <div className="ub-form-grid">
          <Input label={L('Mică sub', 'Low below')} suffix="min" inputMode="decimal" value={low} onChange={(e) => setLow(e.target.value)} disabled={mode === 'auto'} />
          <Input label={L('Mare de la', 'High from')} suffix="min" inputMode="decimal" value={high} onChange={(e) => setHigh(e.target.value)} disabled={mode === 'auto'} />
        </div>
        {mode === 'auto' && <p className="ub-note" style={{ marginTop: 0 }}>{cfg.thresholds.fittedAt ? L(`Recalculate luni din ${cfg.thresholds.sampleSize} estimări.`, `Recomputed on Monday from ${cfg.thresholds.sampleSize} estimates.`) : L('Valori de pornire: sub 3 min, 3–8 min, peste 8 min. Se recalculează săptămânal când există date.', 'Starting values: under 3 min, 3–8 min, over 8 min. Recomputed weekly once there is data.')}</p>}
        <label className="ub-field-label">{L('Zona cozii (poligon normalizat, 0–1)', 'Queue zone (normalised polygon, 0–1)')}
          <textarea className="ub-textarea ub-numeric" rows={3} value={zone} onChange={(e) => setZone(e.target.value)} />
        </label>
        <Input label={L('Valoarea unei mese gratuite', 'Value of a free meal')} suffix="lei" inputMode="decimal" value={meal} onChange={(e) => setMeal(e.target.value)} />
        <div><Button iconLeft="check" onClick={save}>{L('Salvează', 'Save')}</Button></div>
      </div>
    </section>
  );
}

function ScheduleSettings() {
  const L = useL();
  const { lang } = useI18n();
  const { toast } = useApp();
  const [days, setDays] = React.useState<ScheduleDay[] | null>(null);
  const [ex, setEx] = React.useState<ScheduleException[]>([]);
  React.useEffect(() => {
    apiGet<{ days: ScheduleDay[]; exceptions: ScheduleException[] }>('/admin/schedule').then((s) => { setDays(s.days); setEx(s.exceptions); }).catch(() => {});
  }, []);
  if (!days) return <section><Skeleton width="100%" height={240} /></section>;
  const patch = (w: number, p: Partial<ScheduleDay>) => setDays(days.map((d) => (d.weekday === w ? { ...d, ...p } : d)));
  const save = async () => {
    try {
      const s = await apiSend<{ days: ScheduleDay[]; exceptions: ScheduleException[] }>('PUT', '/admin/schedule', { days, exceptions: ex });
      setDays(s.days); setEx(s.exceptions);
      toast(L('Programul e salvat.', 'Schedule saved.'), { tone: 'success', icon: 'circle-check' });
    } catch { toast(L('Verifică orele: deschiderea înaintea închiderii.', 'Check the hours: opening before closing.'), { tone: 'danger' }); }
  };
  return (
    <section>
      <div className="ub-staff-section-title"><h2>{L('Program', 'Schedule')}</h2></div>
      <div style={{ display: 'grid', gap: 'var(--space-2)' }}>
        {days.map((d) => (
          <div key={d.weekday} className="ub-staff-row">
            <span style={{ width: 90, fontWeight: 'var(--weight-semibold)' }}>{weekdayName(d.weekday, lang)}</span>
            <Chip size="sm" selected={d.isClosed} onClick={() => patch(d.weekday, { isClosed: !d.isClosed, opensAt: d.opensAt ?? '11:30', closesAt: d.closesAt ?? '17:00' })}>{L('Închis', 'Closed')}</Chip>
            {!d.isClosed && (
              <>
                <input className="ub-select ub-numeric" type="time" value={d.opensAt ?? ''} onChange={(e) => patch(d.weekday, { opensAt: e.target.value })} aria-label={L('Deschide', 'Opens')} />
                <input className="ub-select ub-numeric" type="time" value={d.closesAt ?? ''} onChange={(e) => patch(d.weekday, { closesAt: e.target.value })} aria-label={L('Închide', 'Closes')} />
              </>
            )}
          </div>
        ))}
        <h3 className="ub-eyebrow" style={{ marginTop: 'var(--space-3)' }}>{L('Zile cu alt program', 'Days with other hours')}</h3>
        {ex.map((e, i) => (
          <div key={i} className="ub-staff-row">
            <input className="ub-select ub-numeric" type="date" value={e.date} onChange={(v) => setEx(ex.map((x, k) => (k === i ? { ...x, date: v.target.value } : x)))} aria-label={L('Data', 'Date')} />
            <Chip size="sm" selected={e.isClosed} onClick={() => setEx(ex.map((x, k) => (k === i ? { ...x, isClosed: !x.isClosed, opensAt: x.opensAt ?? '11:30', closesAt: x.closesAt ?? '15:00' } : x)))}>{L('Închis', 'Closed')}</Chip>
            {!e.isClosed && (
              <>
                <input className="ub-select ub-numeric" type="time" value={e.opensAt ?? ''} onChange={(v) => setEx(ex.map((x, k) => (k === i ? { ...x, opensAt: v.target.value } : x)))} aria-label={L('Deschide', 'Opens')} />
                <input className="ub-select ub-numeric" type="time" value={e.closesAt ?? ''} onChange={(v) => setEx(ex.map((x, k) => (k === i ? { ...x, closesAt: v.target.value } : x)))} aria-label={L('Închide', 'Closes')} />
              </>
            )}
            <input className="ub-select" style={{ flex: 1, minWidth: 140 }} placeholder={L('Motiv, opțional', 'Reason, optional')} value={e.note ?? ''} onChange={(v) => setEx(ex.map((x, k) => (k === i ? { ...x, note: v.target.value || null } : x)))} />
            <IconButton name="trash" label={L('Șterge', 'Delete')} onClick={() => setEx(ex.filter((_, k) => k !== i))} />
          </div>
        ))}
        <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
          <Button variant="secondary" size="sm" iconLeft="plus" onClick={() => setEx([...ex, { date: localDate(), isClosed: true, opensAt: null, closesAt: null, note: null }])}>{L('Adaugă o zi', 'Add a day')}</Button>
          <Button iconLeft="check" onClick={save}>{L('Salvează programul', 'Save schedule')}</Button>
        </div>
      </div>
    </section>
  );
}

function Users() {
  const L = useL();
  const { toast, me } = useApp();
  const [users, setUsers] = React.useState<AdminUser[] | null>(null);
  const [email, setEmail] = React.useState('');
  const [role, setRole] = React.useState<Role>('canteen_staff');
  const load = () => apiGet<AdminUser[]>('/admin/users').then(setUsers).catch(() => setUsers([]));
  React.useEffect(() => { load(); }, []);
  const roleName: Record<string, string> = {
    canteen_staff: L('Cantină', 'Canteen'), dccas_admin: 'DCCAS', tech_admin: L('Echipa tehnică', 'Tech team'), student: L('Student', 'Student'),
  };
  return (
    <section>
      <div className="ub-staff-section-title"><h2>{L('Conturi', 'Accounts')}</h2></div>
      <form onSubmit={async (e) => {
        e.preventDefault();
        try { await apiSend('POST', '/admin/users', { email: email.trim(), role }); setEmail(''); load(); toast(L('Cont adăugat.', 'Account added.'), { tone: 'success' }); }
        catch { toast(L('Adresa nu pare validă.', 'The address does not look valid.'), { tone: 'danger' }); }
      }} style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'flex-end', flexWrap: 'wrap', marginBottom: 'var(--space-4)' }}>
        <div style={{ flex: 1, minWidth: 200 }}><Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
        <select className="ub-select" value={role} onChange={(e) => setRole(e.target.value as Role)} aria-label={L('Rol', 'Role')}>
          {(['canteen_staff', 'dccas_admin', 'tech_admin'] as Role[]).map((r) => <option key={r} value={r}>{roleName[r]}</option>)}
        </select>
        <Button type="submit" iconLeft="plus">{L('Adaugă', 'Add')}</Button>
      </form>
      {!users ? <Skeleton width="100%" height={80} /> : (
        <div className="ub-list">
          {users.map((u) => (
            <div key={u.id} className="ub-list-row">
              <span style={{ flex: 1, minWidth: 0, wordBreak: 'break-all' }}>{u.email}</span>
              <Badge tone="accent">{roleName[u.role]}</Badge>
              {u.id !== me?.id && <IconButton name="trash" label={L('Scoate contul', 'Remove account')} onClick={async () => { await apiSend('DELETE', `/admin/users/${u.id}`).catch(() => {}); load(); }} />}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function ManualVisit() {
  const L = useL();
  const { toast } = useApp();
  const [email, setEmail] = React.useState('');
  const [date, setDate] = React.useState(localDate());
  return (
    <section>
      <div className="ub-staff-section-title"><h2>{L('Vizită adăugată manual', 'Manually added visit')}</h2></div>
      <p className="ub-note" style={{ marginTop: 0, marginBottom: 'var(--space-3)' }}>
        {L('Pentru corecturi în varianta de fidelitate „soft”: o vizită pe care bonul nu a putut-o dovedi. Rămâne marcată ca manuală în raport.', 'For corrections in the “soft” loyalty variant: a visit the receipt could not prove. It stays marked as manual in the report.')}
      </p>
      <form onSubmit={async (e) => {
        e.preventDefault();
        try { await apiSend('POST', '/admin/visits', { email: email.trim(), date }); setEmail(''); toast(L('Vizită adăugată.', 'Visit added.'), { tone: 'success' }); }
        catch { toast(L('Studentul nu există sau are deja punctul din acea zi.', 'Unknown student, or they already have that day’s dot.'), { tone: 'danger' }); }
      }} style={{ display: 'grid', gap: 'var(--space-3)' }}>
        <Input label={L('Adresa studentului', 'Student address')} type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <label className="ub-field-label">{L('Ziua', 'Day')}<input className="ub-select ub-numeric" type="date" value={date} onChange={(e) => setDate(e.target.value)} /></label>
        <div><Button type="submit" iconLeft="plus">{L('Adaugă vizita', 'Add the visit')}</Button></div>
      </form>
    </section>
  );
}
