"use client";

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import SmartImage from "@/components/SmartImage";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  CloseIcon,
  ExpandIcon,
} from "./ProductIcons";

interface ProductGalleryProps {
  images: string[];
  title: string;
  videoUrl?: string | null;
}

/**
 * Product hero gallery.
 *
 * One fixed 4:3 stage so every frame shares identical proportions, a
 * scroll-snapping thumbnail rail, prev/next controls, a live counter and
 * cross-fade transitions. Motion degrades to an instant swap under
 * prefers-reduced-motion.
 */
export function ProductGallery({ images, title, videoUrl }: ProductGalleryProps) {
  const reduce = useReducedMotion();
  const EASE = [0.22, 1, 0.36, 1] as const;

  const stills = images.filter(Boolean);
  const hasVideo = Boolean(videoUrl);
  const total = stills.length + (hasVideo ? 1 : 0);

  const [active, setActive] = useState(0);
  const [lightbox, setLightbox] = useState(false);
  const [seenLength, setSeenLength] = useState(total);

  // Adjust state during render when the slide set changes (react.dev pattern).
  if (seenLength !== total) {
    setSeenLength(total);
    setActive(0);
  }

  const isVideo = hasVideo && active >= stills.length;
  const current = isVideo ? null : stills[Math.min(active, Math.max(stills.length - 1, 0))];

  const go = useCallback(
    (delta: number) => setActive((i) => (i + delta + total) % total),
    [total]
  );

  // Arrow keys drive the stage; Escape closes the lightbox.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") go(-1);
      else if (e.key === "ArrowRight") go(1);
      else if (e.key === "Escape") setLightbox(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go]);

  // Prevent background scroll behind the lightbox.
  useEffect(() => {
    if (!lightbox) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [lightbox]);

  return (
    <div className="flex min-w-0 flex-col gap-3.5">
      {/* ── stage ─────────────────────────────────────────────────────── */}
      <div className="group relative aspect-[4/3] w-full overflow-hidden rounded-2xl border border-slate-200/90 bg-slate-100 shadow-lg shadow-slate-900/5">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={active}
            initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 1.015 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0 }}
            transition={{ duration: reduce ? 0.08 : 0.34, ease: EASE }}
            className="absolute inset-0"
          >
            {isVideo ? (
              <video
                src={videoUrl || ""}
                controls
                playsInline
                preload="metadata"
                className="absolute inset-0 h-full w-full bg-slate-950 object-contain"
              >
                <track kind="captions" />
              </video>
            ) : (
              <SmartImage
                src={current || ""}
                alt={`${title} — view ${active + 1} of ${total}`}
                fill
                priority={active === 0}
                sizes="(min-width: 1280px) 760px, (min-width: 1024px) 58vw, 100vw"
                className="object-cover"
              />
            )}
          </motion.div>
        </AnimatePresence>

        {/* scrims keep the controls legible over photography */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-slate-950/45 to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-slate-950/55 to-transparent" />

        <button
          type="button"
          onClick={() => setLightbox(true)}
          aria-label={`Expand ${title} image`}
          hidden={isVideo}
          className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-slate-950/55 text-white backdrop-blur-md transition hover:bg-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
        >
          <ExpandIcon className="h-[18px] w-[18px]" />
        </button>

        {total > 1 && (
          <>
            <button
              type="button"
              onClick={() => go(-1)}
              aria-label="Previous image"
              className="absolute left-4 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/92 text-slate-800 shadow-md transition hover:bg-brand hover:text-white active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
            >
              <ChevronLeftIcon className="h-5 w-5 stroke-[2.2]" />
            </button>
            <button
              type="button"
              onClick={() => go(1)}
              aria-label="Next image"
              className="absolute right-4 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/92 text-slate-800 shadow-md transition hover:bg-brand hover:text-white active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
            >
              <ChevronRightIcon className="h-5 w-5 stroke-[2.2]" />
            </button>
          </>
        )}

        {/* live counter */}
        <div className="absolute bottom-4 right-4 z-10 rounded-lg border border-white/15 bg-slate-950/70 px-2.5 py-1 text-xs font-bold tabular-nums text-white backdrop-blur-md">
          {active + 1} / {total}
        </div>
      </div>

      {/* ── thumbnail rail ────────────────────────────────────────────── */}
      {total > 1 && (
        <div
          role="tablist"
          aria-label={`${title} images`}
          className="-mx-1 flex snap-x snap-mandatory gap-2.5 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {stills.map((img, i) => (
            <button
              key={`${img}-${i}`}
              type="button"
              role="tab"
              aria-selected={i === active}
              aria-label={`Show view ${i + 1} of ${total}`}
              onClick={() => setActive(i)}
              className={`relative aspect-[4/3] w-20 shrink-0 snap-start overflow-hidden rounded-lg border-2 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand ${
                i === active
                  ? "border-brand shadow-sm"
                  : "border-transparent opacity-60 hover:opacity-100"
              }`}
            >
              <SmartImage
                src={img}
                alt=""
                fill
                sizes="80px"
                loading="lazy"
                className="object-cover"
              />
            </button>
          ))}

          {hasVideo && (
            <button
              type="button"
              role="tab"
              aria-selected={isVideo}
              aria-label="Show product video"
              onClick={() => setActive(stills.length)}
              className={`relative aspect-[4/3] w-20 shrink-0 snap-start overflow-hidden rounded-lg border-2 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand ${
                isVideo ? "border-brand" : "border-transparent opacity-60 hover:opacity-100"
              }`}
            >
              <SmartImage src={stills[0] || ""} alt="" fill sizes="80px" loading="lazy" className="object-cover" />
              <span className="absolute inset-0 flex items-center justify-center bg-slate-950/60">
                <svg viewBox="0 0 24 24" className="h-5 w-5 text-white" fill="currentColor" aria-hidden="true">
                  <path d="M8 5.5v13l11-6.5z" />
                </svg>
              </span>
            </button>
          )}
        </div>
      )}

      {/* ── lightbox ──────────────────────────────────────────────────── */}
      <AnimatePresence>
        {lightbox && !isVideo && current && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduce ? 0.1 : 0.2 }}
            role="dialog"
            aria-modal="true"
            aria-label={`${title} full-size image`}
            className="fixed inset-0 z-[100] flex flex-col bg-slate-950/96 backdrop-blur-md"
          >
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 sm:px-8">
              <span className="truncate text-sm font-semibold text-white sm:text-base">
                {title}
                <span className="ml-3 text-xs font-normal tabular-nums text-slate-400">
                  {active + 1} of {total}
                </span>
              </span>
              <button
                type="button"
                onClick={() => setLightbox(false)}
                aria-label="Close image"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
              >
                <CloseIcon className="h-5 w-5" />
              </button>
            </div>

            <div className="relative flex flex-1 items-center justify-center p-4 sm:p-10">
              <div className="relative aspect-[4/3] max-h-[80vh] w-full max-w-5xl">
                <SmartImage
                  src={current}
                  alt={`${title} — full view ${active + 1}`}
                  fill
                  sizes="100vw"
                  priority
                  className="object-contain"
                />
              </div>
              {total > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() => go(-1)}
                    aria-label="Previous image"
                    className="absolute left-4 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur transition hover:bg-brand active:scale-95"
                  >
                    <ChevronLeftIcon className="h-6 w-6 stroke-[2.2]" />
                  </button>
                  <button
                    type="button"
                    onClick={() => go(1)}
                    aria-label="Next image"
                    className="absolute right-4 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur transition hover:bg-brand active:scale-95"
                  >
                    <ChevronRightIcon className="h-6 w-6 stroke-[2.2]" />
                  </button>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
