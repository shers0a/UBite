/**
 * The brand illustration layer. `src` is a file from the repo's assets/ (the kits get the paths
 * from ui_kits/assets.js: A.spot('run'), A.scene('campus'), A.picto('soup'), A.pattern).
 */
export interface IllustrationProps {
  /** Renders nothing without one, so a missing file never breaks a screen. */
  src?: string;
  /** spot/line = one-ink drawing through a CSS mask · scene = flat token-coloured scene, inlined · picto = menu pictogram, inlined */
  kind?: 'spot' | 'line' | 'scene' | 'picto';
  /** Colour of a spot/line (or of a picto's outline): a token name or any CSS colour value. */
  tone?: 'ink' | 'accent' | 'on-accent' | 'muted' | 'inverse' | 'current' | string;
  width?: number | string;
  height?: number | string;
  /** Aspect ratio when only the width is given. Default 1. */
  ratio?: number;
  /** Hand-animated line wobble, 7 frames a second. Off under prefers-reduced-motion. */
  boil?: boolean;
  /** Gives the drawing role="img" and this label. Without it the drawing is aria-hidden (decoration). */
  label?: string;
  style?: React.CSSProperties;
}
export declare function Illustration(props: IllustrationProps): JSX.Element | null;

export interface PatternProps {
  /** The seamless tile, assets/patterns/canteen.svg. */
  src: string;
  tone?: 'ink' | 'accent' | 'on-accent' | 'muted' | 'inverse' | 'current' | string;
  /** 0.06–0.08 behind content. */
  opacity?: number;
  /** Tile size in px. */
  size?: number;
  /** Slides one tile a minute — splash and kiosk only. Off under prefers-reduced-motion. */
  drift?: boolean;
  style?: React.CSSProperties;
}
/** The doodle wallpaper, absolutely filling its (position: relative) parent. */
export declare function Pattern(props: PatternProps): JSX.Element | null;

export declare function useReducedMotion(): boolean;
