import { requireAuth } from "@/lib/admin-api";
import { deleteAsset, uploadAsset } from "@/lib/storage";
import { db } from "@/db";
import { mediaAssets } from "@/db/schema";
import { asc, eq } from "drizzle-orm";
import { mediaAssetInput } from "@/lib/admin-validation";

export const dynamic = "force-dynamic";

// Categories map to a storage folder on disk / Cloudinary. They must be a
// safe path segment (no slashes or dots) — validated below rather than by a
// fixed allowlist, so new admin surfaces (e.g. "sections") never break uploads.
const CATEGORY_PATTERN = /^[a-z0-9][a-z0-9-]{0,39}$/;

export async function GET(req: Request) {
  const unauth = await requireAuth();
  if (unauth) return unauth;
  const { searchParams } = new URL(req.url);
  const folder = searchParams.get("folder");
  try {
    const rows = await db
      .select()
      .from(mediaAssets)
      .where(folder ? eq(mediaAssets.folder, folder) : undefined)
      .orderBy(asc(mediaAssets.sortOrder), asc(mediaAssets.id));
    return Response.json({ enabled: true, provider: "cloudinary", folder, items: rows });
  } catch (e) {
    console.error("[admin/media] list error", e);
    return Response.json({ enabled: true, provider: "cloudinary", items: [] });
  }
}

export async function POST(req: Request) {
  const unauth = await requireAuth();
  if (unauth) return unauth;
  const contentType = req.headers.get("content-type") || "";

  // JSON: register an existing asset URL in the library (no binary transfer).
  if (contentType.includes("application/json")) {
    try {
      const parsed = mediaAssetInput.safeParse(await req.json());
      if (!parsed.success)
        return Response.json(
          { error: parsed.error.issues[0]?.message || "Invalid media asset" },
          { status: 400 }
        );
      const [row] = await db
        .insert(mediaAssets)
        .values({
          ...parsed.data,
          publicId:
            parsed.data.publicId ||
            `local/${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        })
        .returning();
      return Response.json({ url: row.secureUrl, asset: row }, { status: 201 });
    } catch (e) {
      console.error("[admin/media] register error", e);
      return Response.json({ error: "Unable to register the media asset." }, { status: 500 });
    }
  }

  try {
    const data = await req.formData();
    const file = data.get("file");
    const rawCategory = String(data.get("category") || "uploads").trim().toLowerCase();
    const altText = String(data.get("altText") || "").trim();
    const caption = String(data.get("caption") || "").trim();
    const folder = String(data.get("cloudinaryFolder") || "").trim() || undefined;

    if (!(file instanceof File) || file.size === 0) {
      return Response.json(
        { error: "No file received. Please choose an image to upload and try again." },
        { status: 400 }
      );
    }

    if (!CATEGORY_PATTERN.test(rawCategory)) {
      return Response.json(
        { error: `Invalid upload category "${rawCategory}". Use letters, numbers and dashes only.` },
        { status: 400 }
      );
    }
    const category = rawCategory;

    const result = await uploadAsset(file, category);

    // Persist Cloudinary metadata (only JSON metadata — never the binary).
    if ("publicId" in result && result.publicId) {
      const [row] = await db
        .insert(mediaAssets)
        .values({
          publicId: result.publicId,
          secureUrl: result.url,
          resourceType: result.resourceType || "image",
          format: result.format || "",
          width: result.width || null,
          height: result.height || null,
          bytes: result.bytes || null,
          folder: folder || result.folder || "msnss/uploads",
          altText,
          caption,
          fileName: result.fileName || file.name || "",
        })
        .returning();
      return Response.json({ ...result, asset: row }, { status: 201 });
    }

    return Response.json(result, { status: 201 });
  } catch (e) {
    console.error("[admin/media] upload error", e);
    return Response.json({ error: (e as Error).message || "Upload failed." }, { status: 400 });
  }
}

export async function DELETE(req: Request) {
  const unauth = await requireAuth();
  if (unauth) return unauth;
  try {
    const { bucket, path: assetPath } = await req.json();
    if (!assetPath) return Response.json({ error: "A path or public id is required." }, { status: 400 });

    // Remove the Cloudinary asset itself.
    await deleteAsset(String(bucket || "cloudinary"), assetPath);

    // Remove any metadata row pointing at this asset (matched by public id or url).
    const rows = await db.select({ id: mediaAssets.id, publicId: mediaAssets.publicId, secureUrl: mediaAssets.secureUrl }).from(mediaAssets);
    const target = rows.find(
      (r) => r.publicId === assetPath || r.secureUrl === assetPath || r.publicId.includes(assetPath) || r.secureUrl.includes(assetPath)
    );
    if (target) await db.delete(mediaAssets).where(eq(mediaAssets.id, target.id));

    return Response.json({ ok: true });
  } catch (e) {
    console.error("[admin/media] delete error", e);
    return Response.json({ error: (e as Error).message }, { status: 400 });
  }
}