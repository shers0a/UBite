/* Web Push with VAPID. On iOS it needs the PWA installed to the home screen (docs/04), which is
   why the install prompt is contextual. A subscription the browser has dropped is deleted. */
import net from 'node:net';
import webpush from 'web-push';
import type { Logger } from 'pino';
import type { Config } from '../config';
import type { Queryable } from '../db/index';

export interface PushMessage {
  title: string;
  body: string;
  url?: string;
  tag?: string;
}

/* The server connects to whatever endpoint a subscription names, so a stored URL is a request the
   server makes on a student's behalf. Only the browsers' own push services are accepted: Chrome,
   Edge on Android, Samsung and Opera use FCM; Firefox uses Mozilla's autopush; Safari uses Apple's;
   Edge on Windows uses WNS. Exact hosts, or one or more labels before a fixed suffix. */
const PUSH_HOSTS = ['fcm.googleapis.com', 'android.googleapis.com', 'updates.push.services.mozilla.com'];
const PUSH_SUFFIXES = ['.push.services.mozilla.com', '.push.apple.com', '.notify.windows.com'];
const LABELS = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+$/;

/** https on 443 to a known push service, by name: no IP literal (so no private or loopback
 *  address), no other port, no credentials in the URL. */
export function isPushEndpoint(raw: string): boolean {
  let u: URL;
  try { u = new URL(raw); } catch { return false; }
  if (u.protocol !== 'https:' || (u.port !== '' && u.port !== '443') || u.username || u.password) return false;
  const host = u.hostname.toLowerCase();
  // The URL parser turns 0x7f.1, 2130706433 and the like into 127.0.0.1; [::1] keeps its brackets.
  if (net.isIP(host.replace(/^\[|\]$/g, ''))) return false;
  if (PUSH_HOSTS.includes(host)) return true;
  return PUSH_SUFFIXES.some((s) => host.endsWith(s) && LABELS.test(host.slice(0, -s.length + 1)));
}

export interface Pusher {
  readonly enabled: boolean;
  readonly publicKey: string | null;
  /** Sends to every subscription of these users; returns how many users had one. */
  sendToUsers(db: Queryable, userIds: string[], message: (locale: 'ro' | 'en') => PushMessage): Promise<number>;
}

export function createPusher(cfg: Config, log: Logger): Pusher {
  const keys = !!(cfg.VAPID_PUBLIC_KEY && cfg.VAPID_PRIVATE_KEY);
  // A public demo (DEMO_SHOW_CODES) lets anyone in, so it sends nothing: phones may subscribe and
  // the subscriptions are stored, but no message ever leaves, whoever publishes a menu there.
  const enabled = keys && !cfg.DEMO_SHOW_CODES;
  if (keys && cfg.DEMO_SHOW_CODES) log.info('web push off: a demo stores subscriptions and sends nothing');
  if (enabled) webpush.setVapidDetails(cfg.VAPID_SUBJECT, cfg.VAPID_PUBLIC_KEY!, cfg.VAPID_PRIVATE_KEY!);
  return {
    enabled,
    publicKey: cfg.VAPID_PUBLIC_KEY ?? null,
    async sendToUsers(db, userIds, message) {
      if (!enabled || !userIds.length) return 0;
      const subs = await db.query<{ id: number; user_id: string; endpoint: string; p256dh: string; auth: string; locale: 'ro' | 'en' }>(
        `SELECT s.id, s.user_id, s.endpoint, s.p256dh, s.auth, u.locale FROM push_subscriptions s
         JOIN users u ON u.id = s.user_id AND u.deleted_at IS NULL
         WHERE s.user_id = ANY($1::uuid[])`, [userIds],
      );
      const reached = new Set<string>();
      await Promise.all(subs.rows.map(async (s) => {
        // Stored before endpoints were checked: never connected to, and dropped.
        if (!isPushEndpoint(s.endpoint)) {
          log.warn({ subscription: s.id }, 'push subscription to an unknown service dropped');
          await db.query('DELETE FROM push_subscriptions WHERE id = $1', [s.id]);
          return;
        }
        try {
          await webpush.sendNotification(
            { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
            JSON.stringify({ ...message(s.locale), lang: s.locale }),
            { TTL: 3600, urgency: 'normal' },
          );
          reached.add(s.user_id);
          await db.query('UPDATE push_subscriptions SET last_success_at = now() WHERE id = $1', [s.id]);
        } catch (e: any) {
          if (e?.statusCode === 404 || e?.statusCode === 410) {
            await db.query('DELETE FROM push_subscriptions WHERE id = $1', [s.id]);
          } else {
            log.warn({ status: e?.statusCode }, 'push delivery failed');
          }
        }
      }));
      return reached.size;
    },
  };
}
