/**
 * Ratings and loyalty progress — the two reward surfaces.
 */
export interface RatingStarsProps {
  value?: number;
  /** Sample size. A rating is never shown without one when it exists. */
  count?: number;
  size?: number;
  /** Turns the stars into 44px radio targets. */
  interactive?: boolean;
  onRate?: (n: number) => void;
  /** Submission in flight — shows "Se trimite…". */
  pending?: boolean;
  disabled?: boolean;
  lang?: 'ro' | 'en';
}
export declare function RatingStars(props: RatingStarsProps): JSX.Element;

export interface LoyaltyDotsProps {
  filled?: number;
  total?: number;
  size?: number;
  /** Signed out renders one quiet invitation line instead of the dots. */
  signedIn?: boolean;
  /** Shows the "Adaugă bon" affordance that opens the receipt camera. */
  onAdd?: () => void;
  /** Signed out: makes the invitation line a sign-in link (sign-in at the point of need). */
  onSignIn?: () => void;
  lang?: 'ro' | 'en';
}
/** A dot filling is one of only two animations in the system. 250ms, disabled under reduced-motion. */
export declare function LoyaltyDots(props: LoyaltyDotsProps): JSX.Element;
