/* Cookie-free usage counts (docs/11, D-18): an event name goes to our own API and nothing else.
   "first_visit" is sent once per device, from a flag kept on the phone — the server never
   receives an identifier, only the count. */
import type { AnalyticsEvent } from '@ubite/shared';
import { localDate } from '@ubite/shared';

export function track(name: AnalyticsEvent) {
  try {
    const body = JSON.stringify({ name });
    if (navigator.sendBeacon && navigator.sendBeacon('/api/analytics/event', new Blob([body], { type: 'text/plain' }))) return;
    fetch('/api/analytics/event', { method: 'POST', body, keepalive: true, headers: { 'Content-Type': 'text/plain' } }).catch(() => {});
  } catch { /* never let analytics break the app */ }
}

export function isStandalone() {
  return window.matchMedia?.('(display-mode: standalone)').matches || (navigator as any).standalone === true;
}

/** Distinct days this device opened the app — drives the install prompt and the feedback offer,
 *  both of which wait until the app has proved useful (docs/03 F5, docs/18 Onboarding). */
export function usageDays(): number {
  try {
    const days: string[] = JSON.parse(localStorage.getItem('ubite.days') || '[]');
    return days.length;
  } catch {
    return 0;
  }
}

export function startAnalytics() {
  try {
    if (!localStorage.getItem('ubite.seen')) {
      localStorage.setItem('ubite.seen', '1');
      track('first_visit');
    }
    const days: string[] = JSON.parse(localStorage.getItem('ubite.days') || '[]');
    const today = localDate();
    if (!days.includes(today)) localStorage.setItem('ubite.days', JSON.stringify([...days, today].slice(-30)));
  } catch { /* storage blocked */ }
  if (isStandalone()) track('standalone_open');
  const params = new URLSearchParams(location.search);
  // ?src=kiosk: the kiosk QR turning into a first open — its primary success number (docs/08).
  if (params.get('src') === 'kiosk') {
    track('kiosk_qr_open');
    params.delete('src');
    history.replaceState(null, '', location.pathname + (params.toString() ? `?${params}` : '') + location.hash);
  }
  window.addEventListener('appinstalled', () => track('pwa_installed'));
}
