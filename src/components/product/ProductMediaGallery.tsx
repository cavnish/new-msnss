"use client";

import { MediaMosaicGallery, type MediaGalleryItem } from "@/components/media/MediaMosaicGallery";

export type { MediaGalleryItem };

/**
 * Product media gallery — product-flavoured wrapper around the shared
 * {@link MediaMosaicGallery}. It supplies the product copy and the `#gallery`
 * anchor so the product page keeps a single, stable section id.
 */
export function ProductMediaGallery({
  items,
  title,
}: {
  items: MediaGalleryItem[];
  title: string;
}) {
  return (
    <MediaMosaicGallery
      items={items}
      title={title}
      id="gallery"
      eyebrow="Media Gallery"
      heading="Images & video"
      description={
        <>
          A closer look at {title} — fabrication detail, technical drawings and on-site
          installation, with video walkthroughs where available.
        </>
      }
      tone="light"
    />
  );
}

export default ProductMediaGallery;
