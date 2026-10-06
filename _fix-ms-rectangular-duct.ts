import "./src/db/env";
import { existsSync } from "fs";
import { join } from "path";
import { db, pool } from "./src/db";
import { products } from "./src/db/schema";
import { eq } from "drizzle-orm";

/**
 * One-time repair for the MS Rectangular Duct product record.
 *
 * Problems fixed (verified against the live row before patching):
 *  1. `shortDescription` held test typing ("dnjnfv,").
 *  2. `material` held test typing ("wwahhiuewhnw").
 *  3. `applications` / `specifications` were single-element arrays with
 *     embedded newlines, so the page rendered one giant bullet.
 *  4. `gallery` pointed at generated demo images
 *     (/images/products/ms-rectangular-duct-N.jpg, bulk-overwritten by
 *     _seed-gallery.ts). It now points at the six real locally uploaded
 *     product images (uploads/products/…, served via /api/media/…).
 *
 * Nothing else is touched: legitimate copy (features, benefits, tech specs,
 * process steps, FAQs, showcase, SEO) is left exactly as saved.
 *
 * The write-through hook in src/db/index.ts republishes the static snapshot
 * automatically, so the public page picks the fix up on next render.
 */

const SLUG = "ms-rectangular-duct";

// The six real locally uploaded images for this product (clustered upload
// batch, already used by its "Fabrication & Project Installations" showcase).
const REAL_HERO_IMAGES = [
  "/api/media/products/1791264203849-expoy4-images-10.png",
  "/api/media/products/1791264210393-g0i3a7-hotel-industry.png",
  "/api/media/products/1791264215988-nabfc9-122497653.png",
  "/api/media/products/1791264222022-nx2srd-images-9.png",
  "/api/media/products/1791264229798-gticdu-view-of-factory-against-blue-sky-257700.png",
  "/api/media/products/1791264235745-pjak8l-wwfcmsprodimagescutti-2e16d0ba-format-webp-fill-660x660.png",
];

const CLEAN_SHORT_DESCRIPTION =
  "MS rectangular ducts fabricated from quality mild steel sheets in custom sizes and gauges.";

const CLEAN_MATERIAL =
  "Mild steel (MS) sheets, 18G to 24G, TDF / Cleat / Flange joints";

const CLEAN_APPLICATIONS = [
  "Commercial Buildings",
  "Industrial Plants",
  "Hospitals & Clean Rooms",
  "Malls & Retail Spaces",
  "Warehouses",
  "Hotels & Hospitality",
  "Infrastructure Projects",
];

const CLEAN_SPECIFICATIONS = [
  "Gauge: 18G to 24G",
  "Standard: SMACNA / DW 144",
  "Joint: TDF / Cleat / Flange",
  "Custom sizes on order",
];

// Exact known test strings — also scanned for across every product.
const KNOWN_GARBAGE = ["dnjnfv", "wwahhiuewhnw", "wwahihuewhnv", "dnj nfv"];

async function main() {
  // 0. Every hero image must exist on local disk — never publish broken images.
  const missing = REAL_HERO_IMAGES.filter((url) => {
    const rel = url.replace(/^\/api\/media\//, "");
    return !existsSync(join(process.cwd(), "uploads", rel));
  });
  if (missing.length) {
    throw new Error(`Refusing to patch: missing local files: ${missing.join(", ")}`);
  }
  console.log("  local hero images verified on disk: 6/6");

  const rows = await db.select().from(products).where(eq(products.slug, SLUG));
  const current = rows[0];
  if (!current) throw new Error(`Product not found: ${SLUG}`);
  console.log(`  found id=${current.id} name="${current.name}"`);

  // Report (don't touch) any other obvious test content in this record.
  const dump = JSON.stringify(current);
  for (const g of KNOWN_GARBAGE) {
    if (dump.toLowerCase().includes(g)) console.log(`  note: record contains "${g}"`);
  }

  await db
    .update(products)
    .set({
      shortDescription: CLEAN_SHORT_DESCRIPTION,
      material: CLEAN_MATERIAL,
      applications: CLEAN_APPLICATIONS,
      specifications: CLEAN_SPECIFICATIONS,
      gallery: REAL_HERO_IMAGES,
      updatedAt: new Date(),
    })
    .where(eq(products.slug, SLUG));
  console.log("  patched shortDescription, material, applications, specifications, gallery");

  // Verify the published static snapshot picked it up (write hook publishes).
  const { readPublishedSnapshot } = await import("./src/lib/content-store");
  const { invalidateSnapshotCache } = await import("./src/lib/content-store");
  invalidateSnapshotCache();
  const snapshot = await readPublishedSnapshot();
  const published = (snapshot?.products as unknown[] | undefined)?.find(
    (p) => (p as Record<string, unknown>).slug === SLUG
  ) as Record<string, unknown> | undefined;
  if (!published) throw new Error("product missing from published snapshot after repair");
  console.log(`  published snapshot v${snapshot?.meta.version}`);
  console.log(`  gallery: ${JSON.stringify(published.gallery)}`);
  console.log(`  shortDescription: ${JSON.stringify(published.shortDescription)}`);
  console.log(`  material: ${JSON.stringify(published.material)}`);
  console.log(`  applications: ${(published.applications as string[]).length} items`);
  console.log(`  specifications: ${(published.specifications as string[]).length} items`);

  const gallery = published.gallery as string[];
  if (!Array.isArray(gallery) || gallery.length !== 6) {
    throw new Error(`expected 6 hero images, got ${gallery?.length}`);
  }
  for (const g of KNOWN_GARBAGE) {
    for (const field of ["shortDescription", "material", "fullDescription", "longDescription"]) {
      const val = String(published[field] ?? "").toLowerCase();
      if (val.includes(g)) throw new Error(`garbage "${g}" still present in ${field}`);
    }
  }
  console.log("  OK: 6 real hero images, no garbage values");

  // Scan every other product for the same known test strings (report only).
  const all = await db.select().from(products);
  for (const p of all) {
    if (p.slug === SLUG) continue;
    const text = JSON.stringify(p).toLowerCase();
    const hits = KNOWN_GARBAGE.filter((g) => text.includes(g));
    if (hits.length) console.log(`  WARN: ${p.slug} contains test text: ${hits.join(", ")}`);
  }

  await pool.end();
}

main().catch(async (e) => {
  console.error("REPAIR FAILED:", e instanceof Error ? e.message : e);
  try {
    await pool.end();
  } catch {
    /* ignore */
  }
  process.exit(1);
});
