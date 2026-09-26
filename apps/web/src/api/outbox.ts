/* Wait reports and feedback compose offline and flush on reconnect, preserving the original
   timestamp (docs/04 "Offline and resilience", docs/06 "Offline"). */
import React from 'react';
import type { FeedbackRequest, WaitReportRequest } from '@ubite/shared';
import { apiSend, ApiError } from './client';

type Item =
  | { id: string; kind: 'report'; body: WaitReportRequest; createdAt: number }
  | { id: string; kind: 'feedback'; body: FeedbackRequest; createdAt: number };

const KEY = 'ubite.outbox';
const listeners = new Set<() => void>();

function read(): Item[] {
  try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { return []; }
}
function write(items: Item[]) {
  try { localStorage.setItem(KEY, JSON.stringify(items)); } catch { /* ignore */ }
  listeners.forEach((l) => l());
}

export function enqueue(item: Omit<Item, 'id' | 'createdAt'>) {
  write([...read(), { ...item, id: Math.random().toString(36).slice(2), createdAt: Date.now() } as Item]);
}

let flushing = false;
export async function flushOutbox() {
  if (flushing || !navigator.onLine) return;
  flushing = true;
  try {
    for (const item of read()) {
      try {
        if (item.kind === 'report') await apiSend('POST', '/crowding/report', item.body);
        else await apiSend('POST', '/feedback', item.body);
        write(read().filter((i) => i.id !== item.id));
      } catch (e) {
        const err = e as ApiError;
        if (err.offline || err.status >= 500) break; // try again later
        // Rejected for good (too old, closed, already reported): drop it, never retry forever.
        write(read().filter((i) => i.id !== item.id));
      }
    }
  } finally {
    flushing = false;
  }
}

export function useOutboxCount() {
  const [n, setN] = React.useState(() => read().length);
  React.useEffect(() => {
    const l = () => setN(read().length);
    listeners.add(l);
    window.addEventListener('storage', l);
    return () => { listeners.delete(l); window.removeEventListener('storage', l); };
  }, []);
  return n;
}

export function startOutbox() {
  flushOutbox();
  window.addEventListener('online', () => flushOutbox());
  window.setInterval(() => flushOutbox(), 60_000);
}
