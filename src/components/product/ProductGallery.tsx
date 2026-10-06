"use client";

import SmartImage from "@/components/SmartImage";

interface ProductGalleryProps {
  image: string;
  title: string;
}

/**
 * Product hero image.
 *
 * A single main image, perfectly centred in a fixed 4:3 stage so every
 * product hero shares identical proportions on all screen sizes. Fully
 * responsive: full width on mobile, half the split hero on desktop.
 */
export function ProductGallery({ image, title }: ProductGalleryProps) {
  return (
    <figure className="mx-auto flex w-full min-w-0 flex-col">
      <div className="relative aspect-[4/3] max-h-[clamp(320px,65dvh,720px)] w-full overflow-hidden rounded-2xl border border-slate-200/90 bg-slate-100 shadow-lg shadow-slate-900/5 lg:max-h-[min(68dvh,640px)]">
        <SmartImage
          src={image}
          alt={`${title} manufactured by MSNSS`}
          fill
          priority
          sizes="(min-width: 1280px) 760px, (min-width: 1024px) 58vw, 100vw"
          className="object-cover"
        />
      </div>
    </figure>
  );
}
