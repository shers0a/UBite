import React from 'react';
import { Icon } from '../icons/Icon.jsx';
import { DietaryTag } from '../core/Chip.jsx';
import { Skeleton } from '../core/Input.jsx';

/* Dish photography does not exist yet. Until the canteen supplies it, every photo position
   is a real drop-in slot (assets/image-slot.js) rather than a fake image: a designer or the
   canteen drags a photo in and it stays. Without the slot script it degrades to a tinted
   plate with the category glyph — which is also the correct empty state in production. */

export function DishPhoto({ src, alt = '', size = 64, radius = 'var(--radius-md)', slotId, glyph = 'utensils', style }) {
  const box = { width: size, height: size, borderRadius: radius, flex: 'none', overflow: 'hidden', ...style };
  // Below the fold on a weak canteen connection: lazy, sized for its box (docs/04 "Images").
  if (src) return <img src={src} alt={alt} loading="lazy" decoding="async" width={typeof size === 'number' ? size : undefined} height={typeof size === 'number' ? size : undefined} style={{ ...box, objectFit: 'cover' }} />;
  if (slotId) {
    return (
      <div style={box}>
        <image-slot id={slotId} shape="rounded" radius="10" placeholder={alt || 'Fotografie fel de mâncare'} style={{ width: '100%', height: '100%' }}></image-slot>
      </div>
    );
  }
  return (
    <div style={{ ...box, background: 'var(--surface-sunken)', display: 'grid', placeItems: 'center', color: 'var(--text-muted)' }} aria-hidden="true">
      <Icon name={glyph} size={Math.max(16, Math.round(size * 0.32))} />
    </div>
  );
}

/* `onFavourite` adds the heart ("a heart on any dish, anywhere it appears", docs/03 F10). The row
   and the heart are then two sibling buttons — a button never nests inside another. */
export function DishRow({
  name, price, currency = 'lei', tags = [], photo, slotId, glyph, portions,
  unavailable = false, loading = false, onClick, lang = 'ro', dense = false,
  favourite = false, onFavourite,
}) {
  if (loading) {
    return (
      <div style={{ display: 'flex', gap: 14, alignItems: 'center', padding: `${dense ? 10 : 12}px 0` }}>
        <Skeleton width={dense ? 52 : 64} height={dense ? 52 : 64} radius="var(--radius-md)" />
        <div style={{ flex: 1 }}>
          <Skeleton width="62%" height={18} radius="var(--radius-xs)" />
          <div style={{ height: 8 }} />
          <Skeleton width="34%" height={14} radius="var(--radius-xs)" />
        </div>
        <Skeleton width={48} height={18} radius="var(--radius-xs)" />
      </div>
    );
  }
  const withFav = typeof onFavourite === 'function';
  const favLabel = lang === 'ro'
    ? `${favourite ? 'Scoate de la favorite' : 'Adaugă la favorite'}: ${name}`
    : `${favourite ? 'Remove from favourites' : 'Add to favourites'}: ${name}`;
  const row = (
      <button type="button" onClick={onClick} className="ub-dish" style={{
        display: 'flex', gap: 14, alignItems: 'center', width: withFav ? 'auto' : '100%', flex: withFav ? 1 : undefined,
        minWidth: 0, textAlign: 'left',
        padding: `${dense ? 10 : 12}px 8px`, margin: withFav ? 0 : '0 -8px', background: 'transparent', border: 0,
        borderRadius: 'var(--radius-md)', cursor: onClick ? 'pointer' : 'default',
        opacity: unavailable ? 0.55 : 1, minHeight: 'var(--min-target)',
        transition: 'background var(--motion-fast) var(--ease-out)',
      }}>
        {/* alt="": the name is already the row's text, a screen reader should not hear it twice */}
        <DishPhoto size={dense ? 52 : 64} slotId={slotId} src={photo} alt="" glyph={glyph} />
        <span style={{ flex: 1, minWidth: 0 }}>
          <span style={{ display: 'block', fontSize: 'var(--text-md)', fontWeight: 'var(--weight-semibold)', color: 'var(--text-primary)', lineHeight: 1.25 }}>
            {name}
          </span>
          {(tags.length > 0 || portions != null) && (
            <span style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
              {tags.map((t) => <DietaryTag key={t} kind={t} lang={lang} size="sm" />)}
              {portions != null && (
                <span className="ub-numeric" style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', alignSelf: 'center' }}>
                  {portions} {lang === 'ro' ? 'porții' : 'portions'}
                </span>
              )}
            </span>
          )}
          {unavailable && (
            <span style={{ display: 'block', fontSize: 'var(--text-sm)', color: 'var(--text-muted)', marginTop: 4 }}>
              {lang === 'ro' ? 'S-a terminat' : 'Sold out'}
            </span>
          )}
        </span>
        <span className="ub-numeric" style={{ fontSize: 'var(--text-md)', fontWeight: 'var(--weight-bold)', whiteSpace: 'nowrap', color: 'var(--text-primary)' }}>
          {price} <span style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)', color: 'var(--text-muted)' }}>{currency}</span>
        </span>
        {onClick && !withFav && <Icon name="chevron-right" size={18} style={{ color: 'var(--text-muted)' }} />}
      </button>
  );
  return (
    <>
      {withFav ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 2, margin: '0 -8px' }}>
          {row}
          <button type="button" onClick={onFavourite} aria-pressed={favourite} aria-label={favLabel} className="ub-dish-fav"
            style={{
              width: 44, height: 44, minHeight: 44, flex: 'none', display: 'grid', placeItems: 'center',
              background: 'transparent', border: 0, borderRadius: 'var(--radius-pill)', cursor: 'pointer',
              color: favourite ? 'var(--status-danger-fill)' : 'var(--text-muted)',
            }}>
            <Icon name="heart" size={20} style={{ fill: favourite ? 'var(--status-danger-fill)' : 'transparent' }} />
          </button>
        </div>
      ) : row}
      <style>{`.ub-dish:hover{background:var(--hover-wash)}.ub-dish:active{background:var(--active-wash)}.ub-dish-fav:hover{background:var(--hover-wash)}.ub-dish-fav:active{transform:scale(.96)}@media (prefers-reduced-motion:reduce){.ub-dish-fav:active{transform:none}}`}</style>
    </>
  );
}

export function CategoryHeader({ title, icon = 'utensils', count, lang = 'ro' }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 9, padding: '18px 0 8px',
      position: 'sticky', top: 0, background: 'var(--surface)', zIndex: 2,
    }}>
      <Icon name={icon} size={17} style={{ color: 'var(--text-muted)' }} />
      <h3 style={{ fontSize: 'var(--text-sm)', letterSpacing: 'var(--tracking-label)', textTransform: 'uppercase', fontWeight: 'var(--weight-semibold)', color: 'var(--text-secondary)' }}>
        {title}
      </h3>
      {count != null && (
        <span className="ub-numeric" style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginLeft: 'auto' }}>
          {count} {lang === 'ro' ? (count === 1 ? 'fel' : count >= 20 ? 'de feluri' : 'feluri') : count === 1 ? 'dish' : 'dishes'}
        </span>
      )}
    </div>
  );
}
