/* Web Push with VAPID. On iOS it needs the PWA installed to the home screen (docs/04), which is
   why the install prompt is contextual. A subscription the browser has dropped is deleted. */
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

export interface Pusher {
  readonly enabled: boolean;
  readonly publicKey: string | null;
  /** Sends to every subscription of these users; returns how many users had one. */
  sendToUsers(db: Queryable, userIds: string[], message: (locale: 'ro' | 'en') => PushMessage): Promise<number>;
}

export function createPusher(cfg: Config, log: Logger): Pusher {
  const enabled = !!(cfg.VAPID_PUBLIC_KEY && cfg.VAPID_PRIVATE_KEY);
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
