export interface LogoProps {
  /** tray = tava-U (A, the chosen logo) · signal, bite, plate = the other explored candidates */
  variant?: 'tray' | 'signal' | 'bite' | 'plate';
  /** Box size in px (mark alone), or the lockup's height with withText: 26–30 header, 64 splash, 190 kiosk. */
  size?: number;
  /** Current queue level — fills 0/1/2/3 counters. Omit for a static two-filled mark. */
  level?: 'low' | 'moderate' | 'high' | 'closed';
  /** accent = blue U, ink word · mono = ink · inverse = paper on dark · on-accent = on the accent colour · level = counters take the crowding colour */
  tone?: 'accent' | 'mono' | 'inverse' | 'on-accent' | 'level';
  /** Simplified geometry: thicker strokes, no outline detail — for 16–24px and favicons. */
  favicon?: boolean;
  /** Plays the draw-in once (lockup: the U draws, "Bite" slides out, the counters fill). */
  intro?: boolean;
  /** With variant tray: the lockup — the U is the first letter and "Bite" follows it. */
  withText?: boolean;
  style?: React.CSSProperties;
}
export declare function Logo(props: LogoProps): JSX.Element;

export interface LogoSplashProps {
  level?: 'low' | 'moderate' | 'high' | 'closed';
  variant?: 'tray' | 'signal' | 'bite' | 'plate';
  /** Total life of the splash including the fade. Default 1000ms. */
  duration?: number;
  /** The doodle wallpaper (assets/patterns/canteen.svg), laid faintly behind the lockup. */
  pattern?: string;
  onDone?: () => void;
}
/** First-open splash: the lockup draws itself over the wallpaper, gone in a second. */
export declare function LogoSplash(props: LogoSplashProps): JSX.Element;
