import { db } from "@/db";
import { sectionMedia } from "@/db/schema";
import { and, asc, eq } from "drizzle-orm";
import { z } from "zod";
import { requireAuth } from "@/lib/admin-api";

export const dynamic = "force-dynamic";

export const sectionMediaInput = z.object({
  sectionKey: z.string().trim().min(2).max(60),
  title: z.string().trim().max(255).optional().default(""),
  imageUrl: z.string().trim().min(1),
  altText: z.string().trim().max(500).optional().default(""),
  caption: z.string().trim().max(2000).optional().default(""),
  sortOrder: z.coerce.number().int().default(0),
  active: z.boolean().default(true),
});

/** List every managed section image, optionally scoped to one section. */
export async function GET(req: Request) {
  const unauth = await requireAuth();
  if (unauth) return unauth;
  const key = new URL(req.url).searchParams.get("sectionKey");
  const where = key ? eq(sectionMedia.sectionKey, key) : undefined;
  const rows = await db
    .select()
    .from(sectionMedia)
    .where(where)
    .orderBy(asc(sectionMedia.sectionKey), asc(sectionMedia.sortOrder), asc(sectionMedia.id));
  return Response.json(rows);
}

export async function POST(req: Request) {
  const unauth = await requireAuth();
  if (unauth) return unauth;
  try {
    const parsed = sectionMediaInput.safeParse(await req.json());
    if (!parsed.success)
      return Response.json(
        { error: parsed.error.issues[0]?.message || "Invalid section image" },
        { status: 400 }
      );
    const [row] = await db
      .insert(sectionMedia)
      .values({ ...parsed.data, updatedAt: new Date() })
      .returning();
    return Response.json(row, { status: 201 });
  } catch (e) {
    console.error("[admin/section-media] create error", e);
    return Response.json({ error: "Unable to save the section image." }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const unauth = await requireAuth();
  if (unauth) return unauth;
  const key = new URL(req.url).searchParams.get("sectionKey");
  if (!key) return Response.json({ error: "sectionKey is required" }, { status: 400 });
  await db.delete(sectionMedia).where(and(eq(sectionMedia.sectionKey, key)));
  return Response.json({ ok: true });
}
