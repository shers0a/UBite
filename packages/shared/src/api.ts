/* The REST contract between apps/web and apps/api (docs/06 "API surface"). A change here breaks
   the build on both sides rather than the pilot. Money is in bani, times are ISO strings in UTC,
   dates are YYYY-MM-DD in Europe/Bucharest. */
import type {
  Allergen, AllergenSource, Category, CrowdLevel, DietTag, Lang, Quality, Role,
} from './domain';
import type { ScheduleDay, ScheduleException } from './time';

export interface ApiError {
  error: string;
  message?: string;
  retryAfterSeconds?: number;
}

export interface Features {
  camera: boolean;
  loyalty: boolean;
  waste: boolean;
  prediction: boolean;
}

/* ── Catalogue and menu ─────────────────────────────────────────────────────────────────── */

export interface DishPhoto {
  url: string;
  /** Generated placeholder until the canteen's own photo replaces it (assets/manifest.json). */
  placeholder: boolean;
}

export interface Dish {
  id: string;
  nameRo: string;
  nameEn: string;
  category: Category;
  defaultPriceBani: number;
  weightGrams: number | null;
  calories: number | null;
  photo: DishPhoto | null;
  tags: DietTag[];
  rating: { average: number | null; count: number };
  isActive: boolean;
}

export interface DishAllergen {
  allergen: Allergen;
  source: AllergenSource;
}

export interface DishDetail extends Dish {
  allergens: DishAllergen[];
  /** Present for a signed-in student. */
  mine?: { favorite: boolean; stars: number | null };
  /** Today's price when the dish is on today's menu. */
  todayPriceBani: number | null;
}

export interface MenuItem {
  dish: Dish;
  priceBani: number;
  sortOrder: number;
  /** Only in staff and dashboard responses. */
  portionsPrepared?: number | null;
}

export interface MenuDay {
  serviceDate: string;
  publishedAt: string | null;
  items: MenuItem[];
}

export interface MenuTodayResponse {
  today: string;
  /** Today's menu, or — when it is not published yet — the last published one. */
  menu: MenuDay | null;
  /** True when `menu` is not today's. The screen must say so (docs/03 F1). */
  outdated: boolean;
}

/* ── Crowding ───────────────────────────────────────────────────────────────────────────── */

export interface CrowdingCurrent {
  serverTime: string;
  open: boolean;
  /** Null when no source has produced an estimate yet (cold start, no history). */
  level: CrowdLevel | null;
  waitMinutes: number | null;
  quality: Quality | null;
  computedAt: string | null;
  thresholds: { low: number; high: number };
}

export interface CrowdingTypical {
  /** False during the first pilot week or while the history is thin — the section is hidden. */
  available: boolean;
  date: string;
  weekday: number;
  slots: Array<{ time: string; waitMinutes: number | null }>;
}

export interface WaitReportRequest {
  waitedMinutes: number;
  /** When the student finished waiting — preserved for offline-queued reports. */
  clientReportedAt?: string;
}

export interface WaitReportResponse {
  accepted: boolean;
  reason?: string;
  estimate: CrowdingCurrent;
}

/* ── Status ─────────────────────────────────────────────────────────────────────────────── */

export interface Announcement {
  id: string;
  bodyRo: string;
  bodyEn: string | null;
  startsAt: string;
  endsAt: string;
}

export interface StatusResponse {
  serverTime: string;
  today: string;
  open: boolean;
  todayHours: { opensAt: string; closesAt: string } | null;
  nextOpening: string | null;
  schedule: ScheduleDay[];
  exceptions: ScheduleException[];
  announcements: Announcement[];
  features: Features;
  vapidPublicKey: string | null;
  publicUrl: string;
  privacy: { controller: string | null; contactEmail: string | null; dpoEmail: string | null; approved: boolean };
}

/* ── Accounts ───────────────────────────────────────────────────────────────────────────── */

export interface NotificationPrefs {
  menu_published: boolean;
  favorite_today: boolean;
  quiet_now: boolean;
  one_from_free: boolean;
  /** The window for "it's quiet now", e.g. 11:30–14:00. */
  windowStart: string;
  windowEnd: string;
}

export interface Me {
  id: string;
  email: string;
  role: Role;
  locale: Lang;
  dietPreference: DietTag[];
  displayName: string | null;
  favorites: string[];
  notifications: NotificationPrefs;
  pushSubscribed: boolean;
  lastReportAt: string | null;
}

export interface RequestCodeResponse {
  sent: true;
  /** Seconds until the code expires. */
  expiresIn: number;
  /** Only on a demo deployment (DEMO_SHOW_CODES): the code itself, shown on screen, no email. */
  demoCode?: string;
}

export interface Reward {
  id: string;
  code: string;
  /** Hex secret the phone uses to compute the rolling digits offline. */
  secret: string;
  earnedAt: string;
}

export interface LoyaltyResponse {
  /** Dots to fill, 0–5. Five while an earned reward waits to be redeemed. */
  filled: number;
  countedVisits: number;
  countedToday: boolean;
  rewards: Reward[];
  redeemedCount: number;
  /** Payload of the card QR, generated on the phone. */
  cardId: string;
}

export interface ReceiptDraft {
  /** Signed, short-lived: the confirm step can trust what the scan read. */
  token: string;
  receiptNumber: string;
  totalBani: number | null;
  date: string | null;
  time: string | null;
  items: Array<{ name: string; priceBani: number | null }>;
}

export type VisitRequest =
  | { draftToken: string }
  | { manual: { receiptNumber: string; totalBani: number } };

export interface VisitResponse {
  counted: boolean;
  rewardIssued: boolean;
  loyalty: LoyaltyResponse;
}

export interface HistoryResponse {
  month: string;
  visitsThisMonth: number;
  visitsTotal: number;
  /** Null when no receipt this month carried a readable total. */
  spendThisMonthBani: number | null;
  savedBani: number;
  rewardsRedeemed: number;
  favoriteDish: string | null;
  days: Array<{ date: string; totalBani: number | null; items: string[] | null; counted: boolean }>;
}

export interface FeedbackRequest {
  foodRating?: number | null;
  appRating?: number | null;
  missingFeature?: string | null;
  cameBecauseOfApp?: boolean | null;
  source: 'app' | 'kiosk';
}

/* ── Staff ──────────────────────────────────────────────────────────────────────────────── */

export interface StaffDish extends Dish {
  allergens: DishAllergen[];
}

export interface StaffMenuDraft {
  date: string;
  /** The menu already saved for that date, if any. */
  current: MenuDay | null;
  /** The last published menu before `date` — preloaded, since the rotation repeats. */
  previous: MenuDay | null;
  catalogue: StaffDish[];
}

export interface PublishMenuRequest {
  date?: string;
  items: Array<{ dishId: string; priceBani: number; portionsPrepared?: number | null }>;
}

export interface PublishMenuResponse {
  menu: MenuDay;
  /** Students who get a push notification for this publication. */
  notified: number;
}

export interface DishInput {
  nameRo: string;
  nameEn?: string | null;
  category: Category;
  defaultPriceBani: number;
  weightGrams?: number | null;
  calories?: number | null;
  tags?: DietTag[];
  allergens?: DishAllergen[];
  isActive?: boolean;
}

export interface AnnouncementInput {
  bodyRo: string;
  bodyEn?: string | null;
  startsAt: string;
  endsAt: string;
}

export type RedeemResponse =
  | { kind: 'reward'; status: 'ok'; earnedAt: string }
  | { kind: 'reward'; status: 'used' | 'expired' | 'invalid' }
  | { kind: 'card'; status: 'ok' | 'already_today' | 'closed' | 'unknown' };

/* ── Dashboard ──────────────────────────────────────────────────────────────────────────── */

export interface DashboardSummary {
  from: string;
  to: string;
  headline: {
    visitsRecorded: number;
    averageWaitMinutes: number | null;
    waitReports: number;
    cameBecauseOfApp: { yes: number; answered: number };
    freeMealsGiven: number;
    freeMealsCostBani: number;
    uniqueVisitors: number;
    newVisitors: number;
  };
  byDay: Array<{ date: string; visits: number; reports: number; visitors: number; averageWaitMinutes: number | null }>;
  byHour: Array<{ hour: string; averageWaitMinutes: number | null; averageQueue: number | null }>;
  best: Array<{ name: string; average: number; count: number }>;
  worst: Array<{ name: string; average: number; count: number }>;
  feedback: {
    count: number;
    foodAverage: number | null;
    appAverage: number | null;
    bySource: { app: number; kiosk: number };
    missing: Array<{ text: string; at: string }>;
  };
  loyalty: { enrolled: number; visits: number; rewardsIssued: number; rewardsRedeemed: number; costBani: number };
  waste: Array<{ date: string; name: string; prepared: number; demandVisits: number | null }>;
  features: Array<{ name: string; count: number }>;
  installs: number;
  camera: { lastObservationAt: string | null; observations: number };
  calibration: { fittedAt: string; slope: number; intercept: number; sampleSize: number; maeMinutes: number | null } | null;
}

/* ── Admin ──────────────────────────────────────────────────────────────────────────────── */

export interface CrowdingConfig {
  thresholds: { mode: 'auto' | 'manual'; low: number; high: number; fittedAt: string | null; sampleSize: number | null };
  /** Normalised polygons (0–1) per zone, read by services/vision. */
  zones: { queue: Array<[number, number]>; hall: Array<[number, number]> | null };
  freeMealValueBani: number;
}

export interface AdminUser {
  id: string;
  email: string;
  role: Role;
  createdAt: string;
}
