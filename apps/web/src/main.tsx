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
