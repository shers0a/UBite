/* The vocabulary of docs/05 — the same words in the database enums, the API and the UI. */

export type Lang = 'ro' | 'en';
export const LANGS: Lang[] = ['ro', 'en'];

export type Role = 'student' | 'canteen_staff' | 'dccas_admin' | 'tech_admin';
export const ROLES: Role[] = ['student', 'canteen_staff', 'dccas_admin', 'tech_admin'];

/** Anyone with a University of Bucharest mailbox may hold an account (docs/10): students on
 *  s.unibuc.ro, staff on g.unibuc.ro, unibuc.ro and the faculties' own subdomains (fmi.unibuc.ro, …).
 *  The code sent to the address is the proof, so no subdomain needs listing. */
export const UB_DOMAIN = 'unibuc.ro';
export const isUbEmail = (email: string) => /^[^\s@]+@([a-z0-9-]+\.)*unibuc\.ro$/i.test(email);

export type Category = 'soup' | 'main' | 'side' | 'dessert' | 'salad' | 'drink' | 'extra';
export const CATEGORIES: Category[] = ['soup', 'main', 'side', 'dessert', 'salad', 'drink', 'extra'];

/** The menu reads in one fixed order: soup → main + side → dessert & salad → drinks & extras
 *  (docs/03 F1, docs/18 Zone 2). `side` stays its own category because the garnish may be
 *  priced separately, but it is shown with the mains. */
export interface CategoryGroup {
  key: 'soup' | 'main' | 'dessert' | 'drink';
  categories: Category[];
  ro: string;
  en: string;
  /** Lucide glyph for the category heading. */
  icon: string;
  /** Drawn pictogram (assets/illustrations/picto/) for the category pill. */
  picto: string;
}
export const CATEGORY_GROUPS: CategoryGroup[] = [
  { key: 'soup', categories: ['soup'], ro: 'Ciorbă', en: 'Soup', icon: 'soup', picto: 'soup' },
  { key: 'main', categories: ['main', 'side'], ro: 'Fel principal', en: 'Main course', icon: 'utensils', picto: 'main' },
  { key: 'dessert', categories: ['dessert', 'salad'], ro: 'Desert și salată', en: 'Dessert and salad', icon: 'cookie', picto: 'dessert' },
  { key: 'drink', categories: ['drink', 'extra'], ro: 'Băuturi și extra', en: 'Drinks and extras', icon: 'cup-soda', picto: 'drink' },
];

export const CATEGORY_LABELS: Record<Category, { ro: string; en: string }> = {
  soup: { ro: 'Ciorbă sau supă', en: 'Soup' },
  main: { ro: 'Fel principal', en: 'Main course' },
  side: { ro: 'Garnitură', en: 'Side' },
  dessert: { ro: 'Desert', en: 'Dessert' },
  salad: { ro: 'Salată', en: 'Salad' },
  drink: { ro: 'Băutură', en: 'Drink' },
  extra: { ro: 'Extra', en: 'Extra' },
};

export function groupOf(category: Category): CategoryGroup {
  return CATEGORY_GROUPS.find((g) => g.categories.includes(category)) || CATEGORY_GROUPS[1];
}

/** docs/05 `dish_diet_tags`. Medical consequences: they come from the canteen, never inferred. */
export type DietTag = 'vegetarian' | 'vegan' | 'fasting' | 'no_pork' | 'gluten_free' | 'lactose_free';
export const DIET_TAGS: DietTag[] = ['vegetarian', 'vegan', 'fasting', 'no_pork', 'gluten_free', 'lactose_free'];
export const DIET_TAG_LABELS: Record<DietTag, { ro: string; en: string; icon: string }> = {
  vegetarian: { ro: 'Vegetarian', en: 'Vegetarian', icon: 'leaf' },
  vegan: { ro: 'Vegan', en: 'Vegan', icon: 'salad' },
  fasting: { ro: 'De post', en: 'Fasting', icon: 'sprout' },
  no_pork: { ro: 'Fără porc', en: 'No pork', icon: 'ban' },
  gluten_free: { ro: 'Fără gluten', en: 'Gluten-free', icon: 'wheat-off' },
  lactose_free: { ro: 'Fără lactoză', en: 'Lactose-free', icon: 'milk-off' },
};

/** A dish passes a filter only when the canteen has tagged it. A vegan dish is also vegetarian;
 *  nothing else is implied. */
export function matchesDiet(tags: DietTag[], wanted: DietTag[]): boolean {
  return wanted.every((w) => tags.includes(w) || (w === 'vegetarian' && tags.includes('vegan')));
}

/** The EU list of 14 allergens (Regulation 1169/2011, Annex II). */
export type Allergen =
  | 'gluten' | 'crustaceans' | 'eggs' | 'fish' | 'peanuts' | 'soybeans' | 'milk'
  | 'nuts' | 'celery' | 'mustard' | 'sesame' | 'sulphites' | 'lupin' | 'molluscs';
export const ALLERGENS: Allergen[] = [
  'gluten', 'crustaceans', 'eggs', 'fish', 'peanuts', 'soybeans', 'milk',
  'nuts', 'celery', 'mustard', 'sesame', 'sulphites', 'lupin', 'molluscs',
];
export const ALLERGEN_LABELS: Record<Allergen, { ro: string; en: string }> = {
  gluten: { ro: 'Cereale cu gluten', en: 'Cereals containing gluten' },
  crustaceans: { ro: 'Crustacee', en: 'Crustaceans' },
  eggs: { ro: 'Ouă', en: 'Eggs' },
  fish: { ro: 'Pește', en: 'Fish' },
  peanuts: { ro: 'Arahide', en: 'Peanuts' },
  soybeans: { ro: 'Soia', en: 'Soybeans' },
  milk: { ro: 'Lapte', en: 'Milk' },
  nuts: { ro: 'Fructe cu coajă lemnoasă', en: 'Tree nuts' },
  celery: { ro: 'Țelină', en: 'Celery' },
  mustard: { ro: 'Muștar', en: 'Mustard' },
  sesame: { ro: 'Susan', en: 'Sesame' },
  sulphites: { ro: 'Dioxid de sulf și sulfiți', en: 'Sulphur dioxide and sulphites' },
  lupin: { ro: 'Lupin', en: 'Lupin' },
  molluscs: { ro: 'Moluște', en: 'Molluscs' },
};
export type AllergenSource = 'canteen_declared' | 'unknown';

export type CrowdLevel = 'low' | 'moderate' | 'high';
export type Quality = 'live' | 'degraded' | 'estimated';

/** docs/07: bootstrap level thresholds for week one, replaced by weekly percentiles. */
export const BOOTSTRAP_THRESHOLDS = { low: 3, high: 8 };

export type NotificationType = 'menu_published' | 'favorite_today' | 'quiet_now' | 'one_from_free';
export const NOTIFICATION_TYPES: NotificationType[] = ['menu_published', 'favorite_today', 'quiet_now', 'one_from_free'];

/** Loyalty: five counted visits earn the sixth meal (docs/09). */
export const LOYALTY_CYCLE = 5;

/** Analytics events the API accepts. Names only — never a person (docs/11). */
export const ANALYTICS_EVENTS = [
  'pageview', 'first_visit', 'pwa_installed', 'standalone_open', 'kiosk_qr_open',
  'dish_open', 'filter_use', 'report_submit', 'visit_add', 'feedback_open', 'feedback_submit',
  'favorite_add', 'rating_submit', 'sign_in', 'install_prompt_shown', 'install_prompt_accepted',
  'push_enabled', 'lang_switch', 'kiosk_tap', 'kiosk_feedback', 'offline_open',
] as const;
export type AnalyticsEvent = (typeof ANALYTICS_EVENTS)[number];
