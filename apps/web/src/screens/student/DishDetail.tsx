/* Dish detail (docs/18): photo, name, price, weight, tags, allergens with their source — never
   implied absence — calories when supplied, rating, heart. Sign-in only at the point of need. */
import React from 'react';
import { useLocation } from 'wouter';
import type { DishDetail as Detail } from '@ubite/shared';
import { ALLERGEN_LABELS, formatLei } from '@ubite/shared';
import { AppHeader, Button, DishDetailHeader, EmptyState, IconButton, Skeleton } from '@ds';
import { useResource } from '../../api/cache';
import { apiSend } from '../../api/client';
import { useI18n } from '../../i18n';
import { useApp } from '../../state/app';
import { useNotifications } from '../../state/notifications';
import { track } from '../../analytics';
import { A } from '../../assets';
import { dishName } from '../../components/Menu';
import { InstallPrompt } from '../../components/Chrome';

export function DishDetail({ id }: { id: string }) {
  const { t, lang } = useI18n();
  const { me, setMe, requireSignIn, toast, openSheet } = useApp();
  const [, navigate] = useLocation();
  // Keyed per signed-in state, so "mine" (favourite, my rating) never leaks between accounts.
  const res = useResource<Detail>(`dish:${id}:${me?.id ?? 'anon'}`, `/dishes/${id}`);
  const dish = res.data;
  const [pending, setPending] = React.useState(false);
  const [installAsk, setInstallAsk] = React.useState(false);
  const { ensurePush, setPrefs } = useNotifications();
  const back = () => (window.history.length > 1 ? window.history.back() : navigate('/'));

  const favourite = !!(me?.favorites.includes(id));

  const setFavourite = async (want: boolean) => {
    const current = me;
    if (!current) return;
    setMe({ ...current, favorites: want ? [...current.favorites.filter((x) => x !== id), id] : current.favorites.filter((x) => x !== id) });
    try {
      await apiSend('PUT', `/me/favorites/${id}`, { favorite: want });
      if (want) track('favorite_add');
    } catch {
      setMe(current);
      toast(t('common.errorGeneric'), { tone: 'danger', icon: 'triangle-alert' });
    }
  };

  const toggleFavourite = () => requireSignIn('favorite', () => setFavourite(!favourite));

  // "Notify me when it is on the menu": a favourite plus the favourite-today notification (F10).
  const notifyMe = () => requireSignIn('favorite', async () => {
    if (favourite) { await setFavourite(false); return; }
    await setFavourite(true);
    const r = await ensurePush();
    if (r === 'ios') { setInstallAsk(true); return; }
    await setPrefs({ favorite_today: true }).catch(() => {});
    toast(t('dish.notifyOn'), { tone: 'success', icon: 'bell' });
  });

  const rate = (stars: number) => requireSignIn('rate', async () => {
    setPending(true);
    try {
      const r = await apiSend<{ stars: number; rating: Detail['rating'] }>('PUT', `/dishes/${id}/rating`, { stars });
      if (dish) res.mutate({ ...dish, rating: r.rating, mine: { favorite: favourite, stars: r.stars } });
      track('rating_submit');
      toast(t('dish.rated'), { tone: 'success', icon: 'star' });
    } catch {
      toast(t('common.errorGeneric'), { tone: 'danger', icon: 'triangle-alert' });
    } finally {
      setPending(false);
    }
  });

  const share = async () => {
    try { await navigator.share({ title: dish ? dishName(dish, lang) : 'UBite', url: location.href }); } catch { /* dismissed */ }
  };

  if (res.error?.status === 404) {
    return (
      <div className="ub-screen">
        <AppHeader title="" onBack={back} lang={lang} />
        <main id="main" style={{ padding: '0 var(--gutter)' }}>
          <EmptyState art={A.art.noResults} icon="utensils" title={t('dish.notFound.title')} body={t('dish.notFound.body')}
            action={t('dish.notFound.action')} onAction={() => navigate('/')} />
        </main>
      </div>
    );
  }

  const name = dish ? dishName(dish, lang) : '';
  const price = dish ? formatLei(dish.todayPriceBani ?? dish.defaultPriceBani, lang) : '';
  const allergens = dish?.allergens.filter((a) => a.source === 'canteen_declared').map((a) => ALLERGEN_LABELS[a.allergen][lang]) ?? [];

  return (
    <div className="ub-screen">
      <AppHeader title={name} onBack={back} lang={lang}
        right={typeof navigator.share === 'function' ? <IconButton name="share" label={t('dish.share')} onClick={share} /> : undefined} />
      <main id="main" style={{ padding: '0 var(--gutter) 24px' }}>
        {!dish ? (
          <div aria-busy="true">
            <Skeleton width="100%" height={240} radius="var(--radius-lg)" />
            <div style={{ height: 18 }} />
            <Skeleton width="70%" height={30} />
            <div style={{ height: 12 }} />
            <Skeleton width="40%" height={18} />
            <div style={{ height: 20 }} />
            <Skeleton width="100%" height={96} radius="var(--radius-md)" />
          </div>
        ) : (
          <>
            <DishDetailHeader
              name={name} price={price} lang={lang}
              weight={dish.weightGrams ? `${dish.weightGrams} g` : undefined}
              tags={dish.tags}
              allergens={allergens} allergenSource={allergens.length ? t('dish.allergenSource') : undefined}
              rating={dish.mine?.stars ?? dish.rating.average ?? 0} ratingCount={dish.rating.count}
              favourite={favourite} onFavourite={toggleFavourite} onRate={pending ? undefined : rate}
              photo={dish.photo?.url} photoNote={dish.photo?.placeholder ? t('dish.placeholderPhoto') : undefined} />

            {(dish.calories || dish.todayPriceBani === null) && (
              <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap', marginTop: 'var(--space-3)', fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>
                {dish.calories ? <span className="ub-numeric">{t('dish.calories', { n: dish.calories })}</span> : null}
                {dish.todayPriceBani === null ? <span>{t('dish.usualPrice')}</span> : null}
              </div>
            )}

            <div style={{ marginTop: 20, display: 'flex', gap: 10 }}>
              <Button variant="secondary" iconLeft="bell" fullWidth onClick={notifyMe}>
                {favourite ? t('dish.notifyOn') : t('dish.notifyOff')}
              </Button>
            </div>

            <p style={{ marginTop: 16, fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>
              {t('dish.disclaimer')}
              <a href="#feedback" style={{ marginLeft: 4 }} onClick={(e) => { e.preventDefault(); openSheet('feedback'); }}>{t('dish.disclaimerLink')}</a>.
            </p>
          </>
        )}
        <div className="ub-nav-space" />
      </main>
      {installAsk && <InstallPrompt force onClose={() => setInstallAsk(false)} />}
    </div>
  );
}
