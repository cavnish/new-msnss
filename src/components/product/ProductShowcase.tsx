"use client";

import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import SmartImage from "@/components/SmartImage";
import { ChevronLeftIcon, ChevronRightIcon, CloseIcon } from "./ProductIcons";

export interface ShowcaseImageItem {
  url: string;
  label: string;
  alt?: string;
  /** "image" (default) or "video" — videos play inside the full-view dialog. */
  type?: "image" | "video";
}

interface ProductShowcaseProps {
  images: ShowcaseImageItem[];
  productTitle: string;
}

export function ProductShowcase({ images, productTitle }: ProductShowcaseProps) {
  const reduce = useReducedMotion();
  const [activeIdx, setActiveIdx] = useState<number | null>(null);

  if (!images || images.length === 0) return null;

  // Display up to 6 cards matching reference layout
  const cards = images.slice(0, 6);

  const handleOpen = (index: number) => {
    setActiveIdx(index);
  };

  const handleClose = () => {
    setActiveIdx(null);
  };

  const handlePrev = () => {
    if (activeIdx === null) return;
    setActiveIdx((activeIdx - 1 + cards.length) % cards.length);
  };

  const handleNext = () => {
    if (activeIdx === null) return;
    setActiveIdx((activeIdx + 1) % cards.length);
  };

  return (
    <section className="cv-auto bg-white py-16 sm:py-20 lg:py-24">
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8">
        {/* Stacked header — one focused message, no split header. */}
        <div className="max-w-[62ch]">
          <h2 className="text-[26px] font-extrabold leading-[1.15] tracking-[-0.022em] text-ink sm:text-3xl lg:text-[34px]">
            Application &amp; Range Showcase
          </h2>
          <p className="mt-3 text-[15px] leading-7 text-slate-600 sm:text-base">
            Where {productTitle} goes on a project, and the range it covers. Select any view to inspect
            the fabrication detail.
          </p>
        </div>

        {/* 6-Card Horizontal Showcase Grid matching reference */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          {cards.map((item, idx) => (
            <motion.button
              key={`${item.url}-${idx}`}
              type="button"
              onClick={() => handleOpen(idx)}
              initial={reduce ? { opacity: 0 } : { opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{
                duration: 0.4,
                delay: reduce ? 0 : idx * 0.05,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="group relative aspect-[4/3] w-full overflow-hidden rounded-xl border border-slate-200/80 bg-slate-900 shadow-sm transition-all hover:shadow-md hover:border-brand/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand text-left"
              aria-label={`View ${item.label} for ${productTitle}`}
            >
              {/* Product / Application Image or Video */}
              {item.type === "video" ? (
                <video
                  src={item.url}
                  muted
                  playsInline
                  preload="metadata"
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-108"
                />
              ) : (
                <SmartImage
                  src={item.url}
                  alt={item.alt || `${productTitle} - ${item.label}`}
                  fill
                  sizes="(min-width: 1024px) 16vw, (min-width: 640px) 33vw, 50vw"
                  loading="lazy"
                  className="object-cover transition-transform duration-500 ease-out group-hover:scale-108"
                />
              )}

              {item.type === "video" && (
                <span className="absolute inset-0 z-10 flex items-center justify-center">
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white/90 text-slate-900 shadow-lg transition group-hover:scale-110">
                    <svg viewBox="0 0 24 24" className="ml-0.5 h-5 w-5" fill="currentColor" aria-hidden="true">
                      <path d="M8 5.5v13l11-6.5z" />
                    </svg>
                  </span>
                </span>
              )}

              {/* Dark subtle gradient overlay matching reference */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent transition-opacity group-hover:opacity-90" />

              {/* Short label/title pinned to bottom-left matching reference */}
              <div className="absolute bottom-2.5 left-2.5 right-2.5 z-10">
                <span className="block text-[11px] sm:text-xs font-semibold text-white/95 leading-tight drop-shadow-sm tracking-wide line-clamp-1">
                  {item.label}
                </span>
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Lightbox for Showcase Images */}
      <AnimatePresence>
        {activeIdx !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduce ? 0.1 : 0.2 }}
            role="dialog"
            aria-modal="true"
            aria-label={`${cards[activeIdx].label} full view`}
            className="fixed inset-0 z-[100] flex flex-col bg-slate-950/95 backdrop-blur-md"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 sm:px-8">
              <div className="flex items-center gap-3 text-white">
                <span className="font-semibold text-sm sm:text-base">
                  {cards[activeIdx].label}
                </span>
                <span className="text-xs text-slate-400">
                  {productTitle} ({activeIdx + 1} of {cards.length})
                </span>
              </div>
              <button
                type="button"
                onClick={handleClose}
                aria-label="Close image preview"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
              >
                <CloseIcon className="h-5 w-5" />
              </button>
            </div>

            {/* Main Preview */}
            <div className="relative flex flex-1 items-center justify-center p-4 sm:p-10">
              <div className="relative aspect-[4/3] max-h-[82vh] w-full max-w-5xl sm:aspect-[16/10]">
                {cards[activeIdx].type === "video" ? (
                  <video
                    src={cards[activeIdx].url}
                    controls
                    autoPlay
                    playsInline
                    className="absolute inset-0 h-full w-full bg-slate-950 object-contain"
                  >
                    <track kind="captions" />
                  </video>
                ) : (
                  <SmartImage
                    src={cards[activeIdx].url}
                    alt={cards[activeIdx].label}
                    fill
                    sizes="100vw"
                    priority
                    className="object-contain"
                  />
                )}
              </div>

              {cards.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={handlePrev}
                    aria-label="Previous image"
                    className="absolute left-4 top-1/2 -translate-y-1/2 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur transition hover:bg-brand"
                  >
                    <ChevronLeftIcon className="h-6 w-6" />
                  </button>
                  <button
                    type="button"
                    onClick={handleNext}
                    aria-label="Next image"
                    className="absolute right-4 top-1/2 -translate-y-1/2 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur transition hover:bg-brand"
                  >
                    <ChevronRightIcon className="h-6 w-6" />
                  </button>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
