/* The brand layer from the repo's assets/ (the source of truth, with prompts and licences in
   assets/manifest.json). Imported through Vite, so every file is fingerprinted, precached for
   offline use, and never hotlinked from a generator (CLAUDE.md "Asset rules").
   The same map the UI kits read from ui_kits/assets.js. */

const url = (m: Record<string, unknown>) =>
  Object.fromEntries(Object.entries(m).map(([k, v]) => [k.split('/').pop()!.replace(/\.\w+$/, ''), v as string]));

const spots = url(import.meta.glob('@assets/illustrations/spots/*.svg', { eager: true, query: '?url', import: 'default' }));
const scenes = url(import.meta.glob('@assets/illustrations/scenes/*.svg', { eager: true, query: '?url', import: 'default' }));
const pictos = url(import.meta.glob('@assets/illustrations/picto/*.svg', { eager: true, query: '?url', import: 'default' }));
const art = url(import.meta.glob('@assets/illustrations/*.svg', { eager: true, query: '?url', import: 'default' }));
const cutouts = url(import.meta.glob('@assets/cutouts/*.webp', { eager: true, query: '?url', import: 'default' }));

import hall from '@assets/photos/hall.webp?url';
import pattern from '@assets/patterns/canteen.svg?url';
import sketch from '@assets/illustrations/sketch-city.png?url';

export const A = {
  hall,
  pattern,
  sketch,
  spot: (n: string): string | undefined => spots[n],
  scene: (n: string): string | undefined => scenes[n],
  /** Menu category pictogram; a category without one keeps its Lucide icon. */
  picto: (n: string): string | undefined => pictos[`picto-${n}`],
  art: {
    emptyMenu: art['empty-menu'],
    closed: art.closed,
    noResults: art['no-results'],
    install: art.install,
    offline: art.offline,
    receipt: art.receipt,
  },
  cutout: (slug: string): string | undefined => cutouts[`dish-${slug}`],
  /** Spotlight `video` takes a path without extension and adds .webm and .mp4 — served at fixed
   *  URLs by vite.config.ts so both sources share the name. */
  motion: { run: '/motion/spot-run' },
};
