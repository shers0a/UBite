/* Service worker registration, the install prompt and web push. */
import React from 'react';
import { registerSW } from 'virtual:pwa-register';
import { isStandalone, track } from '../analytics';

let updateSW: ((reload?: boolean) => Promise<void>) | null = null;
const updateListeners = new Set<(ready: boolean) => void>();
let updateReady = false;

export function startServiceWorker(opts: { autoReload?: boolean } = {}) {
  if (!('serviceWorker' in navigator) || import.meta.env.DEV) return;
  updateSW = registerSW({
    immediate: true,
    onNeedRefresh() {
      // The kiosk has nobody to tap "reload": it takes the update at once.
      if (opts.autoReload) { updateSW?.(true); return; }
      updateReady = true;
      updateListeners.forEach((l) => l(true));
    },
    onRegisteredSW(_url, reg) {
      // Look for a new version every hour; deploys happen outside opening hours (docs/12).
      if (reg) window.setInterval(() => reg.update().catch(() => {}), 60 * 60_000);
    },
  });
}

export function useUpdateReady(): [boolean, () => void] {
  const [ready, setReady] = React.useState(updateReady);
  React.useEffect(() => {
    updateListeners.add(setReady);
    return () => { updateListeners.delete(setReady); };
  }, []);
  return [ready, () => updateSW?.(true)];
}

export const isIos = () => /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

/* ── Install (docs/18: second or third visit, or contextually) ────────────────────────── */

let deferred: any = null;
const installListeners = new Set<() => void>();
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferred = e;
    installListeners.forEach((l) => l());
  });
  window.addEventListener('appinstalled', () => { deferred = null; installListeners.forEach((l) => l()); });
}

export function useInstall() {
  const [, force] = React.useReducer((x: number) => x + 1, 0);
  React.useEffect(() => {
    installListeners.add(force);
    return () => { installListeners.delete(force); };
  }, []);
  return {
    installed: isStandalone(),
    canPrompt: !!deferred,
    ios: isIos() && !isStandalone(),
    async prompt() {
      if (!deferred) return false;
      track('install_prompt_accepted');
      deferred.prompt();
      const choice = await deferred.userChoice.catch(() => null);
      deferred = null;
      installListeners.forEach((l) => l());
      return choice?.outcome === 'accepted';
    },
  };
}

/* ── Web push ─────────────────────────────────────────────────────────────────────────── */

export type PushSupport = 'ok' | 'unsupported' | 'ios-needs-install' | 'denied';

export function pushSupport(): PushSupport {
  if (isIos() && !isStandalone()) return 'ios-needs-install';
  if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) return 'unsupported';
  if (Notification.permission === 'denied') return 'denied';
  return 'ok';
}

function b64ToBytes(b64: string) {
  const pad = '='.repeat((4 - (b64.length % 4)) % 4);
  const raw = atob((b64 + pad).replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

/** Must run inside a tap — browsers only ask for permission after a user gesture. */
export async function subscribePush(vapidPublicKey: string): Promise<PushSubscriptionJSON | null> {
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') return null;
  const reg = await navigator.serviceWorker.ready;
  const existing = await reg.pushManager.getSubscription();
  const sub = existing || await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64ToBytes(vapidPublicKey) });
  track('push_enabled');
  return sub.toJSON();
}
