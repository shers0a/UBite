/**
 * Text field and skeleton loader.
 */
export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'size' | 'type' | 'inputMode' | 'id' | 'placeholder' | 'disabled' | 'lang'> {
  label?: string;
  value?: string | number;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  /** Helper text under the field. Replaced by `error` when set. */
  hint?: string;
  /** Error message — also sets aria-invalid and the danger ring. */
  error?: string;
  disabled?: boolean;
  loading?: boolean;
  type?: string;
  /** Static text at the right edge, e.g. "lei" or "min". */
  suffix?: string;
  icon?: string;
  id?: string;
  inputMode?: string;
  lang?: 'ro' | 'en';
}
export declare function Input(props: InputProps): JSX.Element;

export interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  radius?: string;
  style?: React.CSSProperties;
}
/** A shape that matches the real content's footprint. Never a spinner over blank space. */
export declare function Skeleton(props: SkeletonProps): JSX.Element;
