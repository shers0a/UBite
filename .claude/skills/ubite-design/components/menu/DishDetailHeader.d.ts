/**
 * The top of the dish detail screen: photo, price, tags, rating, allergens with their source.
 */
export interface DishDetailHeaderProps {
  name: string;
  price: number | string;
  currency?: string;
  /** e.g. "320 g". Shown only when the canteen supplied it. */
  weight?: string;
  tags?: Array<import('../core/Chip').DietaryTagKind>;
  /** Allergen names. Empty or omitted renders "Informație indisponibilă" — never implied absence. */
  allergens?: string[];
  /** Who stated the allergens. Required whenever allergens are present. */
  allergenSource?: string;
  rating?: number;
  ratingCount?: number;
  favourite?: boolean;
  onFavourite?: () => void;
  /** Passing this makes the stars interactive. */
  onRate?: (n: number) => void;
  slotId?: string;
  photo?: string;
  /** A short line under the photo, e.g. that it is illustrative until the canteen's own arrives. */
  photoNote?: string;
  lang?: 'ro' | 'en';
}
export declare function DishDetailHeader(props: DishDetailHeaderProps): JSX.Element;
