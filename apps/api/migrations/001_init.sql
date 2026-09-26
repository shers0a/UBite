-- UBite schema, docs/05-domain-model.md. Timestamps are timestamptz (UTC, rendered in
-- Europe/Bucharest); money is integer bani. Tables below the "implementation" line are not in
-- docs/05's entity list but are needed to run it; each says why.

CREATE EXTENSION IF NOT EXISTS citext;

CREATE TYPE dish_category AS ENUM ('soup', 'main', 'side', 'dessert', 'salad', 'drink', 'extra');
CREATE TYPE diet_tag AS ENUM ('vegetarian', 'vegan', 'fasting', 'no_pork', 'gluten_free', 'lactose_free');
CREATE TYPE allergen AS ENUM ('gluten', 'crustaceans', 'eggs', 'fish', 'peanuts', 'soybeans', 'milk',
  'nuts', 'celery', 'mustard', 'sesame', 'sulphites', 'lupin', 'molluscs');
CREATE TYPE allergen_source AS ENUM ('canteen_declared', 'unknown');
CREATE TYPE user_role AS ENUM ('student', 'canteen_staff', 'dccas_admin', 'tech_admin');
CREATE TYPE user_locale AS ENUM ('ro', 'en');
-- receipt_manual: the documented OCR fallback (docs/09 DEGRADATION), kept distinct so R15 can
-- report how often it was needed.
CREATE TYPE visit_source AS ENUM ('receipt_ocr', 'receipt_manual', 'staff_confirmed', 'manual_admin');
CREATE TYPE crowd_zone AS ENUM ('queue', 'hall');
CREATE TYPE crowd_level AS ENUM ('low', 'moderate', 'high');
CREATE TYPE estimate_quality AS ENUM ('live', 'degraded', 'estimated');
CREATE TYPE feedback_source AS ENUM ('app', 'kiosk');

-- ── Catalogue ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE dishes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name_ro text NOT NULL CHECK (length(trim(name_ro)) > 0),
  name_en text NOT NULL,
  category dish_category NOT NULL,
  default_price_bani integer NOT NULL CHECK (default_price_bani >= 0),
  weight_grams integer CHECK (weight_grams > 0),
  calories integer CHECK (calories >= 0),
  photo_url text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE dish_diet_tags (
  dish_id uuid NOT NULL REFERENCES dishes (id) ON DELETE CASCADE,
  tag diet_tag NOT NULL,
  PRIMARY KEY (dish_id, tag)
);

CREATE TABLE dish_allergens (
  dish_id uuid NOT NULL REFERENCES dishes (id) ON DELETE CASCADE,
  allergen allergen NOT NULL,
  source allergen_source NOT NULL DEFAULT 'canteen_declared',
  PRIMARY KEY (dish_id, allergen)
);

-- ── People ────────────────────────────────────────────────────────────────────────────────

CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Null once erased: the address is released (docs/10 "Account deletion").
  email citext UNIQUE,
  role user_role NOT NULL DEFAULT 'student',
  display_name text,
  locale user_locale NOT NULL DEFAULT 'ro',
  diet_preference text[],
  created_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  CONSTRAINT student_domain CHECK (role <> 'student' OR email IS NULL OR email LIKE '%@s.unibuc.ro')
);

-- ── Menus ─────────────────────────────────────────────────────────────────────────────────

CREATE TABLE daily_menus (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_date date NOT NULL UNIQUE,
  published_at timestamptz,
  published_by uuid REFERENCES users (id)
);

CREATE TABLE daily_menu_items (
  daily_menu_id uuid NOT NULL REFERENCES daily_menus (id) ON DELETE CASCADE,
  dish_id uuid NOT NULL REFERENCES dishes (id),
  price_bani integer NOT NULL CHECK (price_bani >= 0),
  portions_prepared integer CHECK (portions_prepared >= 0),
  sort_order integer NOT NULL DEFAULT 0,
  PRIMARY KEY (daily_menu_id, dish_id)
);

CREATE TABLE favorites (
  user_id uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  dish_id uuid NOT NULL REFERENCES dishes (id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, dish_id)
);

CREATE TABLE ratings (
  user_id uuid NOT NULL REFERENCES users (id),
  dish_id uuid NOT NULL REFERENCES dishes (id) ON DELETE CASCADE,
  stars smallint NOT NULL CHECK (stars BETWEEN 1 AND 5),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, dish_id)
);

-- ── Loyalty ledger (docs/09) ──────────────────────────────────────────────────────────────

CREATE TABLE visits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  occurred_on date NOT NULL,
  receipt_hash text UNIQUE,
  receipt_total_bani integer CHECK (receipt_total_bani >= 0),
  items_json jsonb,
  source visit_source NOT NULL,
  counted_for_loyalty boolean NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
-- One point per calendar day, enforced by the database, not by application code.
CREATE UNIQUE INDEX visits_one_point_per_day ON visits (user_id, occurred_on) WHERE counted_for_loyalty;

CREATE TABLE loyalty_rewards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  earned_at timestamptz NOT NULL DEFAULT now(),
  code text NOT NULL UNIQUE,
  -- Per-reward HMAC key: the phone derives the rolling digits from it offline.
  secret text NOT NULL,
  redeemed_at timestamptz,
  redeemed_by uuid REFERENCES users (id)
);

-- ── Crowding (docs/07) ────────────────────────────────────────────────────────────────────

-- Never an image. A count, a zone, a confidence.
CREATE TABLE crowd_observations (
  id bigserial PRIMARY KEY,
  observed_at timestamptz NOT NULL,
  zone crowd_zone NOT NULL,
  person_count integer NOT NULL CHECK (person_count >= 0),
  confidence real CHECK (confidence BETWEEN 0 AND 1)
);
CREATE INDEX crowd_observations_time ON crowd_observations (zone, observed_at DESC);

CREATE TABLE wait_reports (
  id bigserial PRIMARY KEY,
  user_id uuid REFERENCES users (id) ON DELETE SET NULL,
  reported_at timestamptz NOT NULL DEFAULT now(),
  waited_minutes smallint NOT NULL CHECK (waited_minutes BETWEEN 0 AND 120),
  client_reported_at timestamptz NOT NULL,
  accepted boolean NOT NULL,
  rejection_reason text
);
-- One accepted report per user per hour (docs/05), by index. A rejected report can be followed
-- by another, but only one the camera agrees with gets through, so retrying cannot game it.
CREATE UNIQUE INDEX wait_reports_one_per_hour
  ON wait_reports (user_id, date_trunc('hour', reported_at AT TIME ZONE 'UTC'))
  WHERE accepted AND user_id IS NOT NULL;
CREATE INDEX wait_reports_time ON wait_reports (client_reported_at DESC);

CREATE TABLE crowd_estimates (
  id bigserial PRIMARY KEY,
  computed_at timestamptz NOT NULL DEFAULT now(),
  wait_minutes real NOT NULL,
  level crowd_level NOT NULL,
  camera_weight real NOT NULL,
  report_weight real NOT NULL,
  history_weight real NOT NULL,
  quality estimate_quality NOT NULL
);
CREATE INDEX crowd_estimates_time ON crowd_estimates (computed_at DESC);

CREATE TABLE calibration_params (
  id bigserial PRIMARY KEY,
  fitted_at timestamptz NOT NULL DEFAULT now(),
  slope_min_per_person real NOT NULL,
  intercept_min real NOT NULL,
  sample_size integer NOT NULL,
  mae_minutes real
);

-- ── Canteen ───────────────────────────────────────────────────────────────────────────────

CREATE TABLE announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  body_ro text NOT NULL CHECK (length(trim(body_ro)) > 0),
  body_en text,
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL CHECK (ends_at > starts_at),
  created_by uuid REFERENCES users (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users (id) ON DELETE SET NULL,
  food_rating smallint CHECK (food_rating BETWEEN 1 AND 5),
  app_rating smallint CHECK (app_rating BETWEEN 1 AND 5),
  missing_feature text,
  came_because_of_app boolean,
  source feedback_source NOT NULL,
  submitted_at timestamptz NOT NULL DEFAULT now()
);

-- ISO weekday: 1 = Monday … 7 = Sunday. Seeded from the confirmed hours; editable, no deploy.
CREATE TABLE canteen_schedule (
  weekday smallint PRIMARY KEY CHECK (weekday BETWEEN 1 AND 7),
  opens_at time,
  closes_at time,
  is_closed boolean NOT NULL DEFAULT false
);
INSERT INTO canteen_schedule (weekday, opens_at, closes_at, is_closed) VALUES
  (1, '11:30', '17:00', false), (2, '11:30', '17:00', false), (3, '11:30', '17:00', false),
  (4, '11:30', '17:00', false), (5, '11:30', '17:00', false),
  (6, NULL, NULL, true), (7, NULL, NULL, true);

-- ════ Implementation tables ═══════════════════════════════════════════════════════════════

-- A closure or shorter hours on one date ("Vineri se închide la 15:00"), so the open/closed
-- status, report window and loyalty window follow the announcement instead of contradicting it.
CREATE TABLE schedule_exceptions (
  service_date date PRIMARY KEY,
  is_closed boolean NOT NULL DEFAULT true,
  opens_at time,
  closes_at time,
  note text
);

-- Six-digit email codes (docs/10): hashed, ten minutes, single use, throttled.
CREATE TABLE auth_codes (
  id bigserial PRIMARY KEY,
  email citext NOT NULL,
  code_hash text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  attempts integer NOT NULL DEFAULT 0,
  last_attempt_at timestamptz,
  consumed_at timestamptz
);
CREATE INDEX auth_codes_email ON auth_codes (email, created_at DESC);

-- Sessions are independent of how the user signed in, so SSO can be added later (docs/10).
CREATE TABLE sessions (
  id text PRIMARY KEY, -- SHA-256 of the cookie value; the value itself is never stored
  user_id uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  last_seen_at timestamptz NOT NULL DEFAULT now()
);

-- docs/03 F5b: each type toggles independently, plus the window for "it's quiet now".
CREATE TABLE notification_prefs (
  user_id uuid PRIMARY KEY REFERENCES users (id) ON DELETE CASCADE,
  menu_published boolean NOT NULL DEFAULT true,
  favorite_today boolean NOT NULL DEFAULT true,
  quiet_now boolean NOT NULL DEFAULT false,
  one_from_free boolean NOT NULL DEFAULT true,
  window_start time NOT NULL DEFAULT '11:30',
  window_end time NOT NULL DEFAULT '14:00',
  last_quiet_sent_on date
);

CREATE TABLE push_subscriptions (
  id bigserial PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  endpoint text NOT NULL UNIQUE,
  p256dh text NOT NULL,
  auth text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_success_at timestamptz
);

-- The catalogue photo lives in the database so it survives any host move (docs/12).
CREATE TABLE dish_photos (
  dish_id uuid PRIMARY KEY REFERENCES dishes (id) ON DELETE CASCADE,
  content bytea NOT NULL,
  mime text NOT NULL,
  placeholder boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Erased accounts keep their receipt hashes here, anonymously, so duplicates stay rejected.
CREATE TABLE retired_receipt_hashes (
  receipt_hash text PRIMARY KEY,
  retired_at timestamptz NOT NULL DEFAULT now()
);

-- Tech-admin configuration: crowding thresholds, camera zones, free-meal value.
CREATE TABLE app_config (
  key text PRIMARY KEY,
  value jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- docs/05 "Historical crowding baseline", materialised nightly: median wait per weekday × 15 min.
CREATE TABLE historical_baseline (
  weekday smallint NOT NULL,
  slot_minute smallint NOT NULL,
  wait_minutes real NOT NULL,
  sample_size integer NOT NULL,
  computed_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (weekday, slot_minute)
);

-- Cookie-free analytics (docs/11, D-18). A visitor is a salted daily hash that cannot be linked
-- across days; the salt is deleted and the day rolled up into a count once it is over.
CREATE TABLE analytics_salts (
  day date PRIMARY KEY,
  salt text NOT NULL
);
CREATE TABLE analytics_visitors (
  day date NOT NULL,
  visitor text NOT NULL,
  PRIMARY KEY (day, visitor)
);
CREATE TABLE analytics_daily (
  day date PRIMARY KEY,
  unique_visitors integer NOT NULL
);
CREATE TABLE analytics_events (
  day date NOT NULL,
  hour smallint NOT NULL,
  name text NOT NULL,
  count integer NOT NULL DEFAULT 0,
  PRIMARY KEY (day, hour, name)
);

-- Scheduled jobs and one-off sends remember when they last ran, so a restart never repeats one.
CREATE TABLE job_runs (
  name text PRIMARY KEY,
  last_run_at timestamptz NOT NULL DEFAULT now()
);
