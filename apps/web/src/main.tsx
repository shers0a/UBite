import React from 'react';
import { createRoot } from 'react-dom/client';
// The design system is the single source of colour, type, spacing, shape and motion.
import '../../../.claude/skills/ubite-design/styles.css';
import './styles/app.css';
import { App } from './App';
import { I18nProvider } from './i18n';
import { startAnalytics } from './analytics';
import { startOutbox } from './api/outbox';
import { startServiceWorker } from './pwa';
import { watchImages, watchReveals } from './motion';

// The entrance tablet (docs/08): opening /kiosk?device=1 once makes the installed app start on the
// kiosk instead of the student home; /kiosk?device=0 undoes it. Chrome and the installed app share storage.
try {
  const q = new URLSearchParams(location.search);
  const device = q.get('device');
  if (device !== null && location.pathname.startsWith('/kiosk')) {
    q.delete('device');
    const target = location.pathname + (q.toString() ? `?${q}` : '');
    if (device === '1') localStorage.setItem('ubite.kioskDevice', target); else localStorage.removeItem('ubite.kioskDevice');
    history.replaceState(null, '', target);
  } else if (location.pathname === '/') {
    const target = localStorage.getItem('ubite.kioskDevice');
    if (target?.startsWith('/kiosk')) history.replaceState(null, '', target);
  }
} catch { /* storage blocked: the kiosk still opens by its address */ }

const kiosk = location.pathname.startsWith('/kiosk');
startServiceWorker({ autoReload: kiosk });
startOutbox();
if (!kiosk) startAnalytics();
watchImages();

// Client errors are logged for the team without any personal data (docs/04 Observability).
window.addEventListener('error', (e) => console.error('[UBite]', e.message));

// Sections rise into view once the first screen has been drawn.
requestAnimationFrame(() => watchReveals());

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <I18nProvider>
      <App />
    </I18nProvider>
  </React.StrictMode>,
);
