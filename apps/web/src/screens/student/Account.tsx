/* Account (docs/18): everything that needs an account, in one place. A destination, never a
   checkpoint — nothing here is required to use the app. Laid out as the kit's AccountScreen. */
import React from 'react';
import { useLocation } from 'wouter';
import type { DietTag, Dish, HistoryResponse, Lang, Me, NotificationType } from '@ubite/shared';
import { DIET_TAGS, DIET_TAG_LABELS, NOTIFICATION_TYPES, formatLei } from '@ubite/shared';
import { AppHeader, Button, Chip, DishRow, EmptyState, Illustration, LoyaltyDots, Sheet, Skeleton } from '@ds';
import { apiSend } from '../../api/client';
import { useResource } from '../../api/cache';
import { formatDayShort, useI18n } from '../../i18n';
import { useApp, type Theme } from '../../state/app';
import { useNotifications } from '../../state/notifications';
import { pushSupport } from '../../pwa';
import { A } from '../../assets';
import { Switch, InstallPrompt } from '../../components/Chrome';
import { dishName, glyphFor } from '../../components/Menu';

export function Account() {
  const { t, lang, setLang } = useI18n();
  const app = useApp();
  const { me, setMe, loyalty, requireSignIn, signOut, toast, status, theme, setTheme } = app;
  const [, navigate] = useLocation();
  const back = () => navigate('/');

  React.useEffect(() => {
    if (location.hash === '#notifications') window.setTimeout(() => document.getElementById('notifications')?.scrollIntoView({ block: 'start' }), 200);
  }, []);

  const appearance = (
    <section className="ub-panel-s">
      <div className="ub-eyebrow" style={{ marginBottom: 10 }}>{t('account.language')}</div>
      <div className="ub-chiprow" style={{ padding: 0 }}>
        {(['ro', 'en'] as Lang[]).map((l) => <Chip key={l} selected={lang === l} onClick={() => setLang(l)}>{l === 'ro' ? 'Română' : 'English'}</Chip>)}
      </div>
      <div className="ub-eyebrow" style={{ margin: '16px 0 10px' }}>{t('account.theme')}</div>
      <div className="ub-chiprow" style={{ padding: 0 }}>
        {(['system', 'light', 'dark'] as Theme[]).map((v) => <Chip key={v} selected={theme === v} onClick={() => setTheme(v)}>{t(`account.theme.${v}` as const)}</Chip>)}
      </div>
    </section>
  );

  if (!me) {
    return (
      <div className="ub-screen">
        <AppHeader title={t('account.title')} onBack={back} lang={lang} />
        <main id="main" style={{ padding: '0 var(--gutter) 28px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <EmptyState art={A.art.install} icon="user" title={t('account.signedOut.title')} body={t('account.signedOut.body')}
            action={t('signin.title')} onAction={() => requireSignIn('account')} />
          {appearance}
          <div className="ub-nav-space" />
        </main>
      </div>
    );
  }

  const isStudent = me.role === 'student';
  const loyaltyOn = !!status.data?.features.loyalty;

  return (
    <div className="ub-screen">
      <AppHeader title={t('account.title')} onBack={back} lang={lang} />
      <main id="main" style={{ padding: '0 var(--gutter) 28px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {isStudent && loyaltyOn && (
          <div style={{ position: 'relative', overflow: 'hidden', background: 'var(--surface-raised)', borderRadius: 'var(--radius-lg)', padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 8 }}>
              <div className="ub-eyebrow" style={{ marginBottom: 4 }}>{t('account.loyalty')}</div>
              <Illustration src={A.spot('friends')} tone="accent" boil width={96} height={96} style={{ margin: '-10px -6px 0 0' }} />
            </div>
            {loyalty.data ? <LoyaltyDots filled={loyalty.data.filled} total={5} lang={lang} onAdd={() => navigate('/visit')} /> : <Skeleton width="70%" height={18} />}
            <div style={{ marginTop: 14, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <Button size="sm" variant="secondary" iconLeft="qr-code" onClick={() => navigate('/card')}>{t('account.rewardCode')}</Button>
            </div>
          </div>
        )}

        {isStudent && <History />}
        {isStudent && <Favourites />}

        {isStudent && (
          <section className="ub-panel-s">
            <div className="ub-eyebrow" style={{ marginBottom: 10 }}>{t('account.diet')}</div>
            <div className="ub-chiprow" style={{ padding: 0, flexWrap: 'wrap' }}>
              {DIET_TAGS.map((tag) => {
                const on = me.dietPreference.includes(tag);
                return (
                  <Chip key={tag} icon={DIET_TAG_LABELS[tag].icon} selected={on} onClick={async () => {
                    const next: DietTag[] = on ? me.dietPreference.filter((x) => x !== tag) : [...me.dietPreference, tag];
                    setMe({ ...me, dietPreference: next });
                    try { setMe(await apiSend<Me>('PATCH', '/me', { dietPreference: next })); } catch { setMe(me); toast(t('common.errorGeneric'), { tone: 'danger' }); }
                  }}>{DIET_TAG_LABELS[tag][lang]}</Chip>
                );
              })}
            </div>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)', marginTop: 10 }}>{t('account.dietHint')}</p>
          </section>
        )}

        {isStudent && <Notifications />}

        {appearance}

        {me.role !== 'student' && (
          <section className="ub-panel-s">
            <div className="ub-eyebrow" style={{ marginBottom: 10 }}>{t('account.tools')}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', alignItems: 'flex-start' }}>
              {(me.role === 'canteen_staff' || me.role === 'tech_admin') && <Button variant="secondary" size="sm" iconLeft="utensils" onClick={() => navigate('/staff')}>{t('account.tools.staff')}</Button>}
              {(me.role === 'dccas_admin' || me.role === 'tech_admin') && <Button variant="secondary" size="sm" iconLeft="chart-column" onClick={() => navigate('/dashboard')}>{t('account.tools.dashboard')}</Button>}
              {me.role === 'tech_admin' && <Button variant="secondary" size="sm" iconLeft="sliders-horizontal" onClick={() => navigate('/admin')}>{t('account.tools.admin')}</Button>}
            </div>
          </section>
        )}

        <section className="ub-panel-s">
          <div className="ub-row"><span>{t('account.email')}</span><span style={{ wordBreak: 'break-all' }}>{me.email}</span></div>
        </section>

        <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
          <Button variant="secondary" size="sm" iconLeft="log-out" onClick={signOut}>{t('account.signOut')}</Button>
          {isStudent && <DeleteAccount />}
        </div>
        <div className="ub-nav-space" />
      </main>
    </div>
  );
}

function History() {
  const { t, lang } = useI18n();
  const { me } = useApp();
  const res = useResource<HistoryResponse>(me ? `history:${me.id}` : null, '/me/history', { refreshMs: 10 * 60_000 });
  const h = res.data;
  const rows: Array<[string, string]> = h ? [
    [t('account.visitsMonth'), String(h.visitsThisMonth)],
    [t('account.spent'), h.spendThisMonthBani !== null ? `${formatLei(h.spendThisMonthBani, lang)} lei` : t('common.unavailable')],
    [t('account.saved'), `${formatLei(h.savedBani, lang)} lei`],
    [t('account.favoriteDish'), h.favoriteDish ?? t('common.unavailable')],
  ] : [];
  return (
    <section className="ub-panel-s">
      <div className="ub-eyebrow" style={{ marginBottom: 10 }}>{t('account.history')}</div>
      {!h ? (
        <div style={{ display: 'grid', gap: 8 }}>{[0, 1, 2, 3].map((i) => <Skeleton key={i} width="100%" height={20} />)}</div>
      ) : (
        <>
          <div style={{ display: 'grid', gap: 8 }}>
            {rows.map(([k, v]) => <div key={k} className="ub-row"><span>{k}</span><span className="ub-numeric">{v}</span></div>)}
          </div>
          {h.spendThisMonthBani === null && h.visitsThisMonth > 0 && (
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)', marginTop: 8 }}>{t('account.spendUnavailable')}</p>
          )}
          <div className="ub-eyebrow" style={{ margin: '16px 0 8px' }}>{t('account.byDay')}</div>
          {h.days.length === 0 ? (
            <p style={{ fontSize: 'var(--text-base)', color: 'var(--text-secondary)' }}>{t('account.noVisits')}</p>
          ) : (
            <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 'var(--space-2)' }}>
              {h.days.slice(0, 10).map((d) => (
                <li key={d.date} style={{ display: 'grid', gap: 2 }}>
                  <div className="ub-row"><span>{formatDayShort(d.date, lang)}</span><span className="ub-numeric">{d.totalBani !== null ? `${formatLei(d.totalBani, lang)} lei` : '—'}</span></div>
                  <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>{d.items?.length ? d.items.join(' · ') : t('common.unavailable')}</span>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </section>
  );
}

function Favourites() {
  const { t, lang } = useI18n();
  const { me, setMe, toast } = useApp();
  const [, navigate] = useLocation();
  const catalogue = useResource<Dish[]>('dishes', '/dishes', { refreshMs: 30 * 60_000 });
  if (!me) return null;
  const favs = (catalogue.data ?? []).filter((d) => me.favorites.includes(d.id));
  const remove = async (id: string) => {
    setMe({ ...me, favorites: me.favorites.filter((x) => x !== id) });
    try { await apiSend('PUT', `/me/favorites/${id}`, { favorite: false }); } catch { setMe(me); toast(t('common.errorGeneric'), { tone: 'danger' }); }
  };
  return (
    <section className="ub-panel-s">
      <div className="ub-eyebrow" style={{ marginBottom: 6 }}>{t('account.favorites')}</div>
      {me.favorites.length === 0 ? (
        <p style={{ fontSize: 'var(--text-base)', color: 'var(--text-secondary)' }}>{t('account.noFavorites')}</p>
      ) : !catalogue.data ? (
        <DishRow loading name="" price="" dense />
      ) : favs.map((d) => (
        <DishRow key={d.id} dense name={dishName(d, lang)} price={formatLei(d.defaultPriceBani, lang)} tags={d.tags} photo={d.photo?.url}
          glyph={glyphFor(d.category)} lang={lang} onClick={() => navigate(`/dish/${d.id}`)} favourite onFavourite={() => remove(d.id)} />
      ))}
    </section>
  );
}

function Notifications() {
  const { t } = useI18n();
  const { me, toast, status } = useApp();
  const { ensurePush, setPrefs } = useNotifications();
  const [editWindow, setEditWindow] = React.useState(false);
  const [installAsk, setInstallAsk] = React.useState(false);
  const [from, setFrom] = React.useState(me?.notifications.windowStart ?? '11:30');
  const [to, setTo] = React.useState(me?.notifications.windowEnd ?? '14:00');
  const [testing, setTesting] = React.useState(false);
  if (!me) return null;
  const support = pushSupport();
  const serverReady = !!status.data?.vapidPublicKey;
  const pushLine = !serverReady ? t('account.pushNotConfigured')
    : support === 'ios-needs-install' ? t('account.pushIos')
      : support === 'unsupported' ? t('account.pushUnsupported')
        : support === 'denied' ? t('account.pushDenied')
          : me.pushSubscribed ? t('account.pushOn') : t('account.pushOff');

  const turnOn = async () => {
    const r = await ensurePush();
    if (r === 'ios') setInstallAsk(true);
    else if (r !== 'ok') toast(t(r === 'denied' ? 'account.pushDenied' : r === 'noserver' ? 'account.pushNotConfigured' : 'account.pushUnsupported'), { icon: 'info' });
  };

  const sendTest = async () => {
    setTesting(true);
    try {
      const r = await apiSend<{ reached: number }>('POST', '/me/push/test');
      toast(t(r.reached ? 'account.pushTestSent' : 'account.pushTestNone'), { tone: r.reached ? 'success' : 'neutral', icon: r.reached ? 'bell' : 'info' });
    } catch { toast(t('common.errorGeneric'), { tone: 'danger' }); } finally { setTesting(false); }
  };

  const toggle = async (type: NotificationType, v: boolean) => {
    try {
      await setPrefs({ [type]: v });
      if (v && !me.pushSubscribed) await turnOn();
    } catch { toast(t('common.errorGeneric'), { tone: 'danger' }); }
  };

  return (
    <section className="ub-panel-s" id="notifications">
      <div className="ub-eyebrow" style={{ marginBottom: 10 }}>{t('account.notifications')}</div>
      {NOTIFICATION_TYPES.map((type) => (
        <Switch key={type} label={t(`account.n.${type}` as const)} checked={me.notifications[type]} onChange={(v) => toggle(type, v)} />
      ))}
      <div style={{ marginTop: 8, fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>
        {t('account.window', { from: me.notifications.windowStart, to: me.notifications.windowEnd })}{' '}
        <button type="button" className="ub-linkbtn" style={{ minHeight: 'auto' }} onClick={() => setEditWindow((v) => !v)}>{t('account.windowChange')}</button>
      </div>
      {editWindow && (
        <form style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'flex-end', marginTop: 'var(--space-3)', flexWrap: 'wrap' }}
          onSubmit={async (e) => {
            e.preventDefault();
            if (from >= to) { toast(t('common.errorGeneric'), { tone: 'danger' }); return; }
            try { await setPrefs({ windowStart: from, windowEnd: to }); setEditWindow(false); } catch { toast(t('common.errorGeneric'), { tone: 'danger' }); }
          }}>
          <label style={{ display: 'grid', gap: 4, fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>{t('account.windowFrom')}
            <input className="ub-select ub-numeric" type="time" value={from} min="07:00" max="20:00" step={900} onChange={(e) => setFrom(e.target.value)} />
          </label>
          <label style={{ display: 'grid', gap: 4, fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>{t('account.windowTo')}
            <input className="ub-select ub-numeric" type="time" value={to} min="07:00" max="20:00" step={900} onChange={(e) => setTo(e.target.value)} />
          </label>
          <Button type="submit" size="md">{t('common.save')}</Button>
        </form>
      )}
      <p style={{ marginTop: 'var(--space-3)', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>{pushLine}</p>
      {serverReady && !me.pushSubscribed && support !== 'unsupported' && support !== 'denied' && (
        <div style={{ marginTop: 'var(--space-2)' }}><Button size="sm" variant="secondary" iconLeft="bell" onClick={turnOn}>{t('account.pushEnable')}</Button></div>
      )}
      {serverReady && me.pushSubscribed && support === 'ok' && (
        <div style={{ marginTop: 'var(--space-2)' }}>
          <Button size="sm" variant="quiet" iconLeft="bell" loading={testing} onClick={sendTest}>{t('account.pushTest')}</Button>
        </div>
      )}
      {installAsk && <InstallPrompt force onClose={() => setInstallAsk(false)} />}
    </section>
  );
}

function DeleteAccount() {
  const { t, lang } = useI18n();
  const { setMe, toast } = useApp();
  const [, navigate] = useLocation();
  const [open, setOpen] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  return (
    <>
      <Button variant="quiet" size="sm" onClick={() => setOpen(true)}>{t('account.delete')}</Button>
      {open && (
        <Sheet open fixed title={t('account.delete.title')} onClose={() => setOpen(false)} lang={lang}>
          <p style={{ fontSize: 'var(--text-base)', color: 'var(--text-secondary)', marginBottom: 'var(--space-4)' }}>{t('account.delete.body')}</p>
          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            <Button variant="quiet" onClick={() => setOpen(false)}>{t('common.cancel')}</Button>
            <Button variant="danger" fullWidth loading={busy} onClick={async () => {
              setBusy(true);
              try {
                await apiSend('DELETE', '/me');
                setMe(null);
                setOpen(false);
                toast(t('account.deleted'), { tone: 'success', icon: 'circle-check' });
                navigate('/');
              } catch { toast(t('common.errorGeneric'), { tone: 'danger' }); } finally { setBusy(false); }
            }}>{t('account.delete.confirm')}</Button>
          </div>
        </Sheet>
      )}
    </>
  );
}
