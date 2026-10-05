import { db } from "@/db";
import { sectionMedia } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireAuth } from "@/lib/admin-api";
import { sectionMediaInput } from "../route";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const unauth = await requireAuth();
  if (unauth) return unauth;
  const id = Number((await params).id);
  const [row] = await db.select().from(sectionMedia).where(eq(sectionMedia.id, id));
  return row ? Response.json(row) : Response.json({ error: "Not found" }, { status: 404 });
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const unauth = await requireAuth();
  if (unauth) return unauth;
  try {
    const id = Number((await params).id);
    const parsed = sectionMediaInput.partial().safeParse(await req.json());
    if (!parsed.success)
      return Response.json(
        { error: parsed.error.issues[0]?.message || "Invalid section image" },
        { status: 400 }
      );
    const [row] = await db
      .update(sectionMedia)
      .set({ ...parsed.data, updatedAt: new Date() })
      .where(eq(sectionMedia.id, id))
      .returning();
    if (!row) return Response.json({ error: "Not found" }, { status: 404 });
    return Response.json(row);
  } catch (e) {
    console.error("[admin/section-media] update error", e);
    return Response.json({ error: "Unable to update the section image." }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const unauth = await requireAuth();
  if (unauth) return unauth;
  const id = Number((await params).id);
  await db.delete(sectionMedia).where(eq(sectionMedia.id, id));
  return Response.json({ ok: true });
}
