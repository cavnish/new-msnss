import { db } from "@/db";
import { catalogues } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireAuth } from "@/lib/admin-api";
import { catalogueInput } from "@/lib/admin-validation";
import { deleteMediaByUrl } from "@/lib/storage";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const u = await requireAuth();
  if (u) return u;
  const p = catalogueInput.safeParse(await req.json());
  if (!p.success) return Response.json({ error: p.error.issues[0]?.message }, { status: 400 });
  const id = Number((await params).id);
  const [before] = await db.select({ fileUrl: catalogues.fileUrl }).from(catalogues).where(eq(catalogues.id, id));
  if (p.data.active) await db.update(catalogues).set({ active: false });
  const [row] = await db
    .update(catalogues)
    .set({ ...p.data, description: p.data.description || null, updatedAt: new Date() })
    .where(eq(catalogues.id, id))
    .returning();
  if (!row) return Response.json({ error: "Catalogue not found" }, { status: 404 });
  // Replacing the PDF should remove the previous file from storage.
  if (before?.fileUrl && before.fileUrl !== row.fileUrl) await deleteMediaByUrl(before.fileUrl);
  return Response.json(row);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const u = await requireAuth();
  if (u) return u;
  const id = Number((await params).id);
  const [existing] = await db.select({ fileUrl: catalogues.fileUrl }).from(catalogues).where(eq(catalogues.id, id));
  if (existing) await deleteMediaByUrl(existing.fileUrl);
  await db.delete(catalogues).where(eq(catalogues.id, id));
  return Response.json({ ok: true });
}
