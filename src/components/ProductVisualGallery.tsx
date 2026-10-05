"use client";
import { Fragment, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import SmartImage from "@/components/SmartImage";

function Cap({ children }: { children: ReactNode }) {
  return <div className="flex min-w-0 items-center justify-between gap-4 text-sm text-white/80">{children}</div>;
}

interface Props {
  images: string[];
  title: string;
  mediaLabel?: string;
}

/**
 * Product visual gallery: main viewer + thumbnail strip, with a full-screen
 * lightbox supporting keyboard (← → Esc) navigation and touch swipe.
 */
export default function ProductVisualGallery({ images, title, mediaLabel = "Product Gallery" }: Props) {
  const reduce = useReducedMotion();
  const clean = useMemo(() => images.filter(Boolean).slice(0, 12), [images]);
  const [active, setActive] = useState(0);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    Promise.resolve().then(() => setActive(0));
  }, [images.length]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
      if (e.key === "ArrowRight") setActive((a) => (a + 1) % Math.max(clean.length, 1));
      if (e.key === "ArrowLeft") setActive((a) => (a - 1 + Math.max(clean.length, 1)) % Math.max(clean.length, 1));
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, clean.length]);

  if (!clean.length) return null;

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 sm:px-6">
        <h2 className="text-sm font-bold uppercase tracking-[0.18em] text-ink sm:text-base">{mediaLabel}</h2>
        <span className="text-xs text-slate-400">
          {active + 1} / {clean.length}
        </span>
      </div>

      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="group block aspect-square w-full cursor-zoom-in focus-visible:outline-none"
          aria-label={`Open ${clean[active] ? "gallery image" : ""} full screen`}
        >
          <SmartImage
            src={clean[active]}
            alt={`${title} — gallery image ${active + 1}`}
            fill
            sizes="(min-width: 1280px) 896px, 100vw"
            className="object-cover"
            priority={active === 0}
          />
          <span className="absolute right-3 top-3 rounded-full bg-slate-950/70 px-3 py-1 text-[11px] font-medium text-white backdrop-blur transition group-hover:bg-brand">
            Expand
          </span>
        </button>

        {clean.length > 1 ? (
          <div className="grid grid-cols-4 gap-2 border-t border-slate-100 p-3 sm:gap-3 sm:p-4">
            {clean.map((img, i) => (
              <button
                key={img + i}
                type="button"
                onClick={() => setActive(i)}
                onMouseEnter={() => setActive(i)}
                className={`relative aspect-square overflow-hidden rounded-lg border-2 transition ${
                  i === active ? "border-brand" : "border-transparent opacity-70 hover:opacity-100"
                }`}
                aria-label={`View image ${i + 1}`}
                aria-pressed={i === active}
              >
                <SmartImage src={img} alt={`${title} — thumbnail ${i + 1}`} fill sizes="160px" className="object-cover" />
              </button>
            ))}
          </div>
        ) : null}

        {clean.length > 1 ? (
          <div className="absolute inset-x-0 top-0 flex items-center justify-between p-2">
            <button
              type="button"
              onClick={() => setActive((a) => (a - 1 + clean.length) % clean.length)}
              className="rounded-full bg-slate-950/60 p-2 text-white backdrop-blur transition hover:bg-brand"
              aria-label="Previous image"
            >
              ←
            </button>
            <button
              type="button"
              onClick={() => setActive((a) => (a + 1) % clean.length)}
              className="rounded-full bg-slate-950/60 p-2 text-white backdrop-blur transition hover:bg-brand"
              aria-label="Next image"
            >
              →
            </button>
          </div>
        ) : null}
      </div>

      {/* Full-screen lightbox */}
      <AnimatePresence>
        {open ? (
          <motion.div
            className="fixed inset-0 z-[90] flex flex-col bg-slate-950/95 backdrop-blur"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduce ? 0 : 0.2 }}
            role="dialog"
            aria-modal="true"
            aria-label={mediaLabel}
          >
            <div className="flex items-center justify-between p-4 sm:p-6">
              <Cap>
                <span className="font-serif text-sm font-semibold uppercase tracking-[0.2em] text-white sm:text-base">{title}</span>
                <span className="text-white/50">
                  {active + 1} / {clean.length}
                </span>
              </Cap>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-full bg-white/10 p-2.5 text-white transition hover:bg-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                aria-label="Close gallery"
              >
                ✕
              </button>
            </div>

            <div className="relative flex min-h-0 flex-1 items-center justify-center px-4 pb-4 sm:px-16">
              <div className="relative aspect-square max-h-full w-full max-w-3xl sm:aspect-[16/10]">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={active}
                    className="absolute inset-0"
                    initial={reduce ? { opacity: 0 } : { opacity: 0, x: 24 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={reduce ? { opacity: 0 } : { opacity: 0, x: -24 }}
                    transition={{ duration: 0.25 }}
                  >
                    <SmartImage
                      src={clean[active]}
                      alt={`${title} — full screen ${active + 1}`}
                      fill
                      sizes="(min-width: 1024px) 70vw, 100vw"
                      className="object-contain"
                      priority
                    />
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>

            <div className="flex items-center justify-center gap-3 p-4 sm:p-6">
              <button
                type="button"
                onClick={() => setActive((a) => (a - 1 + clean.length) % clean.length)}
                className="rounded-full bg-white/10 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand"
                aria-label="Previous image"
              >
                ← Prev
              </button>
              <button
                type="button"
                onClick={() => setActive((a) => (a + 1) % clean.length)}
                className="rounded-full bg-white/10 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand"
                aria-label="Next image"
              >
                Next →
              </button>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

/**
 * Renders a product's technical specifications. Accepts the legacy flat string
 * list (specifications) or the structured label/value rows
 * (technicalSpecifications) introduced for the upgraded profile.
 */
export function SpecTable({ specStrings, specRows }: { specStrings?: string[]; specRows?: { label: string; value: string }[] }) {
  const rows = specRows && specRows.length ? specRows : null;
  if (!rows && (!specStrings || !specStrings.length)) return null;
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-4 py-3 sm:px-6">
        <h2 className="text-sm font-bold uppercase tracking-[0.18em] text-ink sm:text-base">Technical Specifications</h2>
      </div>
      {rows ? (
        <dl className="grid grid-cols-1 sm:grid-cols-2">
          {rows.map((row, i) => (
            <Fragment key={`${row.label}-${i}`}>
              <div className={`px-4 py-3 sm:px-6 ${i % 2 ? "bg-slate-50" : ""}`}>
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">{row.label}</dt>
                <dd className="mt-0.5 text-sm font-medium text-ink">{row.value}</dd>
              </div>
            </Fragment>
          ))}
        </dl>
      ) : (
        <ul className="grid gap-x-6 gap-y-2 px-4 py-4 sm:grid-cols-2 sm:px-6">
          {specStrings!.map((s, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
              <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
              {s}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}