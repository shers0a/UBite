export interface IconProps {
  /** Glyph name from the Lucide set copied into assets/icons (e.g. "clock", "wifi-off"). */
  name: string;
  /** Pixel size of the square box. Default 20. */
  size?: number;
  /** Stroke width. Default 2; use 2.25 for kiosk sizes above 48px. */
  stroke?: number;
  /** Accessible label. Omit for decorative glyphs — they are then aria-hidden. */
  label?: string;
  style?: React.CSSProperties;
}
export declare function Icon(props: IconProps): JSX.Element | null;
export declare const GLYPHS: Record<string, string>;
