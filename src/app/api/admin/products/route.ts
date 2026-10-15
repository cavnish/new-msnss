import { db } from "@/db";
import { products, productImages, type ProductImage } from "@/db/schema";
import { asc, desc } from "drizzle-orm";
import { requireAuth, slugify } from "@/lib/admin-api";
import { productInput } from "@/lib/admin-validation";
import { replaceProductImages } from "@/lib/product-images";
import { buildSnapshotFromDatabase, enqueuePublish, withPublishSuppressed } from "@/lib/content-store";

export const dynamic = "force-dynamic";

/**
 * All products for the admin table, each with its advanced-gallery rows.
 *
 * `product_images` may not exist yet on a database that has not had the schema
 * pushed, so the gallery read is best-effort: a missing table degrades to an
 * empty gallery instead of breaking the whole admin listing.
 */
async function galleryByProduct(): Promise<Map<number, ProductImage[]>> {
  const grouped = new Map<number, ProductImage[]>();
  try {
    const rows = await db
      .select()
      .from(productImages)
      .orderBy(asc(productImages.sortOrder), asc(productImages.id));
    for (const image of rows) {
      const list = grouped.get(image.productId);
      if (list) list.push(image);
      else grouped.set(image.productId, [image]);
    }
  } catch (error) {
    console.warn("[admin/products] product_images unavailable", error);
  }
  return grouped;
}

export async function GET() {
  const u = await requireAuth();
  if (u) return u;
  const [rows, gallery] = await Promise.all([
    db.select().from(products).orderBy(desc(products.id)),
    galleryByProduct(),
  ]);
  return Response.json(rows.map((row) => ({ ...row, images: gallery.get(row.id) ?? [] })));
}

export async function POST(req: Request) {
  const u = await requireAuth();
  if (u) return u;
  try {
    const p = productInput.safeParse(await req.json());
    if (!p.success) return Response.json({ error: p.error.issues[0]?.message || "Invalid product" }, { status: 400 });
    // `images` is not a column on `products` — it is reconciled into product_images.
    const { images, ...b } = p.data;

    // Suppress the per-statement republish so the product row and its gallery are
    // written as one unit, then publish a single new version.
    const row = await withPublishSuppressed(async () => {
      const [created] = await db
        .insert(products)
        .values({
          ...b,
          slug: slugify(b.slug || b.name),
          longDescription: b.longDescription ?? "",
          material: b.material ?? "",
          seoTitle: b.seoTitle ?? "",
          seoDescription: b.seoDescription ?? "",
          seoKeywords: b.seoKeywords ?? "",
          h1: b.h1 ?? "",
          primaryKeyword: b.primaryKeyword ?? "",
          manufacturingNarrative: b.manufacturingNarrative ?? "",
          designFabrication: b.designFabrication ?? "",
          supplyAcrossIndia: b.supplyAcrossIndia ?? "",
          videoUrl: b.videoUrl || null,
          updatedAt: new Date(),
        })
        .returning();
      await replaceProductImages(created.id, images);
      return created;
    });

    const publish = await enqueuePublish(buildSnapshotFromDatabase, { reason: "cms-write" });
    if (!publish.ok) {
      return Response.json(
        { error: `Product saved but publishing failed: ${publish.error ?? "unknown error"}` },
        { status: 500 }
      );
    }
    return Response.json({ ...row, images }, { status: 201 });
  } catch (e) {
    console.error("[admin/products] create error", e);
    return Response.json({ error: "Unable to create product. Check that the slug is unique." }, { status: 500 });
  }
}
