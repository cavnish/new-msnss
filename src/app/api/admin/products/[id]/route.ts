import { db } from "@/db";
import { products } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireAuth, slugify } from "@/lib/admin-api";
import { productInput } from "@/lib/admin-validation";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const u = await requireAuth();
  if (u) return u;
  try {
    const p = productInput.safeParse(await req.json());
    if (!p.success) return Response.json({ error: p.error.issues[0]?.message }, { status: 400 });
    const b = p.data;
    const [row] = await db
      .update(products)
      .set({
        ...b,
        slug: slugify(b.slug || b.name),
        longDescription: b.longDescription ?? "",
        material: b.material ?? "",
        seoTitle: b.seoTitle ?? "",
        seoDescription: b.seoDescription ?? "",
        seoKeywords: b.seoKeywords ?? "",
        videoUrl: b.videoUrl || null,
        updatedAt: new Date(),
      })
      .where(eq(products.id, Number((await params).id)))
      .returning();
    if (!row) return Response.json({ error: "Product not found" }, { status: 404 });
    return Response.json(row);
  } catch (e) {
    console.error("[admin/products] update error", e);
    return Response.json({ error: "Unable to update product. Check that the slug is unique." }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const u = await requireAuth();
  if (u) return u;
  const id = Number((await params).id);
  const [existing] = await db.select({ imageUrl: products.imageUrl, gallery: products.gallery }).from(products).where(eq(products.id, id));
  if (existing) {
    const urls = [existing.imageUrl, ...(existing.gallery ?? [])];
    // Fire-and-forget Cloudinary cleanup (best effort)
    void Promise.allSettled(
      urls.filter((u): u is string => Boolean(u)).map(async (url) => {
        const { safeDeleteImage } = await import("@/lib/cloudinary");
        return safeDeleteImage(url);
      })
    );
  }
  await db.delete(products).where(eq(products.id, id));
  return Response.json({ ok: true });
}