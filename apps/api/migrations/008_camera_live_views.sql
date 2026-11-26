-- Who opened the camera live view in the admin screen, and when (docs/11, the live-view exception, 26 Nov 2026).
-- Never what was seen: the frames stay in the API's memory for seconds and are not stored anywhere.
CREATE TABLE camera_live_views (
  id bigserial PRIMARY KEY,
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  opened_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX camera_live_views_opened ON camera_live_views (opened_at DESC);
