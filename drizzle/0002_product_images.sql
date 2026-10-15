-- MSNSS — Advanced product gallery
-- Adds `product_images`: a typed, ordered 1-to-many gallery for every product.
--
-- Additive & idempotent — safe to run repeatedly, and against a database that
-- already carries an (empty) `product_images` table from an earlier experiment.
-- Apply with:  node scripts/migrate-product-images.mjs   OR   psql -f this file.

CREATE TABLE IF NOT EXISTS "product_images" (
  "id" serial PRIMARY KEY NOT NULL,
  "product_id" integer NOT NULL REFERENCES "products"("id") ON DELETE CASCADE,
  -- public URL of the stored image (local /uploads path or Cloudinary URL)
  "url" text NOT NULL,
  -- role: 'primary' | 'gallery' | 'CAD' | 'onsite'
  "type" varchar(20) DEFAULT 'gallery' NOT NULL,
  "alt_text" text DEFAULT '' NOT NULL,
  "sort_order" integer DEFAULT 0 NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);

-- Reconcile a pre-existing table that was created without the `url` column.
ALTER TABLE "product_images" ADD COLUMN IF NOT EXISTS "url" text;
UPDATE "product_images" SET "url" = '' WHERE "url" IS NULL;
ALTER TABLE "product_images" ALTER COLUMN "url" SET NOT NULL;

-- Ensure the cascade FK exists (a pre-existing table may lack it).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'product_images_product_id_fkey'
  ) THEN
    ALTER TABLE "product_images"
      ADD CONSTRAINT "product_images_product_id_fkey"
      FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "product_images_product_idx"
  ON "product_images" ("product_id", "sort_order");

-- One-time backfill: promote legacy `products.gallery` URL arrays into the new
-- table so pre-existing galleries become fully editable. Runs only for products
-- that have no product_images rows yet. The first image becomes the 'primary'.
INSERT INTO "product_images" ("product_id", "url", "type", "alt_text", "sort_order")
SELECT
  p."id",
  g.value,
  CASE WHEN g.ord = 1 THEN 'primary' ELSE 'gallery' END,
  '',
  (g.ord - 1)::integer
FROM "products" p
CROSS JOIN LATERAL jsonb_array_elements_text(p."gallery") WITH ORDINALITY AS g(value, ord)
WHERE p."gallery" IS NOT NULL
  AND jsonb_typeof(p."gallery") = 'array'
  AND NOT EXISTS (
    SELECT 1 FROM "product_images" pi WHERE pi."product_id" = p."id"
  );
