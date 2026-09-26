/* Turning notifications on, from wherever the student asks for them (account, the menu alert
   card, a dish's "notify me"). Push needs the permission prompt, a subscription saved on the
   server and, on iPhone, the app installed to the home screen (docs/04). */
import React from 'react';
import type { Me, NotificationPrefs } from '@ubite/shared';
import { apiSend } from '../api/client';
import { pushSupport, subscribePush } from '../pwa';
import { useApp } from './app';

export type PushResult = 'ok' | 'ios' | 'denied' | 'unsupported' | 'noserver' | 'error';

export function useNotifications() {
  const { status, me, setMe } = useApp();

  const ensurePush = React.useCallback(async (): Promise<PushResult> => {
    const support = pushSupport();
    if (support === 'ios-needs-install') return 'ios';
    if (support === 'unsupported') return 'unsupported';
    if (support === 'denied') return 'denied';
    const key = status.data?.vapidPublicKey;
    if (!key) return 'noserver';
    try {
      const sub = await subscribePush(key);
      if (!sub) return 'denied';
      await apiSend('POST', '/me/push', sub);
      if (me) setMe({ ...me, pushSubscribed: true });
      return 'ok';
    } catch {
      return 'error';
    }
  }, [status.data?.vapidPublicKey, me, setMe]);

  const setPrefs = React.useCallback(async (patch: Partial<NotificationPrefs>) => {
    if (!me) return;
    const next = { ...me.notifications, ...patch };
    setMe({ ...me, notifications: next });
    try {
      setMe(await apiSend<Me>('PUT', '/me/notifications', next));
    } catch {
      setMe(me);
      throw new Error('prefs');
    }
  }, [me, setMe]);

  return { ensurePush, setPrefs };
}
