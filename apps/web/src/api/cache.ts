/* docs/04: "The crowding number and today's menu must render from cache before the network
   responds, then update in place. This is the single most important performance behaviour."

   useResource reads the last good response from localStorage synchronously on first render,
   then fetches; the age of what is on screen is always known (`fetchedAt`). */
import React from 'react';
import { apiGet, ApiError } from './client';

interface Stored<T> {
  data: T;
  fetchedAt: number;
}

const PREFIX = 'ubite.cache.';

export function readCache<T>(key: string): Stored<T> | null {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    return raw ? (JSON.parse(raw) as Stored<T>) : null;
  } catch {
    return null;
  }
}

export function writeCache<T>(key: string, data: T) {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify({ data, fetchedAt: Date.now() }));
  } catch { /* storage full or blocked: the app still works, just without the offline copy */ }
}

export function clearCache(key: string) {
  try { localStorage.removeItem(PREFIX + key); } catch { /* ignore */ }
}

export interface Resource<T> {
  data: T | null;
  fetchedAt: number | null;
  /** First load in progress with nothing cached — show skeletons. */
  loading: boolean;
  /** The last refresh failed; `data` may still hold the cached copy. */
  error: ApiError | null;
  /** True when what is on screen came from the cache because the network failed. */
  stale: boolean;
  refresh: () => Promise<void>;
  mutate: (data: T) => void;
}

export function useResource<T>(key: string | null, path: string | null, opts: { refreshMs?: number; cache?: boolean } = {}): Resource<T> {
  const useCache = opts.cache !== false;
  const initial = React.useMemo(() => (key && useCache ? readCache<T>(key) : null), [key, useCache]);
  const [state, setState] = React.useState<{ data: T | null; fetchedAt: number | null; error: ApiError | null; loading: boolean }>(() => ({
    data: initial?.data ?? null,
    fetchedAt: initial?.fetchedAt ?? null,
    error: null,
    loading: !!path && !initial,
  }));
  const alive = React.useRef(true);
  React.useEffect(() => () => { alive.current = false; }, []);

  React.useEffect(() => {
    setState({ data: initial?.data ?? null, fetchedAt: initial?.fetchedAt ?? null, error: null, loading: !!path && !initial });
  }, [key, path, initial]);

  const refresh = React.useCallback(async () => {
    if (!path) return;
    try {
      const data = await apiGet<T>(path);
      if (!alive.current) return;
      if (key && useCache) writeCache(key, data);
      setState({ data, fetchedAt: Date.now(), error: null, loading: false });
    } catch (e) {
      if (!alive.current) return;
      setState((s) => ({ ...s, error: e as ApiError, loading: false }));
    }
  }, [key, path, useCache]);

  React.useEffect(() => {
    if (!path) return undefined;
    refresh();
    const onOnline = () => refresh();
    const onVisible = () => { if (document.visibilityState === 'visible') refresh(); };
    window.addEventListener('online', onOnline);
    document.addEventListener('visibilitychange', onVisible);
    let timer: number | undefined;
    if (opts.refreshMs) {
      // Polling, not sockets: robust on weak Wi-Fi (D-17). Paused while the tab is hidden.
      timer = window.setInterval(() => { if (document.visibilityState === 'visible') refresh(); }, opts.refreshMs);
    }
    return () => {
      window.removeEventListener('online', onOnline);
      document.removeEventListener('visibilitychange', onVisible);
      if (timer) window.clearInterval(timer);
    };
  }, [path, refresh, opts.refreshMs]);

  const mutate = React.useCallback((data: T) => {
    if (key && useCache) writeCache(key, data);
    setState({ data, fetchedAt: Date.now(), error: null, loading: false });
  }, [key, useCache]);

  return { ...state, stale: !!state.error && state.data !== null, refresh, mutate };
}

/** Whether the browser believes it is online, kept current. */
export function useOnline() {
  const [online, setOnline] = React.useState(() => (typeof navigator === 'undefined' ? true : navigator.onLine));
  React.useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, []);
  return online;
}

/** Re-renders every `ms`, for ages that tick ("actualizat acum 40s"). */
export function useNow(ms = 5000) {
  const [now, setNow] = React.useState(() => Date.now());
  React.useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), ms);
    return () => window.clearInterval(t);
  }, [ms]);
  return now;
}
