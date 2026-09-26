const UB = window.UBiteDesignSystem_40c8c2;

const MENU = [
  { cat: 'Ciorbă', icon: 'soup', picto: 'soup', items: [
    { id: 'ciorba-perisoare', name: 'Ciorbă de perișoare', price: 9, tags: ['gluten'], glyph: 'soup', weight: '400 ml', rating: 4.4, ratingCount: 62 },
    { id: 'supa-legume', name: 'Supă cremă de legume', price: 8, tags: ['vegetarian'], glyph: 'soup', weight: '400 ml', rating: 4.0, ratingCount: 21 },
  ]},
  { cat: 'Fel principal', icon: 'utensils', picto: 'main', items: [
    { id: 'pui-cartofi', name: 'Pui la cuptor cu cartofi', price: 17, tags: ['lactose'], portions: 120, weight: '320 g', rating: 4.2, ratingCount: 38, allergens: ['Lactoză', 'Muștar'] },
    { id: 'musaca', name: 'Musaca de legume', price: 14, tags: ['vegetarian'], glyph: 'salad', weight: '300 g', rating: 3.9, ratingCount: 17 },
    { id: 'sarmale', name: 'Sarmale cu mămăligă', price: 16, tags: ['pork'], weight: '350 g', rating: 4.6, ratingCount: 84, unavailable: true },
    { id: 'peste', name: 'File de pește la cuptor', price: 19, tags: ['fish'], glyph: 'fish', weight: '280 g', rating: 4.1, ratingCount: 12 },
  ]},
  { cat: 'Desert și salată', icon: 'cookie', picto: 'dessert', items: [
    { id: 'salata-varza', name: 'Salată de varză', price: 4, tags: ['vegan'], glyph: 'salad', weight: '150 g', rating: 4.3, ratingCount: 9 },
    { id: 'papanasi', name: 'Papanași cu smântână', price: 12, tags: ['gluten', 'lactose'], glyph: 'cookie', weight: '220 g', rating: 4.8, ratingCount: 103 },
  ]},
  { cat: 'Băuturi și extra', icon: 'cup-soda', picto: 'drink', items: [
    { id: 'compot', name: 'Compot de mere', price: 3, tags: ['vegan'], glyph: 'cup-soda', weight: '250 ml', rating: 4.0, ratingCount: 6 },
    { id: 'paine', name: 'Pâine', price: 1, tags: ['gluten'], glyph: 'wheat', weight: '80 g' },
  ]},
];

// Placeholder dish photography until the canteen's own photos arrive (assets/manifest.json).
const A = window.UBITE_ASSETS;
if (A) MENU.forEach((g) => g.items.forEach((i) => { i.photo = A.dish(i.id); }));

const FILTERS = [
  { key: 'vegetarian', label: 'Vegetarian', icon: 'leaf' },
  { key: 'vegan', label: 'Vegan', icon: 'salad' },
  { key: 'gluten', label: 'Fără gluten', icon: 'wheat' },
  { key: 'lactose', label: 'Fără lactoză', icon: 'milk' },
];

const HOURS = [
  { label: '11:30', value: 2 }, { label: '12:00', value: 4 }, { label: '12:30', value: 7 },
  { label: '13:00', value: 12 }, { label: '13:30', value: 9 }, { label: '14:00', value: 5 },
  { label: '14:30', value: 3 }, { label: '15:00', value: 2 },
];

const PICKS = ['papanasi', 'pui-cartofi', 'ciorba-perisoare', 'musaca'];
const ALL = MENU.flatMap((g) => g.items);

function matches(item, active) {
  if (!active.length) return true;
  return active.every((f) => {
    if (f === 'vegetarian') return item.tags.includes('vegetarian') || item.tags.includes('vegan');
    if (f === 'vegan') return item.tags.includes('vegan');
    if (f === 'gluten') return !item.tags.includes('gluten');
    if (f === 'lactose') return !item.tags.includes('lactose');
    return true;
  });
}

/* The "picks" rail borrows the horizontal card carousel from the inspiration screens —
   a photo, a price pill and a rating, scrollable with the thumb. */
function PickCard({ item, onClick }) {
  const { Icon } = UB;
  return (
    <button type="button" className="ub-pick" onClick={onClick}>
      <span className="ub-pick-photo">
        {item.photo
          ? <img src={item.photo} alt="" loading="lazy" />
          : <image-slot id={`pick-${item.id}`} shape="rounded" radius="12" placeholder={item.name} style={{ width: '100%', height: '100%' }}></image-slot>}
        <span className="ub-pick-price ub-numeric">{item.price} lei</span>
      </span>
      <span className="ub-pick-name">{item.name}</span>
      {item.rating && (
        <span className="ub-pick-rating ub-numeric">
          <Icon name="star" size={13} style={{ fill: 'var(--crowd-moderate-fill)', color: 'var(--crowd-moderate-fill)' }} />
          {item.rating.toFixed(1)}
        </span>
      )}
    </button>
  );
}

/* Category pills carry the drawn pictograms (assets/illustrations/picto/), like the menu of
   the coffee-app reference; a category without one yet keeps its Lucide icon. On the selected
   pill the pictogram's fill switches to the quiet accent so it still reads on the blue. */
function CategoryPills({ onJump, activeCat }) {
  const { Icon, Illustration } = UB;
  return (
    <div className="ub-pillrow">
      {MENU.map((g) => {
        const on = activeCat === g.cat;
        const picto = A && A.picto(g.picto);
        return (
          <button key={g.cat} type="button" className="ub-pill" data-on={on} onClick={() => onJump(g.cat)}>
            <span className="ub-pill-ico">
              {picto && Illustration
                ? <Illustration kind="picto" src={picto} tone="current" width={34} height={34} style={on ? { '--accent': 'var(--accent-quiet)' } : undefined} />
                : <Icon name={g.icon} size={20} />}
            </span>
            <span>{g.cat}</span>
          </button>
        );
      })}
    </div>
  );
}

/* The spotlight rail: three things UBite really does, each with a character. Swipe, or tap
   the dots. */
function SpotlightRail({ state, set, openSheet, onHours }) {
  const { Spotlight } = UB;
  const rail = React.useRef(null);
  const [index, setIndex] = React.useState(0);
  if (!Spotlight || !A) return null;
  const alert = { action: state.menuAlert ? 'Activat' : 'Anunță-mă', onAction: () => set({ menuAlert: !state.menuAlert }) };
  const cards = [
    // What is true right now comes first: offline, closed. Then the tip, the loyalty nudge, the rest.
    ...(state.offline ? [{ art: A.spot('offline'), tone: 'inverse', eyebrow: 'Fără internet', title: 'Îți arătăm meniul salvat. Raportul pleacă singur când revine semnalul.' }] : []),
    ...(state.level === 'closed' ? [{ art: A.spot('nap'), eyebrow: 'Cantina e închisă', title: 'Deschidem mâine la 11:30. Meniul apare până la 10:30.', ...alert }] : []),
    { art: A.spot('run'), video: A.motion('run'), eyebrow: 'Sfat pentru marți', title: 'La 11:30 aștepți cam 2 minute. La 13:00, cam 12.', action: 'Vezi orele', onAction: onHours },
    ...(state.signedIn && state.loyalty === 4 ? [{ art: A.spot('reward'), tone: 'quiet', eyebrow: 'Fidelitate', title: 'Încă o vizită și următoarea masă e gratuită.', action: 'Vezi cardul', onAction: () => set({ screen: 'account' }) }] : []),
    { art: A.spot('queue'), eyebrow: 'Ajută-i pe colegi', title: 'Spune cât ai stat la coadă. Durează două secunde.', action: 'Raportez', onAction: () => openSheet('report') },
    ...(state.level === 'closed' ? [] : [{ art: A.spot('cook'), eyebrow: 'Meniul de mâine', title: 'Apare de obicei până la 10:30. Îți dăm de știre.', ...alert }]),
  ];
  const go = (i) => {
    const el = rail.current;
    if (el) el.scrollTo({ left: i * (el.firstChild.offsetWidth + 12), behavior: 'smooth' });
  };
  return (
    <section className="ub-rise" style={{ padding: 'var(--density-zone-1) 0 0' }} aria-label="Noutăți">
      <div className="ub-spotrail" ref={rail} onScroll={(e) => {
        const el = e.currentTarget;
        setIndex(Math.round(el.scrollLeft / (el.firstChild.offsetWidth + 12)));
      }}>
        {cards.map((c) => <Spotlight key={c.title} {...c} style={{ flex: 'none', width: 'calc(100% - 2 * var(--gutter) - 20px)', scrollSnapAlign: 'start' }} />)}
      </div>
      <div className="ub-dots" role="tablist" aria-label="Alege cardul">
        {cards.map((c, i) => (
          <button key={c.title} type="button" role="tab" aria-selected={index === i} aria-label={`Cardul ${i + 1} din ${cards.length}`}
            data-on={index === i} onClick={() => go(i)} />
        ))}
      </div>
    </section>
  );
}

function HomeScreen({ state, set, openDish, openSheet }) {
  const { CrowdingIndicator, Chip, DishRow, CategoryHeader, LoyaltyDots, WaitReport,
    CrowdingByHour, Announcement, OfflineBanner, EmptyState, AppHeader, AppFooter, IconButton, Icon, Logo } = UB;
  const [scrollY, setScrollY] = React.useState(0);
  const [activeCat, setActiveCat] = React.useState(null);
  const scroller = React.useRef(null);
  const catRefs = React.useRef({});
  const active = state.filters;
  const toggle = (k) => set({ filters: active.includes(k) ? active.filter((x) => x !== k) : [...active, k] });
  const visible = MENU.map((g) => ({ ...g, items: g.items.filter((i) => matches(i, active)) })).filter((g) => g.items.length);

  // ?scroll=560 opens the home screen already scrolled (mockup screenshots, review links).
  React.useEffect(() => {
    const y = Number(new URLSearchParams(location.search).get('scroll'));
    if (y && scroller.current) { scroller.current.scrollTop = y; setScrollY(y); }
  }, []);

  const jump = (cat) => {
    const el = catRefs.current[cat];
    const box = scroller.current;
    if (el && box) box.scrollTo({ top: el.offsetTop - 104, behavior: 'smooth' });
    setActiveCat(cat);
  };

  const miniOut = scrollY > 300;

  return (
    <div className="ub-scroll" ref={scroller} onScroll={(e) => setScrollY(e.currentTarget.scrollTop)}>
      {/* The mini crowding bar pops in once the hero has scrolled away — the answer the
          student came for is never more than a glance away. */}
      <div className="ub-mini" data-in={miniOut}>
        <span className="ub-mini-dot" data-level={state.level} />
        <strong>{{ low: 'Coadă mică', moderate: 'Coadă medie', high: 'Coadă mare', closed: 'Închis' }[state.level]}</strong>
        {state.level !== 'closed' && <span className="ub-numeric">~{state.wait} min</span>}
        <button type="button" onClick={() => scroller.current.scrollTo({ top: 0, behavior: 'smooth' })} aria-label="Sus">
          <Icon name="chevron-down" size={16} style={{ transform: 'rotate(180deg)' }} />
        </button>
      </div>

      {/* Zone 1 — the hall photo drifts at 40% of scroll and pulls back slightly as you go;
          the crowding card overlaps it by 64px. */}
      <div style={{ position: 'relative', height: 208, overflow: 'hidden' }}>
        <div style={{
          position: 'absolute', inset: '-40px 0 0',
          transform: `translateY(${scrollY * 0.4}px) scale(${1 + Math.min(scrollY, 300) * 0.0006})`,
          transformOrigin: 'center top', willChange: 'transform',
        }}>
          {A
            ? <img src={A.hall} alt="" style={{ width: '100%', height: 260, objectFit: 'cover', display: 'block' }} />
            : <image-slot id="canteen-hall" shape="rect" placeholder="Fotografie: sala cantinei Mihail Kogălniceanu" style={{ width: '100%', height: 260 }}></image-slot>}
        </div>
        <div style={{ position: 'absolute', inset: 0, background: 'var(--scrim)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
          <div style={{ pointerEvents: 'auto', opacity: miniOut ? 0 : 1, transition: 'opacity var(--motion-base) var(--ease-out)' }}>
            <AppHeader brand={Logo ? <Logo variant={state.logo || 'tray'} size={30} level={state.level} withText /> : undefined} right={<>
              <IconButton name="languages" label="Schimbă limba" onClick={() => set({ lang: state.lang === 'ro' ? 'en' : 'ro' })} />
              <IconButton name="bell" label="Notificări" />
              <IconButton name="settings" label="Contul meu" onClick={() => set({ screen: 'account' })} />
            </>} sticky={false} />
          </div>
        </div>
      </div>

      <div className="ub-rise" style={{ padding: '0 var(--gutter) 0', marginTop: -64, position: 'relative', zIndex: 5 }}>
        {state.offline && (
          <div style={{ marginBottom: 12 }}>
            <OfflineBanner variant="offline" updatedLabel="Actualizat la 12:04" queued={state.queued || undefined} lang={state.lang} />
          </div>
        )}
        <CrowdingIndicator
          level={state.level} waitMinutes={state.wait} quality={state.quality}
          updatedSecondsAgo={state.age} lang={state.lang} loading={state.loading}
          onReport={() => openSheet('report')} />
      </div>

      {/* Picks rail */}
      <section className="ub-rise" style={{ padding: 'var(--density-zone-1) 0 0' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 10, padding: '0 var(--gutter) 10px' }}>
          <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-semibold)', minWidth: 0 }}>
            {state.lang === 'ro' ? 'Ce mănâncă lumea azi' : 'What people are eating today'}
          </h2>
          <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{state.lang === 'ro' ? 'după note' : 'by rating'}</span>
        </div>
        <div className="ub-rail">
          {PICKS.map((id) => {
            const item = ALL.find((i) => i.id === id);
            return <PickCard key={id} item={item} onClick={() => openDish(item)} />;
          })}
        </div>
      </section>

      <SpotlightRail state={state} set={set} openSheet={openSheet}
        onHours={() => { const el = catRefs.current.__hours; if (el) scroller.current.scrollTo({ top: el.offsetTop - 80, behavior: 'smooth' }); }} />

      {/* Zone 2 — today's menu */}
      <section style={{ padding: 'var(--density-zone-2) var(--gutter) 0' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 12, gap: 10 }}>
          <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--weight-bold)', letterSpacing: 'var(--tracking-tight)' }}>
            {state.lang === 'ro' ? 'Meniul de azi' : "Today's menu"}
          </h2>
          <span className="ub-numeric" style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>marți, 21 oct</span>
        </div>

        <CategoryPills onJump={jump} activeCat={activeCat} />

        <div className="ub-chiprow" style={{ marginTop: 10 }}>
          {FILTERS.map((f) => (
            <Chip key={f.key} icon={f.icon} selected={active.includes(f.key)} onClick={() => toggle(f.key)}>{f.label}</Chip>
          ))}
        </div>

        {state.menuState === 'stale' && (
          <div style={{ margin: '12px 0' }}>
            <OfflineBanner variant="stale" updatedLabel="Meniul de ieri, luni 20 oct" lang={state.lang} />
          </div>
        )}

        <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius-md)', padding: '4px 14px 10px', marginTop: 14 }}>
          {state.loading ? (
            [0, 1, 2].map((i) => <DishRow key={i} loading name="" price="" />)
          ) : state.menuState === 'empty' ? (
            <div style={{ padding: '8px 0' }}>
              <EmptyState art={A && A.art.emptyMenu} icon="utensils" title="Meniul de azi nu e publicat încă"
                body="De obicei apare până la 10:30. Până atunci îți arătăm meniul de ieri." action="Vezi meniul de ieri"
                onAction={() => set({ menuState: 'stale' })} />
            </div>
          ) : visible.length === 0 ? (
            <div style={{ padding: '8px 0' }}>
              <EmptyState compact art={A && A.art.noResults} icon="sliders-horizontal" title="Niciun fel nu se potrivește cu filtrele"
                body="Scoate un filtru ca să vezi tot meniul de azi." action="Șterge filtrele" onAction={() => set({ filters: [] })} />
            </div>
          ) : visible.map((g) => (
            <div key={g.cat} ref={(el) => { catRefs.current[g.cat] = el; }}>
              <CategoryHeader title={g.cat} icon={g.icon} count={g.items.length} lang={state.lang} />
              {g.items.map((i) => (
                <DishRow key={i.id} {...i} slotId={`dish-${i.id}`} lang={state.lang} onClick={() => openDish(i)} />
              ))}
            </div>
          ))}
        </div>
      </section>

      {/* Zone 3 — loyalty */}
      <section style={{ padding: 'var(--density-zone-2) var(--gutter) 0' }}>
        <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius-md)', padding: 16 }}>
          <LoyaltyDots filled={state.loyalty} total={5} signedIn={state.signedIn} lang={state.lang} onAdd={() => set({ screen: 'visit' })} />
        </div>
      </section>

      {/* Zone 4 — report your wait */}
      <section style={{ padding: 'var(--density-zone-3) var(--gutter) 0' }}>
        <WaitReport state={state.reportState} lang={state.lang} onSubmit={() => set({ reportState: 'done', wait: 5, level: 'moderate', age: 3 })} />
      </section>

      {/* Zone 5 — typical crowding */}
      <section ref={(el) => { catRefs.current.__hours = el; }} style={{ padding: 'var(--density-zone-4) var(--gutter) 0' }}>
        <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius-md)', padding: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
            <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--weight-semibold)' }}>
              {state.lang === 'ro' ? 'De obicei marțea' : 'Usually on Tuesdays'}
            </h3>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
              {state.lang === 'ro' ? 'aglomerat la 13:00' : 'busy at 13:00'}
            </span>
          </div>
          <CrowdingByHour data={HOURS} nowIndex={3} lang={state.lang} />
        </div>
      </section>

      {/* Zone 6 — announcements */}
      <section style={{ padding: 'var(--density-zone-5) var(--gutter) 0' }}>
        <Announcement title="Vineri cantina se închide la 15:00" body="Bucătăria are revizie tehnică." date="18 octombrie" tone="warning" />
      </section>

      {/* Zone 7 — footer, signed off with the city sketch */}
      {A && (
        <div aria-hidden="true" style={{
          height: 120, marginTop: 'var(--density-zone-5)', background: 'var(--text-muted)', opacity: 0.35,
          WebkitMask: `url(${A.sketch}) center bottom / auto 100% no-repeat`, mask: `url(${A.sketch}) center bottom / auto 100% no-repeat`,
        }} />
      )}
      <AppFooter lang={state.lang} onLang={() => set({ lang: state.lang === 'ro' ? 'en' : 'ro' })} />
      <div style={{ height: 76 }} />
    </div>
  );
}

function BottomNav({ screen, go }) {
  const { Icon } = UB;
  const items = [['home', 'utensils', 'Meniu'], ['account', 'star', 'Fidelitate'], ['visit', 'camera', 'Bon'], ['settings', 'settings', 'Cont']];
  return (
    <nav className="ub-nav">
      {items.map(([key, icon, label]) => (
        <button key={key} type="button" data-on={screen === key} onClick={() => go(key === 'settings' ? 'account' : key)}>
          <Icon name={icon} size={19} />
          <span>{label}</span>
        </button>
      ))}
    </nav>
  );
}

Object.assign(window, { HomeScreen, BottomNav, MENU, HOURS });
