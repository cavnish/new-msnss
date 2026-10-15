import { db } from "@/db";
import { projectImages } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireAuth } from "@/lib/admin-api";
import { projectImageInput } from "@/lib/admin-validation";
import { deleteMediaByUrl } from "@/lib/storage";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const u = await requireAuth();
  if (u) return u;
  const p = projectImageInput.safeParse(await req.json());
  if (!p.success) return Response.json({ error: p.error.issues[0]?.message }, { status: 400 });
  const id = Number((await params).id);
  const { projectId: _, ...values } = p.data;
  const [before] = await db.select().from(projectImages).where(eq(projectImages.id, id));
  const [row] = await db
    .update(projectImages)
    .set({ ...values, title: values.title || null, description: values.description || null })
    .where(eq(projectImages.id, id))
    .returning();
  if (!row) return Response.json({ error: "Project image not found" }, { status: 404 });
  if (before?.imageUrl && before.imageUrl !== row.imageUrl) await deleteMediaByUrl(before.imageUrl);
  return Response.json(row);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const u = await requireAuth();
  if (u) return u;
  const id = Number((await params).id);
  const [existing] = await db.select().from(projectImages).where(eq(projectImages.id, id));
  if (existing) await deleteMediaByUrl(existing.imageUrl);
  await db.delete(projectImages).where(eq(projectImages.id, id));
  return Response.json({ ok: true });
}
