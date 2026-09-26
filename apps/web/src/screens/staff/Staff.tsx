/* The canteen's tools, on one shared account (docs/10). The menu editor exists to be finished in
   under two minutes, in a kitchen, without reading anything (docs/18) — built as the kit's
   ui_kits/staff-editor, on live data. Second screen: announcements. Third: redeem a code. */
import React from 'react';
import { Wallpaper } from '../../components/Chrome';
import { useLocation } from 'wouter';
import type {
  Allergen, AnnouncementInput, Category, DietTag, MenuDay, PublishMenuResponse, RedeemResponse, StaffDish, StaffMenuDraft,
} from '@ubite/shared';
import {
  ALLERGENS, ALLERGEN_LABELS, CATEGORIES, CATEGORY_GROUPS, CATEGORY_LABELS, DIET_TAGS, DIET_TAG_LABELS,
  addDays, formatLei, localDate, parseLei,
} from '@ubite/shared';
import { Badge, Button, Chip, EmptyState, Icon, IconButton, Input, Skeleton, Wordmark } from '@ds';
import { apiGet, apiSend, ApiError } from '../../api/client';
import { formatDayLong, formatTime, useI18n } from '../../i18n';
import { useApp } from '../../state/app';
import { Gate, LangChip, SignOutButton, ThemeChip, useL } from './common';

export function Staff() {
  return (
    <Gate roles={['canteen_staff']}>
      <StaffTools />
    </Gate>
  );
}

function StaffTools() {
  const L = useL();
  const { lang } = useI18n();
  const [location, navigate] = useLocation();
  const today = localDate();
  const tabs: Array<[string, string]> = [
    ['/staff', L('Meniul de azi', "Today's menu")],
    ['/staff/announcements', L('Anunțuri', 'Announcements')],
    ['/staff/redeem', L('Cod de recompensă', 'Reward code')],
    ['/staff/catalogue', L('Catalog', 'Catalogue')],
  ];
  return (
    <div className="ub-staff">
      <Wallpaper opacity={0.045} />
      <header className="ub-staff-head">
        <Wordmark size={26} />
        <span className="ub-eyebrow" style={{ marginLeft: 4 }}>{L('Editor meniu · cont cantină', 'Menu editor · canteen account')}</span>
        <span style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <ThemeChip /><LangChip />
          <span className="ub-numeric" style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>{formatDayLong(today, lang)}</span>
          <SignOutButton />
        </span>
      </header>
      <nav className="ub-staff-tabs" aria-label={L('Unelte cantină', 'Canteen tools')}>
        {tabs.map(([path, label]) => <Chip key={path} selected={location === path} onClick={() => navigate(path)}>{label}</Chip>)}
      </nav>
      <main id="main">
        {location === '/staff/announcements' ? <Announcements />
          : location === '/staff/redeem' ? <Redeem />
            : location === '/staff/catalogue' ? <Catalogue />
              : <MenuEditor />}
      </main>
    </div>
  );
}

/* ── Menu editor ──────────────────────────────────────────────────────────────────────── */

interface Sel { price: string; portions: string }

function fromMenu(menu: MenuDay | null, lang: 'ro' | 'en'): Record<string, Sel> {
  return Object.fromEntries((menu?.items ?? []).map((i) => [i.dish.id, {
    price: formatLei(i.priceBani, lang), portions: i.portionsPrepared != null ? String(i.portionsPrepared) : '',
  }]));
}

function MenuEditor() {
  const L = useL();
  const { lang } = useI18n();
  const { toast } = useApp();
  const [draft, setDraft] = React.useState<StaffMenuDraft | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [sel, setSel] = React.useState<Record<string, Sel>>({});
  const [source, setSource] = React.useState<'current' | 'previous' | 'none'>('none');
  const [busy, setBusy] = React.useState(false);
  const [adding, setAdding] = React.useState(false);

  const load = React.useCallback(async () => {
    try {
      const d = await apiGet<StaffMenuDraft>('/staff/menu');
      setDraft(d);
      // Yesterday's selection is preloaded — most days need only a few changes (docs/03 F14).
      if (d.current?.items.length) { setSel(fromMenu(d.current, lang)); setSource('current'); }
      else if (d.previous) { setSel(fromMenu(d.previous, lang)); setSource('previous'); }
      else { setSel({}); setSource('none'); }
      setError(null);
    } catch (e) {
      setError((e as ApiError).offline ? L('Fără internet. Meniul se publică doar online.', 'No internet. The menu publishes only online.') : L('Nu am putut încărca meniul.', 'We could not load the menu.'));
    }
  }, [lang, L]);
  React.useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (error && !draft) return <EmptyState icon="wifi-off" title={error} action={L('Încearcă din nou', 'Try again')} onAction={load} />;
  if (!draft) {
    return (
      <div className="ub-staff-grid">
        <section><Skeleton width="40%" height={28} /><div style={{ height: 16 }} />{[0, 1, 2, 3].map((i) => <div key={i} style={{ marginBottom: 8 }}><Skeleton width="100%" height={64} radius="var(--radius-sm)" /></div>)}</section>
        <section><Skeleton width="30%" height={28} /><div style={{ height: 16 }} />{[0, 1, 2, 3, 4, 5].map((i) => <div key={i} style={{ marginBottom: 8 }}><Skeleton width="100%" height={36} /></div>)}</section>
      </div>
    );
  }

  const catalogue = draft.catalogue.filter((d) => d.isActive || sel[d.id]);
  const byId = new Map(draft.catalogue.map((d) => [d.id, d]));
  const chosen = catalogue.filter((d) => sel[d.id]);
  const toggle = (d: StaffDish) => setSel((s) => {
    const next = { ...s };
    if (next[d.id]) delete next[d.id];
    else next[d.id] = { price: formatLei(d.defaultPriceBani, lang), portions: '' };
    return next;
  });
  const patch = (id: string, p: Partial<Sel>) => setSel((s) => ({ ...s, [id]: { ...s[id], ...p } }));
  const invalid = chosen.filter((d) => parseLei(sel[d.id].price) === null || (sel[d.id].portions !== '' && !/^\d{1,5}$/.test(sel[d.id].portions)));
  const name = (d: StaffDish) => (lang === 'ro' ? d.nameRo : d.nameEn || d.nameRo);

  const publish = async () => {
    if (!chosen.length || invalid.length) return;
    setBusy(true);
    try {
      const r = await apiSend<PublishMenuResponse>('POST', '/staff/menu', {
        items: chosen.map((d) => ({ dishId: d.id, priceBani: parseLei(sel[d.id].price)!, portionsPrepared: sel[d.id].portions ? Number(sel[d.id].portions) : null })),
      });
      setDraft({ ...draft, current: r.menu });
      setSource('current');
      toast(r.notified > 0
        ? L(`Meniul de azi e publicat. ${r.notified} studenți primesc o notificare.`, `Today's menu is published. ${r.notified} students get a notification.`)
        : L('Meniul de azi e publicat. Studenții îl văd acum.', "Today's menu is published. Students can see it now."), { tone: 'success', icon: 'circle-check' });
    } catch (e) {
      toast((e as ApiError).offline ? L('Fără internet. Încearcă din nou când revine semnalul.', 'No internet. Try again when the signal is back.') : L('Nu am putut publica. Încearcă din nou.', 'We could not publish. Try again.'), { tone: 'danger', icon: 'triangle-alert' });
    } finally { setBusy(false); }
  };

  const yesterday = addDays(draft.date, -1);
  const sourceBadge = source === 'current' && draft.current?.publishedAt
    ? <Badge tone="success" icon="check">{L(`publicat la ${formatTime(draft.current.publishedAt, lang)}`, `published at ${formatTime(draft.current.publishedAt, lang)}`)}</Badge>
    : source === 'previous' && draft.previous
      ? <Badge tone="accent" icon="refresh-cw">{draft.previous.serviceDate === yesterday ? L('preluat din meniul de ieri', "carried over from yesterday's menu") : L(`preluat din meniul din ${formatDayLong(draft.previous.serviceDate, lang)}`, `carried over from ${formatDayLong(draft.previous.serviceDate, lang)}`)}</Badge>
      : null;

  return (
    <div className="ub-staff-grid">
      <section aria-labelledby="today-title">
        <div className="ub-staff-section-title">
          <h2 id="today-title">{L('Meniul de azi', "Today's menu")}</h2>
          {sourceBadge}
        </div>

        {chosen.length === 0 ? (
          <EmptyState icon="utensils" title={L('Niciun fel selectat', 'No dish selected')}
            body={L('Bifează din catalog. Începe cu meniul de ieri dacă se repetă.', "Tick dishes in the catalogue. Start from yesterday's menu if it repeats.")} />
        ) : CATEGORY_GROUPS.map((g) => {
          const rows = chosen.filter((c) => g.categories.includes(c.category));
          if (!rows.length) return null;
          return (
            <div key={g.key} style={{ marginBottom: 18 }}>
              <div className="ub-eyebrow" style={{ marginBottom: 8 }}>{lang === 'ro' ? g.ro : g.en}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {rows.map((c) => {
                  const priceBad = parseLei(sel[c.id].price) === null;
                  const portionsBad = sel[c.id].portions !== '' && !/^\d{1,5}$/.test(sel[c.id].portions);
                  return (
                    <div key={c.id} className="ub-staff-row">
                      <span style={{ flex: 1, minWidth: '12ch', fontSize: 'var(--text-md)', fontWeight: 'var(--weight-semibold)' }}>{name(c)}</span>
                      <div style={{ width: 112 }}>
                        <Input value={sel[c.id].price} suffix="lei" inputMode="decimal" aria-label={L(`Preț ${name(c)}`, `Price ${name(c)}`)}
                          error={priceBad ? L('Preț?', 'Price?') : undefined} onChange={(e) => patch(c.id, { price: e.target.value })} />
                      </div>
                      <div style={{ width: 132 }}>
                        <Input value={sel[c.id].portions} placeholder={L('porții', 'portions')} suffix={L('opț.', 'opt.')} inputMode="numeric"
                          aria-label={L(`Porții pregătite, opțional, ${name(c)}`, `Portions prepared, optional, ${name(c)}`)}
                          error={portionsBad ? L('Număr', 'Number') : undefined} onChange={(e) => patch(c.id, { portions: e.target.value.replace(/\D/g, '') })} />
                      </div>
                      <IconButton name="x" label={L(`Scoate ${name(c)}`, `Remove ${name(c)}`)} onClick={() => toggle(c)} />
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        <div className="ub-staff-publish">
          <Button size="lg" iconLeft="check" loading={busy} disabled={!chosen.length || invalid.length > 0} onClick={publish}>
            {L(`Publică meniul (${chosen.length} feluri)`, `Publish the menu (${chosen.length} dishes)`)}
          </Button>
          <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>
            {L('Studenții văd meniul imediat. Poți reveni oricând.', 'Students see the menu at once. You can come back any time.')}
          </span>
        </div>
      </section>

      <section aria-labelledby="catalogue-title">
        <div className="ub-staff-section-title">
          <h2 id="catalogue-title">{L('Catalog', 'Catalogue')}</h2>
          <span className="ub-numeric" style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>{L(`${catalogue.length} feluri`, `${catalogue.length} dishes`)}</span>
        </div>
        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginBottom: 12 }}>
          {L('Bifează ce se gătește azi. Prețul vine din catalog și poate fi schimbat.', 'Tick what is cooked today. The price comes from the catalogue and can be changed.')}
        </p>
        <div className="ub-catalog">
          {CATEGORY_GROUPS.map((g) => {
            const list = catalogue.filter((c) => g.categories.includes(c.category));
            if (!list.length) return null;
            return (
              <div key={g.key}>
                <div className="ub-eyebrow" style={{ margin: '10px 0 6px' }}>{lang === 'ro' ? g.ro : g.en}</div>
                {list.map((c) => {
                  const on = !!sel[c.id];
                  return (
                    <label key={c.id} className="ub-check">
                      <span className="ub-box" data-on={on} aria-hidden="true">{on && <Icon name="check" size={15} stroke={3} />}</span>
                      <input type="checkbox" checked={on} onChange={() => toggle(c)} className="ub-visually-hidden" />
                      <span style={{ flex: 1, fontSize: 'var(--text-base)' }}>{name(c)}</span>
                      <span className="ub-numeric" style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>{formatLei(c.defaultPriceBani, lang)} lei</span>
                    </label>
                  );
                })}
              </div>
            );
          })}
          {adding ? (
            <NewDish onCancel={() => setAdding(false)} onCreated={(d) => {
              setDraft({ ...draft, catalogue: [...draft.catalogue, d] });
              setSel((s) => ({ ...s, [d.id]: { price: formatLei(d.defaultPriceBani, lang), portions: '' } }));
              setAdding(false);
            }} />
          ) : (
            <button type="button" className="ub-addnew" onClick={() => setAdding(true)}><Icon name="plus" size={17} />{L('Adaugă un fel nou', 'Add a new dish')}</button>
          )}
        </div>
        {byId.size === 0 && <p className="ub-note">{L('Catalogul e gol. Adaugă primul fel.', 'The catalogue is empty. Add the first dish.')}</p>}
      </section>
    </div>
  );
}

/** Inline add: the catalogue grows through use, not through a setup phase (docs/03 F14). */
function NewDish({ onCreated, onCancel }: { onCreated: (d: StaffDish) => void; onCancel: () => void }) {
  const L = useL();
  const { lang } = useI18n();
  const [nameRo, setName] = React.useState('');
  const [category, setCategory] = React.useState<Category>('main');
  const [price, setPrice] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const save = async () => {
    const bani = parseLei(price);
    if (nameRo.trim().length < 2 || bani === null) { setError(L('Scrie numele și prețul.', 'Enter the name and price.')); return; }
    setBusy(true);
    try {
      onCreated(await apiSend<StaffDish>('POST', '/staff/dishes', { nameRo: nameRo.trim(), category, defaultPriceBani: bani }));
    } catch { setError(L('Nu am putut salva. Încearcă din nou.', 'We could not save. Try again.')); } finally { setBusy(false); }
  };
  return (
    <form onSubmit={(e) => { e.preventDefault(); save(); }} style={{ display: 'grid', gap: 'var(--space-3)', marginTop: 'var(--space-3)', padding: 'var(--space-3)', background: 'var(--surface-raised)', borderRadius: 'var(--radius-sm)' }}>
      <Input label={L('Numele felului', 'Dish name')} value={nameRo} onChange={(e) => setName(e.target.value)} autoFocus />
      <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
        <label className="ub-field-label" style={{ flex: 1, minWidth: 160 }}>{L('Categorie', 'Category')}
          <select className="ub-select" value={category} onChange={(e) => setCategory(e.target.value as Category)}>
            {CATEGORIES.map((c) => <option key={c} value={c}>{CATEGORY_LABELS[c][lang]}</option>)}
          </select>
        </label>
        <div style={{ width: 140 }}><Input label={L('Preț', 'Price')} value={price} suffix="lei" inputMode="decimal" onChange={(e) => setPrice(e.target.value)} /></div>
      </div>
      {error && <p role="alert" style={{ color: 'var(--status-danger-text)', fontSize: 'var(--text-sm)' }}>{error}</p>}
      <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>{L('Etichetele și alergenii se completează din Catalog, doar cu ce confirmă cantina.', 'Tags and allergens are filled in from the Catalogue, only with what the canteen confirms.')}</p>
      <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
        <Button variant="quiet" onClick={onCancel}>{L('Renunță', 'Cancel')}</Button>
        <Button type="submit" loading={busy}>{L('Adaugă în catalog', 'Add to the catalogue')}</Button>
      </div>
    </form>
  );
}

/* ── Announcements (F15) ──────────────────────────────────────────────────────────────── */

interface Ann { id: string; bodyRo: string; bodyEn: string | null; startsAt: string; endsAt: string }

function localInput(d: Date) {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function Announcements() {
  const L = useL();
  const { lang } = useI18n();
  const { toast } = useApp();
  const [list, setList] = React.useState<Ann[] | null>(null);
  const [bodyRo, setBodyRo] = React.useState('');
  const [bodyEn, setBodyEn] = React.useState('');
  const now = new Date();
  const endOfDay = new Date(now); endOfDay.setHours(17, 0, 0, 0);
  const [starts, setStarts] = React.useState(localInput(now));
  const [ends, setEnds] = React.useState(localInput(endOfDay > now ? endOfDay : new Date(now.getTime() + 86_400_000)));
  const [busy, setBusy] = React.useState(false);
  const load = () => apiGet<Ann[]>('/staff/announcements').then(setList).catch(() => setList([]));
  React.useEffect(() => { load(); }, []);

  const save = async () => {
    const body: AnnouncementInput = { bodyRo: bodyRo.trim(), bodyEn: bodyEn.trim() || null, startsAt: new Date(starts).toISOString(), endsAt: new Date(ends).toISOString() };
    if (body.bodyRo.length < 3 || !(new Date(ends) > new Date(starts))) { toast(L('Scrie mesajul și verifică datele.', 'Write the message and check the dates.'), { tone: 'danger' }); return; }
    setBusy(true);
    try {
      await apiSend('POST', '/staff/announcements', body);
      setBodyRo(''); setBodyEn('');
      toast(L('Anunțul e publicat.', 'The announcement is published.'), { tone: 'success', icon: 'circle-check' });
      load();
    } catch { toast(L('Nu am putut publica anunțul.', 'We could not publish it.'), { tone: 'danger' }); } finally { setBusy(false); }
  };

  return (
    <div className="ub-staff-grid">
      <section>
        <div className="ub-staff-section-title"><h2>{L('Anunț nou', 'New announcement')}</h2></div>
        <form onSubmit={(e) => { e.preventDefault(); save(); }} style={{ display: 'grid', gap: 'var(--space-3)' }}>
          <label className="ub-field-label">{L('Mesajul, în română', 'The message, in Romanian')}
            <textarea className="ub-textarea" maxLength={280} rows={3} value={bodyRo} onChange={(e) => setBodyRo(e.target.value)}
              placeholder={L('Mâine cantina se închide la 15:00.', 'Mâine cantina se închide la 15:00.')} />
          </label>
          <label className="ub-field-label">{L('În engleză, opțional', 'In English, optional')}
            <textarea className="ub-textarea" maxLength={280} rows={2} value={bodyEn} onChange={(e) => setBodyEn(e.target.value)} />
          </label>
          <div className="ub-form-grid">
            <label className="ub-field-label">{L('De la', 'From')}<input className="ub-select" type="datetime-local" value={starts} onChange={(e) => setStarts(e.target.value)} /></label>
            <label className="ub-field-label">{L('Până la', 'Until')}<input className="ub-select" type="datetime-local" value={ends} onChange={(e) => setEnds(e.target.value)} /></label>
          </div>
          <div><Button type="submit" iconLeft="megaphone" loading={busy}>{L('Publică anunțul', 'Publish')}</Button></div>
          <p className="ub-note">{L('Apare pe prima pagină a aplicației și pe tableta de la intrare.', 'It appears on the app’s first page and on the tablet at the entrance.')}</p>
        </form>
      </section>
      <section>
        <div className="ub-staff-section-title"><h2>{L('Anunțuri active și viitoare', 'Current and upcoming')}</h2></div>
        {!list ? <Skeleton width="100%" height={60} /> : list.length === 0 ? (
          <EmptyState compact icon="megaphone" title={L('Niciun anunț', 'No announcements')} body={L('Când ai ceva de spus, scrie aici.', 'When you have something to say, write it here.')} />
        ) : (
          <div className="ub-list">
            {list.map((a) => {
              const over = new Date(a.endsAt) < new Date();
              return (
                <div key={a.id} className="ub-list-row">
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 'var(--weight-semibold)' }}>{a.bodyRo}</div>
                    <div className="ub-numeric" style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                      {formatDayLong(localDate(new Date(a.startsAt)), lang)} {formatTime(a.startsAt, lang)} – {formatDayLong(localDate(new Date(a.endsAt)), lang)} {formatTime(a.endsAt, lang)}
                    </div>
                  </div>
                  {over && <Badge tone="neutral">{L('încheiat', 'ended')}</Badge>}
                  <IconButton name="trash" label={L('Șterge anunțul', 'Delete')} onClick={async () => { await apiSend('DELETE', `/staff/announcements/${a.id}`).catch(() => {}); load(); }} />
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

/* ── Redeem: one field, one button, with a queue forming behind it (docs/09) ──────────── */

function Redeem() {
  const L = useL();
  const [code, setCode] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const [result, setResult] = React.useState<{ tone: 'success' | 'danger' | 'warning'; text: string } | null>(null);
  const [scanning, setScanning] = React.useState(false);

  const submit = async (value: string) => {
    if (!value.trim()) return;
    setBusy(true); setResult(null);
    try {
      const r = await apiSend<RedeemResponse>('POST', '/staff/rewards/redeem', { code: value });
      const msg: Record<string, { tone: 'success' | 'danger' | 'warning'; text: string }> = {
        'reward:ok': { tone: 'success', text: L('Masă gratuită confirmată. Poți servi.', 'Free meal confirmed. You can serve.') },
        'reward:used': { tone: 'danger', text: L('Codul a fost deja folosit.', 'This code was already used.') },
        'reward:expired': { tone: 'warning', text: L('Codul a expirat. Cere studentului să deschidă din nou cardul.', 'The code expired. Ask the student to open the card again.') },
        'reward:invalid': { tone: 'danger', text: L('Codul nu e valid. Verifică literele și cifrele.', 'The code is not valid. Check the letters and digits.') },
        'card:ok': { tone: 'success', text: L('Vizita de azi e confirmată.', "Today's visit is confirmed.") },
        'card:already_today': { tone: 'warning', text: L('Studentul are deja punctul de azi.', 'The student already has today’s dot.') },
        'card:closed': { tone: 'warning', text: L('Cantina e închisă acum.', 'The canteen is closed now.') },
        'card:unknown': { tone: 'danger', text: L('Card necunoscut.', 'Unknown card.') },
      };
      setResult(msg[`${r.kind}:${r.status}`] ?? { tone: 'danger', text: L('Codul nu e valid.', 'Invalid code.') });
      if (r.status === 'ok') setCode('');
    } catch (e) {
      setResult({ tone: 'danger', text: (e as ApiError).offline ? L('Fără internet. Notează codul și încearcă din nou.', 'No internet. Write the code down and try again.') : L('Nu am putut verifica. Încearcă din nou.', 'We could not check it. Try again.') });
    } finally {
      setBusy(false);
      document.getElementById('redeem-code')?.focus();
    }
  };

  const canScan = typeof (window as any).BarcodeDetector === 'function';
  return (
    <section className="ub-staff-card ub-redeem">
      <div className="ub-staff-section-title"><h2>{L('Cod de recompensă', 'Reward code')}</h2></div>
      <form onSubmit={(e) => { e.preventDefault(); submit(code); }} style={{ display: 'grid', gap: 'var(--space-3)' }}>
        <Input id="redeem-code" label={L('Codul de pe telefonul studentului', "The code on the student's phone")} value={code} placeholder="K7P4 4839"
          autoComplete="off" autoCapitalize="characters" spellCheck={false} onChange={(e) => setCode(e.target.value.toUpperCase())} autoFocus />
        <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
          <Button type="submit" size="lg" iconLeft="check" loading={busy} disabled={code.replace(/\s/g, '').length < 8}>{L('Confirmă', 'Confirm')}</Button>
          {canScan && <Button size="lg" variant="secondary" iconLeft="scan-line" onClick={() => setScanning((v) => !v)}>{scanning ? L('Oprește camera', 'Stop camera') : L('Scanează', 'Scan')}</Button>}
        </div>
      </form>
      {scanning && <Scanner onCode={(v) => { setScanning(false); setCode(v); submit(v); }} />}
      {result && (
        <div className="ub-result" data-tone={result.tone} role="status" style={{ marginTop: 'var(--space-4)' }}>
          <Icon name={result.tone === 'success' ? 'circle-check' : 'triangle-alert'} size={24} />{result.text}
        </div>
      )}
      <p className="ub-note">{L('Codul se schimbă în fiecare minut pe telefonul studentului și merge o singură dată. Un cod de card confirmă vizita de azi.', "The code changes every minute on the student's phone and works once. A card code confirms today’s visit.")}</p>
    </section>
  );
}

function Scanner({ onCode }: { onCode: (value: string) => void }) {
  const L = useL();
  const video = React.useRef<HTMLVideoElement>(null);
  const [error, setError] = React.useState<string | null>(null);
  React.useEffect(() => {
    let stream: MediaStream | null = null;
    let raf = 0;
    let stopped = false;
    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        if (!video.current) return;
        video.current.srcObject = stream;
        await video.current.play();
        const detector = new (window as any).BarcodeDetector({ formats: ['qr_code'] });
        const tick = async () => {
          if (stopped || !video.current) return;
          try {
            const codes = await detector.detect(video.current);
            const hit = codes.find((c: any) => /^UBITE:[RC]:/i.test(c.rawValue));
            if (hit) { onCode(hit.rawValue); return; }
          } catch { /* keep looking */ }
          raf = requestAnimationFrame(tick);
        };
        tick();
      } catch {
        setError(L('Nu putem porni camera. Scrie codul de mână.', 'We cannot start the camera. Type the code instead.'));
      }
    })();
    return () => { stopped = true; cancelAnimationFrame(raf); stream?.getTracks().forEach((t) => t.stop()); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  return error
    ? <p className="ub-note" role="alert">{error}</p>
    : <div className="ub-scanner" style={{ marginTop: 'var(--space-4)' }}><video ref={video} muted playsInline /></div>;
}

/* ── Catalogue (the canteen's own data: tags and allergens only as the canteen confirms) ── */

function Catalogue() {
  const L = useL();
  const { lang } = useI18n();
  const [list, setList] = React.useState<StaffDish[] | null>(null);
  const [editing, setEditing] = React.useState<StaffDish | null>(null);
  const load = () => apiGet<StaffDish[]>('/staff/dishes').then(setList).catch(() => setList([]));
  React.useEffect(() => { load(); }, []);
  if (editing) return <DishEditor dish={editing} onDone={() => { setEditing(null); load(); }} />;
  return (
    <section className="ub-staff-card">
      <div className="ub-staff-section-title">
        <h2>{L('Catalog', 'Catalogue')}</h2>
        <span className="ub-numeric" style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>{list ? L(`${list.length} feluri`, `${list.length} dishes`) : ''}</span>
      </div>
      <p className="ub-note" style={{ marginTop: 0, marginBottom: 'var(--space-4)' }}>
        {L('Etichetele alimentare și alergenii au consecințe medicale. Bifează doar ce confirmă bucătăria. Ce lipsește apare ca „Informație indisponibilă”, niciodată ca „nu conține”.',
          'Dietary tags and allergens have medical consequences. Tick only what the kitchen confirms. Anything missing shows as “Information not available”, never as “does not contain”.')}
      </p>
      {!list ? <Skeleton width="100%" height={200} /> : (
        <div className="ub-list">
          {list.map((d) => (
            <div key={d.id} className="ub-list-row">
              <div style={{ flex: 1, minWidth: '14ch' }}>
                <div style={{ fontWeight: 'var(--weight-semibold)' }}>{lang === 'ro' ? d.nameRo : d.nameEn}</div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                  {CATEGORY_LABELS[d.category][lang]} · {formatLei(d.defaultPriceBani, lang)} lei
                  {d.tags.length ? ` · ${d.tags.map((t) => DIET_TAG_LABELS[t][lang]).join(', ')}` : ''}
                  {d.allergens.length ? ` · ${L('alergeni', 'allergens')}: ${d.allergens.length}` : ` · ${L('alergeni nedeclarați', 'allergens not declared')}`}
                </div>
              </div>
              {!d.isActive && <Badge tone="neutral">{L('scos', 'retired')}</Badge>}
              {d.photo?.placeholder && <Badge tone="warning">{L('poză orientativă', 'placeholder photo')}</Badge>}
              <Button size="sm" variant="secondary" iconLeft="pencil" onClick={() => setEditing(d)}>{L('Editează', 'Edit')}</Button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function DishEditor({ dish, onDone }: { dish: StaffDish; onDone: () => void }) {
  const L = useL();
  const { lang } = useI18n();
  const { toast } = useApp();
  const [nameRo, setNameRo] = React.useState(dish.nameRo);
  const [nameEn, setNameEn] = React.useState(dish.nameEn === dish.nameRo ? '' : dish.nameEn);
  const [category, setCategory] = React.useState<Category>(dish.category);
  const [price, setPrice] = React.useState(formatLei(dish.defaultPriceBani, lang));
  const [weight, setWeight] = React.useState(dish.weightGrams ? String(dish.weightGrams) : '');
  const [calories, setCalories] = React.useState(dish.calories ? String(dish.calories) : '');
  const [tags, setTags] = React.useState<DietTag[]>(dish.tags);
  const [allergens, setAllergens] = React.useState<Allergen[]>(dish.allergens.filter((a) => a.source === 'canteen_declared').map((a) => a.allergen));
  const [active, setActive] = React.useState(dish.isActive);
  const [busy, setBusy] = React.useState(false);
  const [photoBusy, setPhotoBusy] = React.useState(false);

  const save = async () => {
    const bani = parseLei(price);
    if (nameRo.trim().length < 2 || bani === null) { toast(L('Verifică numele și prețul.', 'Check the name and price.'), { tone: 'danger' }); return; }
    setBusy(true);
    try {
      await apiSend('PATCH', `/staff/dishes/${dish.id}`, {
        nameRo: nameRo.trim(), nameEn: nameEn.trim() || null, category, defaultPriceBani: bani,
        weightGrams: weight ? Number(weight) : null, calories: calories ? Number(calories) : null,
        tags, allergens: allergens.map((a) => ({ allergen: a, source: 'canteen_declared' })), isActive: active,
      });
      toast(L('Salvat.', 'Saved.'), { tone: 'success', icon: 'circle-check' });
      onDone();
    } catch { toast(L('Nu am putut salva.', 'We could not save.'), { tone: 'danger' }); } finally { setBusy(false); }
  };

  const upload = async (file: File | undefined) => {
    if (!file) return;
    setPhotoBusy(true);
    const form = new FormData();
    form.append('photo', file);
    try {
      await apiSend('PUT', `/staff/dishes/${dish.id}/photo`, form);
      toast(L('Fotografia e salvată.', 'Photo saved.'), { tone: 'success', icon: 'circle-check' });
    } catch { toast(L('Nu am putut încărca fotografia.', 'We could not upload the photo.'), { tone: 'danger' }); } finally { setPhotoBusy(false); }
  };

  const check = <T extends string>(list: T[], set: (v: T[]) => void, value: T, label: string) => {
    const on = list.includes(value);
    return (
      <label key={value} className="ub-check">
        <span className="ub-box" data-on={on} aria-hidden="true">{on && <Icon name="check" size={15} stroke={3} />}</span>
        <input type="checkbox" className="ub-visually-hidden" checked={on} onChange={() => set(on ? list.filter((x) => x !== value) : [...list, value])} />
        <span>{label}</span>
      </label>
    );
  };

  return (
    <section className="ub-staff-card">
      <div className="ub-staff-section-title">
        <IconButton name="chevron-left" label={L('Înapoi la catalog', 'Back to the catalogue')} onClick={onDone} />
        <h2>{dish.nameRo}</h2>
      </div>
      <form onSubmit={(e) => { e.preventDefault(); save(); }} style={{ display: 'grid', gap: 'var(--space-5)' }}>
        <div className="ub-form-grid">
          <Input label={L('Nume în română', 'Name in Romanian')} value={nameRo} onChange={(e) => setNameRo(e.target.value)} />
          <Input label={L('Nume în engleză', 'Name in English')} value={nameEn} onChange={(e) => setNameEn(e.target.value)} hint={L('Traducerea o face echipa.', 'The team translates it.')} />
          <label className="ub-field-label">{L('Categorie', 'Category')}
            <select className="ub-select" value={category} onChange={(e) => setCategory(e.target.value as Category)}>
              {CATEGORIES.map((c) => <option key={c} value={c}>{CATEGORY_LABELS[c][lang]}</option>)}
            </select>
          </label>
          <Input label={L('Preț obișnuit', 'Usual price')} value={price} suffix="lei" inputMode="decimal" onChange={(e) => setPrice(e.target.value)} />
          <Input label={L('Gramaj', 'Weight')} value={weight} suffix="g" inputMode="numeric" onChange={(e) => setWeight(e.target.value.replace(/\D/g, ''))} />
          <Input label={L('Calorii, dacă le dă cantina', 'Calories, if the canteen gives them')} value={calories} suffix="kcal" inputMode="numeric" onChange={(e) => setCalories(e.target.value.replace(/\D/g, ''))} />
        </div>
        <fieldset style={{ border: 0, padding: 0, margin: 0 }}>
          <legend className="ub-eyebrow" style={{ marginBottom: 'var(--space-2)' }}>{L('Etichete alimentare confirmate de cantină', 'Dietary tags confirmed by the canteen')}</legend>
          <div className="ub-checks">{DIET_TAGS.map((t) => check(tags, setTags, t, DIET_TAG_LABELS[t][lang]))}</div>
        </fieldset>
        <fieldset style={{ border: 0, padding: 0, margin: 0 }}>
          <legend className="ub-eyebrow" style={{ marginBottom: 'var(--space-2)' }}>{L('Alergeni declarați de cantină', 'Allergens declared by the canteen')}</legend>
          <div className="ub-checks">{ALLERGENS.map((a) => check(allergens, setAllergens, a, ALLERGEN_LABELS[a][lang]))}</div>
          <p className="ub-note">{L('Fără niciun alergen bifat, studenții văd „Informație indisponibilă”.', 'With no allergen ticked, students see “Information not available”.')}</p>
        </fieldset>
        <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center', flexWrap: 'wrap' }}>
          <label className="ub-check" style={{ paddingLeft: 0 }}>
            <span className="ub-box" data-on={active} aria-hidden="true">{active && <Icon name="check" size={15} stroke={3} />}</span>
            <input type="checkbox" className="ub-visually-hidden" checked={active} onChange={() => setActive(!active)} />
            <span>{L('Activ în catalog', 'Active in the catalogue')}</span>
          </label>
          <label className="ub-btn ub-btn--secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, minHeight: 44, padding: '0 16px', borderRadius: 'var(--radius-sm)', background: 'var(--accent-quiet)', color: 'var(--accent-quiet-text)', fontWeight: 'var(--weight-semibold)', cursor: 'pointer' }}>
            <Icon name="image-plus" size={18} />{photoBusy ? L('Se încarcă…', 'Uploading…') : L('Fotografie', 'Photo')}
            <input type="file" accept="image/*" className="ub-visually-hidden" onChange={(e) => upload(e.target.files?.[0])} />
          </label>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <Button variant="quiet" onClick={onDone}>{L('Renunță', 'Cancel')}</Button>
          <Button type="submit" iconLeft="check" loading={busy}>{L('Salvează', 'Save')}</Button>
        </div>
      </form>
    </section>
  );
}
