# Domain Model & Database Schema

PostgreSQL. All timestamps stored as `timestamptz` in UTC, rendered in `Europe/Bucharest`.
All money stored in **bani** (integer minor units), never floats.

## Core decision: the dish is the atom

The unit of the model is the **dish**, not the meal package. A day's menu is a selection of
dishes from a fixed catalogue. This was chosen deliberately: it is what makes dietary filters,
per-dish ratings, favourites and consumption statistics possible at all.

The canteen's real rotation is small and repetitive — reviews describe roughly the same dishes
daily with minor variations — so a catalogue of **under 40 dishes** covers it.

## Entities

### `dishes` — the fixed catalogue

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `name_ro` | text | |
| `name_en` | text | Translated by the team |
| `category` | enum | `soup`, `main`, `side`, `dessert`, `salad`, `drink`, `extra` |
| `default_price_bani` | integer | Overridable per day |
| `weight_grams` | integer null | |
| `calories` | integer null | Only if the canteen supplies it |
| `photo_url` | text null | One photo per catalogue entry, taken once |
| `is_active` | boolean | Retired dishes stay for historical integrity |
| `created_at` | timestamptz | |

Category `side` exists separately from `main` because the garnish may be priced separately.

### `dish_diet_tags`

| Column | Type |
|---|---|
| `dish_id` | uuid FK |
| `tag` | enum: `vegetarian`, `vegan`, `fasting`, `no_pork`, `gluten_free`, `lactose_free` |

`fasting` (*de post*) is a real and frequently relevant category at UB.

> **LEGAL** — `gluten_free` and `lactose_free` carry medical consequences. These flags must
> originate from the canteen, never be inferred by the team, and every dish detail screen
> carries a disclaimer naming the canteen as the source. Same for `allergens`. See
> [11-privacy-gdpr-accessibility.md](11-privacy-gdpr-accessibility.md).

### `dish_allergens`

| Column | Type |
|---|---|
| `dish_id` | uuid FK |
| `allergen` | enum, EU 14-allergen list |
| `source` | enum: `canteen_declared`, `unknown` |

`unknown` is a legitimate and honest value. Display it as "information not available", never
as "does not contain".

### `daily_menus`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `service_date` | date UNIQUE | One menu per day |
| `published_at` | timestamptz null | Null means draft |
| `published_by` | uuid FK → `users` | |

### `daily_menu_items`

| Column | Type | Notes |
|---|---|---|
| `daily_menu_id` | uuid FK | |
| `dish_id` | uuid FK | |
| `price_bani` | integer | Snapshot — never read historical prices from `dishes` |
| `portions_prepared` | integer null | Optional; feeds food-waste analysis |
| `sort_order` | integer | |

Price is snapshotted per day so that the spending history stays correct when prices change.

### `users`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `email` | citext UNIQUE | Must end in `@s.unibuc.ro` for students |
| `role` | enum: `student`, `canteen_staff`, `dccas_admin`, `tech_admin` | |
| `display_name` | text null | Optional; not required for any feature |
| `locale` | enum: `ro`, `en` | |
| `diet_preference` | text[] null | Saved filter, applied automatically |
| `created_at` | timestamptz | |
| `deleted_at` | timestamptz null | Soft delete for GDPR erasure |

Deliberately **not** stored: name, faculty, year, phone. None of them are needed by any
feature, and each one would enlarge the privacy surface for nothing.

The `canteen_staff` role uses a **single shared account** — whoever is on duty. Individual
accounts were rejected as friction in a kitchen.

### `favorites`

`(user_id, dish_id, created_at)` — composite PK.

### `ratings`

| Column | Type | Notes |
|---|---|---|
| `user_id` | uuid FK | |
| `dish_id` | uuid FK | |
| `stars` | smallint | 1–5 |
| `created_at` | timestamptz | |

Composite PK on `(user_id, dish_id)` — one rating per person per dish, updatable.

### `visits` — loyalty ledger

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `user_id` | uuid FK | |
| `occurred_on` | date | |
| `receipt_hash` | text UNIQUE | SHA-256 of normalised receipt number — anti-fraud |
| `receipt_total_bani` | integer null | Parsed from receipt, powers spend history |
| `items_json` | jsonb null | Parsed line items, powers "what I ate" |
| `source` | enum: `receipt_ocr`, `receipt_manual`, `staff_confirmed`, `manual_admin` | `receipt_manual` is the typed fallback when OCR fails |
| `counted_for_loyalty` | boolean | |
| `created_at` | timestamptz | |

Unique constraint on `(user_id, occurred_on)` where `counted_for_loyalty` is true — enforces
the "one point per day" rule at database level, not in application code.

`receipt_hash` being globally unique prevents two students photographing the same receipt.

### `loyalty_rewards`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `user_id` | uuid FK | |
| `earned_at` | timestamptz | |
| `code` | text UNIQUE | Single-use, short-lived |
| `redeemed_at` | timestamptz null | |
| `redeemed_by` | uuid FK null | Staff account that consumed it |

### `crowd_observations` — camera output

| Column | Type | Notes |
|---|---|---|
| `id` | bigserial PK | |
| `observed_at` | timestamptz | |
| `zone` | enum: `queue`, `hall` | |
| `person_count` | integer | |
| `confidence` | real | Model confidence, 0–1 |

**This table never contains an image.** See [07](07-crowding-module.md) and
[11](11-privacy-gdpr-accessibility.md).

### `wait_reports` — student reports

| Column | Type | Notes |
|---|---|---|
| `id` | bigserial PK | |
| `user_id` | uuid FK null | Null allowed for anonymous reports |
| `reported_at` | timestamptz | |
| `waited_minutes` | smallint | |
| `client_reported_at` | timestamptz | For offline-queued reports |
| `accepted` | boolean | False if rejected as an outlier |
| `rejection_reason` | text null | |

Rate limit — one accepted report per user per hour — enforced with a partial unique index on
`(user_id, date_trunc('hour', reported_at))`.

### `crowd_estimates` — the fused, published value

| Column | Type | Notes |
|---|---|---|
| `id` | bigserial PK | |
| `computed_at` | timestamptz | |
| `wait_minutes` | real | |
| `level` | enum: `low`, `moderate`, `high` | The three levels the form requires |
| `camera_weight` | real | Actual contribution, 0–0.7 |
| `report_weight` | real | Actual contribution, 0–0.3 |
| `history_weight` | real | Fallback contribution |
| `quality` | enum: `live`, `degraded`, `estimated` | Drives the UI badge |

Storing the weights makes the estimate auditable after the fact — necessary for R8.

### `calibration_params`

| Column | Type | Notes |
|---|---|---|
| `id` | bigserial PK | |
| `fitted_at` | timestamptz | |
| `slope_min_per_person` | real | Minutes of wait per queued person |
| `intercept_min` | real | |
| `sample_size` | integer | |
| `mae_minutes` | real | Fit quality — reported for R8 |

### `announcements`

`id`, `body_ro`, `body_en`, `starts_at`, `ends_at`, `created_by`, `created_at`.

### `feedback`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `user_id` | uuid FK null | Anonymous permitted |
| `food_rating` | smallint null | 1–5 |
| `app_rating` | smallint null | 1–5 |
| `missing_feature` | text null | |
| `came_because_of_app` | boolean null | The impact question |
| `source` | enum: `app`, `kiosk` | |
| `submitted_at` | timestamptz | |

`came_because_of_app` is the single most valuable field for the final report — it is the only
one that evidences behavioural impact rather than usage.

### `canteen_schedule`

`weekday`, `opens_at`, `closes_at`, `is_closed`. Seeded from confirmed hours: Monday–Friday
11:30–17:00, closed weekends. Configurable without a deploy.

## Relationships at a glance

```
dishes ──< dish_diet_tags
       ──< dish_allergens
       ──< daily_menu_items >── daily_menus
       ──< favorites >── users
       ──< ratings  >── users

users ──< visits ──< (rolls up to) loyalty_rewards
      ──< wait_reports
      ──< feedback

crowd_observations ─┐
wait_reports       ─┼─→ crowd_estimates
historical baseline ┘
                     calibration_params (fitted from camera × reports)
```

## Derived values, not stored

- **Loyalty progress** — `count(visits where counted_for_loyalty) mod 5`. Never stored as a
  counter; counters drift, ledgers do not.
- **Monthly spend** — sum over `visits.receipt_total_bani` for the month.
- **Top dishes** — aggregate over `ratings`.
- **Historical crowding baseline** — median `wait_minutes` per weekday × 15-minute slot,
  materialised nightly for speed.

## Implementation tables

The running system adds tables for things this model implies but does not name — sign-in codes,
sessions, notification preferences and push subscriptions, catalogue photos, receipt hashes kept
after an account is erased, one-day schedule exceptions, tech-admin configuration, the materialised
historical baseline, cookie-free analytics counters and job bookkeeping. They are listed, with the
reason for each, in [24-running-the-app.md](24-running-the-app.md) and commented in
`apps/api/migrations/001_init.sql`. None of them stores anything about a person beyond what this
document already allows.
