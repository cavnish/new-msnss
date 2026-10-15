import { db } from "@/db";
import { productImages, type ProductImageType, type ProductMediaType } from "@/db/schema";
import { asc, eq } from "drizzle-orm";

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Product gallery persistence
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * The advanced product gallery is a 1-to-many relationship (`product_images`),
 * but the admin edits it as an ordered list in a single form. These helpers let
 * the product create/update routes treat the list atomically: the submitted
 * array order *is* the public display order (`sort_order = index`). Each entry
 * is either an image or a video (`media_type`); videos may carry a poster.
 *
 * Keeping this logic in one place means the POST and PUT handlers cannot drift
 * apart, and the public read path (`getProductImages`) has a single writer to
 * reason about.
 */

export type ProductImageInput = {
  url: string;
  mediaType?: ProductMediaType;
  posterUrl?: string | null;
  type: ProductImageType;
  altText?: string | null;
  sortOrder?: number;
};

/** Replace a product's gallery with `images`. Array order becomes sort order. */
export async function replaceProductImages(
  productId: number,
  images: ProductImageInput[]
): Promise<void> {
  await db.delete(productImages).where(eq(productImages.productId, productId));
  if (!images.length) return;

  await db.insert(productImages).values(
    images.map((image, index) => ({
      productId,
      url: image.url,
      mediaType: image.mediaType ?? "image",
      type: image.type,
      altText: image.altText ?? "",
      // Only videos carry a poster; images must never store a stray one.
      posterUrl: image.mediaType === "video" ? image.posterUrl || null : null,
      sortOrder: index,
    }))
  );
}

/** Gallery rows for a product, in public display order. */
export async function listProductImages(productId: number) {
  return db
    .select()
    .from(productImages)
    .where(eq(productImages.productId, productId))
    .orderBy(asc(productImages.sortOrder), asc(productImages.id));
}
