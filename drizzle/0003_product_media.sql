-- MSNSS — Product media gallery (images + video)
-- Extends `product_images` so a single ordered relationship holds both still
-- images and videos, each optionally carrying a poster/thumbnail.
--
-- Additive & idempotent — safe to run repeatedly, and against a database that
-- already has the 0002 gallery in place.
-- Apply with:  node scripts/migrate-sql.mjs   OR   psql -f this file.

-- "image" (default) or "video".
ALTER TABLE "product_images"
  ADD COLUMN IF NOT EXISTS "media_type" varchar(10) DEFAULT 'image' NOT NULL;

-- Optional poster/thumbnail, used for videos only.
ALTER TABLE "product_images"
  ADD COLUMN IF NOT EXISTS "poster_url" text;

-- Keep the existing default consistent for rows created before this migration.
UPDATE "product_images" SET "media_type" = 'image' WHERE "media_type" IS NULL;
