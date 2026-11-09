-- The menu and the catalogue read each dish's average rating and rating count (services/menu.ts
-- DISH_COLUMNS). The primary key is (user_id, dish_id), so without this both subqueries scan the
-- whole table for every dish. Under load with 20k ratings: /api/menu/today 107 → 342 req/s,
-- /api/dishes 34 → 281 req/s. INCLUDE makes both an index-only scan.
CREATE INDEX IF NOT EXISTS ratings_dish ON ratings (dish_id) INCLUDE (stars);
