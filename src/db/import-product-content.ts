import "./env";
import { eq } from "drizzle-orm";
import { db } from "./index";
import { products } from "./schema";
import { ALL_PRODUCT_CONTENT } from "./content";
import { withPublishSuppressed, enqueuePublish, buildSnapshotFromDatabase } from "@/lib/content-store";

/**
 * Upserts the long-form editorial content for every product.
 *
 * Content is matched on `slug` so this is safe to re-run: it refreshes the
 * written copy without creating duplicates or disturbing CMS-only fields the
 * team has set (placement, gallery, related products).
 */
async function run() {
  console.log(`📝 Importing content for ${ALL_PRODUCT_CONTENT.length} products…`);

  await withPublishSuppressed(async () => {
    for (const c of ALL_PRODUCT_CONTENT) {
      const [existing] = await db.select({ id: products.id }).from(products).where(eq(products.slug, c.slug));

      const values = {
        name: c.name,
        category: c.category,
        h1: c.h1,
        primaryKeyword: c.primaryKeyword,
        secondaryKeywords: c.secondaryKeywords,
        seoTags: c.seoTags,
        seoTitle: c.seoTitle,
        seoDescription: c.seoDescription,
        seoKeywords: c.seoKeywords,
        shortDescription: c.shortDescription,
        longDescription: c.manufacturingNarrative,
        manufacturingNarrative: c.manufacturingNarrative,
        material: c.material,
        technicalSpecifications: c.technicalSpecifications,
        features: c.features,
        benefits: c.benefits,
        applications: c.applicationDetails.map((a) => a.title),
        applicationDetails: c.applicationDetails,
        industries: c.industries,
        designFabrication: c.designFabrication,
        supplyAcrossIndia: c.supplyAcrossIndia,
        faqs: c.faqs,
        manufacturingProcess: c.manufacturingProcess,
        installationInformation: c.installationInformation,
        maintenanceInformation: c.maintenanceInformation,
        updatedAt: new Date(),
      };

      if (existing) {
        await db.update(products).set(values).where(eq(products.slug, c.slug));
        console.log(`  ✏️  updated  ${c.slug}`);
      } else {
        await db.insert(products).values({
          ...values,
          slug: c.slug,
          shortDescription: c.shortDescription,
          fullDescription: c.manufacturingNarrative,
          imageUrl: "/images/products/ms-rectangular.jpg",
          sortOrder: 0,
          active: true,
        });
        console.log(`  ➕ created  ${c.slug}`);
      }
    }
  });

  const result = await enqueuePublish(buildSnapshotFromDatabase, { reason: "product-content-import" });
  if (!result.ok) throw new Error(`Content written but publish failed: ${result.error}`);
  console.log(`📦 Published content version ${result.version} (${result.checksum})`);
  console.log("✅ Product content import complete");
  process.exit(0);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
