/* Motion for the app, within the design system's rules: transform and opacity only, the motion
   tokens' durations (150–250 ms), interruptible, and nothing at all under prefers-reduced-motion
   (the tokens drop to 0 ms and every hook here stands still).

   - Page transitions: the View Transitions API around every in-app navigation. Tabs slide
     sideways in the direction of the tab; a dish or a page opens forward and closes back.
   - The bottom nav folds to its icons while the student scrolls down, like Revolut's.
   - Sections rise into place the first time they scroll into view.
   - Pictures fade in once they have loaded, instead of popping.
   - A light tap of haptics on the phone when something is confirmed. */
import React from 'react';
import { flushSync } from 'react-dom';
import type { AroundNavHandler } from 'wouter';

export const reducedMotion = () =>
  typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/* ── Page transitions ──────────────────────────────────────────────────────────────────── */

const TABS = ['/', '/card', '/visit', '/account'];

/** Which way the page moves: sideways between tabs, forward into a detail, back out of it. */
function direction(from: string, to: string): 'left' | 'right' | 'forward' | 'back' | 'fade' {
  const a = TABS.indexOf(from);
  const b = TABS.indexOf(to);
  if (a >= 0 && b >= 0) return b > a ? 'left' : 'right';
  if (a >= 0 && b < 0) return 'forward';
  if (a < 0 && b >= 0) return 'back';
  return 'fade';
}

/** Surfaces with their own layout (staff, dashboard, admin, kiosk) change without a slide. */
const plain = (path: string) => /^\/(staff|dashboard|admin|kiosk)/.test(path);

export const viewTransitionNav: AroundNavHandler = (navigate, to, options) => {
  const doc = document as Document & { startViewTransition?: (cb: () => void) => { finished: Promise<void> } };
  const from = location.pathname;
  const target = String(to).split(/[?#]/)[0];
  const scrollTop = () => { if (!String(to).includes('#')) window.scrollTo(0, 0); };
  if (!doc.startViewTransition || reducedMotion() || plain(from) || plain(target) || from === target) {
    navigate(to, options);
    scrollTop();
    return;
  }
  const root = document.documentElement;
  root.dataset.nav = direction(from, target);
  // The nav stays put while the page moves. It is named only for the transition: a named element
  // is cut off from what lies behind it, and the glass needs to see the page the rest of the time.
  const nav = document.querySelector<HTMLElement>('.ub-navglass');
  if (nav) nav.style.viewTransitionName = 'ub-nav';
  const t = doc.startViewTransition(() => {
    // The new page must be in the DOM, and at the top, before the browser takes its picture.
    flushSync(() => navigate(to, options));
    scrollTop();
  });
  t.finished.finally(() => { delete root.dataset.nav; if (nav) nav.style.viewTransitionName = ''; });
};

/* ── The bottom nav folds while scrolling down ──────────────────────────────────────────── */

/** True once the page scrolls down past the first screenful's top; false again on the way up or
 *  at the top. A few pixels of jitter are ignored so the nav does not flutter. */
export function useScrollFold(threshold = 56) {
  const [folded, setFolded] = React.useState(false);
  React.useEffect(() => {
    let last = window.scrollY;
    let frame = 0;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const y = window.scrollY;
        const dy = y - last;
        if (y < threshold) setFolded(false);
        else if (dy > 6) setFolded(true);
        else if (dy < -6) setFolded(false);
        if (Math.abs(dy) > 6 || y < threshold) last = y;
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => { window.removeEventListener('scroll', onScroll); cancelAnimationFrame(frame); };
  }, [threshold]);
  return folded;
}

/* ── Reveal on scroll, pictures fading in ───────────────────────────────────────────────── */

let revealObserver: IntersectionObserver | null = null;

/** Marks `.ub-reveal` elements visible as they enter the viewport. Without IntersectionObserver
 *  or with reduced motion, nothing is ever hidden (the CSS only hides under `.ub-reveal-on`). */
export function watchReveals() {
  if (typeof IntersectionObserver === 'undefined' || reducedMotion()) return;
  document.documentElement.classList.add('ub-reveal-on');
  revealObserver ??= new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (e.isIntersecting) { e.target.classList.add('is-in'); revealObserver?.unobserve(e.target); }
    }
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
  const scan = () => document.querySelectorAll('.ub-reveal:not(.is-in)').forEach((el) => revealObserver?.observe(el));
  scan();
  new MutationObserver(() => scan()).observe(document.body, { childList: true, subtree: true });
}

/** Pictures fade in when they arrive (CSS on img:not(.is-loaded) inside `.ub-fadeimg-on`). */
export function watchImages() {
  if (reducedMotion()) return;
  document.documentElement.classList.add('ub-fadeimg-on');
  const mark = (e: Event) => { const t = e.target as HTMLElement; if (t?.tagName === 'IMG') t.classList.add('is-loaded'); };
  document.addEventListener('load', mark, true);
  document.addEventListener('error', mark, true);
  // Pictures that finished before this ran.
  document.querySelectorAll('img').forEach((img) => { if ((img as HTMLImageElement).complete) img.classList.add('is-loaded'); });
}

/** A short tap on phones that have it, when something is confirmed. */
export function haptic(ms = 12) {
  try { if (!reducedMotion()) navigator.vibrate?.(ms); } catch { /* not supported */ }
}

/* ── Parallax for the wallpaper ─────────────────────────────────────────────────────────── */

/** Writes the scroll offset to a CSS variable on the element, once a frame, for scroll-linked
 *  transforms that cost nothing when the page is still. */
export function useScrollVar(ref: React.RefObject<HTMLElement | null>, name = '--ub-scroll') {
  React.useEffect(() => {
    if (reducedMotion()) return;
    let frame = 0;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => ref.current?.style.setProperty(name, `${window.scrollY}px`));
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => { window.removeEventListener('scroll', onScroll); cancelAnimationFrame(frame); };
  }, [ref, name]);
}

/* ── Pull to refresh ────────────────────────────────────────────────────────────────────── */

/** Installed as an app there is no browser to pull the page down: pulling at the very top
 *  refreshes the screen's data. The indicator follows the finger with some resistance, and past
 *  the threshold a release refreshes. Touch only — the data also refreshes on its own. */
export function usePullToRefresh(onRefresh: () => Promise<unknown>, threshold = 72) {
  const [pull, setPull] = React.useState(0);
  const [busy, setBusy] = React.useState(false);
  const state = React.useRef({ startY: 0, active: false, pull: 0 });
  React.useEffect(() => {
    const onStart = (e: TouchEvent) => {
      if (window.scrollY > 0 || busy || e.touches.length !== 1) return;
      state.current = { startY: e.touches[0].clientY, active: true, pull: 0 };
    };
    const onMove = (e: TouchEvent) => {
      const s = state.current;
      if (!s.active) return;
      const dy = e.touches[0].clientY - s.startY;
      if (dy <= 0 || window.scrollY > 0) { s.pull = 0; setPull(0); return; }
      s.pull = Math.min(threshold * 1.6, dy * 0.5);
      setPull(s.pull);
    };
    const onEnd = async () => {
      const s = state.current;
      if (!s.active) return;
      s.active = false;
      if (s.pull >= threshold) {
        setBusy(true);
        setPull(threshold * 0.8);
        haptic(10);
        try { await onRefresh(); } finally { setBusy(false); setPull(0); }
      } else {
        setPull(0);
      }
    };
    window.addEventListener('touchstart', onStart, { passive: true });
    window.addEventListener('touchmove', onMove, { passive: true });
    window.addEventListener('touchend', onEnd);
    window.addEventListener('touchcancel', onEnd);
    return () => {
      window.removeEventListener('touchstart', onStart);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onEnd);
      window.removeEventListener('touchcancel', onEnd);
    };
  }, [onRefresh, threshold, busy]);
  return { pull, busy, progress: Math.min(1, pull / threshold) };
}
