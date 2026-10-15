-- MSNSS — Section media (images + video)
-- Extends `section_media` so the homepage marketing sections can hold videos as
-- well as stills, each video optionally carrying a poster/thumbnail. This lets
-- the homepage "About" and "Why Industry Leaders Choose MSNSS" galleries reuse
-- exactly the same media model as the product gallery.
--
-- Additive & idempotent — safe to run repeatedly, and against a database that
-- already has the 0003 product media in place.
-- Apply with:  npm run db:migrate:sql   OR   psql -f this file.

-- "image" (default) or "video".
ALTER TABLE "section_media"
  ADD COLUMN IF NOT EXISTS "media_type" varchar(10) DEFAULT 'image' NOT NULL;

-- Optional poster/thumbnail, used for videos only.
ALTER TABLE "section_media"
  ADD COLUMN IF NOT EXISTS "poster_url" text;

-- Keep the existing default consistent for rows created before this migration.
UPDATE "section_media" SET "media_type" = 'image' WHERE "media_type" IS NULL;
