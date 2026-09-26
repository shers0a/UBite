/* The loyalty card (docs/09): five dots, and at the till a code the phone computes itself —
   offline, because the till is the weakest Wi-Fi spot in the building. */
import React from 'react';
import { useLocation } from 'wouter';
import { REWARD_STEP_SECONDS, qrPayload, rewardCodeAt } from '@ubite/shared';
import { AppHeader, Button, EmptyState, Illustration, LoyaltyDots, Skeleton } from '@ds';
import { useNow } from '../../api/cache';
import { useI18n, formatDate } from '../../i18n';
import { useApp } from '../../state/app';
import { A } from '../../assets';
import { Qr } from '../../components/Qr';

export function Card() {
  const { t, lang } = useI18n();
  const { me, loyalty, requireSignIn, status } = useApp();
  const [, navigate] = useLocation();
  const now = useNow(1000);
  const reward = loyalty.data?.rewards[0] ?? null;
  const [code, setCode] = React.useState<string | null>(null);
  const step = Math.floor(now / 1000 / REWARD_STEP_SECONDS);
  React.useEffect(() => {
    let live = true;
    if (reward) rewardCodeAt(reward.code, reward.secret, now).then((c) => { if (live) setCode(c); }).catch(() => setCode(null));
    else setCode(null);
    return () => { live = false; };
  }, [reward?.id, step]); // eslint-disable-line react-hooks/exhaustive-deps
  const secondsLeft = REWARD_STEP_SECONDS - (Math.floor(now / 1000) % REWARD_STEP_SECONDS);

  if (status.data && !status.data.features.loyalty) {
    return (
      <div className="ub-screen">
        <AppHeader title={t('card.title')} onBack={() => navigate('/')} lang={lang} />
        <main id="main" style={{ padding: '0 var(--gutter)' }}>
          <EmptyState icon="star" title={t('visit.err.feature_off')} />
        </main>
      </div>
    );
  }

  if (!me) {
    return (
      <div className="ub-screen">
        <AppHeader title={t('card.title')} onBack={() => navigate('/')} lang={lang} />
        <main id="main" style={{ padding: '0 var(--gutter)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius-md)', padding: 'var(--space-4)' }}>
            <LoyaltyDots signedIn={false} lang={lang} onSignIn={() => requireSignIn('loyalty')} />
          </div>
          <HowItWorks />
        </main>
      </div>
    );
  }

  return (
    <div className="ub-screen">
      <AppHeader title={t('card.title')} onBack={() => navigate('/')} lang={lang} />
      <main id="main" style={{ padding: '0 var(--gutter) 28px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ position: 'relative', overflow: 'hidden', background: 'var(--surface-raised)', borderRadius: 'var(--radius-lg)', padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 8 }}>
            <div className="ub-eyebrow" style={{ marginBottom: 4 }}>{t('account.loyalty')}</div>
            <Illustration src={A.spot('friends')} tone="accent" boil width={96} height={96} style={{ margin: '-10px -6px 0 0' }} />
          </div>
          {loyalty.data ? (
            <LoyaltyDots filled={loyalty.data.filled} total={5} lang={lang} onAdd={() => navigate('/visit')} />
          ) : (
            <Skeleton width="70%" height={18} />
          )}

          {reward && (
            <div style={{ marginTop: 'var(--space-5)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-3)', textAlign: 'center' }}>
              <div className="ub-eyebrow">{t('card.code')}</div>
              <div className="ub-qr">{code && <Qr value={qrPayload.reward(code)} label={`${t('card.code')}: ${code}`} />}</div>
              <div className="ub-code ub-numeric" aria-live="polite">{code ?? '···· ····'}</div>
              <div className="ub-numeric" style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>
                {t('card.showAtTill')} · {t('card.changesIn', { s: secondsLeft })}
              </div>
              <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>{t('card.earned', { date: formatDate(reward.earnedAt.slice(0, 10), lang) })}</div>
            </div>
          )}
        </div>

        {!reward && (
          <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius-md)', padding: 16, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-3)', textAlign: 'center' }}>
            <div className="ub-eyebrow" style={{ alignSelf: 'flex-start' }}>{t('card.qrCard')}</div>
            <div className="ub-qr"><Qr value={qrPayload.card(me.id)} label={t('card.qrCard')} size={176} /></div>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>{t('card.qrCardHint')}</p>
          </div>
        )}

        <Button fullWidth size="lg" iconLeft="camera" onClick={() => navigate('/visit')}>{t('visit.take')}</Button>
        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>{t('card.offline')} {t('card.soft')}</p>
        <HowItWorks />
        <div className="ub-nav-space" />
      </main>
    </div>
  );
}

function HowItWorks() {
  const { t } = useI18n();
  return (
    <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius-md)', padding: 16 }}>
      <div className="ub-eyebrow" style={{ marginBottom: 10 }}>{t('card.how.title')}</div>
      <ol style={{ margin: 0, paddingLeft: 'var(--space-5)', display: 'grid', gap: 'var(--space-2)', fontSize: 'var(--text-base)', color: 'var(--text-secondary)' }}>
        <li>{t('card.how.1')}</li>
        <li>{t('card.how.2')}</li>
        <li>{t('card.how.3')}</li>
      </ol>
    </div>
  );
}
