import { db } from "@/db";
import { catalogues, catalogueLeads } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { z } from "zod";
import { getActiveCatalogue } from "@/lib/queries";

export const dynamic = "force-dynamic";

/** Public read — served from the published snapshot, never from a live query. */
export async function GET() {
  const item = await getActiveCatalogue();
  return Response.json(item ?? null);
}

/** Lead capture — writes to the database and republishes via the write hook. */
export async function POST(req: Request) {
  const p = z
    .object({
      catalogueId: z.coerce.number().positive(),
      name: z.string().trim().min(2),
      company: z.string().optional(),
      email: z.string().email(),
      phone: z.string().min(7),
    })
    .safeParse(await req.json());
  if (!p.success)
    return Response.json({ error: p.error.issues[0]?.message }, { status: 400 });

  const [catalogue] = await db
    .select()
    .from(catalogues)
    .where(eq(catalogues.id, p.data.catalogueId));
  if (!catalogue || !catalogue.active)
    return Response.json({ error: "Catalogue is not available" }, { status: 404 });

  await db.insert(catalogueLeads).values({
    ...p.data,
    company: p.data.company || null,
  });
  await db
    .update(catalogues)
    .set({ downloadCount: sql`${catalogues.downloadCount}+1` })
    .where(eq(catalogues.id, catalogue.id));

  return Response.json({ ok: true, url: catalogue.fileUrl });
}
