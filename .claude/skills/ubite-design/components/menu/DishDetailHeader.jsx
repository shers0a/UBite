import React from 'react';
import { Icon } from '../icons/Icon.jsx';
import { DietaryTag } from '../core/Chip.jsx';
import { RatingStars } from './RatingStars.jsx';
import { DishPhoto } from './DishRow.jsx';

/* The dish detail header. Allergen information is a safety claim: where the canteen has
   not supplied it, the screen says so in words and names who the authority is. Silence
   would read as "no allergens", which is the one thing it must never mean. */

export function DishDetailHeader({
  name, price, currency = 'lei', weight, tags = [], allergens, allergenSource,
  rating, ratingCount, favourite = false, onFavourite, onRate, slotId, photo, photoNote, lang = 'ro',
}) {
  const t = lang === 'ro'
    ? { allergens: 'Alergeni', unknown: 'Informație indisponibilă', source: (s) => `Sursă: ${s}`,
        noSource: 'Cantina nu a furnizat lista de alergeni pentru acest fel.', fav: 'Adaugă la favorite', unfav: 'Scoate de la favorite' }
    : { allergens: 'Allergens', unknown: 'Information not available', source: (s) => `Source: ${s}`,
        noSource: 'The canteen has not supplied an allergen list for this dish.', fav: 'Add to favourites', unfav: 'Remove from favourites' };
  return (
    <>
      <div style={{ position: 'relative' }}>
        <div style={{ position: 'relative', height: 240, borderRadius: 'var(--radius-lg)', overflow: 'hidden', background: 'var(--surface-sunken)' }}>
          <DishPhoto slotId={slotId} src={photo} alt={name} size="100%" radius="var(--radius-lg)" style={{ width: '100%', height: '100%' }} />
          <div style={{ position: 'absolute', inset: 0, background: 'var(--scrim)', pointerEvents: 'none' }} />
          <button type="button" onClick={onFavourite} aria-pressed={favourite}
            aria-label={favourite ? t.unfav : t.fav} className="ub-fav"
            style={{
              position: 'absolute', top: 12, right: 12, width: 44, height: 44, borderRadius: 'var(--radius-pill)',
              border: 0, display: 'grid', placeItems: 'center', cursor: 'pointer',
              background: 'var(--surface-raised)', color: favourite ? 'var(--status-danger-fill)' : 'var(--text-secondary)',
            }}>
            <Icon name="heart" size={20} style={{ fill: favourite ? 'var(--status-danger-fill)' : 'transparent' }} />
          </button>
        </div>

        {photoNote && (
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginTop: 8 }}>{photoNote}</div>
        )}

        <div style={{ marginTop: photoNote ? 10 : 18, display: 'flex', alignItems: 'flex-start', gap: 16 }}>
          <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--weight-bold)', letterSpacing: 'var(--tracking-tight)', flex: 1 }}>{name}</h1>
          <span className="ub-numeric" style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--weight-bold)', whiteSpace: 'nowrap' }}>
            {price} <span style={{ fontSize: 'var(--text-md)', color: 'var(--text-muted)', fontWeight: 'var(--weight-medium)' }}>{currency}</span>
          </span>
        </div>

        {weight && (
          <div className="ub-numeric" style={{ fontSize: 'var(--text-base)', color: 'var(--text-secondary)', marginTop: 4 }}>{weight}</div>
        )}

        {tags.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 14 }}>
            {tags.map((k) => <DietaryTag key={k} kind={k} lang={lang} />)}
          </div>
        )}

        <div style={{ marginTop: 16 }}>
          <RatingStars value={rating ?? 0} count={ratingCount} interactive={!!onRate} onRate={onRate} lang={lang} />
        </div>

        <div style={{ marginTop: 20, padding: 16, background: 'var(--surface)', borderRadius: 'var(--radius-md)' }}>
          <div className="ub-eyebrow" style={{ marginBottom: 8 }}>{t.allergens}</div>
          {allergens && allergens.length > 0 ? (
            <>
              <div style={{ fontSize: 'var(--text-base)', color: 'var(--text-primary)' }}>{allergens.join(' · ')}</div>
              <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)', marginTop: 6 }}>{t.source(allergenSource || 'Cantina UB')}</div>
            </>
          ) : (
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <Icon name="circle-alert" size={18} style={{ color: 'var(--status-warning-text)', marginTop: 2 }} />
              <div>
                <div style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--weight-semibold)', color: 'var(--status-warning-text)' }}>{t.unknown}</div>
                <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginTop: 4 }}>{t.noSource}</div>
              </div>
            </div>
          )}
        </div>
      </div>
      <style>{`.ub-fav:hover{background:var(--surface)}.ub-fav:active{transform:scale(.96)}@media (prefers-reduced-motion:reduce){.ub-fav:active{transform:none}}`}</style>
    </>
  );
}
