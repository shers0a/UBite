/* "Despre UBite": the kit's three flat scenes over the doodle wallpaper. docs/18 is explicit that
   there is no onboarding before the value — the first open goes straight to crowding and menu —
   so these slides are reachable from the footer, never a gate. */
import React from 'react';
import { useLocation } from 'wouter';
import { Button, Illustration, Logo, Pattern } from '@ds';
import { useI18n } from '../../i18n';
import { A } from '../../assets';

export function About() {
  const { t } = useI18n();
  const [, navigate] = useLocation();
  const [i, setI] = React.useState(0);
  const slides = [
    { scene: A.scene('campus'), title: t('about.s1.title'), body: t('about.s1.body') },
    { scene: A.scene('counter'), title: t('about.s2.title'), body: t('about.s2.body') },
    { scene: A.scene('phone'), title: t('about.s3.title'), body: t('about.s3.body') },
  ];
  const s = slides[i];
  const last = i === slides.length - 1;
  const done = () => navigate('/');
  return (
    <main id="main" className="ub-onb" aria-label={t('about.title')}>
      <Pattern src={A.pattern} opacity={0.06} size={375} />
      <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '34px var(--gutter) 0' }}>
        <Logo variant="tray" size={26} withText />
        {!last && <Button size="sm" variant="quiet" onClick={done}>{t('about.skip')}</Button>}
      </div>
      <div className="ub-onb-slide" key={i} style={{ position: 'relative', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div className="ub-onb-art">
          {s.scene && <Illustration kind="scene" src={s.scene} tone="ink" width={300} height={270} />}
        </div>
        <div style={{ padding: '26px var(--gutter) 0', textAlign: 'center' }}>
          <h1 style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--weight-bold)', letterSpacing: 'var(--tracking-tight)', lineHeight: 1.2 }}>{s.title}</h1>
          <p style={{ marginTop: 8, fontSize: 'var(--text-base)', color: 'var(--text-secondary)', marginInline: 'auto' }}>{s.body}</p>
        </div>
      </div>
      <div style={{ position: 'relative', padding: '0 var(--gutter) 28px' }}>
        <div className="ub-dots" style={{ marginBottom: 14 }}>
          {slides.map((_, k) => (
            <button key={k} type="button" aria-label={t('about.step', { n: k + 1, total: slides.length })} aria-current={k === i ? 'step' : undefined}
              data-on={k === i} onClick={() => setI(k)} />
          ))}
        </div>
        <Button fullWidth size="lg" onClick={() => (last ? done() : setI(i + 1))}>{last ? t('about.start') : t('about.next')}</Button>
      </div>
    </main>
  );
}
