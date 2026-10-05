-- MSNSS database schema extension (Phase 8/10/11 of the website upgrade)
-- Additive migration — safe to run with existing data.
-- Apply with:  npx drizzle-kit push  (after setting DATABASE_URL)  OR  manually via psql.

-- ---------------------------------------------------------------
-- 1. Product profile (extended)
-- ---------------------------------------------------------------
ALTER TABLE "products"
  ADD COLUMN IF NOT EXISTS "long_description" text DEFAULT '' NOT NULL,
  ADD COLUMN IF NOT EXISTS "material" text DEFAULT '' NOT NULL,
  ADD COLUMN IF NOT EXISTS "benefits" jsonb DEFAULT '[]'::jsonb NOT NULL,
  ADD COLUMN IF NOT EXISTS "technical_specifications" jsonb DEFAULT '[]'::jsonb NOT NULL,
  ADD COLUMN IF NOT EXISTS "manufacturing_process" jsonb DEFAULT '[]'::jsonb NOT NULL,
  ADD COLUMN IF NOT EXISTS "installation_information" jsonb DEFAULT '[]'::jsonb NOT NULL,
  ADD COLUMN IF NOT EXISTS "maintenance_information" jsonb DEFAULT '[]'::jsonb NOT NULL,
  ADD COLUMN IF NOT EXISTS "industries" jsonb DEFAULT '[]'::jsonb NOT NULL,
  ADD COLUMN IF NOT EXISTS "featured" boolean DEFAULT false NOT NULL,
  ADD COLUMN IF NOT EXISTS "related_product_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
  ADD COLUMN IF NOT EXISTS "seo_title" text DEFAULT '' NOT NULL,
  ADD COLUMN IF NOT EXISTS "seo_description" text DEFAULT '' NOT NULL,
  ADD COLUMN IF NOT EXISTS "seo_keywords" text DEFAULT '' NOT NULL,
  ADD COLUMN IF NOT EXISTS "updated_at" timestamp DEFAULT now() NOT NULL;

CREATE INDEX IF NOT EXISTS "products_category_idx" ON "products" ("category");
CREATE INDEX IF NOT EXISTS "products_featured_idx" ON "products" ("featured", "active");

-- ---------------------------------------------------------------
-- 2. Service profile (extended)
-- ---------------------------------------------------------------
ALTER TABLE "services"
  ADD COLUMN IF NOT EXISTS "capabilities" jsonb DEFAULT '[]'::jsonb NOT NULL,
  ADD COLUMN IF NOT EXISTS "benefits" jsonb DEFAULT '[]'::jsonb NOT NULL,
  ADD COLUMN IF NOT EXISTS "process" jsonb DEFAULT '[]'::jsonb NOT NULL,
  ADD COLUMN IF NOT EXISTS "equipment" jsonb DEFAULT '[]'::jsonb NOT NULL,
  ADD COLUMN IF NOT EXISTS "applications" jsonb DEFAULT '[]'::jsonb NOT NULL,
  ADD COLUMN IF NOT EXISTS "faqs" jsonb DEFAULT '[]'::jsonb NOT NULL,
  ADD COLUMN IF NOT EXISTS "featured" boolean DEFAULT false NOT NULL,
  ADD COLUMN IF NOT EXISTS "seo_title" text DEFAULT '' NOT NULL,
  ADD COLUMN IF NOT EXISTS "seo_description" text DEFAULT '' NOT NULL,
  ADD COLUMN IF NOT EXISTS "seo_keywords" text DEFAULT '' NOT NULL,
  ADD COLUMN IF NOT EXISTS "updated_at" timestamp DEFAULT now() NOT NULL;

CREATE INDEX IF NOT EXISTS "services_slug_active_idx" ON "services" ("slug", "active");

-- ---------------------------------------------------------------
-- 3. Cloudinary media library
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "media_assets" (
  "id" serial PRIMARY KEY NOT NULL,
  "public_id" varchar(512) NOT NULL UNIQUE,
  "secure_url" text NOT NULL,
  "resource_type" varchar(40) DEFAULT 'image' NOT NULL,
  "format" varchar(16) DEFAULT '' NOT NULL,
  "width" integer,
  "height" integer,
  "bytes" integer,
  "folder" varchar(255) DEFAULT 'msnss/uploads' NOT NULL,
  "alt_text" text DEFAULT '' NOT NULL,
  "caption" text DEFAULT '' NOT NULL,
  "file_name" varchar(255),
  "sort_order" integer DEFAULT 0 NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "media_assets_folder_idx" ON "media_assets" ("folder");
CREATE INDEX IF NOT EXISTS "media_assets_sort_idx" ON "media_assets" ("sort_order");