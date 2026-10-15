import { db } from "@/db";
import { products, productImages } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireAuth, slugify } from "@/lib/admin-api";
import { productInput } from "@/lib/admin-validation";
import { listProductImages, replaceProductImages } from "@/lib/product-images";
import { buildSnapshotFromDatabase, enqueuePublish, withPublishSuppressed } from "@/lib/content-store";
import { deleteMediaByUrl } from "@/lib/storage";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const u = await requireAuth();
  if (u) return u;
  try {
    const raw = await req.json();
    const p = productInput.safeParse(raw);
    if (!p.success) return Response.json({ error: p.error.issues[0]?.message }, { status: 400 });
    const { images, ...b } = p.data;
    const id = Number((await params).id);
    // Fields the admin editor may not send must never be wiped by zod defaults.
    const [existing] = await db
      .select({ gallery: products.gallery, manufacturingNarrative: products.manufacturingNarrative })
      .from(products)
      .where(eq(products.id, id));
    if (!existing) return Response.json({ error: "Product not found" }, { status: 404 });

    const row = await withPublishSuppressed(async () => {
      const [updated] = await db
        .update(products)
        .set({
          ...b,
          gallery: "gallery" in raw ? b.gallery : existing.gallery,
          manufacturingNarrative:
            "manufacturingNarrative" in raw
              ? b.manufacturingNarrative ?? ""
              : existing.manufacturingNarrative,
          slug: slugify(b.slug || b.name),
          longDescription: b.longDescription ?? "",
          material: b.material ?? "",
          seoTitle: b.seoTitle ?? "",
          seoDescription: b.seoDescription ?? "",
          seoKeywords: b.seoKeywords ?? "",
          h1: b.h1 ?? "",
          primaryKeyword: b.primaryKeyword ?? "",
          designFabrication: b.designFabrication ?? "",
          supplyAcrossIndia: b.supplyAcrossIndia ?? "",
          videoUrl: b.videoUrl || null,
          updatedAt: new Date(),
        })
        .where(eq(products.id, id))
        .returning();
      // Only touch the gallery when the editor actually sent it.
      if (updated && "images" in raw) await replaceProductImages(id, images);
      return updated ?? null;
    });

    if (!row) return Response.json({ error: "Product not found" }, { status: 404 });

    const publish = await enqueuePublish(buildSnapshotFromDatabase, { reason: "cms-write" });
    if (!publish.ok) {
      return Response.json(
        { error: `Product saved but publishing failed: ${publish.error ?? "unknown error"}` },
        { status: 500 }
      );
    }
    return Response.json({ ...row, images: await listProductImages(id) });
  } catch (e) {
    console.error("[admin/products] update error", e);
    return Response.json({ error: "Unable to update product. Check that the slug is unique." }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const u = await requireAuth();
  if (u) return u;
  const id = Number((await params).id);
  const [existing] = await db.select().from(products).where(eq(products.id, id));
  const gallery = await db
    .select({ url: productImages.url })
    .from(productImages)
    .where(eq(productImages.productId, id));
  if (existing) {
    // product_images rows are removed by the foreign-key cascade on the product
    // delete below, but their underlying files must be removed explicitly.
    const urls = [existing.imageUrl, ...(existing.gallery ?? []), ...gallery.map((g) => g.url)];
    await Promise.allSettled(urls.filter((u): u is string => Boolean(u)).map((url) => deleteMediaByUrl(url)));
  }
  await db.delete(products).where(eq(products.id, id));
  return Response.json({ ok: true });
}
