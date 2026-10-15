import { db } from "@/db";
import { sectionMedia } from "@/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { requireAuth } from "@/lib/admin-api";
import { buildSnapshotFromDatabase, enqueuePublish, withPublishSuppressed } from "@/lib/content-store";
import { normalizePoster, sectionMediaInput } from "../route";

export const dynamic = "force-dynamic";

/** One gallery save = the full ordered media list for a section key. */
const bulkInput = z.object({
  sectionKey: z.string().trim().min(2).max(60),
  items: z
    .array(sectionMediaInput.omit({ sectionKey: true, sortOrder: true, active: true }))
    .max(24),
});

/**
 * Replace every row of one section gallery in a single write.
 *
 * Mirrors the product gallery (`replaceProductImages`): the array order becomes
 * `sort_order`, and the delete + insert pair runs with per-statement publishing
 * suppressed so the whole gallery ships as one atomic new version.
 */
export async function PUT(req: Request) {
  const unauth = await requireAuth();
  if (unauth) return unauth;
  try {
    const parsed = bulkInput.safeParse(await req.json());
    if (!parsed.success)
      return Response.json(
        { error: parsed.error.issues[0]?.message || "Invalid gallery" },
        { status: 400 }
      );
    const { sectionKey, items } = parsed.data;

    await withPublishSuppressed(async () => {
      await db.delete(sectionMedia).where(eq(sectionMedia.sectionKey, sectionKey));
      if (!items.length) return;
      await db.insert(sectionMedia).values(
        items.map((item, index) => ({
          sectionKey,
          title: item.title ?? "",
          imageUrl: item.imageUrl,
          mediaType: item.mediaType,
          altText: item.altText ?? "",
          caption: item.caption ?? "",
          posterUrl: normalizePoster(item.posterUrl),
          sortOrder: index,
          active: true,
          updatedAt: new Date(),
        }))
      );
    });

    const publish = await enqueuePublish(buildSnapshotFromDatabase, { reason: "cms-write" });
    if (!publish.ok) {
      return Response.json(
        { error: `Gallery saved but publishing failed: ${publish.error ?? "unknown error"}` },
        { status: 500 }
      );
    }
    return Response.json({ ok: true, count: items.length });
  } catch (e) {
    console.error("[admin/section-media] bulk save error", e);
    return Response.json({ error: "Unable to save the section gallery." }, { status: 500 });
  }
}
