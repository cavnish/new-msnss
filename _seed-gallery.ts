import "./src/db/env";
import { db, pool } from "./src/db";
import { products } from "./src/db/schema";
import { eq, sql } from "drizzle-orm";

/**
 * Points every product's CMS `gallery` and `showcase_items` at its generated
 * six-frame set, so the redesigned product page is driven by real CMS data the
 * marketing team can edit from /admin/products (not by hard-coded URLs).
 */
const LABELS = [
  "Fabricated Section",
  "Joint & Flange Detail",
  "Set & Range",
  "Cross Section & Dimensions",
  "Installed on Site",
  "Inspection & Quality Check",
];

const ALT_PREFIX: Record<string, string> = {
  "ms-rectangular-duct": "MS rectangular duct",
  "ss-rectangular-duct": "SS rectangular duct",
  "ms-round-duct": "MS round duct",
  "ss-round-duct": "SS round duct",
  "flanged-duct": "flanged duct",
  "angle-frame-duct": "angle frame duct",
  "kitchen-exhaust-duct": "kitchen exhaust duct",
  "fire-rated-duct": "fire-rated duct",
  "cisbond-fr-802-coating": "Cisbond FR 802 coating",
  "volume-control-damper": "volume control damper",
  "duct-flange": "duct flange",
  "access-door": "duct access door",
  "plasma-cutting-machine": "plasma cutting machine",
  "bending-punching-machine": "bending and punching machine",
};

async function main() {
  const existing = await db.select({ slug: products.slug }).from(products);
  let updated = 0;
  const skipped: string[] = [];

  for (const { slug } of existing) {
    if (!ALT_PREFIX[slug]) {
      skipped.push(slug);
      continue;
    }
    const gallery = LABELS.map((_, i) => `/images/products/${slug}-${i + 1}.jpg`);
    const showcase = LABELS.map((label, i) => ({
      type: "image" as const,
      url: `/images/products/${slug}-${i + 1}.jpg`,
      label,
    }));
    await db
      .update(products)
      .set({ gallery, showcaseItems: showcase, updatedAt: new Date() })
      .where(eq(products.slug, slug));
    updated++;
  }

  console.log(`updated ${updated} product(s)`);
  if (skipped.length) console.log(`skipped (no image set): ${skipped.join(", ")}`);

  const check = await db.execute(sql`
    select slug,
           jsonb_array_length(coalesce(gallery,'[]'::jsonb)) as g,
           jsonb_array_length(coalesce("showcase_items",'[]'::jsonb)) as s
    from products order by id
  `);
  for (const r of (check as unknown as { rows: { slug: string; g: number; s: number }[] }).rows) {
    console.log(`  ${r.slug.padEnd(28)} gallery=${r.g} showcase=${r.s}`);
  }
}

main()
  .catch((e) => {
    console.error("FAILED:", e.message);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
