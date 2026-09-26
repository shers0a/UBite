/* The kiosk's data: today's menu and the crowding estimate, cached so a weak signal never blanks
   the wall (docs/08 "Offline behaviour"), and a QR code that counts its own conversions. */
import React from 'react';
import type { CrowdingCurrent, MenuTodayResponse, StatusResponse } from '@ubite/shared';
import { useResource } from '../../api/cache';

export function useKioskData() {
  const menu = useResource<MenuTodayResponse>('kiosk:menu', '/menu/today', { refreshMs: 60_000 });
  const crowding = useResource<CrowdingCurrent>('kiosk:crowding', '/crowding/current', { refreshMs: 30_000 });
  const status = useResource<StatusResponse>('kiosk:status', '/status', { refreshMs: 5 * 60_000 });
  const qrUrl = `${(status.data?.publicUrl || location.origin).replace(/\/$/, '')}/?src=kiosk`;
  return { menu, crowding, status, qrUrl, displayUrl: qrUrl.replace(/^https?:\/\//, '').replace(/\/\?src=kiosk$/, '') };
}

/** Keep the tablet's screen on while the page is visible (docs/08 "Screen always on"). */
export function useWakeLock() {
  React.useEffect(() => {
    let lock: any = null;
    const request = async () => {
      try { lock = await (navigator as any).wakeLock?.request('screen'); } catch { /* not supported or denied */ }
    };
    const onVisible = () => { if (document.visibilityState === 'visible') request(); };
    request();
    document.addEventListener('visibilitychange', onVisible);
    return () => { document.removeEventListener('visibilitychange', onVisible); lock?.release?.().catch(() => {}); };
  }, []);
}

/** The kiosk reads in the kit's dark theme by default; ?theme=light for a bright entrance. */
export function useKioskTheme() {
  React.useEffect(() => {
    const t = new URLSearchParams(location.search).get('theme');
    document.documentElement.setAttribute('data-theme', t === 'light' ? 'light' : 'dark');
    document.documentElement.lang = 'ro';
    document.title = 'UBite — kiosk';
  }, []);
}

export function useClock() {
  const [now, setNow] = React.useState(() => new Date());
  React.useEffect(() => {
    const t = window.setInterval(() => setNow(new Date()), 10_000);
    return () => window.clearInterval(t);
  }, []);
  return now;
}
