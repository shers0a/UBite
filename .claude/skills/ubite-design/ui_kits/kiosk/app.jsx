const UB = window.UBiteDesignSystem_40c8c2;

const PANELS = ['menu', 'crowding', 'download'];
// docs/08-kiosk.md — shortened on the team's request, 22 Sep 2026 (was 12/8/8 s).
const DURATION = { menu: 8000, crowding: 5000, download: 5000 };

const KIOSK_MENU = [
  ['Ciorbă', [['Ciorbă de perișoare', 9], ['Supă cremă de legume', 8]]],
  ['Fel principal', [['Pui la cuptor cu cartofi', 17], ['Musaca de legume', 14], ['File de pește la cuptor', 19]]],
  ['Desert și salată', [['Salată de varză', 4], ['Papanași cu smântână', 12]]],
  ['Băuturi și extra', [['Compot de mere', 3], ['Pâine', 1]]],
];

function Kiosk() {
  const { CrowdingIndicator, Wordmark, Icon, Badge, Button } = UB;
  const [i, setI] = React.useState(0);
  const [paused, setPaused] = React.useState(false);
  const [vote, setVote] = React.useState(null);
  const panel = PANELS[i % PANELS.length];

  React.useEffect(() => {
    if (paused) return undefined;
    const t = setTimeout(() => setI((n) => n + 1), DURATION[panel]);
    return () => clearTimeout(t);
  }, [i, paused, panel]);

  React.useEffect(() => {
    if (!paused) return undefined;
    const t = setTimeout(() => { setPaused(false); setVote(null); }, 45000);
    return () => clearTimeout(t);
  }, [paused]);

  return (
    <div className="ub-kiosk" onClick={() => setPaused(true)}>
      <header className="ub-kiosk-head">
        <Wordmark size={54} />
        <span className="ub-numeric ub-kiosk-clock">12:41</span>
        <span className="ub-kiosk-place">Cantina Mihail Kogălniceanu · L–V 11:30–17:00</span>
      </header>

      {paused ? (
        <div className="ub-kiosk-body ub-kiosk-full">
          <div className="ub-kiosk-menu">
            {KIOSK_MENU.map(([cat, items]) => (
              <div key={cat}>
                <h2 className="ub-kiosk-cat">{cat}</h2>
                {items.map(([n, p]) => (
                  <div key={n} className="ub-kiosk-row"><span>{n}</span><span className="ub-numeric">{p} lei</span></div>
                ))}
              </div>
            ))}
          </div>
          <div className="ub-kiosk-vote">
            <span className="ub-kiosk-voteq">Cum a fost azi?</span>
            <div className="ub-kiosk-faces">
              {[['face-slightly-smiling', 'bine'], ['face-neutral', 'acceptabil'], ['face-slightly-frowning', 'slab']].map(([g, l]) => (
                <button key={g} type="button" className="ub-face" data-on={vote === g} onClick={(e) => { e.stopPropagation(); setVote(g); }}>
                  <Icon name={g} size={56} stroke={2.25} /><span>{l}</span>
                </button>
              ))}
            </div>
            {vote && <span className="ub-kiosk-thanks">Mulțumim.</span>}
          </div>
        </div>
      ) : (
        <div className="ub-kiosk-body" key={panel}>
          {panel === 'menu' && (
            <div className="ub-kiosk-menu ub-fadein">
              {KIOSK_MENU.map(([cat, items]) => (
                <div key={cat}>
                  <h2 className="ub-kiosk-cat">{cat}</h2>
                  {items.map(([n, p]) => (
                    <div key={n} className="ub-kiosk-row"><span>{n}</span><span className="ub-numeric">{p} lei</span></div>
                  ))}
                </div>
              ))}
            </div>
          )}
          {panel === 'crowding' && (
            <div className="ub-fadein" style={{ display: 'grid', placeItems: 'center', height: '100%' }}>
              <div style={{ width: 880 }}>
                <CrowdingIndicator size="kiosk" level="moderate" waitMinutes={6} quality="live" updatedSecondsAgo={40} />
              </div>
            </div>
          )}
          {panel === 'download' && (
            <div className="ub-fadein ub-kiosk-qr">
              <div>
                <h2 className="ub-kiosk-qr-title">Vezi coada înainte să vii</h2>
                <p className="ub-kiosk-qr-body">Scanează și pui UBite pe telefon. Nu trebuie cont.</p>
                <p className="ub-kiosk-qr-url ub-numeric">ubite.unibuc.ro</p>
              </div>
              <div className="ub-kiosk-qr-box">
                {window.UBITE_ASSETS
                  ? <img src={window.UBITE_ASSETS.qr} alt="Cod QR către ubite.unibuc.ro" style={{ width: 300, height: 300, display: 'block' }} />
                  : <image-slot id="kiosk-qr" shape="rounded" radius="12" placeholder="Cod QR către ubite.unibuc.ro" style={{ width: 300, height: 300 }}></image-slot>}
              </div>
            </div>
          )}
        </div>
      )}

      <footer className="ub-kiosk-foot">
        <div className="ub-kiosk-dots">
          {PANELS.map((p, n) => <span key={p} data-on={!paused && n === i % PANELS.length} />)}
        </div>
        <span>{paused ? 'Revine la rotație în 45 de secunde' : 'Atinge ecranul pentru meniul complet'}</span>
      </footer>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<Kiosk />);
