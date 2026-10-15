import { db } from "@/db";
import { services } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireAuth, slugify } from "@/lib/admin-api";
import { serviceInput } from "@/lib/admin-validation";
import { deleteMediaByUrl } from "@/lib/storage";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const u = await requireAuth();
  if (u) return u;
  try {
    const p = serviceInput.safeParse(await req.json());
    if (!p.success) return Response.json({ error: p.error.issues[0]?.message }, { status: 400 });
    const b = p.data;
    const id = Number((await params).id);
    const [before] = await db
      .select({ imageUrl: services.imageUrl, gallery: services.gallery })
      .from(services)
      .where(eq(services.id, id));
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
      .where(eq(services.id, id))
      .returning();
    if (!row) return Response.json({ error: "Solution not found" }, { status: 404 });
    // Remove files for images that are no longer referenced by this solution.
    if (before) {
      const keep = new Set([row.imageUrl ?? "", ...(row.gallery ?? [])].filter(Boolean));
      const removed = [before.imageUrl, ...(before.gallery ?? [])].filter(
        (url): url is string => typeof url === "string" && url.length > 0 && !keep.has(url)
      );
      await Promise.allSettled(removed.map((url) => deleteMediaByUrl(url)));
    }
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
  const [existing] = await db
    .select({ imageUrl: services.imageUrl, gallery: services.gallery, videoUrl: services.videoUrl })
    .from(services)
    .where(eq(services.id, id));
  if (existing) {
    const urls = [existing.imageUrl, existing.videoUrl, ...(existing.gallery ?? [])];
    await Promise.allSettled(urls.filter((u): u is string => Boolean(u)).map((url) => deleteMediaByUrl(url)));
  }
  await db.delete(services).where(eq(services.id, id));
  return Response.json({ ok: true });
}
