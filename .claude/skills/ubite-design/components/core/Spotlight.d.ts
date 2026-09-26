export interface SpotlightProps {
  /** Short label above the title, e.g. "Sfat pentru marți". */
  eyebrow?: string;
  /** One or two short sentences. Second person, no exclamation marks. */
  title: string;
  /** Pill button label; the arrow is added. */
  action?: string;
  onAction?: () => void;
  /** A character from assets/illustrations/spots/ — drawn in the card's text colour. */
  art?: string;
  /** The character animated (path without extension to spot-*.mp4/.webm, white lines on black). Accent tone only; reduced motion keeps the still. */
  video?: string;
  /** Hand-animated wobble on the character. Default true; off under reduced motion. */
  boil?: boolean;
  /** accent (default) · quiet = accent-quiet card · inverse = inverse surface */
  tone?: 'accent' | 'quiet' | 'inverse';
  style?: React.CSSProperties;
}
/** A feature card with a character, for things UBite really does. */
export declare function Spotlight(props: SpotlightProps): JSX.Element;
