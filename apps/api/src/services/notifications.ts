/* The four notification types of docs/18, each toggled independently by the student:
   menu published · your favourite is on today · it's quiet now (inside your window) ·
   one meal from a free one. Every send is claimed once in job_runs, so a restart or a second
   publication never repeats it. */
import { localDate, localMinutes, parseHHMM } from '@ubite/shared';
import type { Ctx } from '../context';
import { claimRun } from './config-store';

const APP = '/';

export async function notifyMenuPublished(ctx: Ctx, date: string, dishIds: string[]): Promise<number> {
  const { db, push } = ctx;
  if (!push.enabled) return 0;
  let notified = 0;

  if (await claimRun(db, `push:menu:${date}`)) {
    const names = await db.query<{ name_ro: string; name_en: string }>(
      `SELECT d.name_ro, d.name_en FROM dishes d WHERE d.id = ANY($1::uuid[])
       ORDER BY array_position(ARRAY['soup','main','side','dessert','salad','drink','extra']::dish_category[], d.category) LIMIT 3`,
      [dishIds],
    );
    const users = await db.query<{ user_id: string }>(
      `SELECT p.user_id FROM notification_prefs p JOIN push_subscriptions s ON s.user_id = p.user_id
       WHERE p.menu_published GROUP BY p.user_id`,
    );
    notified += await push.sendToUsers(db, users.rows.map((u) => u.user_id), (lang) => ({
      title: lang === 'ro' ? 'Meniul de azi e publicat' : "Today's menu is out",
      body: names.rows.map((n) => (lang === 'ro' ? n.name_ro : n.name_en)).join(' · '),
      url: APP,
      tag: `menu-${date}`,
    }));
  }

  // Favourites: per student and per day, so a corrected menu can still reach a new match.
  const favs = await db.query<{ user_id: string; dish_id: string; name_ro: string; name_en: string }>(
    `SELECT f.user_id, f.dish_id, d.name_ro, d.name_en FROM favorites f
     JOIN dishes d ON d.id = f.dish_id
     JOIN notification_prefs p ON p.user_id = f.user_id AND p.favorite_today
     WHERE f.dish_id = ANY($1::uuid[])`, [dishIds],
  );
  const byUser = new Map<string, Array<{ ro: string; en: string }>>();
  for (const f of favs.rows) {
    if (!byUser.has(f.user_id)) byUser.set(f.user_id, []);
    byUser.get(f.user_id)!.push({ ro: f.name_ro, en: f.name_en });
  }
  for (const [userId, dishes] of byUser) {
    if (!(await claimRun(db, `push:fav:${date}:${userId}`))) continue;
    notified += await push.sendToUsers(db, [userId], (lang) => ({
      title: lang === 'ro' ? 'Felul tău preferat e azi în meniu' : 'Your favourite is on today',
      body: dishes.map((d) => (lang === 'ro' ? d.ro : d.en)).join(' · '),
      url: APP,
      tag: `fav-${date}`,
    }));
  }
  return notified;
}

/** "It's quiet now" — only inside each student's own window, at most once a day. */
export async function notifyQuietNow(ctx: Ctx, now: Date) {
  const { db, push } = ctx;
  if (!push.enabled) return 0;
  const today = localDate(now);
  const minute = localMinutes(now);
  const r = await db.query<{ user_id: string; window_start: string; window_end: string }>(
    `SELECT p.user_id, p.window_start::text, p.window_end::text FROM notification_prefs p
     WHERE p.quiet_now AND (p.last_quiet_sent_on IS NULL OR p.last_quiet_sent_on < $1::date)
       AND EXISTS (SELECT 1 FROM push_subscriptions s WHERE s.user_id = p.user_id)`, [today],
  );
  const due = r.rows.filter((u) => minute >= parseHHMM(u.window_start) && minute < parseHHMM(u.window_end)).map((u) => u.user_id);
  if (!due.length) return 0;
  await db.query('UPDATE notification_prefs SET last_quiet_sent_on = $2::date WHERE user_id = ANY($1::uuid[])', [due, today]);
  return push.sendToUsers(db, due, (lang) => ({
    title: lang === 'ro' ? 'E liber acum la cantină' : "It's quiet at the canteen now",
    body: lang === 'ro' ? 'Coada e mică. Dacă ai o pauză, acum e momentul.' : 'The queue is short. If you have a break, now is the time.',
    url: APP,
    tag: `quiet-${today}`,
  }));
}

export async function notifyOneFromFree(ctx: Ctx, userId: string) {
  const { db, push } = ctx;
  if (!push.enabled) return 0;
  const pref = await db.query<{ one_from_free: boolean }>('SELECT one_from_free FROM notification_prefs WHERE user_id = $1', [userId]);
  if (pref.rows[0] && !pref.rows[0].one_from_free) return 0;
  return push.sendToUsers(db, [userId], (lang) => ({
    title: lang === 'ro' ? 'Încă o masă și următoarea e gratuită' : 'One more meal and the next one is free',
    body: lang === 'ro' ? 'Ai patru buline din cinci pe cardul de fidelitate.' : 'You have four of five dots on your loyalty card.',
    url: '/card',
    tag: 'loyalty-four',
  }));
}
