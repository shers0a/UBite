/**
 * App chrome: header, footer, announcements, bottom sheet and toast.
 */
export interface AppHeaderProps {
  /** Omit on the home screen — the wordmark (or `brand`) takes its place. */
  title?: string;
  onBack?: () => void;
  right?: React.ReactNode;
  /** Replaces the default wordmark — pass the live <Logo level={…} withText /> here. */
  brand?: React.ReactNode;
  sticky?: boolean;
  /** Over a photo: no page colour behind the brand and buttons. */
  transparent?: boolean;
  lang?: 'ro' | 'en';
}
export declare function AppHeader(props: AppHeaderProps): JSX.Element;

export interface AppFooterLink {
  label: string;
  href?: string;
  onClick?: () => void;
}

export interface AppFooterProps {
  lang?: 'ro' | 'en';
  onLang?: () => void;
  /** Real destinations for the footer links. Defaults to feedback, privacy and account labels. */
  links?: AppFooterLink[];
  /** The configured schedule as a short label. Defaults to the confirmed hours. */
  hoursLabel?: string;
}
/** Zone 7, the densest zone: hours, address, feedback, privacy, account, language switch. */
export declare function AppFooter(props: AppFooterProps): JSX.Element;

export interface AnnouncementProps {
  title: string;
  body?: string;
  date?: string;
  tone?: 'neutral' | 'warning';
}
/** Zone 6. Renders only when the canteen has posted something. */
export declare function Announcement(props: AnnouncementProps): JSX.Element;

export interface SheetProps {
  open?: boolean;
  title?: string;
  children?: React.ReactNode;
  onClose?: () => void;
  lang?: 'ro' | 'en';
  /** Pin to the viewport (production app, which scrolls the document) instead of the parent. */
  fixed?: boolean;
}
/** Bottom sheet. Positioned absolutely — its parent must be position:relative (the phone frame). */
export declare function Sheet(props: SheetProps): JSX.Element | null;

export interface ToastProps {
  message: string;
  tone?: 'neutral' | 'success' | 'danger';
  icon?: string;
  action?: string;
  onAction?: () => void;
}
export declare function Toast(props: ToastProps): JSX.Element;

export interface AppShellProps {
  children?: React.ReactNode;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  /** Defaults to --max-phone (440px). Widen for the staff and DCCAS surfaces. */
  maxWidth?: string;
}
/** The page wrapper: one scrolling surface, centred, themed. */
export declare function AppShell(props: AppShellProps): JSX.Element;
