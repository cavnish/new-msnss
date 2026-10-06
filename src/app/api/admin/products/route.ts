import { db } from "@/db";
import { products } from "@/db/schema";
import { desc } from "drizzle-orm";
import { requireAuth, slugify } from "@/lib/admin-api";
import { productInput } from "@/lib/admin-validation";

export const dynamic = "force-dynamic";

export async function GET() {
  const u = await requireAuth();
  if (u) return u;
  return Response.json(await db.select().from(products).orderBy(desc(products.id)));
}

export async function POST(req: Request) {
  const u = await requireAuth();
  if (u) return u;
  try {
    const p = productInput.safeParse(await req.json());
    if (!p.success) return Response.json({ error: p.error.issues[0]?.message || "Invalid product" }, { status: 400 });
    const b = p.data;
    const row = (
      await db
        .insert(products)
        .values({
          ...b,
          slug: slugify(b.slug || b.name),
          longDescription: b.longDescription ?? "",
          material: b.material ?? "",
          seoTitle: b.seoTitle ?? "",
          seoDescription: b.seoDescription ?? "",
          seoKeywords: b.seoKeywords ?? "",
          h1: b.h1 ?? "",
          primaryKeyword: b.primaryKeyword ?? "",
          manufacturingNarrative: b.manufacturingNarrative ?? "",
          designFabrication: b.designFabrication ?? "",
          supplyAcrossIndia: b.supplyAcrossIndia ?? "",
          videoUrl: b.videoUrl || null,
          updatedAt: new Date(),
        })
        .returning()
    )[0];
    return Response.json(row, { status: 201 });
  } catch (e) {
    console.error("[admin/products] create error", e);
    return Response.json({ error: "Unable to create product. Check that the slug is unique." }, { status: 500 });
  }
}