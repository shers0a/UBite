/* Add a visit (docs/18): camera with guidance, then a confirmation of what was read, before it is
   recorded. On failure a clear request for a better photo — never silent acceptance, never silent
   rejection — and the documented fallback: type the receipt number and total. */
import React from 'react';
import { useLocation } from 'wouter';
import type { ReceiptDraft, VisitResponse } from '@ubite/shared';
import { formatLei, parseLei } from '@ubite/shared';
import { AppHeader, Button, EmptyState, Illustration, Input, OfflineBanner, Toast } from '@ds';
import { apiSend, ApiError } from '../../api/client';
import { useOnline } from '../../api/cache';
import { formatDayLong, hasString, useI18n } from '../../i18n';
import { useApp } from '../../state/app';
import { track } from '../../analytics';
import { A } from '../../assets';

type Step = 'camera' | 'reading' | 'confirm' | 'manual' | 'error';

/** A phone photo is 3–6 MB and the till has the weakest Wi-Fi in the building (docs/09). The
 *  reader works at about 1500 px across the receipt, so 2400 px on the long side loses nothing it
 *  uses and sends a few hundred KB. Any failure sends the original. */
async function shrinkPhoto(file: File): Promise<Blob> {
  try {
    if (typeof createImageBitmap !== 'function') return file;
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, 2400 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext('2d')?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.9));
    return blob && blob.size < file.size ? blob : file;
  } catch {
    return file;
  }
}

export function AddVisit() {
  const { t, lang } = useI18n();
  const { me, loyalty, requireSignIn, toast, status } = useApp();
  const [, navigate] = useLocation();
  const online = useOnline();
  const [step, setStep] = React.useState<Step>('camera');
  const [draft, setDraft] = React.useState<ReceiptDraft | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [number, setNumber] = React.useState('');
  const [total, setTotal] = React.useState('');
  const fileRef = React.useRef<HTMLInputElement>(null);

  const explain = (e: unknown) => {
    const err = e as ApiError;
    if (err.offline) return t('visit.offline');
    const key = `visit.err.${err.code}`;
    return hasString(key) ? t(key) : t('common.errorGeneric');
  };

  const done = (r: VisitResponse) => {
    loyalty.mutate(r.loyalty);
    track('visit_add');
    if (r.rewardIssued) {
      toast(t('visit.reward'), { tone: 'success', icon: 'gift' });
      navigate('/card');
    } else {
      toast(r.counted ? t('visit.recorded', { filled: r.loyalty.filled }) : t('visit.recordedNoPoint'), { tone: 'success', icon: 'circle-check' });
      navigate('/');
    }
  };

  const onPhoto = async (file: File | undefined) => {
    if (!file) return;
    setStep('reading'); setError(null);
    const form = new FormData();
    form.append('receipt', await shrinkPhoto(file), 'receipt.jpg');
    try {
      const d = await apiSend<ReceiptDraft>('POST', '/me/visits/scan', form);
      setDraft(d);
      setStep('confirm');
    } catch (e) {
      const err = e as ApiError;
      setError(err.code === 'unreadable' ? t('visit.unreadable') : explain(e));
      setStep('error');
    } finally {
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const confirm = async () => {
    if (!draft) return;
    setBusy(true); setError(null);
    try {
      done(await apiSend<VisitResponse>('POST', '/me/visits', { draftToken: draft.token }));
    } catch (e) {
      setError(explain(e));
    } finally { setBusy(false); }
  };

  const manual = async () => {
    const bani = parseLei(total);
    if (!/^\d{1,8}$/.test(number.trim()) || bani === null) { setError(t('common.errorGeneric')); return; }
    setBusy(true); setError(null);
    try {
      done(await apiSend<VisitResponse>('POST', '/me/visits', { manual: { receiptNumber: number.trim(), totalBani: bani } }));
    } catch (e) {
      setError(explain(e));
    } finally { setBusy(false); }
  };

  const header = <AppHeader title={t('visit.title')} onBack={() => (window.history.length > 1 ? window.history.back() : navigate('/'))} lang={lang} />;

  if (status.data && !status.data.features.loyalty) {
    return <div className="ub-screen">{header}<main id="main" style={{ padding: '0 var(--gutter)' }}><EmptyState icon="star" title={t('visit.err.feature_off')} /></main></div>;
  }
  if (!me) {
    return (
      <div className="ub-screen">{header}
        <main id="main" style={{ padding: '0 var(--gutter)' }}>
          <EmptyState art={A.art.receipt} icon="camera" title={t('visit.signIn')} body={t('visit.intro')} action={t('signin.title')} onAction={() => requireSignIn('loyalty')} />
        </main>
      </div>
    );
  }

  return (
    <div className="ub-screen">
      {header}
      <main id="main" style={{ padding: '0 var(--gutter) 24px' }}>
        {!online && <div style={{ marginBottom: 'var(--space-3)' }}><OfflineBanner variant="offline" lang={lang} /></div>}

        {(step === 'camera' || step === 'reading' || step === 'error') && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
              <Illustration src={A.spot('cashier')} tone="accent" boil width={92} height={92} />
              <p style={{ fontSize: 'var(--text-base)', color: 'var(--text-secondary)', margin: 0 }}>{t('visit.intro')}</p>
            </div>
            <div className="ub-frame">
              <div className="ub-frame-border" />
              {A.art.receipt && <span aria-hidden="true" className="ub-frame-art" style={{ WebkitMask: `url(${A.art.receipt}) center / contain no-repeat`, mask: `url(${A.art.receipt}) center / contain no-repeat` }} />}
              <span className="ub-frame-text">{step === 'reading' ? t('visit.reading') : t('visit.frame')}</span>
            </div>
            <input ref={fileRef} type="file" accept="image/*" capture="environment" className="ub-visually-hidden" tabIndex={-1}
              onChange={(e) => onPhoto(e.target.files?.[0])} aria-label={t('visit.take')} />
            {step === 'error' && error && (
              <div style={{ marginTop: 16 }}>
                <Toast tone="danger" icon="triangle-alert" message={error} />
              </div>
            )}
            <div style={{ marginTop: 16 }}>
              <Button fullWidth size="lg" iconLeft="camera" loading={step === 'reading'} disabled={!online}
                onClick={() => fileRef.current?.click()}>{step === 'reading' ? t('visit.reading') : t('visit.take')}</Button>
            </div>
            <div style={{ marginTop: 'var(--space-2)' }}>
              <button type="button" className="ub-linkbtn" onClick={() => { setStep('manual'); setError(null); }} disabled={!online}>{t('visit.manual')}</button>
            </div>
            <p style={{ marginTop: 12, fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>{t('visit.privacy')}</p>
          </>
        )}

        {step === 'confirm' && draft && (
          <>
            <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius-md)', padding: 16 }}>
              <div className="ub-eyebrow" style={{ marginBottom: 10 }}>{t('visit.read')}</div>
              {([
                [t('visit.date'), draft.date ? `${formatDayLong(draft.date, lang)}${draft.time ? `, ${draft.time}` : ''}` : t('common.unavailable')],
                [t('visit.total'), draft.totalBani !== null ? `${formatLei(draft.totalBani, lang)} lei` : t('common.unavailable')],
                [t('visit.number'), `#${draft.receiptNumber}`],
              ] as const).map(([k, v]) => (
                <div key={k} className="ub-row" style={{ minHeight: 36 }}>
                  <span>{k}</span><span className="ub-numeric">{v}</span>
                </div>
              ))}
              {draft.items.length > 0 && (
                <>
                  <div className="ub-eyebrow" style={{ margin: '12px 0 6px' }}>{t('visit.items')}</div>
                  <ul style={{ margin: 0, paddingLeft: 'var(--space-5)', color: 'var(--text-secondary)' }}>
                    {draft.items.map((i, n) => <li key={n}>{i.name}{i.priceBani !== null ? ` · ${formatLei(i.priceBani, lang)} lei` : ''}</li>)}
                  </ul>
                </>
              )}
            </div>
            {error && <div style={{ marginTop: 14 }}><Toast tone="danger" icon="triangle-alert" message={error} /></div>}
            <div style={{ marginTop: 14, display: 'flex', gap: 10 }}>
              <Button variant="quiet" onClick={() => { setStep('camera'); setDraft(null); setError(null); }}>{t('visit.retake')}</Button>
              <Button fullWidth loading={busy} onClick={confirm}>{t('visit.confirm')}</Button>
            </div>
          </>
        )}

        {step === 'manual' && (
          <form onSubmit={(e) => { e.preventDefault(); manual(); }} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <h2 style={{ fontSize: 'var(--text-lg)' }}>{t('visit.manualTitle')}</h2>
            <Input label={t('visit.manualNumber')} hint={t('visit.manualNumberHint')} inputMode="numeric" value={number}
              onChange={(e) => setNumber(e.target.value.replace(/\D/g, '').slice(0, 8))} lang={lang} />
            <Input label={t('visit.manualTotal')} inputMode="decimal" suffix="lei" value={total} placeholder="26,00"
              onChange={(e) => setTotal(e.target.value.replace(/[^\d.,]/g, '').slice(0, 8))} lang={lang} />
            {error && <Toast tone="danger" icon="triangle-alert" message={error} />}
            <div style={{ display: 'flex', gap: 10 }}>
              <Button variant="quiet" onClick={() => { setStep('camera'); setError(null); }}>{t('common.back')}</Button>
              <Button type="submit" fullWidth loading={busy} disabled={!number || !total}>{t('visit.confirm')}</Button>
            </div>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>{t('visit.privacy')}</p>
          </form>
        )}
        <div className="ub-nav-space" />
      </main>
    </div>
  );
}
