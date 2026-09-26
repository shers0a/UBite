/**
 * Filter chips, status badges and dietary tags.
 */
export interface ChipProps {
  children?: React.ReactNode;
  /** Toggled state — sets aria-pressed and fills with the accent. */
  selected?: boolean;
  disabled?: boolean;
  icon?: string;
  /** Optional result count shown after the label. */
  count?: number;
  size?: 'sm' | 'md';
  onClick?: () => void;
}
export declare function Chip(props: ChipProps): JSX.Element;

export interface BadgeProps {
  children?: React.ReactNode;
  tone?: 'neutral' | 'accent' | 'low' | 'moderate' | 'high' | 'warning' | 'danger' | 'success';
  icon?: string;
  size?: 'sm' | 'md';
}
/** Read-only status marker. Not tappable — use Chip for anything interactive. */
export declare function Badge(props: BadgeProps): JSX.Element;

export type DietaryTagKind =
  | 'vegetarian' | 'vegan' | 'fasting' | 'no_pork' | 'gluten_free' | 'lactose_free'
  | 'gluten' | 'lactose' | 'egg' | 'fish' | 'pork' | 'unknown';

export interface DietaryTagProps {
  /** The first six are the docs/05 diet tags; the "contains" kinds stay for allergen callouts. */
  kind?: DietaryTagKind;
  lang?: 'ro' | 'en';
  size?: 'sm' | 'md';
}
/** Always renders the word. "unknown" reads "Informație indisponibilă" — never implied absence. */
export declare function DietaryTag(props: DietaryTagProps): JSX.Element;
