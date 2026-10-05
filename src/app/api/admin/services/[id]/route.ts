import { db } from "@/db";
import { services } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireAuth, slugify } from "@/lib/admin-api";
import { serviceInput } from "@/lib/admin-validation";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const u = await requireAuth();
  if (u) return u;
  try {
    const p = serviceInput.safeParse(await req.json());
    if (!p.success) return Response.json({ error: p.error.issues[0]?.message }, { status: 400 });
    const b = p.data;
    const [row] = await db
      .update(services)
      .set({
        ...b,
        slug: slugify(b.slug || b.name),
        imageUrl: b.imageUrl || null,
        videoUrl: b.videoUrl || null,
        seoTitle: b.seoTitle ?? "",
        seoDescription: b.seoDescription ?? "",
        seoKeywords: b.seoKeywords ?? "",
        updatedAt: new Date(),
      })
      .where(eq(services.id, Number((await params).id)))
      .returning();
    if (!row) return Response.json({ error: "Solution not found" }, { status: 404 });
    return Response.json(row);
  } catch (e) {
    console.error("[admin/services] update error", e);
    return Response.json({ error: "Unable to update solution. Check that the slug is unique." }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const u = await requireAuth();
  if (u) return u;
  const id = Number((await params).id);
  const [existing] = await db.select({ imageUrl: services.imageUrl, gallery: services.gallery }).from(services).where(eq(services.id, id));
  if (existing) {
    const urls = [existing.imageUrl, ...(existing.gallery ?? [])];
    void Promise.allSettled(
      urls.filter((u): u is string => Boolean(u)).map(async (url) => {
        const { safeDeleteImage } = await import("@/lib/cloudinary");
        return safeDeleteImage(url);
      })
    );
  }
  await db.delete(services).where(eq(services.id, id));
  return Response.json({ ok: true });
}