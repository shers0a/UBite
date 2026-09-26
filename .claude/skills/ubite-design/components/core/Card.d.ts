/**
 * The surface primitive. Two elevations only, both expressed as colour value.
 */
export interface CardProps extends Omit<React.HTMLAttributes<HTMLElement>, 'children'> {
  children?: React.ReactNode;
  /** 1 = --surface (sections, rows). 2 = --surface-raised (crowding hero, sheets). */
  elevation?: 1 | 2;
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  radius?: 'sm' | 'md' | 'lg';
  as?: keyof JSX.IntrinsicElements;
}
export declare function Card(props: CardProps): JSX.Element;

export interface SectionHeaderProps {
  title: string;
  /** Right-aligned metadata, e.g. a date or a count. */
  meta?: string;
  icon?: string;
  action?: React.ReactNode;
  /** Which home-screen density zone this header belongs to. */
  density?: 'zone-1' | 'zone-2' | 'zone-3' | 'zone-4' | 'zone-5' | 'zone-6' | 'zone-7';
}
export declare function SectionHeader(props: SectionHeaderProps): JSX.Element;
