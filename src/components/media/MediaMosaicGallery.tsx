"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import SmartImage from "@/components/SmartImage";
import { mediaRoleLabel, parseVideoSource } from "@/lib/media";

export interface MediaGalleryItem {
  url: string;
  mediaType: "image" | "video";
  /** Optional gallery role, mirroring `product_images.type`. Drives the chip. */
  type?: string;
  alt: string;
  /** Admin-authored caption, shown on the lead tile only when present. */
  caption?: string;
  /** Optional poster/thumbnail for a video. */
  posterUrl?: string;
}

type FilterId = "all" | "image" | "video";

/** How many tiles the mosaic shows before the visitor opts into "show all". */
const INITIAL_VISIBLE = 8;

/**
 * The bento span for a tile. The first tile leads with a large 2×2 feature
 * block (when there is enough media for a mosaic), every other tile is square.
 * Rows are a fixed height so the feature block stays perfectly aligned.
 */
function tileSpan(index: number, total: number): string {
  if (index === 0 && total > 3) return "col-span-2 row-span-2";
  return "";
}

/** Tone-dependent surface colours — the mosaic is reused on light and dark sections. */
const TONES = {
  light: {
    section: "relative overflow-hidden bg-gradient-to-b from-white to-slate-50",
    grid: "text-ink",
    heading: "text-ink",
    body: "text-slate-600",
    count: "text-slate-500",
    countValue: "text-ink",
    pillIdle: "border-slate-300 bg-white text-slate-600 hover:border-brand hover:text-brand",
    pillCountIdle: "text-slate-400",
    tile: "border-slate-200/80 bg-slate-100",
    ghost: "border-slate-300 bg-white text-ink hover:border-brand hover:text-brand",
  },
  dark: {
    section: "relative overflow-hidden",
    grid: "text-white",
    heading: "text-white",
    body: "text-slate-400",
    count: "text-slate-400",
    countValue: "text-white",
    pillIdle: "border-white/15 bg-white/5 text-slate-300 hover:border-brand hover:text-white",
    pillCountIdle: "text-slate-500",
    tile: "border-white/10 bg-white/5",
    ghost: "border-white/20 bg-white/5 text-white hover:border-brand",
  },
} as const;

interface MediaMosaicGalleryProps {
  items: MediaGalleryItem[];
  /** Used for accessible labels ("{title} media viewer"). */
  title: string;
  /** Stable id for the wrapping section (must be unique per page). */
  id?: string;
  /** Filter pill group `layoutId`; defaults to a value derived from `id`. */
  filterGroupId?: string;
  eyebrow?: string;
  heading?: string;
  description?: React.ReactNode;
  tone?: keyof typeof TONES;
  /** Max tiles shown before "Show all N". */
  initialVisible?: number;
  /** Extra classes on the wrapping element. */
  className?: string;
  /** Vertical rhythm for standalone use; pass "" when embedded in a padded section. */
  paddingClassName?: string;
  /** Container classes — match the surrounding section's grid. */
  containerClassName?: string;
}

/**
 * Shared media mosaic — a cinematic bento grid of images *and* videos with a
 * role/method filter, staggered scroll reveals and a full-screen lightbox that
 * plays uploaded files and YouTube/Vimeo embeds inline.
 *
 * Used by the product detail page and by the homepage "About" / "Why Industry
 * Leaders Choose MSNSS" sections, so a single component and a single media
 * model (see `section_media` / `product_images`) drive every gallery.
 *
 * Motion is transform/opacity only and is fully disabled under
 * `prefers-reduced-motion`.
 */
export function MediaMosaicGallery({
  items,
  title,
  id = "gallery",
  filterGroupId,
  eyebrow = "Media Gallery",
  heading = "Images & video",
  description,
  tone = "light",
  initialVisible = INITIAL_VISIBLE,
  className = "",
  paddingClassName = "py-16 sm:py-20 lg:py-24",
  containerClassName = "mx-auto w-full max-w-[1400px] px-4 sm:px-6 lg:px-8",
}: MediaMosaicGalleryProps) {
  const reduce = useReducedMotion();
  const t = TONES[tone];
  const clean = useMemo(
    () => (items ?? []).filter((item) => item && item.url && item.url.trim()),
    [items]
  );

  const images = useMemo(() => clean.filter((item) => item.mediaType !== "video"), [clean]);
  const videos = useMemo(() => clean.filter((item) => item.mediaType === "video"), [clean]);

  const [filter, setFilter] = useState<FilterId>("all");
  const [expanded, setExpanded] = useState(false);
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  const visible = useMemo(() => {
    if (filter === "image") return images;
    if (filter === "video") return videos;
    return clean;
  }, [filter, clean, images, videos]);

  const capped = !expanded && filter === "all" && visible.length > initialVisible;
  const shown = capped ? visible.slice(0, initialVisible) : visible;
  const activeItem = openIdx === null ? null : visible[openIdx] ?? null;

  const close = useCallback(() => setOpenIdx(null), []);

  const step = useCallback(
    (dir: number) => {
      setOpenIdx((cur) => {
        if (cur === null || visible.length === 0) return cur;
        return (cur + dir + visible.length) % visible.length;
      });
    },
    [visible.length]
  );

  // Lock background scroll and wire ← / → / Esc while the lightbox is open.
  useEffect(() => {
    if (openIdx === null) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
      else if (event.key === "ArrowRight") step(1);
      else if (event.key === "ArrowLeft") step(-1);
    };
    window.addEventListener("keydown", onKey);
    dialogRef.current?.focus();

    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [openIdx, close, step]);

  if (clean.length === 0) return null;

  const allFilters: { id: FilterId; label: string; count: number }[] = [
    { id: "all", label: "All", count: clean.length },
    { id: "image", label: "Images", count: images.length },
    { id: "video", label: "Videos", count: videos.length },
  ];
  const filters = allFilters.filter((entry) => entry.id === "all" || entry.count > 0);

  const showFilters = filters.length > 2;
  const layoutGroup = filterGroupId || `${id}-filter`;
  const headingId = `${id}-heading`;

  return (
    <section
      id={id}
      aria-labelledby={headingId}
      className={`cv-auto ${t.section} ${paddingClassName} ${className}`.trim()}
    >
      {tone === "light" ? (
        <>
          <div className="pointer-events-none absolute inset-0 eng-grid opacity-40" aria-hidden="true" />
          <div
            className="pointer-events-none absolute -right-40 top-10 h-[clamp(280px,34vw,460px)] w-[clamp(280px,34vw,460px)] rounded-full bg-brand-light/50 blur-3xl"
            aria-hidden="true"
          />
        </>
      ) : null}

      <div className={`relative ${containerClassName}`}>
        {/* ── header ─────────────────────────────────────────────────────── */}
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-[52ch]">
            <span className="eyebrow">{eyebrow}</span>
            <h2
              id={headingId}
              className={`mt-3 text-balance text-3xl font-extrabold tracking-tight sm:text-4xl ${t.heading}`}
            >
              {heading}
            </h2>
            {description ? (
              <p className={`mt-3 text-pretty text-sm leading-relaxed sm:text-base ${t.body}`}>
                {description}
              </p>
            ) : null}
          </div>

          {showFilters ? (
            <div
              role="tablist"
              aria-label="Filter gallery media"
              className="flex flex-wrap items-center gap-2"
            >
              {filters.map((entry) => {
                const selected = filter === entry.id;
                return (
                  <button
                    key={entry.id}
                    type="button"
                    role="tab"
                    aria-selected={selected}
                    onClick={() => {
                      setFilter(entry.id);
                      setExpanded(false);
                      close();
                    }}
                    className={`relative inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 ${
                      selected ? "border-transparent text-white" : t.pillIdle
                    }`}
                  >
                    {selected ? (
                      <motion.span
                        layoutId={layoutGroup}
                        className="absolute inset-0 rounded-full bg-brand shadow-sm shadow-brand/30"
                        transition={{ type: "spring", stiffness: 420, damping: 34 }}
                        aria-hidden="true"
                      />
                    ) : null}
                    <span className="relative">{entry.label}</span>
                    <span
                      className={`relative tabular-nums ${
                        selected ? "text-white/75" : t.pillCountIdle
                      }`}
                    >
                      {entry.count}
                    </span>
                  </button>
                );
              })}
            </div>
          ) : (
            <p className={`text-sm font-semibold ${t.count}`}>
              <span className={`tabular-nums ${t.countValue}`}>{clean.length}</span>{" "}
              {clean.length === 1 ? "view" : "views"}
            </p>
          )}
        </div>

        {/* ── bento mosaic ───────────────────────────────────────────────── */}
        <motion.ul
          layout={!reduce}
          className="mt-9 grid auto-rows-[clamp(132px,16.5vw,196px)] grid-cols-2 gap-3 [grid-auto-flow:row_dense] sm:grid-cols-3 sm:gap-4 lg:grid-cols-4"
        >
          <AnimatePresence mode="popLayout">
            {shown.map((item, index) => {
              const isVideo = item.mediaType === "video";
              const source = isVideo ? parseVideoSource(item.url) : null;
              const poster = item.posterUrl || source?.derivedPoster || "";
              const chip = isVideo ? "Video" : mediaRoleLabel(item.type || "");
              const indexInVisible = visible.indexOf(item);

              return (
                <motion.li
                  key={item.url}
                  layout={!reduce}
                  initial={reduce ? { opacity: 0 } : { opacity: 0, y: 22, scale: 0.96 }}
                  whileInView={{ opacity: 1, y: 0, scale: 1 }}
                  exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.96 }}
                  viewport={{ once: true, amount: 0.15 }}
                  transition={{
                    duration: reduce ? 0.2 : 0.55,
                    ease: [0.16, 1, 0.3, 1],
                    delay: reduce ? 0 : Math.min(index, 6) * 0.05,
                  }}
                  className={tileSpan(index, shown.length)}
                >
                  <button
                    type="button"
                    onClick={() => setOpenIdx(indexInVisible)}
                    aria-label={
                      isVideo ? `Play ${item.alt || "video"}` : `View ${item.alt || "image"}`
                    }
                    className={`group relative block h-full w-full overflow-hidden rounded-2xl border text-left shadow-sm transition-shadow duration-300 hover:shadow-xl hover:shadow-slate-900/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 ${t.tile}`}
                  >
                    {isVideo ? (
                      poster ? (
                        <SmartImage
                          src={poster}
                          alt={item.alt || `${title} video`}
                          fill
                          sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
                          className="object-cover transition-transform duration-[900ms] ease-out group-hover:scale-[1.06]"
                        />
                      ) : source?.kind === "file" ? (
                        <video
                          src={`${source.fileUrl}#t=0.1`}
                          muted
                          playsInline
                          preload="metadata"
                          className="absolute inset-0 h-full w-full object-cover transition-transform duration-[900ms] ease-out group-hover:scale-[1.06]"
                          aria-hidden="true"
                        />
                      ) : (
                        <span className="absolute inset-0 flex items-center justify-center bg-ink/85 text-xs font-semibold text-white/70">
                          Video
                        </span>
                      )
                    ) : (
                      <SmartImage
                        src={item.url}
                        alt={item.alt || `${title} — view`}
                        fill
                        sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
                        loading={index < 4 ? "eager" : "lazy"}
                        className="object-cover transition-transform duration-[900ms] ease-out group-hover:scale-[1.06]"
                      />
                    )}

                    {/* scrim */}
                    <span
                      className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink/75 via-ink/10 to-transparent opacity-75 transition-opacity duration-300 group-hover:opacity-95"
                      aria-hidden="true"
                    />
                    {/* light sweep on hover */}
                    {!reduce ? (
                      <span
                        className="pointer-events-none absolute inset-0 -skew-x-12 -translate-x-[135%] bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-[900ms] ease-out group-hover:translate-x-[135%]"
                        aria-hidden="true"
                      />
                    ) : null}

                    {isVideo ? (
                      <span
                        className="pointer-events-none absolute inset-0 flex items-center justify-center"
                        aria-hidden="true"
                      >
                        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/15 text-white ring-1 ring-white/50 backdrop-blur-sm transition-transform duration-300 group-hover:scale-110 sm:h-14 sm:w-14">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M8 5v14l11-7z" />
                          </svg>
                        </span>
                      </span>
                    ) : (
                      <span
                        className="pointer-events-none absolute bottom-3 right-3 flex h-8 w-8 translate-y-1 items-center justify-center rounded-full bg-white/15 text-white opacity-0 ring-1 ring-white/40 backdrop-blur-sm transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100"
                        aria-hidden="true"
                      >
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                        >
                          <path d="M9 3H3v6M15 3h6v6M15 21h6v-6M9 21H3v-6" />
                        </svg>
                      </span>
                    )}

                    {chip ? (
                      <span className="absolute left-3 top-3 rounded-md bg-ink/80 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur-sm">
                        {chip}
                      </span>
                    ) : null}

                    {index === 0 && shown.length > 3 && item.caption ? (
                      <span className="absolute bottom-4 left-4 right-4 line-clamp-2 text-sm font-semibold text-white drop-shadow-sm">
                        {item.caption}
                      </span>
                    ) : null}
                  </button>
                </motion.li>
              );
            })}
          </AnimatePresence>
        </motion.ul>

        {/* ── show all / less ────────────────────────────────────────────── */}
        {capped ? (
          <div className="mt-8 flex justify-center">
            <button
              type="button"
              onClick={() => setExpanded(true)}
              className={`btn-micro inline-flex items-center gap-2 rounded-full border px-5 py-2.5 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 ${t.ghost}`}
            >
              Show all {visible.length}
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                aria-hidden="true"
              >
                <path d="M6 9l6 6 6-6" />
              </svg>
            </button>
          </div>
        ) : null}
      </div>

      {/* ── lightbox ─────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {activeItem ? (
          <motion.div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-label={`${title} media viewer`}
            tabIndex={-1}
            onClick={close}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.24 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-ink/95 p-3 backdrop-blur-sm outline-none sm:p-6"
          >
            <motion.div
              onClick={(event) => event.stopPropagation()}
              initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.97 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="flex max-h-full w-full max-w-6xl flex-col"
            >
              <div className="mb-3 flex items-center justify-between gap-4 text-white">
                <p className="truncate text-sm font-semibold">{activeItem.alt || title}</p>
                <div className="flex shrink-0 items-center gap-3">
                  <span className="text-xs font-semibold tabular-nums text-white/60">
                    {(openIdx ?? 0) + 1} / {visible.length}
                  </span>
                  <button
                    type="button"
                    onClick={close}
                    aria-label="Close viewer"
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      aria-hidden="true"
                    >
                      <path d="M6 6l12 12M18 6L6 18" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-black/40">
                {activeItem.mediaType === "video" ? (
                  (() => {
                    const source = parseVideoSource(activeItem.url);
                    if (source.kind === "youtube" || source.kind === "vimeo") {
                      return (
                        <div className="aspect-video w-full">
                          <iframe
                            src={source.embedUrl}
                            title={activeItem.alt || `${title} video`}
                            allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                            allowFullScreen
                            className="h-full w-full"
                          />
                        </div>
                      );
                    }
                    return (
                      <video
                        src={source.fileUrl || activeItem.url}
                        controls
                        autoPlay
                        playsInline
                        poster={activeItem.posterUrl || undefined}
                        className="max-h-[78dvh] w-full bg-black object-contain"
                      >
                        <track kind="captions" />
                      </video>
                    );
                  })()
                ) : (
                  <div className="relative h-[min(78dvh,900px)] w-full">
                    <SmartImage
                      src={activeItem.url}
                      alt={activeItem.alt || `${title} — view`}
                      fill
                      sizes="(min-width: 1024px) 80vw, 95vw"
                      className="object-contain"
                    />
                  </div>
                )}
              </div>

              {visible.length > 1 ? (
                <div className="mt-4 flex items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => step(-1)}
                    aria-label="Previous media"
                    className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                  >
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      aria-hidden="true"
                    >
                      <path d="M15 18l-6-6 6-6" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => step(1)}
                    aria-label="Next media"
                    className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                  >
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      aria-hidden="true"
                    >
                      <path d="M9 6l6 6-6 6" />
                    </svg>
                  </button>
                </div>
              ) : null}
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </section>
  );
}

export default MediaMosaicGallery;
