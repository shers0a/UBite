/* Four experiences, one bundle (docs/06): student, canteen staff, DCCAS dashboard and kiosk are
   routes gated by role. The staff, dashboard, admin and kiosk code is split out, so a student's
   phone downloads only the student app. */
import React from 'react';
import { Route, Router, Switch, useLocation } from 'wouter';
import { LogoSplash } from '@ds';
import { AppProvider, useApp } from './state/app';
import { useI18n } from './i18n';
import { track } from './analytics';
import { A } from './assets';
import { BottomNav, RouteLoading, Toaster, Wallpaper } from './components/Chrome';
import { viewTransitionNav } from './motion';
import { FeedbackSheet, ReportSheet, SignInSheet } from './components/Sheets';
import { Home } from './screens/student/Home';
import { DishDetail } from './screens/student/DishDetail';

const loadAccount = () => import('./screens/student/Account');
const loadCard = () => import('./screens/student/Card');
const loadVisit = () => import('./screens/student/AddVisit');
const Account = React.lazy(() => loadAccount().then((m) => ({ default: m.Account })));
const Card = React.lazy(() => loadCard().then((m) => ({ default: m.Card })));
const AddVisit = React.lazy(() => loadVisit().then((m) => ({ default: m.AddVisit })));
const Privacy = React.lazy(() => import('./screens/student/Privacy').then((m) => ({ default: m.Privacy })));
const About = React.lazy(() => import('./screens/student/About').then((m) => ({ default: m.About })));
const Staff = React.lazy(() => import('./screens/staff/Staff').then((m) => ({ default: m.Staff })));
const Dashboard = React.lazy(() => import('./screens/dashboard/Dashboard').then((m) => ({ default: m.Dashboard })));
const Admin = React.lazy(() => import('./screens/admin/Admin').then((m) => ({ default: m.Admin })));
const Kiosk = React.lazy(() => import('./screens/kiosk/Kiosk').then((m) => ({ default: m.Kiosk })));
const Attract = React.lazy(() => import('./screens/kiosk/Attract').then((m) => ({ default: m.Attract })));

function PageViews() {
  const [location] = useLocation();
  React.useEffect(() => {
    track('pageview');
  }, [location]);
  // The other tabs' code arrives while the student reads the menu, so a tab never waits.
  React.useEffect(() => {
    const idle = (window as Window & { requestIdleCallback?: (cb: () => void) => number }).requestIdleCallback ?? ((cb: () => void) => window.setTimeout(cb, 1500));
    idle(() => { loadCard(); loadVisit(); loadAccount(); });
  }, []);
  return null;
}

/* The one-second splash: the U draws itself over the wallpaper and the counters fill to the
   current level. Once per session, never a gate — the home screen is already behind it. */
function Splash() {
  const { crowding } = useApp();
  const [show, setShow] = React.useState(() => {
    try { return !sessionStorage.getItem('ubite.splash'); } catch { return false; }
  });
  React.useEffect(() => { try { sessionStorage.setItem('ubite.splash', '1'); } catch { /* ignore */ } }, []);
  if (!show) return null;
  const level = crowding.data?.open === false ? 'closed' : crowding.data?.level ?? 'moderate';
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 80, pointerEvents: 'none' }} aria-hidden="true">
      <LogoSplash level={level} pattern={A.pattern} onDone={() => setShow(false)} />
    </div>
  );
}

function StudentShell({ children }: { children: React.ReactNode }) {
  const { t } = useI18n();
  return (
    <div className="ub-app">
      <Wallpaper />
      <a className="ub-skip" href="#main">{t('common.skip')}</a>
      <React.Suspense fallback={<RouteLoading />}>{children}</React.Suspense>
      <BottomNav />
      <Toaster />
      <SignInSheet />
      <ReportSheet />
      <FeedbackSheet />
      <Splash />
    </div>
  );
}

export function App() {
  return (
    <Router aroundNav={viewTransitionNav}>
    <AppProvider>
      <PageViews />
      <Switch>
        <Route path="/kiosk/attract"><React.Suspense fallback={null}><Attract /></React.Suspense></Route>
        <Route path="/kiosk"><React.Suspense fallback={null}><Kiosk /></React.Suspense></Route>
        <Route path="/staff"><React.Suspense fallback={null}><Staff /></React.Suspense></Route>
        <Route path="/staff/*"><React.Suspense fallback={null}><Staff /></React.Suspense></Route>
        <Route path="/dashboard"><React.Suspense fallback={null}><Dashboard /></React.Suspense></Route>
        <Route path="/admin"><React.Suspense fallback={null}><Admin /></React.Suspense></Route>
        <Route path="/about"><React.Suspense fallback={<RouteLoading />}><div className="ub-app"><Wallpaper /><About /></div></React.Suspense></Route>
        <Route>
          <StudentShell>
            <Switch>
              <Route path="/dish/:id">{(p: { id: string }) => <DishDetail id={p.id} />}</Route>
              <Route path="/account"><Account /></Route>
              <Route path="/card"><Card /></Route>
              <Route path="/visit"><AddVisit /></Route>
              <Route path="/privacy"><Privacy /></Route>
              <Route><Home /></Route>
            </Switch>
          </StudentShell>
        </Route>
      </Switch>
    </AppProvider>
    </Router>
  );
}
