/**
 * The chosen UBite lockup (tray-U + "Bite"), drawn by Logo. Vector files: the repo's assets/brand/.
 */
export interface WordmarkProps {
  /** Cap height box in px. 28 in the app header, 20 in the footer, 64+ on the kiosk. */
  size?: number;
  /** full = the lockup; mark = the app-icon tile (lockup on the accent square); inline = text only. */
  variant?: 'full' | 'mark' | 'inline';
  /** accent (default) · mono = one ink, for print or a single-colour context · inverse = on dark. */
  tone?: 'accent' | 'mono' | 'inverse';
}
export declare function Wordmark(props: WordmarkProps): JSX.Element;
