BEGIN;
CREATE TABLE IF NOT EXISTS site_page_views (
  id uuid PRIMARY KEY,
  visitor_id uuid NOT NULL,
  visit_id uuid NOT NULL,
  page text NOT NULL CHECK (page IN ('home','standings','schedule','team','moves','rules','commish')),
  device text NOT NULL CHECK (device IN ('mobile','tablet','desktop')),
  viewed_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS site_page_views_time_idx ON site_page_views (viewed_at);
COMMIT;
