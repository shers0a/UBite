const UB = window.UBiteDesignSystem_40c8c2;

function DishDetailScreen({ dish, state, set, back }) {
  const { AppHeader, DishDetailHeader, Button, IconButton, Toast } = UB;
  const [rated, setRated] = React.useState(0);
  const [fav, setFav] = React.useState(false);
  return (
    <div className="ub-scroll">
      <AppHeader title={dish.name} onBack={back} lang={state.lang}
        right={<IconButton name="download" label="Salvează" />} />
      <div style={{ padding: '0 var(--gutter) 24px' }}>
        <DishDetailHeader
          name={dish.name} price={dish.price} weight={dish.weight} tags={dish.tags || []}
          allergens={dish.allergens} allergenSource={dish.allergens ? 'Cantina Mihail Kogălniceanu' : undefined}
          rating={rated || dish.rating} ratingCount={dish.ratingCount}
          favourite={fav} onFavourite={() => setFav((v) => !v)}
          onRate={(n) => setRated(n)} slotId={`dish-${dish.id}-hero`} photo={dish.photo} lang={state.lang} />

        {dish.unavailable && (
          <div style={{ marginTop: 16 }}>
            <Toast message="S-a terminat azi. Îți dăm de știre când revine în meniu." icon="circle-alert" />
          </div>
        )}

        <div style={{ marginTop: 20, display: 'flex', gap: 10 }}>
          <Button variant="secondary" iconLeft="bell" fullWidth>Anunță-mă când e în meniu</Button>
        </div>

        <p style={{ marginTop: 16, fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>
          Prețurile și alergenii sunt cele comunicate de cantină. Dacă ceva nu corespunde, spune-ne din
          <a href="#" style={{ marginLeft: 4 }}>trimite feedback</a>.
        </p>
      </div>
    </div>
  );
}

/* First open: three slides, each with a flat scene (assets/illustrations/scenes/) on a quiet
   blob over the doodle wallpaper. Skippable from the first slide; never shown again. */
function OnboardingScreen({ onDone, initial = 0 }) {
  const { Button, Illustration, Pattern, Logo } = UB;
  const A = window.UBITE_ASSETS;
  const [i, setI] = React.useState(Math.min(2, Math.max(0, initial)));
  const slides = [
    { art: A && { kind: 'scene', src: A.scene('campus') }, title: 'Cantina Universității, în buzunar',
      body: 'Meniul zilei, coada de acum și ce spun colegii despre fiecare fel.' },
    { art: A && { kind: 'scene', src: A.scene('counter') }, title: 'Vezi meniul înainte să cobori',
      body: 'Se publică de obicei până la 10:30. Îl găsești și fără internet.' },
    { art: A && { kind: 'scene', src: A.scene('phone') }, title: 'Știi cât aștepți, în minute',
      body: 'Estimarea vine din rapoartele colegilor și îți arată mereu cât e de proaspătă.' },
  ];
  const s = slides[i];
  const last = i === slides.length - 1;
  return (
    <div className="ub-onb" role="dialog" aria-label="Bun venit în UBite">
      {Pattern && A && <Pattern src={A.pattern} opacity={0.06} size={375} />}
      <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '34px var(--gutter) 0' }}>
        {Logo && <Logo variant="tray" size={26} withText />}
        {!last && <Button size="sm" variant="quiet" onClick={onDone}>Sari peste</Button>}
      </div>
      <div className="ub-onb-slide" key={i} style={{ position: 'relative', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div className="ub-onb-art">
          {s.art && Illustration && <Illustration kind={s.art.kind} src={s.art.src} tone={s.art.tone || 'ink'} boil={s.art.boil}
            width={s.art.kind === 'spot' ? 250 : 300} height={s.art.kind === 'spot' ? 250 : 270} />}
        </div>
        <div style={{ padding: '26px var(--gutter) 0', textAlign: 'center' }}>
          <h1 style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--weight-bold)', letterSpacing: 'var(--tracking-tight)', lineHeight: 1.2 }}>{s.title}</h1>
          <p style={{ marginTop: 8, fontSize: 'var(--text-base)', color: 'var(--text-secondary)' }}>{s.body}</p>
        </div>
      </div>
      <div style={{ position: 'relative', padding: '0 var(--gutter) 28px' }}>
        <div className="ub-dots" style={{ marginBottom: 14 }}>
          {slides.map((x, k) => <button key={k} type="button" aria-label={`Pasul ${k + 1} din ${slides.length}`} data-on={k === i} onClick={() => setI(k)} />)}
        </div>
        <Button fullWidth size="lg" onClick={() => (last ? onDone() : setI(i + 1))}>{last ? 'Începe' : 'Înainte'}</Button>
      </div>
    </div>
  );
}

function AccountScreen({ state, set, back }) {
  const { AppHeader, LoyaltyDots, Button, Chip, Badge, Card } = UB;
  const rows = [
    ['Mese luna asta', '14'], ['Cheltuit', '186 lei'], ['Economisit prin fidelitate', '17 lei'], ['Felul preferat', 'Papanași cu smântână'],
  ];
  return (
    <div className="ub-scroll">
      <AppHeader title="Contul meu" onBack={back} lang={state.lang} />
      <div style={{ padding: '0 var(--gutter) 28px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ position: 'relative', overflow: 'hidden', background: 'var(--surface-raised)', borderRadius: 'var(--radius-lg)', padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 8 }}>
            <div className="ub-eyebrow" style={{ marginBottom: 4 }}>Fidelitate</div>
            {UB.Illustration && window.UBITE_ASSETS && (
              <UB.Illustration src={window.UBITE_ASSETS.spot('friends')} tone="accent" boil width={96} height={96} style={{ margin: '-10px -6px 0 0' }} />
            )}
          </div>
          <LoyaltyDots filled={state.loyalty} total={5} lang={state.lang} onAdd={() => set({ screen: 'visit' })} />
          <div style={{ marginTop: 14, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <Button size="sm" variant="secondary" iconLeft="qr-code">Vezi codul de recompensă</Button>
          </div>
        </div>

        <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius-md)', padding: 16 }}>
          <div className="ub-eyebrow" style={{ marginBottom: 10 }}>Istoricul tău</div>
          <div style={{ display: 'grid', gap: 8 }}>
            {rows.map(([k, v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-base)' }}>
                <span style={{ color: 'var(--text-secondary)' }}>{k}</span>
                <span className="ub-numeric" style={{ fontWeight: 'var(--weight-semibold)' }}>{v}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius-md)', padding: 16 }}>
          <div className="ub-eyebrow" style={{ marginBottom: 10 }}>Preferință alimentară</div>
          <div className="ub-chiprow" style={{ padding: 0 }}>
            <Chip selected icon="leaf">Vegetarian</Chip><Chip icon="salad">Vegan</Chip><Chip icon="wheat">Fără gluten</Chip>
          </div>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)', marginTop: 10 }}>
            Filtrăm meniul automat. Poți vedea oricând tot meniul dintr-un tap.
          </p>
        </div>

        <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius-md)', padding: 16 }}>
          <div className="ub-eyebrow" style={{ marginBottom: 10 }}>Notificări</div>
          {[['Meniul e publicat', true], ['Felul tău preferat e azi', true], ['E liber acum', false], ['Mai ai o masă până la cea gratuită', true]].map(([label, on]) => (
            <label key={label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', minHeight: 44, fontSize: 'var(--text-base)' }}>
              {label}
              <span style={{
                width: 46, height: 28, borderRadius: 999, background: on ? 'var(--accent)' : 'var(--border-strong)',
                position: 'relative', flex: 'none', transition: 'background var(--motion-fast) var(--ease-out)',
              }}>
                <span style={{ position: 'absolute', top: 3, left: on ? 21 : 3, width: 22, height: 22, borderRadius: '50%', background: 'var(--surface-raised)', transition: 'left var(--motion-fast) var(--ease-out)' }} />
              </span>
            </label>
          ))}
          <div style={{ marginTop: 8, fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>
            „E liber acum" te caută doar între 11:30 și 14:00. <a href="#">Schimbă intervalul</a>
          </div>
        </div>

        <Button variant="quiet" size="sm">Șterge contul</Button>
      </div>
    </div>
  );
}

function AddVisitScreen({ state, set, back }) {
  const { AppHeader, Button, Toast, Skeleton } = UB;
  const [step, setStep] = React.useState('camera');
  return (
    <div className="ub-scroll">
      <AppHeader title="Adaugă o vizită" onBack={back} lang={state.lang} />
      <div style={{ padding: '0 var(--gutter) 24px' }}>
        {step === 'camera' && (
          <>
            {UB.Illustration && window.UBITE_ASSETS && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                <UB.Illustration src={window.UBITE_ASSETS.spot('cashier')} tone="accent" boil width={92} height={92} />
                <p style={{ fontSize: 'var(--text-base)', color: 'var(--text-secondary)', margin: 0 }}>
                  Cere bonul la casă și fotografiază-l. Fiecare bon e o bulină pe cardul de fidelitate.
                </p>
              </div>
            )}
            <div style={{ position: 'relative', borderRadius: 'var(--radius-lg)', overflow: 'hidden', background: 'var(--surface-inverse)', height: 320, display: 'grid', placeItems: 'center' }}>
              <div style={{ position: 'absolute', inset: 24, border: '2px dashed rgba(255,255,255,.45)', borderRadius: 'var(--radius-md)' }} />
              {window.UBITE_ASSETS && (
                <span aria-hidden="true" style={{
                  position: 'absolute', top: 44, left: '50%', marginLeft: -60, width: 120, height: 150, opacity: .5,
                  background: 'var(--text-inverse)',
                  WebkitMask: `url(${window.UBITE_ASSETS.art.receipt}) center / contain no-repeat`,
                  mask: `url(${window.UBITE_ASSETS.art.receipt}) center / contain no-repeat`,
                }} />
              )}
              <span style={{ color: 'var(--text-inverse)', fontSize: 'var(--text-base)', textAlign: 'center', padding: '0 32px', marginTop: 150, position: 'relative' }}>
                Încadrează bonul fiscal în chenar. Nu e nevoie să fie perfect.
              </span>
            </div>
            <div style={{ marginTop: 16 }}>
              <Button fullWidth size="lg" iconLeft="camera" onClick={() => setStep('confirm')}>Fotografiază bonul</Button>
            </div>
            <p style={{ marginTop: 12, fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>
              Păstrăm doar data, suma și numărul bonului. Fotografia nu se salvează.
            </p>
          </>
        )}
        {step === 'confirm' && (
          <>
            <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius-md)', padding: 16 }}>
              <div className="ub-eyebrow" style={{ marginBottom: 10 }}>Am citit</div>
              {[['Data', '21 octombrie 2026, 12:48'], ['Sumă', '26 lei'], ['Bon', '#0421']].map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', minHeight: 36, fontSize: 'var(--text-base)' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>{k}</span>
                  <span className="ub-numeric" style={{ fontWeight: 'var(--weight-semibold)' }}>{v}</span>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 14, display: 'flex', gap: 10 }}>
              <Button variant="quiet" onClick={() => setStep('camera')}>Fă altă poză</Button>
              <Button fullWidth onClick={() => { set({ loyalty: Math.min(5, state.loyalty + 1), screen: 'home' }); }}>Adaugă vizita</Button>
            </div>
          </>
        )}
        {step === 'error' && (
          <Toast tone="danger" icon="triangle-alert" message="Nu am putut citi bonul. Încearcă o poză mai apropiată." action="Reîncearcă" onAction={() => setStep('camera')} />
        )}
        <div style={{ marginTop: 18 }}>
          <button type="button" onClick={() => setStep('error')} style={{ background: 'none', border: 0, color: 'var(--text-muted)', fontSize: 'var(--text-sm)', textDecoration: 'underline', cursor: 'pointer', padding: 0, minHeight: 'auto' }}>
            Vezi starea de eroare
          </button>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { OnboardingScreen, DishDetailScreen, AccountScreen, AddVisitScreen });
