/* The DCCAS dashboard (docs/03 F16, F17; docs/18): read-only, and the screen that turns the
   directorate from gatekeeper into ally. It opens with a sentence, not a grid of widgets — as the
   kit ui_kits/dccas-dashboard — and every number says plainly where it comes from. */
import React from 'react';
import { Wallpaper } from '../../components/Chrome';
import type { DashboardSummary } from '@ubite/shared';
import { addDays, formatLei, localDate, weekdayOf } from '@ubite/shared';
import { Badge, Button, Chip, EmptyState, RatingStars, Skeleton, Wordmark } from '@ds';
import { apiGet, ApiError } from '../../api/client';
import { formatDayShort, formatTime, useI18n, weekdayName } from '../../i18n';
import { Gate, LangChip, SignOutButton, ThemeChip, useL } from '../staff/common';

const PROJECT_START = '2026-09-25';

export function Dashboard() {
  return <Gate roles={['dccas_admin']}><DashboardView /></Gate>;
}

function Metric({ label, value, unit, note, tone }: { label: string; value: string; unit?: string; note?: string; tone?: string }) {
  return (
    <div className="ub-metric">
      <span className="ub-eyebrow">{label}</span>
      <div className="ub-numeric ub-metric-v" style={{ color: tone || 'var(--text-primary)' }}>
        {value}{unit && <span className="ub-metric-u">{unit}</span>}
      </div>
      {note && <span className="ub-metric-n">{note}</span>}
    </div>
  );
}

function Bars({ data, unit = '', label }: { data: Array<[string, number]>; unit?: string; label: string }) {
  const top = Math.max(1, ...data.map((d) => d[1]));
  return (
    <div className="ub-bars" role="table" aria-label={label}>
      {data.map(([l, v]) => (
        <div key={l} className="ub-bar-row" role="row">
          <span className="ub-bar-label" role="rowheader">{l}</span>
          <span className="ub-bar-track" aria-hidden="true"><span className="ub-bar-fill" style={{ width: `${(v / top) * 100}%` }} /></span>
          <span className="ub-numeric ub-bar-v" role="cell">{v}{unit}</span>
        </div>
      ))}
    </div>
  );
}

function DashboardView() {
  const L = useL();
  const { lang } = useI18n();
  const today = localDate();
  const ranges: Array<[string, string, string]> = [
    ['7', L('Ultimele 7 zile', 'Last 7 days'), addDays(today, -6)],
    ['30', L('Ultimele 30 de zile', 'Last 30 days'), addDays(today, -29)],
    ['all', L('Tot proiectul', 'Whole project'), PROJECT_START < addDays(today, -29) ? PROJECT_START : addDays(today, -60)],
  ];
  const [range, setRange] = React.useState('30');
  const from = ranges.find((r) => r[0] === range)![2];
  const [data, setData] = React.useState<DashboardSummary | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [exports, setExports] = React.useState<Array<{ name: string; title: string }>>([]);

  React.useEffect(() => {
    let live = true;
    setData(null); setError(null);
    apiGet<DashboardSummary>(`/dashboard/summary?from=${from}&to=${today}`)
      .then((d) => { if (live) setData(d); })
      .catch((e: ApiError) => { if (live) setError(e.offline ? L('Fără internet.', 'No internet.') : L('Nu am putut încărca raportul.', 'We could not load the report.')); });
    return () => { live = false; };
  }, [from, today]); // eslint-disable-line react-hooks/exhaustive-deps
  React.useEffect(() => { apiGet<Array<{ name: string; title: string }>>('/dashboard/exports').then(setExports).catch(() => {}); }, []);

  const h = data?.headline;
  const pct = h && h.cameBecauseOfApp.answered ? Math.round((h.cameBecauseOfApp.yes / h.cameBecauseOfApp.answered) * 100) : null;
  const busiest = data?.byHour.filter((x) => x.averageWaitMinutes !== null).sort((a, b) => b.averageWaitMinutes! - a.averageWaitMinutes!)[0];
  const quietDay = data ? summariseQuietDay(data.byDay, lang) : null;

  return (
    <div className="ub-dash">
      <Wallpaper opacity={0.045} />
      <header className="ub-dash-head">
        <Wordmark size={26} />
        <span className="ub-eyebrow">{L('Raport DCCAS · doar citire', 'DCCAS report · read only')}</span>
        <span style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          {ranges.map(([key, label]) => <Chip key={key} size="sm" selected={range === key} onClick={() => setRange(key)}>{label}</Chip>)}
          <ThemeChip /><LangChip />
          <Button size="sm" variant="secondary" iconLeft="download" onClick={() => document.getElementById('exports')?.scrollIntoView({ behavior: 'smooth' })}>{L('Exportă tabel', 'Export table')}</Button>
          <SignOutButton />
        </span>
      </header>
      <main id="main">
        {error ? <EmptyState icon="wifi-off" title={error} /> : !data || !h ? (
          <div style={{ display: 'grid', gap: 14 }}>
            <Skeleton width="60%" height={24} />
            <div className="ub-dash-metrics">{[0, 1, 2, 3].map((i) => <Skeleton key={i} width="100%" height={110} radius="var(--radius-md)" />)}</div>
            <div className="ub-dash-grid">{[0, 1, 2, 3].map((i) => <Skeleton key={i} width="100%" height={220} radius="var(--radius-md)" />)}</div>
          </div>
        ) : (
          <>
            <p className="ub-dash-lede">
              {h.visitsRecorded + h.waitReports === 0 ? L('Încă nu sunt date pentru perioada aleasă. Primele numere apar din prima zi de pilot.', 'No data for this period yet. The first numbers appear from the first pilot day.') : (
                <>
                  {L('În perioada aleasă, studenții au înregistrat ', 'In this period, students recorded ')}
                  <strong>{h.visitsRecorded} {L('vizite cu bon', 'visits with a receipt')}</strong>
                  {L(' și au raportat de ', ' and reported their wait ')}<strong>{h.waitReports} {L('ori cât au așteptat', 'times')}</strong>.
                  {busiest && L(` Vârful e de obicei la ${busiest.hour}`, ` The peak is usually at ${busiest.hour}`)}
                  {quietDay && L(`, iar ${quietDay} e cea mai liniștită zi`, `, and ${quietDay} is the quietest day`)}.
                  {L(' Mai jos, ce spun studenții și cât a costat fidelitatea.', ' Below: what students say, and what loyalty cost.')}
                </>
              )}
            </p>

            <div className="ub-dash-metrics">
              <Metric label={L('Vizite înregistrate în aplicație', 'Visits recorded in the app')} value={String(h.visitsRecorded)} note={L('din bonuri fiscale fotografiate', 'from photographed fiscal receipts')} />
              <Metric label={L('Timp mediu de așteptare', 'Average wait')} value={h.averageWaitMinutes !== null ? fmt(h.averageWaitMinutes, lang) : '—'} unit={h.averageWaitMinutes !== null ? ' min' : undefined}
                note={L(`din ${h.waitReports} raportări`, `from ${h.waitReports} reports`)} />
              <Metric label={L('Studenți care spun că aplicația i-a adus', 'Students who say the app brought them')} value={pct !== null ? String(pct) : '—'} unit={pct !== null ? '%' : undefined}
                note={L(`din ${h.cameBecauseOfApp.answered} răspunsuri`, `from ${h.cameBecauseOfApp.answered} answers`)} tone="var(--crowd-low-text)" />
              <Metric label={L('Mese gratuite acordate', 'Free meals given')} value={String(h.freeMealsGiven)}
                note={L(`cost estimat ${formatLei(h.freeMealsCostBani, lang)} lei`, `estimated cost ${formatLei(h.freeMealsCostBani, lang)} lei`)} tone="var(--crowd-moderate-text)" />
            </div>

            <div className="ub-dash-grid">
              <section className="ub-panel">
                <h2>{L('Vizitatori unici în aplicație, pe zi', 'Unique app visitors per day')}</h2>
                {data.byDay.length ? <Bars label={L('Vizitatori pe zi', 'Visitors per day')} data={data.byDay.slice(-12).map((d) => [dayLabel(d.date, lang), d.visitors])} />
                  : <p className="ub-note">{L('Fără date încă.', 'No data yet.')}</p>}
                <p className="ub-note">{L('Numărați fără cookie-uri: aceeași persoană în două zile apare de două ori.', 'Counted without cookies: the same person on two days counts twice.')}</p>
              </section>
              <section className="ub-panel">
                <h2>{L('Așteptare medie pe oră', 'Average wait by hour')}</h2>
                {data.byHour.some((x) => x.averageWaitMinutes !== null)
                  ? <Bars label={L('Minute pe oră', 'Minutes by hour')} unit=" min" data={data.byHour.filter((x) => x.averageWaitMinutes !== null).map((x) => [x.hour, Math.round(x.averageWaitMinutes!)])} />
                  : <p className="ub-note">{L('Fără date încă.', 'No data yet.')}</p>}
                {data.byHour.some((x) => x.averageQueue !== null) && (
                  <p className="ub-note">{L('Camera a văzut în medie ', 'The camera saw on average ')}{data.byHour.filter((x) => x.averageQueue !== null).map((x) => `${x.hour}: ${fmt(x.averageQueue!, lang)}`).join(' · ')} {L('persoane la coadă.', 'people queueing.')}</p>
                )}
              </section>
              <section className="ub-panel">
                <h2>{L('Cele mai bine notate', 'Best rated')}</h2>
                {data.best.length ? data.best.map((d) => (
                  <div key={d.name} className="ub-dish-line"><span>{d.name}</span><RatingStars value={d.average} count={d.count} size={16} lang={lang} /></div>
                )) : <p className="ub-note">{L('Apar după cel puțin trei note pe fel.', 'They appear after at least three ratings per dish.')}</p>}
              </section>
              <section className="ub-panel">
                <h2>{L('Cele mai slab notate', 'Lowest rated')}</h2>
                {data.worst.length ? data.worst.map((d) => (
                  <div key={d.name} className="ub-dish-line"><span>{d.name}</span><RatingStars value={d.average} count={d.count} size={16} lang={lang} /></div>
                )) : <p className="ub-note">{L('Niciun fel sub 3,5.', 'No dish below 3.5.')}</p>}
                <p className="ub-note">{L('Notele sub 3,5 apar aici. Nu e o sancțiune — e o listă de discuție cu bucătăria.', 'Ratings under 3.5 show here. Not a sanction — a list to discuss with the kitchen.')}</p>
              </section>
              <section className="ub-panel">
                <h2>{L('Ce spun studenții', 'What students say')}</h2>
                <div className="ub-dish-line"><span>{L('Mulțumire față de mâncare', 'Satisfaction with the food')}</span><span className="ub-numeric">{data.feedback.foodAverage !== null ? `${fmt(data.feedback.foodAverage, lang)} / 5` : '—'}</span></div>
                <div className="ub-dish-line"><span>{L('Utilitatea aplicației', 'Usefulness of the app')}</span><span className="ub-numeric">{data.feedback.appAverage !== null ? `${fmt(data.feedback.appAverage, lang)} / 5` : '—'}</span></div>
                <div className="ub-dish-line"><span>{L('Răspunsuri', 'Answers')}</span><span className="ub-numeric">{data.feedback.count} ({L('aplicație', 'app')} {data.feedback.bySource.app} · {L('tabletă', 'tablet')} {data.feedback.bySource.kiosk})</span></div>
                {data.feedback.missing.length > 0 && (
                  <>
                    <h3 className="ub-eyebrow" style={{ margin: '14px 0 6px' }}>{L('Ce le lipsește', 'What they miss')}</h3>
                    <ul style={{ margin: 0, paddingLeft: 'var(--space-5)', color: 'var(--text-secondary)' }}>
                      {data.feedback.missing.slice(0, 8).map((m, i) => <li key={i}>{m.text}</li>)}
                    </ul>
                  </>
                )}
              </section>
              <section className="ub-panel">
                <h2>{L('Fidelitate', 'Loyalty')}</h2>
                <div className="ub-dish-line"><span>{L('Studenți înscriși (cel puțin o vizită)', 'Students enrolled (at least one visit)')}</span><span className="ub-numeric">{data.loyalty.enrolled}</span></div>
                <div className="ub-dish-line"><span>{L('Buline acordate', 'Dots given')}</span><span className="ub-numeric">{data.loyalty.visits}</span></div>
                <div className="ub-dish-line"><span>{L('Mese gratuite câștigate / acordate', 'Free meals earned / given')}</span><span className="ub-numeric">{data.loyalty.rewardsIssued} / {data.loyalty.rewardsRedeemed}</span></div>
                <div className="ub-dish-line"><span>{L('Cost estimat', 'Estimated cost')}</span><span className="ub-numeric">{formatLei(data.loyalty.costBani, lang)} lei</span></div>
                <p className="ub-note">{L('Costul folosește valoarea unei mese stabilite de echipă (implicit 10 lei). Nicio masă nu se acordă fără cod valid.', 'The cost uses the meal value set by the team (10 lei by default). No meal is given without a valid code.')}</p>
              </section>
              {data.waste.length > 0 && (
                <section className="ub-panel ub-panel--wide">
                  <h2>{L('Porții pregătite și cerere înregistrată', 'Portions prepared and recorded demand')}</h2>
                  <div className="ub-table-wrap">
                    <table className="ub-table ub-table--text2">
                      <thead><tr><th>{L('Zi', 'Day')}</th><th>{L('Fel', 'Dish')}</th><th>{L('Pregătite', 'Prepared')}</th><th>{L('Bonuri cu felul', 'Receipts with it')}</th></tr></thead>
                      <tbody>
                        {data.waste.slice(0, 20).map((w) => (
                          <tr key={w.date + w.name}>
                            <td className="ub-numeric">{formatDayShort(w.date, lang)}</td><td>{w.name}</td>
                            <td className="ub-numeric">{w.prepared}</td><td className="ub-numeric">{w.demandVisits ?? '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <p className="ub-note">{L('Apare doar pentru felurile la care s-a completat câmpul „porții pregătite”. Cererea vine din bonurile fotografiate în aplicație, nu din toate vânzările — e o analiză a cererii, nu o măsurare a risipei.', 'Only for dishes where “portions prepared” was filled in. Demand comes from receipts photographed in the app, not from all sales — it is a demand analysis, not a waste measurement.')}</p>
                </section>
              )}
              <section className="ub-panel ub-panel--wide" id="exports">
                <h2>{L('Tabele pentru raportare (CSV)', 'Tables for reporting (CSV)')}</h2>
                <div className="ub-dish-line"><span>{L('Vizitatori unici, însumați pe zile', 'Unique visitors, summed by day')}</span><span className="ub-numeric">{h.uniqueVisitors}</span></div>
                <div className="ub-dish-line"><span>{L('Dispozitive noi (prima deschidere)', 'New devices (first open)')}</span><span className="ub-numeric">{h.newVisitors}</span></div>
                <div className="ub-dish-line"><span>{L('Instalări ale aplicației', 'App installs')}</span><span className="ub-numeric">{data.installs}</span></div>
                <div className="ub-exports" style={{ marginTop: 'var(--space-3)' }}>
                  {exports.map((e) => (
                    <a key={e.name} className="ub-btn ub-btn--secondary" href={`/api/dashboard/export/${e.name}.csv?from=${from}&to=${today}`} download
                      style={{ display: 'inline-flex', alignItems: 'center', minHeight: 36, padding: '0 12px', borderRadius: 'var(--radius-sm)', background: 'var(--accent-quiet)', color: 'var(--accent-quiet-text)', fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)', textDecoration: 'none' }}>
                      {e.title}
                    </a>
                  ))}
                </div>
              </section>
              <section className="ub-panel ub-panel--wide">
                <h2>{L('Estimarea aglomerației', 'Crowding estimate')}</h2>
                <div className="ub-dish-line"><span>{L('Ultima observație a camerei', 'Last camera observation')}</span>
                  <span className="ub-numeric">{data.camera.lastObservationAt ? `${formatDayShort(localDate(new Date(data.camera.lastObservationAt)), lang)} ${formatTime(data.camera.lastObservationAt, lang)}` : <Badge tone="neutral">{L('fără cameră', 'no camera')}</Badge>}</span></div>
                <div className="ub-dish-line"><span>{L('Calibrare (minute pe persoană la coadă)', 'Calibration (minutes per queued person)')}</span>
                  <span className="ub-numeric">{data.calibration ? `${fmt(data.calibration.slope, lang, 2)} · ${L('eroare medie', 'mean error')} ${data.calibration.maeMinutes !== null ? fmt(data.calibration.maeMinutes, lang) + ' min' : '—'} · ${data.calibration.sampleSize} ${L('perechi', 'pairs')}` : '—'}</span></div>
                <p className="ub-note">{L('Fără cameră, estimarea vine din rapoartele studenților și din istoric. Nicio imagine nu se păstrează.', 'Without a camera, the estimate comes from student reports and history. No image is kept.')}</p>
              </section>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

function fmt(x: number, lang: 'ro' | 'en', digits = 1) {
  return new Intl.NumberFormat(lang === 'ro' ? 'ro-RO' : 'en-GB', { maximumFractionDigits: digits }).format(x);
}

/** "Ma 14" — the kit's short day labels. */
function dayLabel(date: string, lang: 'ro' | 'en') {
  const ro = ['Lu', 'Ma', 'Mi', 'Jo', 'Vi', 'Sâ', 'Du'];
  const en = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  return `${(lang === 'ro' ? ro : en)[weekdayOf(date) - 1]} ${Number(date.slice(8))}`;
}

function summariseQuietDay(days: DashboardSummary['byDay'], lang: 'ro' | 'en'): string | null {
  const byWeekday = new Map<number, number[]>();
  for (const d of days) if (d.averageWaitMinutes !== null) {
    const w = weekdayOf(d.date);
    byWeekday.set(w, [...(byWeekday.get(w) || []), d.averageWaitMinutes]);
  }
  if (byWeekday.size < 3) return null;
  let best: [number, number] | null = null;
  for (const [w, v] of byWeekday) {
    const avg = v.reduce((s, x) => s + x, 0) / v.length;
    if (!best || avg < best[1]) best = [w, avg];
  }
  return best ? weekdayName(best[0], lang, 'plural') : null;
}
