/* App chrome around the student screens: the floating bottom nav, the toast, the update notice
   and the contextual install prompt — all as drawn in the student-app UI kit. */
import React from 'react';
import { useLocation } from 'wouter';
import { Button, Icon, Illustration, Pattern, Sheet, Skeleton, Toast, Wordmark } from '@ds';
import { useI18n } from '../i18n';
import { useApp } from '../state/app';
import { isIos, useInstall, useUpdateReady } from '../pwa';
import type { StringKey } from '../i18n/strings';
import { track, usageDays } from '../analytics';
import { A } from '../assets';
import { reducedMotion, useScrollFold } from '../motion';
import { GlassFloat } from './Glass';

export function BottomNav() {
  const { t } = useI18n();
  const { status, requireSignIn, me, loyalty: card } = useApp();
  const [location, navigate] = useLocation();
  // A free meal waiting shows as a badge on the installed app's icon, like an unread message.
  const rewards = card.data?.rewards.length ?? 0;
  React.useEffect(() => {
    const n = navigator as Navigator & { setAppBadge?: (c?: number) => Promise<void>; clearAppBadge?: () => Promise<void> };
    (rewards ? n.setAppBadge?.(rewards) : n.clearAppBadge?.())?.catch(() => {});
  }, [rewards]);
  // Folds to its icons while the student scrolls down, and opens again on the way up (Revolut).
  const folded = useScrollFold();
  // Loyalty belongs to students; the canteen and DCCAS accounts never see a card.
  const loyalty = (status.data?.features.loyalty ?? true) && (!me || me.role === 'student');
  const items: Array<[string, string, string, boolean]> = [
    ['/', 'utensils', t('nav.menu'), false],
    ...(loyalty ? [['/card', 'star', t('nav.card'), true], ['/visit', 'camera', t('nav.visit'), true]] as Array<[string, string, string, boolean]> : []),
    ['/account', 'settings', t('nav.account'), false],
  ];
  return (
    <nav aria-label={t('nav.label')}>
      {/* The glass pill's centre sits 44 px above the bottom edge (safe area included). */}
      <GlassFloat padding="6px" className="ub-navglass"
        style={{ position: 'fixed', bottom: 'calc(44px + env(safe-area-inset-bottom))', left: '50%', zIndex: 28 }}>
        <div className="ub-nav" data-folded={folded} style={{ '--nav-items': items.length } as React.CSSProperties}>
          {items.map(([path, icon, label, needsAccount]) => (
            // Links, so a long press or a middle click opens the page like any other link.
            <a key={path} href={path} data-on={location === path} aria-current={location === path ? 'page' : undefined}
              onClick={(e) => {
                if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
                e.preventDefault();
                if (needsAccount) requireSignIn('loyalty', () => navigate(path));
                else navigate(path);
              }}>
              <Icon name={icon} size={20} />
              <span className="ub-nav-label">{label}</span>
            </a>
          ))}
        </div>
      </GlassFloat>
    </nav>
  );
}

/* The doodle wallpaper behind every screen, as on the kiosk: food drawn in the brand's hand, in
   the accent colour at a whisper. It moves at a quarter of the scroll — the one scroll-linked
   motion, part of the brand layer's drift (design system motion rules) — and stands still under
   reduced motion. Cards stay opaque surfaces, so the words never sit on the pattern. */
export function Wallpaper({ opacity = 0.06, size = 360 }: { opacity?: number; size?: number }) {
  const ref = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    if (reducedMotion()) return;
    let frame = 0;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => ref.current?.style.setProperty('--ub-wall-y', `${-((window.scrollY * 0.25) % size)}px`));
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => { window.removeEventListener('scroll', onScroll); cancelAnimationFrame(frame); };
  }, [size]);
  return (
    <div className="ub-wall" aria-hidden="true">
      <div className="ub-wall-layer" ref={ref} style={{ bottom: -size }}>
        <Pattern src={A.pattern} opacity={opacity} size={size} />
      </div>
    </div>
  );
}

/* While a screen's code arrives: a thin bar along the top and the page's outline, not a blank. */
export function RouteLoading() {
  const { t } = useI18n();
  return (
    <div aria-busy="true" aria-label={t('common.loading')} style={{ minHeight: '100vh' }}>
      <div className="ub-topbar" />
      <div style={{ padding: 'calc(var(--space-6) + env(safe-area-inset-top)) var(--gutter) 0', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
        <Skeleton width="42%" height={28} radius="var(--radius-sm)" />
        <Skeleton width="100%" height={148} radius="var(--radius-lg)" />
        <Skeleton width="100%" height={64} radius="var(--radius-md)" />
        <Skeleton width="100%" height={64} radius="var(--radius-md)" />
      </div>
    </div>
  );
}

export function Toaster() {
  const { toastState, dismissToast } = useApp();
  const { t } = useI18n();
  const [updateReady, reload] = useUpdateReady();
  if (toastState) {
    return (
      <div className="ub-toaster" key={toastState.id}>
        <Toast message={toastState.message} tone={toastState.tone} icon={toastState.icon} action={toastState.action}
          onAction={() => { toastState.onAction?.(); dismissToast(); }} />
      </div>
    );
  }
  if (updateReady) {
    return (
      <div className="ub-toaster">
        <Toast message={t('update.available')} icon="refresh-cw" action={t('update.reload')} onAction={reload} />
      </div>
    );
  }
  return null;
}

/* docs/18: the install prompt appears on the second or third visit, once the app has shown it is
   useful — or contextually, when the student asks for something that needs notifications. */
export function InstallPrompt({ force = false, onClose }: { force?: boolean; onClose?: () => void }) {
  const { t, lang } = useI18n();
  const install = useInstall();
  const [iosHelp, setIosHelp] = React.useState(false);
  const [hidden, setHidden] = React.useState(() => {
    try {
      const until = Number(localStorage.getItem('ubite.installLater') || 0);
      return Date.now() < until;
    } catch { return false; }
  });
  const eligible = force || (!hidden && usageDays() >= 2);
  const available = install.canPrompt || install.ios;
  React.useEffect(() => { if (eligible && available && !install.installed) track('install_prompt_shown'); }, [eligible, available, install.installed]);
  if (install.installed || !available || !eligible) return null;

  const later = () => {
    try { localStorage.setItem('ubite.installLater', String(Date.now() + 7 * 86_400_000)); } catch { /* ignore */ }
    setHidden(true);
    onClose?.();
  };
  const add = async () => {
    if (install.canPrompt) { await install.prompt(); onClose?.(); setHidden(true); }
    else setIosHelp(true);
  };

  return (
    <>
      {!iosHelp && (
        <div className="ub-install" role="dialog" aria-label={t('install.title')}>
          <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'flex-start' }}>
            {A.art.install
              ? <span aria-hidden="true" className="ub-install-art" style={{ WebkitMask: `url(${A.art.install}) center / contain no-repeat`, mask: `url(${A.art.install}) center / contain no-repeat` }} />
              : <Wordmark size={34} variant="mark" />}
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--weight-semibold)' }}>{t('install.title')}</div>
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginTop: 2 }}>{t('install.body')}</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 'var(--space-3)' }}>
            <Button size="sm" variant="quiet" onClick={later} style={{ whiteSpace: 'nowrap' }}>{t('install.later')}</Button>
            <Button size="sm" fullWidth onClick={add}>{t('install.add')}</Button>
          </div>
        </div>
      )}
      {iosHelp && (
        <Sheet open fixed title={t('install.ios.title')} onClose={() => { setIosHelp(false); later(); }} lang={lang}>
          <InstallSteps platform="ios" />
          <Button fullWidth onClick={() => { setIosHelp(false); later(); }} style={{ marginTop: 'var(--space-5)' }}>{t('install.ios.ok')}</Button>
        </Sheet>
      )}
    </>
  );
}

/* ── Getting the app: the same steps everywhere the student is asked to install ─────────── */

export type InstallPlatform = 'android' | 'ios';

/** What the student looks for on the phone, drawn inline in the step's sentence: the browser's
 *  button as a small key, and the app's own icon for the last step. */
const KEYS: Record<string, string> = { share: 'share', more: 'ellipsis', add: 'square-plus', menu: 'ellipsis-vertical', install: 'smartphone' };
function withKeys(text: string) {
  return text.split(/\{(\w+)\}/).map((part, i) => {
    if (i % 2 === 0) return part;
    if (part === 'app') return <img key={i} className="ub-key-app" src="/icons/icon-192.png" alt="" width={26} height={26} />;
    return KEYS[part] ? <span key={i} className="ub-key"><Icon name={KEYS[part]} size={16} /></span> : null;
  });
}

const STEPS: Record<InstallPlatform, Array<[StringKey, StringKey | null]>> = {
  ios: [['getapp.ios.1', 'getapp.ios.1note'], ['getapp.ios.2', 'getapp.ios.2note'], ['getapp.ios.3', null], ['getapp.ios.4', 'getapp.ios.4note']],
  android: [['getapp.android.1', 'getapp.android.1note'], ['getapp.android.2', 'getapp.android.2note'], ['getapp.android.3', null], ['getapp.android.4', 'getapp.android.4note']],
};

export function InstallSteps({ platform }: { platform: InstallPlatform }) {
  const { t } = useI18n();
  return (
    <ol className="ub-howto">
      {STEPS[platform].map(([step, note], i) => (
        <li key={step}>
          <span className="ub-howto-n ub-numeric" aria-hidden="true">{i + 1}</span>
          <div>
            <div className="ub-howto-title">{withKeys(t(step))}</div>
            {note && <p className="ub-howto-note">{withKeys(t(note))}</p>}
          </div>
        </li>
      ))}
    </ol>
  );
}

/** Pages opened inside Instagram, Facebook, TikTok and the like cannot be installed from there. */
const inAppBrowser = () => /FBAN|FBAV|FB_IAB|Instagram|Line\/|TikTok|musical_ly|Snapchat|GSA\/|; wv\)/i.test(navigator.userAgent);

/** Account: "Vrei UBite ca aplicație?" — one tap where the browser can install it, and the steps
 *  for the phone in the student's hand (the other one a tap away). Gone once it is installed. */
export function GetTheApp() {
  const { t } = useI18n();
  const install = useInstall();
  const [platform, setPlatform] = React.useState<InstallPlatform>(() => (isIos() ? 'ios' : 'android'));
  const [done, setDone] = React.useState(false);
  if (install.installed) return null;
  return (
    <section className="ub-panel-s" aria-labelledby="getapp-title">
      <div className="ub-eyebrow" style={{ marginBottom: 10 }}>{t('getapp.eyebrow')}</div>
      <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'flex-start' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h2 id="getapp-title" style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-semibold)', lineHeight: 'var(--leading-snug)' }}>{t('getapp.title')}</h2>
          <p style={{ fontSize: 'var(--text-base)', color: 'var(--text-secondary)', marginTop: 'var(--space-1)' }}>{t('getapp.body')}</p>
        </div>
        {/* The student on the phone, not the phone and bowl the signed-out card above already shows. */}
        <Illustration src={A.spot('phone')} tone="accent" boil width={96} height={96} style={{ flex: 'none', margin: '-6px -6px 0 0' }} />
      </div>

      {done ? (
        <p role="status" style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center', marginTop: 'var(--space-4)', fontSize: 'var(--text-base)', color: 'var(--status-success-text)', fontWeight: 'var(--weight-semibold)' }}>
          <Icon name="circle-check" size={18} />{t('getapp.done')}
        </p>
      ) : (
        <>
          {install.canPrompt && (
            <div style={{ marginTop: 'var(--space-4)' }}>
              <Button fullWidth iconLeft="download" onClick={async () => { if (await install.prompt()) setDone(true); }}>{t('getapp.install')}</Button>
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)', marginTop: 'var(--space-4)' }}>{t('getapp.orSteps')}</p>
            </div>
          )}
          <div className="ub-seg" role="group" aria-label={t('getapp.phone')} style={{ marginTop: install.canPrompt ? 'var(--space-2)' : 'var(--space-4)' }}>
            {(['android', 'ios'] as const).map((p) => (
              <button key={p} type="button" className="ub-scale" data-on={platform === p} aria-pressed={platform === p} onClick={() => setPlatform(p)}>
                {p === 'ios' ? 'iPhone' : 'Android'}
              </button>
            ))}
          </div>
          {inAppBrowser() && (
            <p style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 'var(--space-3)', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
              <Icon name="info" size={16} style={{ marginTop: 3 }} />{t('getapp.inApp')}
            </p>
          )}
          <div style={{ marginTop: 'var(--space-4)' }}><InstallSteps platform={platform} /></div>
        </>
      )}
    </section>
  );
}

/** The account screen's toggles, as drawn in the kit, made a real switch (role="switch"). */
export function Switch({ label, checked, onChange, disabled }: { label: string; checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <label className="ub-switch-row">
      <span>{label}</span>
      <button type="button" role="switch" aria-checked={checked} disabled={disabled} className="ub-switch" data-on={checked}
        onClick={() => onChange(!checked)}>
        <span className="ub-switch-knob" />
      </button>
    </label>
  );
}

export function ScreenHeaderSpacer() {
  return <div style={{ height: 'var(--space-1)' }} />;
}
