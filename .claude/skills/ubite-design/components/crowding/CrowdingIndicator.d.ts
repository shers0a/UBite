/**
 * The signature UBite component: how busy the canteen is, right now.
 */
export interface CrowdingIndicatorProps {
  /** Queue level. "closed" replaces the level with opening hours — never a stale number. */
  level?: 'low' | 'moderate' | 'high' | 'closed';
  /** Estimated wait. Minutes only — never a percentage, which would imply precision we do not have. */
  waitMinutes?: number;
  /** Estimate quality from the fusion pipeline. The badge renders only when NOT "live". */
  quality?: 'live' | 'degraded' | 'estimated';
  /** Age of the estimate in seconds. Always shown. */
  updatedSecondsAgo?: number;
  /** hero = home Zone 1; compact = inline/list; kiosk = readable at three metres. */
  size?: 'hero' | 'compact' | 'kiosk';
  lang?: 'ro' | 'en';
  /** Human label for the next opening, used only when level is "closed". */
  opensAtLabel?: string;
  /** The canteen's hours as a short label ("L–V 11:30–17:00"). Defaults to the confirmed hours. */
  hoursLabel?: string;
  loading?: boolean;
  error?: boolean;
  /** Optional "how long did you wait?" affordance. Hidden at kiosk size. */
  onReport?: () => void;
  /** "glass": a translucent card whose level colour shows through the caller's glass layer. */
  surface?: 'raised' | 'glass';
  /** With surface="glass": the glass layer, drawn between the colour field and the words. */
  underlay?: import('react').ReactNode;
}
export declare function CrowdingIndicator(props: CrowdingIndicatorProps): JSX.Element;

export interface PersonMeterProps {
  level?: 'low' | 'moderate' | 'high' | 'closed';
  size?: number;
  lang?: 'ro' | 'en';
}
/** Three person glyphs, 1/2/3 filled — the non-colour carrier of the level. */
export declare function PersonMeter(props: PersonMeterProps): JSX.Element;

export interface QualityBadgeProps {
  quality?: 'live' | 'degraded' | 'estimated';
  lang?: 'ro' | 'en';
}
/** Renders nothing when quality is "live", so its presence always means something. */
export declare function QualityBadge(props: QualityBadgeProps): JSX.Element | null;

export interface FreshnessStampProps {
  seconds?: number;
  quality?: 'live' | 'degraded' | 'estimated';
  /** True when showing cached data offline — turns the stamp amber. */
  stale?: boolean;
  lang?: 'ro' | 'en';
  size?: string;
}
export declare function FreshnessStamp(props: FreshnessStampProps): JSX.Element;
