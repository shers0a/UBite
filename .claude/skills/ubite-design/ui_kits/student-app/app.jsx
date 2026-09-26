const UB = window.UBiteDesignSystem_40c8c2;

const DEFAULTS = {
  screen: 'home', lang: 'ro', theme: 'dark', level: 'moderate', wait: 6, quality: 'live',
  age: 40, loading: false, offline: false, queued: 0, menuState: 'fresh', filters: [],
  loyalty: 4, signedIn: true, reportState: 'idle', install: false, logo: 'tray', onboarding: false, menuAlert: false,
};

/* Links can open the prototype on one state — the mockup site and the reviewers use this:
   ?screen=home|dish|account|visit  &dish=papanasi  &theme=light|dark  &level=low|moderate|high|closed
   &menu=fresh|stale|empty  &offline  &install  &onboarding=1..3  &lang=en  &scroll=560
   ?embed shows only the phone (for screenshots); ?fit makes the phone the whole screen (for phones). */
const Q = new URLSearchParams(location.search);
const EMBED = Q.has('embed') || Q.has('fit');
const WAITS = { low: 2, moderate: 6, high: 13, closed: 0 };
const FROM_URL = Object.fromEntries(Object.entries({
  screen: Q.get('screen'), theme: Q.get('theme'), lang: Q.get('lang'), menuState: Q.get('menu'),
  level: Q.get('level'), wait: Q.get('level') ? WAITS[Q.get('level')] : null,
  offline: Q.has('offline') || null, queued: Q.has('offline') ? 1 : null, install: Q.has('install') || null,
  onboarding: Q.get('onboarding') ? Number(Q.get('onboarding')) || 1 : null,
}).filter(([, v]) => v !== null && v !== undefined));

function Toolbar({ state, set }) {
  const { Chip, Button } = UB;
  const Group = ({ label, children }) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <span className="ub-eyebrow">{label}</span>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>{children}</div>
    </div>
  );
  return (
    <aside className="ub-toolbar">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        <Group label="Temă">
          {['light', 'dark'].map((t) => <Chip key={t} size="sm" selected={state.theme === t} onClick={() => set({ theme: t })}>{t === 'light' ? 'Zi' : 'Noapte'}</Chip>)}
        </Group>
        <Group label="Nivel coadă">
          {[['low', 'Mică', 2], ['moderate', 'Medie', 6], ['high', 'Mare', 13], ['closed', 'Închis', 0]].map(([l, n, w]) => (
            <Chip key={l} size="sm" selected={state.level === l} onClick={() => set({ level: l, wait: w, age: 12 })}>{n}</Chip>
          ))}
        </Group>
        <Group label="Calitatea estimării">
          {[['live', 'live'], ['degraded', 'aproximativ'], ['estimated', 'istoric']].map(([q, n]) => (
            <Chip key={q} size="sm" selected={state.quality === q} onClick={() => set({ quality: q, age: q === 'live' ? 20 : 240 })}>{n}</Chip>
          ))}
        </Group>
        <Group label="Stări de sistem">
          <Chip size="sm" selected={state.loading} onClick={() => set({ loading: !state.loading })}>Se încarcă</Chip>
          <Chip size="sm" selected={state.offline} onClick={() => set({ offline: !state.offline, queued: state.offline ? 0 : 1 })}>Offline</Chip>
          <Chip size="sm" selected={state.menuState === 'stale'} onClick={() => set({ menuState: state.menuState === 'stale' ? 'fresh' : 'stale' })}>Meniu vechi</Chip>
          <Chip size="sm" selected={state.menuState === 'empty'} onClick={() => set({ menuState: state.menuState === 'empty' ? 'fresh' : 'empty' })}>Meniu nepublicat</Chip>
          <Chip size="sm" selected={!state.signedIn} onClick={() => set({ signedIn: !state.signedIn })}>Deconectat</Chip>
          <Chip size="sm" selected={state.install} onClick={() => set({ install: !state.install })}>Invitație instalare</Chip>
          <Chip size="sm" selected={state.onboarding} onClick={() => set({ onboarding: !state.onboarding })}>Prima deschidere</Chip>
        </Group>
        <Group label="Limbă">
          {['ro', 'en'].map((l) => <Chip key={l} size="sm" selected={state.lang === l} onClick={() => set({ lang: l })}>{l.toUpperCase()}</Chip>)}
        </Group>
        <Button size="sm" variant="quiet" onClick={() => set({ ...DEFAULTS, theme: state.theme, logo: state.logo })}>Resetează</Button>
      </div>
    </aside>
  );
}

function InstallPrompt({ onClose }) {
  const { Button, Wordmark } = UB;
  return (
    <div className="ub-install" style={{
      position: 'absolute', left: 12, right: 12, bottom: 84, zIndex: 30,
      background: 'var(--surface-raised)', borderRadius: 'var(--radius-lg)', padding: 16,
      boxShadow: 'var(--shadow-overlay)',
    }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
        {window.UBITE_ASSETS
          ? <span aria-hidden="true" style={{ width: 64, height: 64, flex: 'none', background: 'var(--accent)', WebkitMask: `url(${window.UBITE_ASSETS.art.install}) center / contain no-repeat`, mask: `url(${window.UBITE_ASSETS.art.install}) center / contain no-repeat` }} />
          : <Wordmark size={34} variant="mark" />}
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--weight-semibold)' }}>Pune UBite pe ecranul principal</div>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginTop: 2 }}>
            Ca să primești o notificare când e liber. Durează cinci secunde.
          </p>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
        <Button size="sm" variant="quiet" onClick={onClose} style={{ whiteSpace: 'nowrap' }}>Mai târziu</Button>
        <Button size="sm" fullWidth onClick={onClose}>Adaugă</Button>
      </div>
    </div>
  );
}

function App() {
  const { Sheet, WaitReport, Toast, LogoSplash } = UB;
  const [state, setState] = React.useState(() => ({ ...DEFAULTS, ...FROM_URL }));
  const [splash, setSplash] = React.useState(!Q.has('embed') && !Q.has('nosplash') && !FROM_URL.onboarding);
  const [dish, setDish] = React.useState(() => (Q.get('dish') && window.MENU ? window.MENU.flatMap((g) => g.items).find((i) => i.id === Q.get('dish')) || null : null));
  const [sheet, setSheet] = React.useState(null);
  const [toast, setToast] = React.useState(null);
  const set = (patch) => setState((s) => ({ ...s, ...patch }));

  React.useEffect(() => { document.documentElement.setAttribute('data-theme', state.theme); }, [state.theme]);
  React.useEffect(() => { if (EMBED) document.body.classList.add(Q.has('fit') ? 'ub-fit' : 'ub-embed'); }, []);

  const back = () => set({ screen: 'home' });
  const openDish = (d) => { setDish(d); set({ screen: 'dish' }); };

  return (
    <div className="ub-stage">
      {!EMBED && <Toolbar state={state} set={set} />}
      <div className="ub-phone-wrap">
        <div className="ub-phone">
          <div className="ub-statusbar"><span className="ub-numeric">12:41</span><span className="ub-numeric">Cantina Kogălniceanu</span></div>
          {splash && LogoSplash && <LogoSplash level={state.level} variant={state.logo} pattern={window.UBITE_ASSETS && window.UBITE_ASSETS.pattern} onDone={() => setSplash(false)} />}
          <div className="ub-screen" key={state.screen} style={{ position: 'absolute', inset: 0 }}>
            {state.screen === 'home' && <HomeScreen state={state} set={set} openDish={openDish} openSheet={setSheet} />}
            {state.screen === 'dish' && dish && <DishDetailScreen dish={dish} state={state} set={set} back={back} />}
            {state.screen === 'account' && <AccountScreen state={state} set={set} back={back} />}
            {state.screen === 'visit' && <AddVisitScreen state={state} set={set} back={back} />}
          </div>

          <BottomNav screen={state.screen} go={(s) => set({ screen: s })} />

          {state.install && <InstallPrompt onClose={() => set({ install: false })} />}

          {state.onboarding && <OnboardingScreen initial={typeof state.onboarding === 'number' ? state.onboarding - 1 : 0} onDone={() => set({ onboarding: false })} />}

          {sheet === 'report' && (
            <Sheet open title="Cât ai așteptat?" onClose={() => setSheet(null)} lang={state.lang}>
              <WaitReport lang={state.lang} onSubmit={(m) => {
                setSheet(null);
                set({ reportState: 'done', wait: m || 5, level: (m || 5) < 3 ? 'low' : (m || 5) < 9 ? 'moderate' : 'high', age: 2, quality: 'live' });
                setToast('Mulțumim. Estimarea s-a actualizat.');
                setTimeout(() => setToast(null), 2600);
              }} />
            </Sheet>
          )}

          {toast && (
            <div style={{ position: 'absolute', left: 12, right: 12, bottom: 84, zIndex: 50 }}>
              <Toast message={toast} tone="success" icon="circle-check" />
            </div>
          )}
        </div>
        {!EMBED && <p className="ub-caption">400 px · zoom 200% fără scroll orizontal · temă {state.theme === 'dark' ? 'întunecată' : 'luminoasă'}</p>}
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
