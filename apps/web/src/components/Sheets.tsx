import React from 'react';
import type { FeedbackRequest, Me, RequestCodeResponse } from '@ubite/shared';
import { Button, Input, Sheet, WaitReport } from '@ds';
import { apiSend, ApiError } from '../api/client';
import { enqueue } from '../api/outbox';
import { hasString, useI18n } from '../i18n';
import type { StringKey } from '../i18n/strings';
import { useApp, type ReportOutcome } from '../state/app';
import { track } from '../analytics';

/* ── Sign-in at the point of need (docs/10) ───────────────────────────────────────────── */

export function SignInSheet() {
  const { t, lang } = useI18n();
  const { signInOpen, closeSignIn, completeSignIn, toast } = useApp();
  const [step, setStep] = React.useState<'email' | 'code'>('email');
  const [email, setEmail] = React.useState('');
  const [code, setCode] = React.useState('');
  const [demoCode, setDemoCode] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (signInOpen) { setStep('email'); setCode(''); setDemoCode(null); setError(null); }
  }, [signInOpen]);

  const explain = (e: unknown) => {
    const err = e as ApiError;
    if (err.offline) return t('common.offlineNeeded');
    const key = `signin.err.${err.code}`;
    return hasString(key) ? t(key, { s: err.body?.retryAfterSeconds ?? 5 }) : t('common.errorGeneric');
  };

  const send = async () => {
    setBusy(true); setError(null);
    try {
      const r = await apiSend<RequestCodeResponse>('POST', '/auth/request-code', { email: email.trim() });
      // A demo deployment has no email: it hands the code over, and it goes straight in the field.
      setDemoCode(r.demoCode ?? null);
      if (r.demoCode) setCode(r.demoCode);
      setStep('code');
    } catch (e) { setError(explain(e)); } finally { setBusy(false); }
  };

  const verify = async () => {
    setBusy(true); setError(null);
    try {
      const me = await apiSend<Me>('POST', '/auth/verify', { email: email.trim(), code: code.trim() });
      completeSignIn(me);
      toast(t('signin.welcome'), { tone: 'success', icon: 'circle-check' });
    } catch (e) { setError(explain(e)); } finally { setBusy(false); }
  };

  if (!signInOpen) return null;
  return (
    <Sheet open fixed title={t('signin.title')} onClose={closeSignIn} lang={lang}>
      <p style={{ fontSize: 'var(--text-base)', color: 'var(--text-secondary)', marginBottom: 'var(--space-4)' }}>
        {t(`signin.why.${signInOpen}` as StringKey)}
      </p>
      {step === 'email' ? (
        <form onSubmit={(e) => { e.preventDefault(); send(); }} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <Input label={t(signInOpen === 'staff' ? 'signin.emailStaff' : 'signin.email')} type="email" inputMode="email" autoComplete="email" autoCapitalize="none" spellCheck={false}
            placeholder={signInOpen === 'staff' ? 'nume@unibuc.ro' : 'prenume.nume@s.unibuc.ro'} value={email} onChange={(e) => setEmail(e.target.value)}
            hint={signInOpen === 'staff' ? undefined : t('signin.emailHint')} error={error || undefined} lang={lang} required />
          <Button type="submit" fullWidth size="lg" loading={busy} disabled={!email.includes('@')}>{t('signin.sendCode')}</Button>
        </form>
      ) : (
        <form onSubmit={(e) => { e.preventDefault(); verify(); }} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <p style={{ fontSize: 'var(--text-base)' }}>
            {demoCode ? t('signin.demoCode', { code: demoCode }) : t('signin.codeSent', { email: email.trim().toLowerCase() })}
          </p>
          <Input label={t('signin.code')} inputMode="numeric" autoComplete="one-time-code" maxLength={6} pattern="\d{6}"
            className="ub-numeric" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            error={error || undefined} lang={lang} autoFocus />
          <Button type="submit" fullWidth size="lg" loading={busy} disabled={code.length !== 6}>{t('signin.verify')}</Button>
          <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
            <Button variant="quiet" size="sm" onClick={() => { setStep('email'); setError(null); }}>{t('signin.otherEmail')}</Button>
            <Button variant="quiet" size="sm" onClick={send} disabled={busy}>{t('signin.resend')}</Button>
          </div>
        </form>
      )}
    </Sheet>
  );
}

/* ── How long did you wait? (docs/03 F6) ──────────────────────────────────────────────── */

export function reportMessage(outcome: ReportOutcome): StringKey | null {
  return ({
    done: 'report.thanks', queued: 'report.queued', already: 'report.already', closed: 'report.closed',
    rejected: 'report.rejected', invalid: 'report.invalid', error: 'common.errorGeneric',
  } as const)[outcome] ?? null;
}

export function ReportSheet() {
  const { t, lang } = useI18n();
  const { sheet, openSheet, submitReport, toast } = useApp();
  const [other, setOther] = React.useState(false);
  const [value, setValue] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  React.useEffect(() => { if (sheet === 'report') { setOther(false); setValue(''); } }, [sheet]);
  if (sheet !== 'report') return null;

  const send = async (minutes: number) => {
    setBusy(true);
    const outcome = await submitReport(minutes);
    setBusy(false);
    if (outcome === 'invalid') { toast(t('report.invalid'), { tone: 'danger', icon: 'circle-alert' }); return; }
    openSheet(null);
    const ok = outcome === 'done' || outcome === 'queued' || outcome === 'already';
    toast(t(reportMessage(outcome)!), { tone: ok ? 'success' : outcome === 'error' ? 'danger' : 'neutral', icon: ok ? 'circle-check' : 'info' });
  };

  return (
    <Sheet open fixed title={t('report.title')} onClose={() => openSheet(null)} lang={lang}>
      {!other ? (
        <WaitReport lang={lang} state={busy ? 'sending' : 'idle'} onSubmit={(m: number | null) => (m === null ? setOther(true) : send(m))} />
      ) : (
        <form onSubmit={(e) => { e.preventDefault(); send(Number(value)); }} style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'flex-end' }}>
          <div style={{ flex: 1 }}>
            <Input label={t('report.minutesLabel')} inputMode="numeric" suffix={t('common.min')} value={value}
              onChange={(e) => setValue(e.target.value.replace(/\D/g, '').slice(0, 3))} lang={lang} autoFocus />
          </div>
          <Button type="submit" loading={busy} disabled={!value}>{t('report.send')}</Button>
        </form>
      )}
    </Sheet>
  );
}

/* ── Feedback: four questions, under thirty seconds, anonymous allowed (docs/03 F5) ───── */

function Scale({ label, value, onChange }: { label: string; value: number | null; onChange: (n: number) => void }) {
  const { t } = useI18n();
  return (
    <fieldset style={{ border: 0, padding: 0, margin: 0 }}>
      <legend style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--weight-semibold)', marginBottom: 'var(--space-2)' }}>{label}</legend>
      <div style={{ display: 'flex', gap: 'var(--space-2)' }} role="radiogroup" aria-label={label}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} type="button" role="radio" aria-checked={value === n} aria-label={t('feedback.scale', { n })}
            className="ub-wait ub-scale" data-on={value === n} onClick={() => onChange(n)}>
            {n}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

export function FeedbackSheet() {
  const { t, lang } = useI18n();
  const { sheet, openSheet, toast } = useApp();
  const [food, setFood] = React.useState<number | null>(null);
  const [app, setApp] = React.useState<number | null>(null);
  const [missing, setMissing] = React.useState('');
  const [came, setCame] = React.useState<boolean | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  React.useEffect(() => {
    if (sheet === 'feedback') { setFood(null); setApp(null); setMissing(''); setCame(null); setError(null); track('feedback_open'); }
  }, [sheet]);
  if (sheet !== 'feedback') return null;

  const submit = async () => {
    const body: FeedbackRequest = { foodRating: food, appRating: app, missingFeature: missing.trim() || null, cameBecauseOfApp: came, source: 'app' };
    if (food === null && app === null && !body.missingFeature && came === null) { setError(t('feedback.empty')); return; }
    setBusy(true);
    track('feedback_submit');
    const done = (queued: boolean) => {
      try { localStorage.setItem('ubite.feedbackAt', String(Date.now())); } catch { /* ignore */ }
      openSheet(null);
      toast(t(queued ? 'feedback.queued' : 'feedback.thanks'), { tone: 'success', icon: 'circle-check' });
    };
    if (!navigator.onLine) { enqueue({ kind: 'feedback', body }); setBusy(false); done(true); return; }
    try {
      await apiSend('POST', '/feedback', body);
      done(false);
    } catch (e) {
      if ((e as ApiError).offline) { enqueue({ kind: 'feedback', body }); done(true); } else setError(t('common.errorGeneric'));
    } finally { setBusy(false); }
  };

  return (
    <Sheet open fixed title={t('feedback.title')} onClose={() => openSheet(null)} lang={lang}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
        <Scale label={t('feedback.food')} value={food} onChange={setFood} />
        <Scale label={t('feedback.app')} value={app} onChange={setApp} />
        <fieldset style={{ border: 0, padding: 0, margin: 0 }}>
          <legend style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--weight-semibold)', marginBottom: 'var(--space-2)' }}>{t('feedback.came')}</legend>
          <div style={{ display: 'flex', gap: 'var(--space-2)' }} role="radiogroup" aria-label={t('feedback.came')}>
            {([true, false] as const).map((v) => (
              <button key={String(v)} type="button" role="radio" aria-checked={came === v} className="ub-wait ub-scale" data-on={came === v}
                onClick={() => setCame(v)} style={{ minWidth: 88 }}>{t(v ? 'feedback.yes' : 'feedback.no')}</button>
            ))}
          </div>
        </fieldset>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          <span style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--weight-semibold)' }}>{t('feedback.missing')}</span>
          <textarea className="ub-textarea" rows={3} maxLength={1000} value={missing} onChange={(e) => setMissing(e.target.value)}
            placeholder={t('feedback.missingHint')} />
        </label>
        {error && <p role="alert" style={{ color: 'var(--status-danger-text)', fontSize: 'var(--text-sm)' }}>{error}</p>}
        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>{t('feedback.anon')}</p>
        <Button fullWidth size="lg" loading={busy} onClick={submit}>{t('feedback.send')}</Button>
      </div>
    </Sheet>
  );
}
