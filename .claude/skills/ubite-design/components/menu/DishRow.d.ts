/**
 * The menu list row, its photo slot, and the category heading above it.
 */
export interface DishRowProps {
  name: string;
  price: number | string;
  currency?: string;
  /** Dietary tag kinds, rendered as words. */
  tags?: Array<import('../core/Chip').DietaryTagKind>;
  /** Real photo URL, when one exists. */
  photo?: string;
  /** Drop-in slot id used until real canteen photography arrives. */
  slotId?: string;
  /** Fallback glyph when there is neither photo nor slot. */
  glyph?: string;
  /** Staff-entered portions prepared. Optional everywhere. */
  portions?: number;
  /** Sold out — dims the row and adds the words "S-a terminat". */
  unavailable?: boolean;
  loading?: boolean;
  dense?: boolean;
  lang?: 'ro' | 'en';
  onClick?: () => void;
  /** Favourited by the signed-in student. Only drawn when `onFavourite` is given. */
  favourite?: boolean;
  /** Adds the heart beside the row (docs/03 F10). Signed out, the caller asks for sign-in first. */
  onFavourite?: () => void;
}
export declare function DishRow(props: DishRowProps): JSX.Element;

export interface DishPhotoProps {
  src?: string;
  alt?: string;
  size?: number;
  radius?: string;
  slotId?: string;
  glyph?: string;
}
export declare function DishPhoto(props: DishPhotoProps): JSX.Element;

export interface CategoryHeaderProps {
  title: string;
  icon?: string;
  count?: number;
  lang?: 'ro' | 'en';
}
/** Sticky category heading. Category order is fixed: ciorbă → fel principal → desert & salată → băuturi. */
export declare function CategoryHeader(props: CategoryHeaderProps): JSX.Element;
