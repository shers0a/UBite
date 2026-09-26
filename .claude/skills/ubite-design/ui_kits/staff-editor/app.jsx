const UB = window.UBiteDesignSystem_40c8c2;

const CATALOG = [
  { id: 'ciorba-perisoare', name: 'Ciorbă de perișoare', cat: 'Ciorbă', price: 9 },
  { id: 'ciorba-burta', name: 'Ciorbă de burtă', cat: 'Ciorbă', price: 12 },
  { id: 'supa-legume', name: 'Supă cremă de legume', cat: 'Ciorbă', price: 8 },
  { id: 'pui-cartofi', name: 'Pui la cuptor cu cartofi', cat: 'Fel principal', price: 17 },
  { id: 'musaca', name: 'Musaca de legume', cat: 'Fel principal', price: 14 },
  { id: 'sarmale', name: 'Sarmale cu mămăligă', cat: 'Fel principal', price: 16 },
  { id: 'peste', name: 'File de pește la cuptor', cat: 'Fel principal', price: 19 },
  { id: 'tocanita', name: 'Tocăniță de cartofi', cat: 'Fel principal', price: 13 },
  { id: 'salata-varza', name: 'Salată de varză', cat: 'Desert și salată', price: 4 },
  { id: 'salata-muraturi', name: 'Murături asortate', cat: 'Desert și salată', price: 4 },
  { id: 'papanasi', name: 'Papanași cu smântână', cat: 'Desert și salată', price: 12 },
  { id: 'prajitura', name: 'Prăjitură de casă', cat: 'Desert și salată', price: 7 },
  { id: 'compot', name: 'Compot de mere', cat: 'Băuturi și extra', price: 3 },
  { id: 'apa', name: 'Apă plată 0,5 l', cat: 'Băuturi și extra', price: 3 },
  { id: 'paine', name: 'Pâine', cat: 'Băuturi și extra', price: 1 },
];

const YESTERDAY = ['ciorba-perisoare', 'pui-cartofi', 'musaca', 'salata-varza', 'papanasi', 'compot', 'paine'];
const CATS = ['Ciorbă', 'Fel principal', 'Desert și salată', 'Băuturi și extra'];

function StaffEditor() {
  const { Button, Input, Chip, Badge, Icon, Toast, AppHeader, Wordmark, IconButton, EmptyState } = UB;
  const [sel, setSel] = React.useState(() => Object.fromEntries(YESTERDAY.map((id) => [id, { on: true, price: CATALOG.find((c) => c.id === id).price, portions: '' }])));
  const [published, setPublished] = React.useState(false);
  const [theme, setTheme] = React.useState('light');
  React.useEffect(() => { document.documentElement.setAttribute('data-theme', theme); }, [theme]);

  const toggle = (item) => setSel((s) => ({ ...s, [item.id]: s[item.id]?.on ? { ...s[item.id], on: false } : { on: true, price: item.price, portions: '' } }));
  const patch = (id, p) => setSel((s) => ({ ...s, [id]: { ...s[id], ...p } }));
  const chosen = CATALOG.filter((c) => sel[c.id]?.on);

  return (
    <div className="ub-staff">
      <header className="ub-staff-head">
        <Wordmark size={26} />
        <span className="ub-eyebrow" style={{ marginLeft: 4 }}>Editor meniu · cont cantină</span>
        <span style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
          <Chip size="sm" selected={theme === 'dark'} onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>Noapte</Chip>
          <span className="ub-numeric" style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>marți, 21 octombrie</span>
        </span>
      </header>

      <div className="ub-staff-grid">
        <section>
          <div className="ub-staff-section-title">
            <h2>Meniul de azi</h2>
            <Badge tone="accent" icon="refresh-cw">preluat din meniul de ieri</Badge>
          </div>

          {chosen.length === 0 ? (
            <EmptyState icon="utensils" title="Niciun fel selectat" body="Bifează din catalogul de jos. Începe cu meniul de ieri dacă se repetă." />
          ) : CATS.map((cat) => {
            const rows = chosen.filter((c) => c.cat === cat);
            if (!rows.length) return null;
            return (
              <div key={cat} style={{ marginBottom: 18 }}>
                <div className="ub-eyebrow" style={{ marginBottom: 8 }}>{cat}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {rows.map((c) => (
                    <div key={c.id} className="ub-staff-row">
                      <span style={{ flex: 1, fontSize: 'var(--text-md)', fontWeight: 'var(--weight-semibold)' }}>{c.name}</span>
                      <div style={{ width: 112 }}>
                        <Input value={sel[c.id].price} suffix="lei" inputMode="decimal"
                          onChange={(e) => patch(c.id, { price: e.target.value })} />
                      </div>
                      <div style={{ width: 132 }}>
                        <Input value={sel[c.id].portions} placeholder="porții" suffix="opț."
                          inputMode="numeric" onChange={(e) => patch(c.id, { portions: e.target.value })} />
                      </div>
                      <IconButton name="x" label={`Scoate ${c.name}`} onClick={() => toggle(c)} />
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          <div className="ub-staff-publish">
            <Button size="lg" iconLeft="check" onClick={() => { setPublished(true); setTimeout(() => setPublished(false), 3000); }}>
              Publică meniul ({chosen.length} feluri)
            </Button>
            <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>
              Studenții văd meniul imediat. Poți reveni oricând.
            </span>
          </div>
        </section>

        <section>
          <div className="ub-staff-section-title"><h2>Catalog</h2>
            <span className="ub-numeric" style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>{CATALOG.length} feluri</span>
          </div>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginBottom: 12 }}>
            Bifează ce se gătește azi. Prețul vine din catalog și poate fi schimbat.
          </p>
          <div className="ub-catalog">
            {CATS.map((cat) => (
              <div key={cat}>
                <div className="ub-eyebrow" style={{ margin: '10px 0 6px' }}>{cat}</div>
                {CATALOG.filter((c) => c.cat === cat).map((c) => {
                  const on = !!sel[c.id]?.on;
                  return (
                    <label key={c.id} className="ub-check">
                      <span className="ub-box" data-on={on}>{on && <Icon name="check" size={15} stroke={3} />}</span>
                      <input type="checkbox" checked={on} onChange={() => toggle(c)} className="ub-visually-hidden" />
                      <span style={{ flex: 1, fontSize: 'var(--text-base)' }}>{c.name}</span>
                      <span className="ub-numeric" style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>{c.price} lei</span>
                    </label>
                  );
                })}
              </div>
            ))}
            <button type="button" className="ub-addnew"><Icon name="plus" size={17} />Adaugă un fel nou</button>
          </div>
        </section>
      </div>

      {published && (
        <div style={{ position: 'fixed', left: '50%', transform: 'translateX(-50%)', bottom: 24, zIndex: 60, minWidth: 320 }}>
          <Toast message="Meniul de azi e publicat. 312 studenți primesc o notificare." tone="success" icon="circle-check" />
        </div>
      )}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<StaffEditor />);
