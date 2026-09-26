/// <reference lib="webworker" />
/* The service worker (docs/06 "Offline", docs/04 "Offline and resilience").
   - The app shell and the brand layer are precached: the app opens with no signal at all.
   - Every navigation gets the shell — the application never shows a browser error page, which
     matters most on the kiosk, "because that is what people will photograph" (docs/08).
   - Menu, catalogue, status and crowding: network first, the last good copy when offline.
   - Dish photos: cache first, they never change behind a URL.
   - Web push: the four notification types. */
import { clientsClaim } from 'workbox-core';
import { cleanupOutdatedCaches, createHandlerBoundToURL, precacheAndRoute } from 'workbox-precaching';
import { NavigationRoute, registerRoute } from 'workbox-routing';
import { CacheFirst, NetworkFirst } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';

declare const self: ServiceWorkerGlobalScope & { __WB_MANIFEST: Array<{ url: string; revision: string | null }> };

self.addEventListener('message', (e) => {
  if (e.data?.type === 'SKIP_WAITING') self.skipWaiting();
});
clientsClaim();
cleanupOutdatedCaches();
precacheAndRoute(self.__WB_MANIFEST);

registerRoute(new NavigationRoute(createHandlerBoundToURL('/index.html'), { denylist: [/^\/api\//] }));

registerRoute(
  ({ url, request }) => request.method === 'GET' && url.pathname.startsWith('/api/dishes/') && url.pathname.endsWith('/photo'),
  new CacheFirst({ cacheName: 'ubite-photos', plugins: [new ExpirationPlugin({ maxEntries: 80, maxAgeSeconds: 60 * 86_400 })] }),
);

registerRoute(
  ({ url, request }) => request.method === 'GET' && /^\/api\/(menu|dishes|status|crowding)(\/|$)/.test(url.pathname),
  new NetworkFirst({ cacheName: 'ubite-api', networkTimeoutSeconds: 6, plugins: [new ExpirationPlugin({ maxEntries: 120, maxAgeSeconds: 14 * 86_400 })] }),
);

registerRoute(
  ({ url }) => url.pathname.startsWith('/motion/'),
  new CacheFirst({ cacheName: 'ubite-motion', plugins: [new ExpirationPlugin({ maxEntries: 6 })] }),
);

self.addEventListener('push', (event) => {
  let data: { title?: string; body?: string; url?: string; tag?: string; lang?: string } = {};
  try { data = event.data?.json() ?? {}; } catch { data = { title: 'UBite', body: event.data?.text() }; }
  // The badge is the tray-U as a silhouette: Android paints it in one colour in the status bar.
  const options: NotificationOptions & { renotify?: boolean; vibrate?: number[]; timestamp?: number } = {
    body: data.body || '',
    icon: '/icons/icon-192.png',
    badge: '/icons/badge-96.png',
    tag: data.tag,
    // A newer "it is quiet now" replaces the older one, and still tells the student.
    renotify: !!data.tag,
    lang: data.lang || 'ro',
    timestamp: Date.now(),
    vibrate: [60, 40, 60],
    data: { url: data.url || '/' },
  };
  event.waitUntil(self.registration.showNotification(data.title || 'UBite', options));
});

/* Browsers rotate push subscriptions now and then; without this the student silently stops
   receiving notifications. Subscribe again with the server's key and tell the server. */
function b64ToBytes(b64: string) {
  const pad = '='.repeat((4 - (b64.length % 4)) % 4);
  const raw = atob((b64 + pad).replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}
self.addEventListener('pushsubscriptionchange', (event) => {
  (event as ExtendableEvent).waitUntil((async () => {
    const status = await fetch('/api/status').then((r) => r.json()).catch(() => null);
    if (!status?.vapidPublicKey) return;
    const sub = await self.registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64ToBytes(status.vapidPublicKey) });
    await fetch('/api/me/push', {
      method: 'POST', credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json', 'X-UBite': '1' },
      body: JSON.stringify(sub.toJSON()),
    }).catch(() => {});
  })());
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const target = new URL(event.notification.data?.url || '/', self.location.origin).href;
  event.waitUntil((async () => {
    const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const w of windows) {
      if ('focus' in w) {
        await (w as WindowClient).navigate(target).catch(() => {});
        return (w as WindowClient).focus();
      }
    }
    return self.clients.openWindow(target);
  })());
});
