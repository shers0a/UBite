/**
 * The system's only button. Three weights: primary (one per screen), secondary, quiet.
 */
export interface ButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'type' | 'onClick' | 'children' | 'disabled'> {
  children?: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'quiet' | 'danger';
  /** md = 44px, the touch-target floor. kiosk = 72px, for three-metre use. */
  size?: 'sm' | 'md' | 'lg' | 'kiosk';
  /** Icon glyph name rendered before the label. */
  iconLeft?: string;
  iconRight?: string;
  /** Swaps the left icon for a spinner and blocks interaction. */
  loading?: boolean;
  disabled?: boolean;
  /** Draws the danger ring — for a button whose last submit failed. */
  error?: boolean;
  fullWidth?: boolean;
  type?: 'button' | 'submit';
  onClick?: () => void;
  style?: React.CSSProperties;
}
export declare function Button(props: ButtonProps): JSX.Element;

export interface IconButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onClick' | 'disabled' | 'name'> {
  /** Glyph name. */
  name: string;
  /** Required — it is the accessible name. */
  label: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'secondary' | 'quiet' | 'danger';
  disabled?: boolean;
  onClick?: () => void;
  style?: React.CSSProperties;
}
export declare function IconButton(props: IconButtonProps): JSX.Element;
