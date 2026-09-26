import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '../..');
const ds = path.join(root, '.claude/skills/ubite-design');
const brand = path.join(root, 'assets/brand');

/* Files served at fixed URLs straight from the repo's assets/ — never copied, so they cannot drift
   from the locked originals (assets/style/lock.json): the PWA icons, and the animated character
   the Spotlight card loads as <video> with a .webm and an .mp4 source of the same name. */
const FIXED: Record<string, string> = {
  ...Object.fromEntries(['favicon.svg', 'favicon-32.png', 'apple-touch-icon.png', 'icon-192.png', 'icon-512.png', 'icon-maskable-512.png']
    .map((n) => [`icons/${n}`, path.join(brand, n)])),
  'motion/spot-run.webm': path.join(root, 'assets/motion/spot-run.webm'),
  'motion/spot-run.mp4': path.join(root, 'assets/motion/spot-run.mp4'),
};
const MIME: Record<string, string> = { svg: 'image/svg+xml', png: 'image/png', webm: 'video/webm', mp4: 'video/mp4' };
function fixedAssets() {
  return {
    name: 'ubite-fixed-assets',
    configureServer(server: any) {
      server.middlewares.use((req: any, res: any, next: any) => {
        const key = (req.url || '').split('?')[0].replace(/^\//, '');
        const file = FIXED[key];
        if (!file) return next();
        res.setHeader('Content-Type', MIME[key.split('.').pop()!] || 'application/octet-stream');
        res.end(fs.readFileSync(file));
      });
    },
    generateBundle(this: any) {
      for (const [fileName, file] of Object.entries(FIXED)) this.emitFile({ type: 'asset', fileName, source: fs.readFileSync(file) });
    },
  };
}

export default defineConfig({
  plugins: [
    react(),
    fixedAssets(),
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      registerType: 'prompt',
      injectRegister: false,
      manifest: {
        id: '/',
        name: 'UBite — Cantina Mihail Kogălniceanu',
        short_name: 'UBite',
        description: 'Meniul de azi și coada de acum la cantina Universității din București.',
        lang: 'ro',
        start_url: '/?source=pwa',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait',
        // Token values from the design system (colors.css): --surface-page (dark) and --accent.
        background_color: '#0D1116',
        theme_color: '#0D1116',
        categories: ['food', 'education', 'lifestyle'],
        dir: 'ltr',
        display_override: ['standalone', 'minimal-ui'],
        // Opening the app again (a notification, a shortcut) reuses the open window.
        launch_handler: { client_mode: ['navigate-existing', 'auto'] },
        prefer_related_applications: false,
        // Long-press on the icon.
        shortcuts: [
          { name: 'Meniul de azi și coada', short_name: 'Meniu', url: '/?source=shortcut', icons: [{ src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' }] },
          { name: 'Cardul de fidelitate', short_name: 'Card', url: '/card?source=shortcut', icons: [{ src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' }] },
          { name: 'Adaugă bonul', short_name: 'Bon', url: '/visit?source=shortcut', icons: [{ src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' }] },
        ],
        // The richer install sheet on Android shows these (scripts/pwa-screenshots.mjs).
        screenshots: [
          { src: '/screenshots/home.png', sizes: '780x1688', type: 'image/png', form_factor: 'narrow', label: 'Coada de acum, în minute, și meniul de azi' },
          { src: '/screenshots/menu.png', sizes: '780x1688', type: 'image/png', form_factor: 'narrow', label: 'Meniul pe categorii, cu filtre alimentare' },
          { src: '/screenshots/card.png', sizes: '780x1688', type: 'image/png', form_factor: 'narrow', label: 'Cardul de fidelitate: a șasea masă e gratuită' },
        ],
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      injectManifest: {
        globPatterns: ['**/*.{js,css,html,woff2,svg,webp,png}'],
        globIgnores: ['**/kiosk-*', '**/screenshots/**'],
        maximumFileSizeToCacheInBytes: 2 * 1024 * 1024,
      },
      devOptions: { enabled: false },
    }),
  ],
  resolve: {
    alias: { '@ds': path.join(ds, 'index.js'), '@assets': path.join(root, 'assets') },
    dedupe: ['react', 'react-dom'],
  },
  server: {
    port: 5173,
    proxy: { '/api': 'http://localhost:8080' },
    fs: { allow: [root] },
  },
  build: {
    target: 'es2020',
    sourcemap: true,
    assetsInlineLimit: 0,
  },
});
