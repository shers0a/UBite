/* Home — "the only screen that really matters" (docs/18). Most important at the top, density
   increasing as importance falls: crowding, menu, loyalty, report, typical hours, announcements,
   footer. Built exactly as ui_kits/student-app/HomeScreen.jsx, on live data. */
import React from 'react';
import { useLocation } from 'wouter';
import type { CrowdingTypical, DietTag, MenuTodayResponse } from '@ubite/shared';
import { DIET_TAGS, DIET_TAG_LABELS, addDays, localDate, matchesDiet, weekdayOf } from '@ubite/shared';
import {
  Announcement, AppFooter, AppHeader, Button, Chip, CrowdingByHour, CrowdingIndicator, DishRow, EmptyState, Icon,
  IconButton, Logo, LoyaltyDots, OfflineBanner, Skeleton, Spotlight, WaitReport,
} from '@ds';
import { useNow, useOnline, useResource } from '../../api/cache';
import { apiSend } from '../../api/client';
import { useOutboxCount } from '../../api/outbox';
import { formatDate, formatDayShort, formatTime, minutesText, useI18n, weekdayName } from '../../i18n';
import { useApp } from '../../state/app';
import { useNotifications } from '../../state/notifications';
import { track, usageDays } from '../../analytics';
import { A } from '../../assets';
import { CategoryPills, MenuList, PickCard, groupMenu } from '../../components/Menu';
import { InstallPrompt } from '../../components/Chrome';
import { GlassFloat, GlassIcon, GlassLayer } from '../../components/Glass';
import { haptic, usePullToRefresh } from '../../motion';
import { reportMessage } from '../../components/Sheets';
import { crowdingView } from './crowding';

export function Home() {
  const { t, lang, setLang } = useI18n();
  const app = useApp();
  const { status, crowding, me, loyalty, requireSignIn, openSheet, toast } = app;
  const [, navigate] = useLocation();
  const online = useOnline();
  const queued = useOutboxCount();
  const now = useNow(5000);

  const menuRes = useResource<MenuTodayResponse>('menu', '/menu/today', { refreshMs: 60_000 });
  const typical = useResource<CrowdingTypical>('typical', '/crowding/typical', { refreshMs: 30 * 60_000 });
  const view = crowdingView(crowding.data, crowding.fetchedAt, status.data, lang, now);
  const open = status.data ? status.data.open : !!crowding.data?.open;
  const offline = !online || (crowding.stale && menuRes.stale);
  const refreshAll = React.useCallback(
    () => Promise.all([crowding.refresh(), menuRes.refresh(), status.refresh(), typical.refresh()]),
    [crowding.refresh, menuRes.refresh, status.refresh, typical.refresh],
  );
  const ptr = usePullToRefresh(refreshAll);

  /* ── Scroll: parallax on the hall photo, mini answer after 300px ── */
  const photoRef = React.useRef<HTMLDivElement>(null);
  const hoursRef = React.useRef<HTMLElement>(null);
  const groupRefs = React.useRef<Record<string, HTMLElement | null>>({});
  const [miniOut, setMiniOut] = React.useState(false);
  const heroRef = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    let frame = 0;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const y = window.scrollY;
        if (photoRef.current && !reduce) {
          photoRef.current.style.transform = `translateY(${y * 0.4}px) scale(${1 + Math.min(y, 300) * 0.0006})`;
        }
        setMiniOut(y > 300);
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => { window.removeEventListener('scroll', onScroll); cancelAnimationFrame(frame); };
  }, []);

  /* ── Filters: usable without an account; a saved preference is pre-applied (docs/03 F11) ── */
  const [filters, setFilters] = React.useState<DietTag[]>(() => (me?.dietPreference?.length ? me.dietPreference : []));
  const appliedSaved = React.useRef(!!me?.dietPreference?.length);
  React.useEffect(() => {
    if (!appliedSaved.current && me?.dietPreference?.length) { appliedSaved.current = true; setFilters(me.dietPreference); }
  }, [me?.dietPreference]);
  const toggleFilter = (tag: DietTag) => {
    track('filter_use');
    setFilters((f) => (f.includes(tag) ? f.filter((x) => x !== tag) : [...f, tag]));
  };

  const menu = menuRes.data?.menu ?? null;
  const items = menu?.items ?? [];
  const visible = items.filter((i) => matchesDiet(i.dish.tags, filters));
  const groups = groupMenu(visible);
  const allGroups = groupMenu(items);
  const [activeCat, setActiveCat] = React.useState<string | null>(null);
  const jump = (key: string) => {
    const el = groupRefs.current[key];
    if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 88, behavior: 'smooth' });
    setActiveCat(key);
  };

  const favorites = new Set(me?.favorites ?? []);
  const toggleFavourite = (dishId: string) => requireSignIn('favorite', async () => {
    const current = app.me;
    const was = (current?.favorites ?? []).includes(dishId);
    const next = was ? (current?.favorites ?? []).filter((x) => x !== dishId) : [...(current?.favorites ?? []), dishId];
    if (current) app.setMe({ ...current, favorites: next });
    try {
      await apiSend('PUT', `/me/favorites/${dishId}`, { favorite: !was });
      if (!was) track('favorite_add');
    } catch {
      if (current) app.setMe(current);
      toast(t('common.errorGeneric'), { tone: 'danger', icon: 'triangle-alert' });
    }
  });
  const openDish = (id: string) => { track('dish_open'); navigate(`/dish/${id}`); };

  const picks = items.filter((i) => i.dish.rating.count > 0).sort((a, b) => (b.dish.rating.average ?? 0) - (a.dish.rating.average ?? 0)).slice(0, 6);

  /* ── Zone 4 state ── */
  const [reportState, setReportState] = React.useState<'idle' | 'sending' | 'done'>('idle');
  const [reportNote, setReportNote] = React.useState<string | null>(null);
  const suppressed = app.lastReportAt !== null && Date.now() - app.lastReportAt < 60 * 60_000 && reportState !== 'done';
  const onZoneReport = async (m: number | null) => {
    if (m === null) { openSheet('report'); return; }
    setReportState('sending');
    const outcome = await app.submitReport(m);
    if (outcome === 'done' || outcome === 'queued' || outcome === 'already') {
      haptic();
      setReportState('done');
      setReportNote(outcome === 'done' ? null : t(reportMessage(outcome)!));
    } else {
      setReportState('idle');
      toast(t(reportMessage(outcome)!), { tone: outcome === 'error' ? 'danger' : 'neutral', icon: 'info' });
    }
  };

  const { ensurePush, setPrefs } = useNotifications();
  const [installAsk, setInstallAsk] = React.useState(false);
  const enableMenuAlert = () => requireSignIn('notifications', async () => {
    const r = await ensurePush();
    if (r === 'ios') { setInstallAsk(true); return; }
    await setPrefs({ menu_published: true }).catch(() => {});
    toast(r === 'ok' ? t('account.pushOn') : t(r === 'denied' ? 'account.pushDenied' : r === 'noserver' ? 'account.pushNotConfigured' : 'account.pushUnsupported'),
      { tone: r === 'ok' ? 'success' : 'neutral', icon: r === 'ok' ? 'bell' : 'info' });
  });

  /* ── Zone 5: typical by hour ── */
  const tp = typical.data?.available ? typical.data : null;
  const slots = tp ? tp.slots.filter((s) => s.waitMinutes !== null) as Array<{ time: string; waitMinutes: number }> : [];
  const busiest = slots.length ? slots.reduce((a, b) => (b.waitMinutes > a.waitMinutes ? b : a)) : null;
  const quietest = slots.length ? slots.reduce((a, b) => (b.waitMinutes < a.waitMinutes ? b : a)) : null;
  const nowHHMM = formatTime(new Date(now), 'ro');
  const nowIndex = tp ? tp.slots.reduce((idx, s, i) => (s.time <= nowHHMM ? i : idx), -1) : -1;

  /* ── Zone 6: canteen announcements, plus upcoming schedule changes ── */
  const today = status.data?.today ?? localDate();
  const exceptions = (status.data?.exceptions ?? []).filter((e) => e.date >= today && e.date <= addDays(today, 7));

  const loyaltyOn = (status.data?.features.loyalty ?? true) && (!me || me.role === 'student');
  const rewardWaiting = !!loyalty.data?.rewards.length;

  return (
    <div className="ub-screen">
      {/* The answer the student came for is never more than a glance away. */}
      {/* Pull to refresh: follows the finger, spins while the data comes back. */}
      {(ptr.pull > 0 || ptr.busy) && (
        <div className="ub-ptr" aria-live="polite" style={{ transform: `translate(-50%, ${ptr.pull}px)`, opacity: Math.max(ptr.progress, ptr.busy ? 1 : 0) }}>
          <span className={ptr.busy ? 'ub-ptr-spin' : undefined} style={{ display: 'grid', transform: ptr.busy ? undefined : `rotate(${ptr.progress * 270}deg)` }}>
            <Icon name="refresh-cw" size={18} />
          </span>
          {ptr.busy && <span className="ub-visually-hidden">{t('common.loading')}</span>}
        </div>
      )}

      <GlassFloat hidden={!miniOut} padding="6px 6px 6px 14px" className="ub-miniglass"
        style={{ position: 'fixed', top: miniOut ? 'calc(34px + env(safe-area-inset-top))' : '-72px', left: '50%', zIndex: 25 }}>
      <div className="ub-mini">
        <span className="ub-mini-dot" data-level={view.noEstimate ? 'none' : view.level} />
        <strong>{view.level === 'closed' ? t('mini.closed') : view.noEstimate ? t('mini.none') : t(`mini.${view.level}` as const)}</strong>
        {view.level !== 'closed' && !view.noEstimate && <span className="ub-numeric">~{view.waitMinutes} {t('common.min')}</span>}
        <button type="button" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} aria-label={t('header.top')} tabIndex={miniOut ? 0 : -1}>
          <Icon name="chevron-down" size={16} style={{ transform: 'rotate(180deg)' }} />
        </button>
      </div>
      </GlassFloat>

      {/* Zone 1 — the hall photo drifts at 40% of scroll; the crowding card overlaps it by 64px. */}
      <div className="ub-hall">
        <div className="ub-hall-photo" ref={photoRef}><img src={A.hall} alt="" /></div>
        <div className="ub-hall-scrim" />
        <div className="ub-hall-head">
          <div style={{ opacity: miniOut ? 0 : 1 }}>
            <AppHeader sticky={false} transparent lang={lang}
              brand={<Logo variant="tray" size={30} level={view.noEstimate ? undefined : view.level} withText />}
              right={<>
                <GlassIcon><IconButton name="languages" label={t('header.lang')} onClick={() => { track('lang_switch'); setLang(lang === 'ro' ? 'en' : 'ro'); }} /></GlassIcon>
                <GlassIcon><IconButton name="bell" label={t('header.notifications')} onClick={() => requireSignIn('notifications', () => navigate('/account#notifications'))} /></GlassIcon>
                <GlassIcon><IconButton name="settings" label={t('header.account')} onClick={() => navigate('/account')} /></GlassIcon>
              </>} />
          </div>
        </div>
      </div>
      {/* Frosted band across the photo's lower edge, where it meets the wallpaper. */}
      <div className="ub-hall-seam" aria-hidden="true" />

      <main id="main">
        <div className="ub-hero ub-rise">
          {offline && (
            <div style={{ marginBottom: 'var(--space-3)' }}>
              <OfflineBanner variant="offline" lang={lang} queued={queued || undefined}
                updatedLabel={crowding.fetchedAt ? t('offline.updated', { time: formatTime(new Date(crowding.fetchedAt), lang) }) : undefined} />
            </div>
          )}
          <h1 className="ub-visually-hidden">UBite — {t('menu.title')}</h1>
          <div aria-live="polite" className="ub-hero-card" ref={heroRef}>
            <CrowdingIndicator level={view.level} waitMinutes={view.waitMinutes} quality={view.quality}
              updatedSecondsAgo={view.updatedSecondsAgo} lang={lang} opensAtLabel={view.opensAtLabel} hoursLabel={view.hoursLabel}
              loading={crowding.loading && !crowding.data} error={view.noEstimate && !crowding.loading}
              onReport={open && !view.noEstimate ? () => openSheet('report') : undefined}
              surface="glass" underlay={<GlassLayer box={heroRef} radius="--radius-lg" />} />
          </div>
          {view.noEstimate && open && (
            <div style={{ marginTop: 'var(--space-2)' }}>
              <Button variant="quiet" size="sm" iconLeft="clock" onClick={() => openSheet('report')}>{t('report.title')}</Button>
            </div>
          )}
        </div>

        {/* Picks rail — today's dishes by rating */}
        {picks.length >= 2 && (
          <section className="ub-rise" style={{ padding: 'var(--density-zone-1) 0 0' }} aria-labelledby="picks-title">
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 10, padding: '0 var(--gutter) 10px' }}>
              <h2 id="picks-title" style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-semibold)', minWidth: 0 }}>{t('home.picks')}</h2>
              <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{t('home.picksMeta')}</span>
            </div>
            <div className="ub-rail">
              {picks.map((item) => <PickCard key={item.dish.id} item={item} onClick={() => openDish(item.dish.id)} />)}
            </div>
          </section>
        )}

        <SpotlightRail
          offline={offline} closed={view.level === 'closed'} opensAtLabel={view.opensAtLabel} open={open}
          typical={tp && busiest && quietest && busiest.waitMinutes > quietest.waitMinutes ? { weekday: tp.weekday, busy: busiest, quiet: quietest } : null}
          loyaltyFilled={loyalty.data?.filled ?? null} rewardWaiting={rewardWaiting}
          menuAlertOn={!!me?.notifications.menu_published && !!me?.pushSubscribed}
          onHours={() => hoursRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })}
          onCard={() => navigate('/card')} onReport={() => openSheet('report')} onAlert={enableMenuAlert}
          onFeedback={() => openSheet('feedback')} />

        {/* Zone 2 — today's menu */}
        <section className="ub-reveal" style={{ padding: 'var(--density-zone-2) var(--gutter) 0' }} aria-labelledby="menu-title">
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 12, gap: 10 }}>
            <h2 id="menu-title" style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--weight-bold)', letterSpacing: 'var(--tracking-tight)' }}>{t('menu.title')}</h2>
            <span className="ub-numeric" style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>{formatDayShort(today, lang)}</span>
          </div>

          {allGroups.length > 1 && <CategoryPills groups={allGroups} active={activeCat} onJump={jump} />}

          <div className="ub-chiprow" style={{ marginTop: 10 }} role="group" aria-label={t('menu.filters')}>
            {DIET_TAGS.map((tag) => (
              <Chip key={tag} icon={DIET_TAG_LABELS[tag].icon} selected={filters.includes(tag)} onClick={() => toggleFilter(tag)}>
                {DIET_TAG_LABELS[tag][lang]}
              </Chip>
            ))}
          </div>
          {filters.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginTop: 'var(--space-1)', flexWrap: 'wrap' }}>
              {me?.dietPreference?.length ? <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>{t('menu.savedFilter')}</span> : null}
              <button type="button" className="ub-linkbtn" onClick={() => setFilters([])}>{t('menu.seeAll')}</button>
            </div>
          )}

          {menuRes.data?.outdated && menu && (
            <div style={{ margin: '12px 0' }}>
              <OfflineBanner variant="stale" lang={lang} updatedLabel={t('menu.staleLabel', { date: formatDayShort(menu.serviceDate, lang) })} />
            </div>
          )}

          <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius-md)', padding: '4px 14px 10px', marginTop: 14 }}>
            {menuRes.loading && !menuRes.data ? (
              [0, 1, 2].map((i) => <DishRow key={i} loading name="" price="" />)
            ) : menuRes.error && !menuRes.data ? (
              <div style={{ padding: '8px 0' }}>
                <EmptyState art={A.art.offline} icon="wifi-off" title={t('menu.error.title')} body={t('menu.error.body')} action={t('common.retry')} onAction={menuRes.refresh} />
              </div>
            ) : !menu ? (
              <div style={{ padding: '8px 0' }}>
                <EmptyState art={A.art.emptyMenu} icon="utensils" title={t('menu.empty.title')} body={t('menu.empty.body')} />
              </div>
            ) : visible.length === 0 ? (
              <div style={{ padding: '8px 0' }}>
                <EmptyState compact art={A.art.noResults} icon="sliders-horizontal" title={t('menu.noResults.title')}
                  body={t('menu.noResults.body')} action={t('menu.noResults.action')} onAction={() => setFilters([])} />
              </div>
            ) : (
              <MenuList groups={groups} favorites={favorites} onOpen={openDish} onFavourite={toggleFavourite}
                registerGroup={(key, el) => { groupRefs.current[key] = el; }} />
            )}
          </div>
          {menuRes.stale && menuRes.fetchedAt && (
            <p className="ub-caption ub-numeric" style={{ marginTop: 'var(--space-2)' }}>{t('menu.cached', { time: formatTime(new Date(menuRes.fetchedAt), lang) })}</p>
          )}
        </section>

        {/* Zone 3 — loyalty */}
        {loyaltyOn && (
          <section className="ub-reveal" style={{ padding: 'var(--density-zone-2) var(--gutter) 0' }}>
            <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius-md)', padding: 16 }}>
              {me && me.role === 'student' && !loyalty.data ? (
                <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center' }}>
                  <Skeleton width={120} height={16} /><Skeleton width="50%" height={16} />
                </div>
              ) : (
                <LoyaltyDots filled={loyalty.data?.filled ?? 0} total={5} signedIn={!!me} lang={lang}
                  onAdd={() => navigate('/visit')} onSignIn={() => requireSignIn('loyalty')} />
              )}
            </div>
          </section>
        )}

        {/* Zone 4 — report your wait: opening hours only, suppressed for an hour after a report */}
        {open && !suppressed && (
          <section className="ub-reveal" style={{ padding: 'var(--density-zone-3) var(--gutter) 0' }}>
            <WaitReport state={reportState} lang={lang} onSubmit={onZoneReport} />
            {reportState === 'done' && reportNote && <p className="ub-caption" style={{ marginTop: 'var(--space-2)' }}>{reportNote}</p>}
          </section>
        )}

        {/* Zone 5 — typical crowding; hidden in week one while history accumulates */}
        {tp && busiest && quietest && (
          <section ref={hoursRef} className="ub-reveal" style={{ padding: 'var(--density-zone-4) var(--gutter) 0' }} aria-labelledby="typical-title">
            <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius-md)', padding: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10, gap: 'var(--space-2)', flexWrap: 'wrap' }}>
                <h3 id="typical-title" style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--weight-semibold)' }}>
                  {t('typical.title', { weekday: weekdayName(tp.weekday, lang, 'plural') })}
                </h3>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                  {t('typical.busy', { busy: busiest.time, quiet: quietest.time })}
                </span>
              </div>
              <CrowdingByHour data={tp.slots.map((s) => ({ label: s.time, value: s.waitMinutes ?? 0 }))} nowIndex={nowIndex >= 0 ? nowIndex : undefined} lang={lang} />
            </div>
          </section>
        )}

        {/* Zone 6 — announcements, only when present */}
        {(exceptions.length > 0 || (status.data?.announcements.length ?? 0) > 0) && (
          <section className="ub-reveal" style={{ padding: 'var(--density-zone-5) var(--gutter) 0', display: 'flex', flexDirection: 'column', gap: 'var(--density-zone-6)' }}>
            {exceptions.map((e) => (
              <Announcement key={e.date} tone="warning"
                title={exceptionTitle(e, lang)} body={e.note || undefined} date={formatDate(e.date, lang)} />
            ))}
            {status.data?.announcements.map((a) => (
              <Announcement key={a.id} title={lang === 'en' && a.bodyEn ? a.bodyEn : a.bodyRo}
                date={t('announce.until', { date: formatDate(localDate(new Date(a.endsAt)), lang) })} />
            ))}
          </section>
        )}

        {/* Zone 7 — footer, signed off with the city sketch */}
        <div aria-hidden="true" className="ub-reveal" style={{
          height: 120, marginTop: 'var(--density-zone-5)', background: 'var(--text-muted)', opacity: 0.35,
          WebkitMask: `url(${A.sketch}) center bottom / auto 100% no-repeat`, mask: `url(${A.sketch}) center bottom / auto 100% no-repeat`,
        }} />
        <AppFooter lang={lang} hoursLabel={view.hoursLabel} onLang={() => { track('lang_switch'); setLang(lang === 'ro' ? 'en' : 'ro'); }}
          links={[
            { label: t('footer.feedback'), href: '#feedback', onClick: () => openSheet('feedback') },
            { label: t('footer.privacy'), href: '/privacy', onClick: () => navigate('/privacy') },
            { label: t('footer.about'), href: '/about', onClick: () => navigate('/about') },
            me ? { label: t('footer.account'), href: '/account', onClick: () => navigate('/account') }
              : { label: t('footer.signIn'), href: '#signin', onClick: () => requireSignIn('account') },
          ]} />
        <div className="ub-nav-space" />
      </main>
      <InstallPrompt force={installAsk} onClose={() => setInstallAsk(false)} />
    </div>
  );
}

function exceptionTitle(e: { date: string; isClosed: boolean; opensAt: string | null; closesAt: string | null }, lang: 'ro' | 'en') {
  const day = weekdayName(weekdayOf(e.date), lang);
  const Day = day.charAt(0).toUpperCase() + day.slice(1);
  if (e.isClosed) return lang === 'ro' ? `${Day} cantina e închisă` : `${Day} the canteen is closed`;
  return lang === 'ro' ? `${Day} programul e ${e.opensAt}–${e.closesAt}` : `${Day} the hours are ${e.opensAt}–${e.closesAt}`;
}

/* ── The spotlight rail: things UBite really does, each with a character ─────────────────── */

interface RailProps {
  offline: boolean;
  closed: boolean;
  open: boolean;
  opensAtLabel: string;
  typical: { weekday: number; busy: { time: string; waitMinutes: number }; quiet: { time: string; waitMinutes: number } } | null;
  loyaltyFilled: number | null;
  rewardWaiting: boolean;
  menuAlertOn: boolean;
  onHours: () => void;
  onCard: () => void;
  onReport: () => void;
  onAlert: () => void;
  onFeedback: () => void;
}

function SpotlightRail(p: RailProps) {
  const { t, lang } = useI18n();
  const rail = React.useRef<HTMLDivElement>(null);
  const [index, setIndex] = React.useState(0);
  const feedbackDue = React.useMemo(() => {
    const last = Number(localStorage.getItem('ubite.feedbackAt') || 0);
    return usageDays() >= 3 && Date.now() - last > 14 * 86_400_000;
  }, []);
  type Card = { key: string; art?: string; video?: string; tone?: 'accent' | 'quiet' | 'inverse'; eyebrow: string; title: string; action?: string; onAction?: () => void };
  const cards: Card[] = [
    // What is true right now comes first: offline, closed. Then the tip, the loyalty nudge, the rest.
    ...(p.offline ? [{ key: 'offline', art: A.spot('offline'), tone: 'inverse' as const, eyebrow: t('spot.offline.eyebrow'), title: t('spot.offline.title') }] : []),
    ...(p.closed ? [{ key: 'closed', art: A.spot('nap'), eyebrow: t('spot.closed.eyebrow'), title: t('spot.closed.title', { when: p.opensAtLabel }),
      action: p.menuAlertOn ? t('spot.alert.on') : t('spot.alert.action'), onAction: p.menuAlertOn ? undefined : p.onAlert }] : []),
    ...(p.typical ? [{ key: 'tip', art: A.spot('run'), video: A.motion.run, eyebrow: t('spot.tip.eyebrow', { weekday: weekdayName(p.typical.weekday, lang) }),
      title: t('spot.tip.title', { quietTime: p.typical.quiet.time, quiet: minutesText(p.typical.quiet.waitMinutes, lang), busyTime: p.typical.busy.time, busy: minutesText(p.typical.busy.waitMinutes, lang) }),
      action: t('spot.tip.action'), onAction: p.onHours }] : []),
    ...(p.rewardWaiting ? [{ key: 'reward', art: A.spot('reward'), tone: 'quiet' as const, eyebrow: t('spot.loyalty.eyebrow'), title: t('spot.reward.title'), action: t('spot.loyalty.action'), onAction: p.onCard }]
      : p.loyaltyFilled === 4 ? [{ key: 'four', art: A.spot('reward'), tone: 'quiet' as const, eyebrow: t('spot.loyalty.eyebrow'), title: t('spot.loyalty.title'), action: t('spot.loyalty.action'), onAction: p.onCard }] : []),
    ...(p.open ? [{ key: 'report', art: A.spot('queue'), eyebrow: t('spot.report.eyebrow'), title: t('spot.report.title'), action: t('spot.report.action'), onAction: p.onReport }] : []),
    ...(!p.closed && !p.menuAlertOn ? [{ key: 'alert', art: A.spot('cook'), eyebrow: t('spot.alert.eyebrow'), title: t('spot.alert.title'), action: t('spot.alert.action'), onAction: p.onAlert }] : []),
    ...(feedbackDue ? [{ key: 'feedback', art: A.spot('friends'), tone: 'quiet' as const, eyebrow: t('spot.feedback.eyebrow'), title: t('spot.feedback.title'), action: t('spot.feedback.action'), onAction: p.onFeedback }] : []),
  ];
  if (!cards.length) return null;
  const go = (i: number) => {
    const el = rail.current;
    const first = el?.firstElementChild as HTMLElement | null;
    if (el && first) el.scrollTo({ left: i * (first.offsetWidth + 12), behavior: 'smooth' });
  };
  return (
    <section className="ub-rise" style={{ padding: 'var(--density-zone-1) 0 0' }} aria-label={t('home.spotRail')}>
      <div className="ub-spotrail" ref={rail} onScroll={(e) => {
        const el = e.currentTarget;
        const first = el.firstElementChild as HTMLElement | null;
        if (first) setIndex(Math.round(el.scrollLeft / (first.offsetWidth + 12)));
      }}>
        {cards.map(({ key, ...c }) => (
          <Spotlight key={key} {...c} style={{ flex: 'none', width: cards.length > 1 ? 'calc(100% - 2 * var(--gutter) - 20px)' : 'calc(100% - 2 * var(--gutter))', scrollSnapAlign: 'start' }} />
        ))}
      </div>
      {cards.length > 1 && (
        <div className="ub-dots" role="tablist" aria-label={t('home.spotDots')}>
          {cards.map((c, i) => (
            <button key={c.key} type="button" role="tab" aria-selected={index === i} aria-label={t('home.spotDot', { n: i + 1, total: cards.length })}
              data-on={index === i} onClick={() => go(i)} />
          ))}
        </div>
      )}
    </section>
  );
}
