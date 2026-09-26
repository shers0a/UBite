/**
 * Empty, offline, stale and error states, the wait-report control, and the hourly pattern.
 */
export interface EmptyStateProps {
  icon?: string;
  /** URL of a line illustration (assets/illustrations/*.svg). Drawn in the accent colour via a
   *  CSS mask, so it follows the theme. Replaces the icon when present. */
  art?: string;
  /** What is missing, in plain words. */
  title: string;
  /** Why it is missing and what happens next. */
  body?: string;
  action?: string;
  onAction?: () => void;
  compact?: boolean;
}
export declare function EmptyState(props: EmptyStateProps): JSX.Element;

export interface OfflineBannerProps {
  variant?: 'offline' | 'stale' | 'error';
  lang?: 'ro' | 'en';
  /** Age of the cached content, e.g. "Actualizat la 12:04". Always shown when offline. */
  updatedLabel?: string;
  /** Count of actions waiting to be sent — acknowledges queued work. */
  queued?: number;
  onRetry?: () => void;
}
export declare function OfflineBanner(props: OfflineBannerProps): JSX.Element;

export interface WaitReportProps {
  /** Quick minute options. A free entry is always offered alongside. */
  options?: number[];
  state?: 'idle' | 'sending' | 'done';
  onSubmit?: (minutes: number | null) => void;
  lang?: 'ro' | 'en';
}
export declare function WaitReport(props: WaitReportProps): JSX.Element;

export interface CrowdingByHourProps {
  data?: Array<{ label: string; value: number }>;
  /** Index of the current slot — the only bar drawn in full colour. */
  nowIndex?: number;
  height?: number;
  /** Label every n-th slot. Defaults to every other one past eight slots, so 400px never overflows. */
  labelEvery?: number;
  lang?: 'ro' | 'en';
}
/** Hide this section entirely while data is thin. A flat, wrong chart costs more trust than no chart. */
export declare function CrowdingByHour(props: CrowdingByHourProps): JSX.Element;
