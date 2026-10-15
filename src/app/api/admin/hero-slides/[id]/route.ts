import { db } from "@/db";
import { heroSlides } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireAuth } from "@/lib/admin-api";
import { heroInput } from "@/lib/admin-validation";
import { deleteMediaByUrl } from "@/lib/storage";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const u = await requireAuth();
  if (u) return u;
  try {
    const p = heroInput.safeParse(await req.json());
    if (!p.success) return Response.json({ error: p.error.issues[0]?.message }, { status: 400 });
    const id = Number((await params).id);
    const [existing] = await db.select().from(heroSlides).where(eq(heroSlides.id, id));
    const [row] = await db
      .update(heroSlides)
      .set({ ...p.data, videoUrl: p.data.videoUrl || null })
      .where(eq(heroSlides.id, id))
      .returning();
    if (!row) return Response.json({ error: "Hero slide not found" }, { status: 404 });
    // Replacing a slide's media should remove the file it no longer references.
    if (existing) {
      if (existing.imageUrl && existing.imageUrl !== row.imageUrl) await deleteMediaByUrl(existing.imageUrl);
      if (existing.videoUrl && existing.videoUrl !== row.videoUrl) await deleteMediaByUrl(existing.videoUrl);
    }
    return Response.json(row);
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Unable to update hero slide" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const u = await requireAuth();
  if (u) return u;
  const id = Number((await params).id);
  const [existing] = await db.select().from(heroSlides).where(eq(heroSlides.id, id));
  if (existing) {
    await deleteMediaByUrl(existing.imageUrl);
    await deleteMediaByUrl(existing.videoUrl);
  }
  await db.delete(heroSlides).where(eq(heroSlides.id, id));
  return Response.json({ ok: true });
}
