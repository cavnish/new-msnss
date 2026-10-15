"use client";

import { useMemo, useState } from "react";
import SmartImage from "@/components/SmartImage";

/** Gallery image types, mirroring `product_images.type`. */
export type ProductGalleryType = "primary" | "gallery" | "CAD" | "onsite";

export interface ProductGalleryImage {
  url: string;
  type: ProductGalleryType;
  alt: string;
}

interface ProductGalleryProps {
  /** Ordered gallery from the CMS. Falls back to `image` when empty. */
  images?: ProductGalleryImage[];
  /** Legacy single hero image — the ultimate fallback. */
  image: string;
  title: string;
}

/**
 * Display groups. Images are fetched as one flat, ordered list and grouped by
 * `type` here (primary + gallery = Photos), so the query stays a single cheap
 * list read while the hero still presents distinct, labelled views.
 */
const GROUPS = [
  { id: "photos", label: "Photos", types: ["primary", "gallery"] },
  { id: "cad", label: "CAD & Drawings", types: ["CAD"] },
  { id: "onsite", label: "On-Site", types: ["onsite"] },
] as const;

const TYPE_BADGE: Record<ProductGalleryType, string> = {
  primary: "",
  gallery: "",
  CAD: "CAD Drawing",
  onsite: "On-Site",
};

/**
 * Product hero gallery.
 *
 * A single 4:3 stage — so every product hero shares identical proportions — fed
 * by the CMS gallery. When the gallery holds more than one role, a tab strip
 * switches between Photos / CAD & Drawings / On-Site; a thumbnail rail below
 * steps through the active group. The primary image leads by default, and a
 * product with no gallery degrades to its single Main Image.
 */
export function ProductGallery({ images, image, title }: ProductGalleryProps) {
  const list = useMemo<ProductGalleryImage[]>(() => {
    const clean = (images ?? []).filter((item) => item && item.url);
    if (clean.length) return clean;
    return image ? [{ url: image, type: "primary", alt: `${title} manufactured by MSNSS` }] : [];
  }, [images, image, title]);

  const groups = useMemo(
    () =>
      GROUPS.map((group) => ({
        id: group.id,
        label: group.label,
        items: list.filter((item) => (group.types as readonly string[]).includes(item.type)),
      })).filter((group) => group.items.length > 0),
    [list]
  );

  // The primary image leads; otherwise the first image does.
  const leadIndex = Math.max(
    0,
    list.findIndex((item) => item.type === "primary")
  );
  const [active, setActive] = useState(leadIndex);
  const activeItem = list[active] ?? list[0];

  if (!activeItem) return null;

  const activeGroup = groups.find((group) => group.items.includes(activeItem)) ?? groups[0];
  const stageType = activeItem.type;

  return (
    <figure className="mx-auto flex w-full min-w-0 flex-col">
      {/* ── main stage ─────────────────────────────────────────────────── */}
      <div className="relative aspect-[4/3] max-h-[clamp(320px,65dvh,720px)] w-full overflow-hidden rounded-2xl border border-slate-200/90 bg-slate-100 shadow-lg shadow-slate-900/5 lg:max-h-[min(68dvh,640px)]">
        <SmartImage
          src={activeItem.url}
          alt={activeItem.alt || `${title} manufactured by MSNSS`}
          fill
          priority
          sizes="(min-width: 1280px) 760px, (min-width: 1024px) 58vw, 100vw"
          className="object-cover"
        />
        {TYPE_BADGE[stageType] ? (
          <span className="absolute left-3 top-3 rounded-md bg-ink/85 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-white">
            {TYPE_BADGE[stageType]}
          </span>
        ) : null}
      </div>

      {/* ── role tabs (only when more than one role is present) ─────────── */}
      {groups.length > 1 && activeGroup && (
        <div
          role="tablist"
          aria-label={`${title} gallery views`}
          className="mt-3 flex flex-wrap gap-2"
        >
          {groups.map((group) => {
            const selected = group.id === activeGroup.id;
            return (
              <button
                key={group.id}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => setActive(list.indexOf(group.items[0]))}
                className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-1 ${
                  selected
                    ? "border-brand bg-brand text-white"
                    : "border-slate-300 bg-white text-slate-600 hover:border-brand hover:text-brand"
                }`}
              >
                {group.label}
                <span
                  className={`tabular-nums ${selected ? "text-white/80" : "text-slate-400"}`}
                >
                  {group.items.length}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* ── thumbnail rail for the active group ────────────────────────── */}
      {activeGroup && activeGroup.items.length > 1 && (
        <ol className="mt-2.5 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:thin]">
          {activeGroup.items.map((item, i) => {
            const index = list.indexOf(item);
            const selected = index === active;
            return (
              <li key={`${item.url}-${i}`} className="shrink-0">
                <button
                  type="button"
                  onClick={() => setActive(index)}
                  aria-label={`Show ${item.alt || `image ${i + 1}`}`}
                  aria-current={selected}
                  className={`relative block h-16 w-20 overflow-hidden rounded-lg border-2 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand ${
                    selected ? "border-brand" : "border-transparent hover:border-slate-300"
                  }`}
                >
                  <SmartImage
                    src={item.url}
                    alt=""
                    fill
                    sizes="80px"
                    loading="lazy"
                    className="object-cover"
                  />
                </button>
              </li>
            );
          })}
        </ol>
      )}
    </figure>
  );
}
