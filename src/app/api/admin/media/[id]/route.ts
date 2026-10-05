import { db } from "@/db";
import { mediaAssets } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireAuth } from "@/lib/admin-api";
import { mediaAssetPatchInput } from "@/lib/admin-validation";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const unauth = await requireAuth();
  if (unauth) return unauth;
  const id = Number((await params).id);
  const [row] = await db.select().from(mediaAssets).where(eq(mediaAssets.id, id));
  if (!row) return Response.json({ error: "Media asset not found" }, { status: 404 });
  return Response.json(row);
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const unauth = await requireAuth();
  if (unauth) return unauth;
  const id = Number((await params).id);
  const parsed = mediaAssetPatchInput.safeParse(await req.json());
  if (!parsed.success) return Response.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
  const [updated] = await db
    .update(mediaAssets)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(mediaAssets.id, id))
    .returning();
  if (!updated) return Response.json({ error: "Media asset not found" }, { status: 404 });
  return Response.json(updated);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const unauth = await requireAuth();
  if (unauth) return unauth;
  const id = Number((await params).id);
  const [row] = await db.select().from(mediaAssets).where(eq(mediaAssets.id, id));
  if (!row) return Response.json({ error: "Media asset not found" }, { status: 404 });
  const { safeDeleteImage } = await import("@/lib/cloudinary");
  await safeDeleteImage(row.publicId);
  await db.delete(mediaAssets).where(eq(mediaAssets.id, id));
  return Response.json({ ok: true });
}