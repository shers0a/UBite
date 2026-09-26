const UB = window.UBiteDesignSystem_40c8c2;

const DAYS = [['Lu', 780], ['Ma', 812], ['Mi', 690], ['Jo', 744], ['Vi', 520]];
const HOURS = [['11:30', 2], ['12:00', 4], ['12:30', 7], ['13:00', 12], ['13:30', 9], ['14:00', 5], ['14:30', 3], ['15:00', 2]];
const BEST = [['Papanași cu smântână', 4.8, 103], ['Sarmale cu mămăligă', 4.6, 84], ['Ciorbă de perișoare', 4.4, 62]];
const WORST = [['Tocăniță de cartofi', 2.9, 41], ['Murături asortate', 3.1, 18], ['Supă cremă de legume', 3.4, 27]];
const WASTE = [['Pui la cuptor cu cartofi', 120, 112], ['Musaca de legume', 90, 61], ['File de pește', 60, 33]];

function Metric({ label, value, unit, note, tone }) {
  return (
    <div className="ub-metric">
      <span className="ub-eyebrow">{label}</span>
      <div className="ub-numeric ub-metric-v" style={{ color: tone || 'var(--text-primary)' }}>
        {value}<span className="ub-metric-u">{unit}</span>
      </div>
      {note && <span className="ub-metric-n">{note}</span>}
    </div>
  );
}

function Bars({ data, unit = '', max }) {
  const top = max || Math.max(...data.map((d) => d[1]));
  return (
    <div className="ub-bars">
      {data.map(([label, v]) => (
        <div key={label} className="ub-bar-row">
          <span className="ub-bar-label">{label}</span>
          <span className="ub-bar-track"><span className="ub-bar-fill" style={{ width: `${(v / top) * 100}%` }} /></span>
          <span className="ub-numeric ub-bar-v">{v}{unit}</span>
        </div>
      ))}
    </div>
  );
}

function Dashboard() {
  const { Wordmark, Button, Badge, Chip, RatingStars, Icon } = UB;
  const [theme, setTheme] = React.useState('light');
  const [range, setRange] = React.useState('Ultimele 30 de zile');
  React.useEffect(() => { document.documentElement.setAttribute('data-theme', theme); }, [theme]);

  return (
    <div className="ub-dash">
      <header className="ub-dash-head">
        <Wordmark size={26} />
        <span className="ub-eyebrow">Raport DCCAS · doar citire</span>
        <span style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          {['Ultimele 7 zile', 'Ultimele 30 de zile', 'Tot pilotul'].map((r) => (
            <Chip key={r} size="sm" selected={range === r} onClick={() => setRange(r)}>{r}</Chip>
          ))}
          <Chip size="sm" selected={theme === 'dark'} onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>Noapte</Chip>
          <Button size="sm" variant="secondary" iconLeft="download">Exportă tabel</Button>
        </span>
      </header>

      <p className="ub-dash-lede">
        Cantina a servit <strong>3 546 de mese</strong> în perioada selectată. Vârful e constant la 13:00, iar
        vinerea e cea mai liniștită zi. Mai jos, ce spun studenții și cât a costat fidelitatea.
      </p>

      <div className="ub-dash-metrics">
        <Metric label="Mese servite" value="3 546" note="+8% față de luna trecută" />
        <Metric label="Timp mediu de așteptare" value="6,4" unit=" min" note="din 1 204 raportări" />
        <Metric label="Studenți care spun că aplicația i-a adus" value="41" unit="%" note="din 312 răspunsuri" tone="var(--crowd-low-text)" />
        <Metric label="Mese gratuite acordate" value="68" note="cost estimat 1 088 lei" tone="var(--crowd-moderate-text)" />
      </div>

      <div className="ub-dash-grid">
        <section className="ub-panel">
          <h2>Trafic pe zi</h2>
          <Bars data={DAYS} />
        </section>
        <section className="ub-panel">
          <h2>Așteptare medie pe oră</h2>
          <Bars data={HOURS} unit=" min" />
          <p className="ub-note">Vârful de la 13:00 coincide cu finalul cursurilor de la Drept și Litere.</p>
        </section>
        <section className="ub-panel">
          <h2>Cele mai bine notate</h2>
          {BEST.map(([n, r, c]) => (
            <div key={n} className="ub-dish-line"><span>{n}</span><RatingStars value={r} count={c} size={16} /></div>
          ))}
        </section>
        <section className="ub-panel">
          <h2>Cele mai slab notate</h2>
          {WORST.map(([n, r, c]) => (
            <div key={n} className="ub-dish-line"><span>{n}</span><RatingStars value={r} count={c} size={16} /></div>
          ))}
          <p className="ub-note">Notele sub 3,5 apar aici. Nu e o sancțiune — e o listă de discuție cu bucătăria.</p>
        </section>
        <section className="ub-panel ub-panel--wide">
          <h2>Porții pregătite față de porții vândute</h2>
          <table className="ub-table">
            <thead><tr><th>Fel</th><th>Pregătite</th><th>Vândute</th><th>Rămase</th></tr></thead>
            <tbody>
              {WASTE.map(([n, prep, sold]) => (
                <tr key={n}>
                  <td>{n}</td>
                  <td className="ub-numeric">{prep}</td>
                  <td className="ub-numeric">{sold}</td>
                  <td className="ub-numeric">
                    <Badge tone={prep - sold > 20 ? 'warning' : 'neutral'}>{prep - sold}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="ub-note">Apare doar pentru felurile la care s-a completat câmpul „porții pregătite”. Unde lipsește, rândul lipsește — nu estimăm.</p>
        </section>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<Dashboard />);
