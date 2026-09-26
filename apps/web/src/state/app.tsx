/* Application state shared by every student screen: the session, status, the crowding estimate,
   toasts, and the three sheets any screen can open — sign-in at the point of need, the wait
   report and feedback. */
import React from 'react';
import type { CrowdingCurrent, LoyaltyResponse, Me, StatusResponse, WaitReportResponse } from '@ubite/shared';
import { apiGet, apiSend, ApiError } from '../api/client';
import { clearCache, readCache, useResource, writeCache, type Resource } from '../api/cache';
import { enqueue } from '../api/outbox';
import { useI18n } from '../i18n';
import { track } from '../analytics';

export type SignInReason = 'favorite' | 'rate' | 'loyalty' | 'notifications' | 'account' | 'staff';
export type Theme = 'system' | 'light' | 'dark';
export type ReportOutcome = 'done' | 'queued' | 'already' | 'closed' | 'rejected' | 'invalid' | 'error';

interface ToastState {
  id: number;
  message: string;
  tone?: 'neutral' | 'success' | 'danger';
  icon?: string;
  action?: string;
  onAction?: () => void;
}

interface AppState {
  status: Resource<StatusResponse>;
  crowding: Resource<CrowdingCurrent>;
  me: Me | null;
  setMe: (me: Me | null) => void;
  refreshMe: () => Promise<void>;
  loyalty: Resource<LoyaltyResponse>;
  signedIn: boolean;
  /** Runs `then` now when signed in; otherwise asks for sign-in with the reason, then runs it. */
  requireSignIn: (reason: SignInReason, then?: () => void) => void;
  signInOpen: SignInReason | null;
  closeSignIn: () => void;
  completeSignIn: (me: Me) => void;
  signOut: () => Promise<void>;
  toast: (message: string, opts?: Omit<ToastState, 'id' | 'message'>) => void;
  toastState: ToastState | null;
  dismissToast: () => void;
  sheet: 'report' | 'feedback' | null;
  openSheet: (s: 'report' | 'feedback' | null) => void;
  submitReport: (minutes: number) => Promise<ReportOutcome>;
  lastReportAt: number | null;
  theme: Theme;
  setTheme: (t: Theme) => void;
}

const Ctx = React.createContext<AppState | null>(null);

export function useApp() {
  const c = React.useContext(Ctx);
  if (!c) throw new Error('useApp outside AppProvider');
  return c;
}

function applyTheme(t: Theme) {
  if (t === 'system') document.documentElement.removeAttribute('data-theme');
  else document.documentElement.setAttribute('data-theme', t);
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const { t, lang, setLang } = useI18n();
  const status = useResource<StatusResponse>('status', '/status', { refreshMs: 5 * 60_000 });
  // docs/03 F3: refreshes every 30 seconds while the screen is open.
  const crowding = useResource<CrowdingCurrent>('crowding', '/crowding/current', { refreshMs: 30_000 });

  const [me, setMeState] = React.useState<Me | null>(() => readCache<Me>('me')?.data ?? null);
  const setMe = React.useCallback((m: Me | null) => {
    setMeState(m);
    if (m) writeCache('me', m); else { clearCache('me'); clearCache('loyalty'); clearCache('history'); }
  }, []);
  const refreshMe = React.useCallback(async () => {
    try {
      const m = await apiGet<Me>('/me');
      setMe(m);
    } catch (e) {
      if ((e as ApiError).status === 401) setMe(null);
    }
  }, [setMe]);
  React.useEffect(() => { refreshMe(); }, [refreshMe]);

  // The interface language follows the account once signed in, and the account follows a switch.
  React.useEffect(() => { if (me && me.locale !== lang) setLang(me.locale); }, [me?.id]); // eslint-disable-line react-hooks/exhaustive-deps
  React.useEffect(() => {
    if (me && me.locale !== lang) apiSend<Me>('PATCH', '/me', { locale: lang }).then(setMe).catch(() => {});
  }, [lang]); // eslint-disable-line react-hooks/exhaustive-deps

  const loyaltyOn = !!status.data?.features.loyalty && !!me && me.role === 'student';
  const loyalty = useResource<LoyaltyResponse>(loyaltyOn ? `loyalty:${me!.id}` : null, loyaltyOn ? '/me/loyalty' : null, { refreshMs: 5 * 60_000 });

  const [signInOpen, setSignInOpen] = React.useState<SignInReason | null>(null);
  const pending = React.useRef<(() => void) | null>(null);
  const requireSignIn = React.useCallback((reason: SignInReason, then?: () => void) => {
    if (me) { then?.(); return; }
    pending.current = then || null;
    setSignInOpen(reason);
  }, [me]);
  const completeSignIn = React.useCallback((m: Me) => {
    setMe(m);
    setSignInOpen(null);
    track('sign_in');
    const next = pending.current;
    pending.current = null;
    // Back to the action the student was attempting (docs/10).
    if (next) window.setTimeout(next, 50);
  }, [setMe]);

  const [toastState, setToast] = React.useState<ToastState | null>(null);
  const toastTimer = React.useRef<number | undefined>(undefined);
  const toast = React.useCallback((message: string, opts: Omit<ToastState, 'id' | 'message'> = {}) => {
    window.clearTimeout(toastTimer.current);
    setToast({ id: Date.now(), message, ...opts });
    toastTimer.current = window.setTimeout(() => setToast(null), opts.action ? 6000 : 3200);
  }, []);

  const signOut = React.useCallback(async () => {
    await apiSend('POST', '/auth/logout').catch(() => {});
    setMe(null);
    toast(t('account.signedOutToast'));
  }, [setMe, toast, t]);

  const [sheet, openSheet] = React.useState<'report' | 'feedback' | null>(null);

  const [lastReportAt, setLastReportAt] = React.useState<number | null>(() => {
    const v = Number(localStorage.getItem('ubite.lastReportAt'));
    return Number.isFinite(v) && v > 0 ? v : null;
  });
  const markReported = () => {
    const now = Date.now();
    setLastReportAt(now);
    try { localStorage.setItem('ubite.lastReportAt', String(now)); } catch { /* ignore */ }
  };

  const submitReport = React.useCallback(async (minutes: number): Promise<ReportOutcome> => {
    if (!Number.isInteger(minutes) || minutes < 0 || minutes > 120) return 'invalid';
    const body = { waitedMinutes: minutes, clientReportedAt: new Date().toISOString() };
    track('report_submit');
    if (!navigator.onLine) { enqueue({ kind: 'report', body }); markReported(); return 'queued'; }
    try {
      const r = await apiSend<WaitReportResponse>('POST', '/crowding/report', body);
      markReported();
      crowding.mutate(r.estimate);
      return r.accepted ? 'done' : 'rejected';
    } catch (e) {
      const err = e as ApiError;
      if (err.offline) { enqueue({ kind: 'report', body }); markReported(); return 'queued'; }
      if (err.code === 'already_reported') { markReported(); return 'already'; }
      if (err.code === 'closed') return 'closed';
      return 'error';
    }
  }, [crowding]);

  const [theme, setThemeState] = React.useState<Theme>(() => {
    const v = localStorage.getItem('ubite.theme');
    return v === 'light' || v === 'dark' ? v : 'system';
  });
  const setTheme = React.useCallback((v: Theme) => {
    setThemeState(v);
    applyTheme(v);
    try { if (v === 'system') localStorage.removeItem('ubite.theme'); else localStorage.setItem('ubite.theme', v); } catch { /* ignore */ }
  }, []);

  const value: AppState = {
    status, crowding, me, setMe, refreshMe, loyalty, signedIn: !!me,
    requireSignIn, signInOpen, closeSignIn: () => { pending.current = null; setSignInOpen(null); }, completeSignIn, signOut,
    toast, toastState, dismissToast: () => setToast(null),
    sheet, openSheet, submitReport, lastReportAt,
    theme, setTheme,
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
