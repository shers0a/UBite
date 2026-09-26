/* The menu surfaces of the student-app kit: picks rail, category pills and the grouped list. */
import React from 'react';
import type { CategoryGroup, DietTag, MenuItem } from '@ubite/shared';
import { CATEGORY_GROUPS, formatLei } from '@ubite/shared';
import { CategoryHeader, DishRow, Icon, Illustration } from '@ds';
import { useI18n } from '../i18n';
import { A } from '../assets';

export function dishName(item: { nameRo: string; nameEn: string }, lang: 'ro' | 'en') {
  return lang === 'ro' ? item.nameRo : item.nameEn || item.nameRo;
}

/** Glyph for a dish with no photo — the tinted plate is the correct empty state (DishPhoto). */
export function glyphFor(category: string) {
  return CATEGORY_GROUPS.find((g) => g.categories.includes(category as any))?.icon || 'utensils';
}

export interface MenuGroup {
  group: CategoryGroup;
  items: MenuItem[];
}

export function groupMenu(items: MenuItem[]): MenuGroup[] {
  return CATEGORY_GROUPS.map((group) => ({ group, items: items.filter((i) => group.categories.includes(i.dish.category)) }))
    .filter((g) => g.items.length);
}

/* The "picks" rail: today's dishes by rating — a photo, a price pill and a rating. */
export function PickCard({ item, onClick }: { item: MenuItem; onClick: () => void }) {
  const { lang } = useI18n();
  const name = dishName(item.dish, lang);
  return (
    <button type="button" className="ub-pick" onClick={onClick}>
      <span className="ub-pick-photo">
        {item.dish.photo
          ? <img src={item.dish.photo.url} alt="" loading="lazy" decoding="async" />
          : <span className="ub-pick-glyph"><Icon name={glyphFor(item.dish.category)} size={28} /></span>}
        <span className="ub-pick-price ub-numeric">{formatLei(item.priceBani, lang)} lei</span>
      </span>
      <span className="ub-pick-name">{name}</span>
      {item.dish.rating.average !== null && (
        <span className="ub-pick-rating ub-numeric">
          <Icon name="star" size={13} style={{ fill: 'var(--crowd-moderate-fill)', color: 'var(--crowd-moderate-fill)' }} />
          {item.dish.rating.average.toFixed(1)}
          <span className="ub-visually-hidden"> · {item.dish.rating.count}</span>
        </span>
      )}
    </button>
  );
}

/* Category pills carry the drawn pictograms; the selected one switches the pictogram's fill to the
   quiet accent so it still reads on the blue. */
export function CategoryPills({ groups, active, onJump }: { groups: MenuGroup[]; active: string | null; onJump: (key: string) => void }) {
  const { lang } = useI18n();
  return (
    <div className="ub-pillrow">
      {groups.map(({ group }) => {
        const on = active === group.key;
        const picto = A.picto(group.picto);
        return (
          <button key={group.key} type="button" className="ub-pill" data-on={on} aria-pressed={on} onClick={() => onJump(group.key)}>
            <span className="ub-pill-ico">
              {picto
                ? <Illustration kind="picto" src={picto} tone="current" width={34} height={34} style={on ? ({ '--accent': 'var(--accent-quiet)' } as React.CSSProperties) : undefined} />
                : <Icon name={group.icon} size={20} />}
            </span>
            <span>{lang === 'ro' ? group.ro : group.en}</span>
          </button>
        );
      })}
    </div>
  );
}

export function MenuList({ groups, favorites, onOpen, onFavourite, registerGroup }: {
  groups: MenuGroup[];
  favorites: Set<string>;
  onOpen: (id: string) => void;
  onFavourite: (id: string) => void;
  registerGroup?: (key: string, el: HTMLElement | null) => void;
}) {
  const { lang } = useI18n();
  return (
    <>
      {groups.map(({ group, items }) => (
        <div key={group.key} ref={(el) => registerGroup?.(group.key, el)}>
          <CategoryHeader title={lang === 'ro' ? group.ro : group.en} icon={group.icon} count={items.length} lang={lang} />
          {items.map((i) => (
            <DishRow key={i.dish.id} name={dishName(i.dish, lang)} price={formatLei(i.priceBani, lang)} tags={i.dish.tags as DietTag[]}
              photo={i.dish.photo?.url} glyph={glyphFor(i.dish.category)} lang={lang}
              onClick={() => onOpen(i.dish.id)} favourite={favorites.has(i.dish.id)} onFavourite={() => onFavourite(i.dish.id)} />
          ))}
        </div>
      ))}
    </>
  );
}
