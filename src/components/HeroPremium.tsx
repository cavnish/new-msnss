"use client";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useCallback, useEffect, useState } from "react";
import type { HeroSlide } from "@/db/schema";
import SmartImage from "@/components/SmartImage";

const AUTOPLAY = 6000;

/**
 * Every slide renders inside the exact same fixed box, so switching slides
 * never changes the section height (zero CLS). Typography and icon scale are
 * identical across slides and scale only with the breakpoint.
 */
const HERO_HEIGHT = "h-[680px] sm:h-[680px] lg:h-[740px] xl:h-[760px]";

const TRUST = [
  { big: "25+", top: "YEARS OF", bottom: "EXPERIENCE", icon: "shield" },
  { big: "2,000", top: "SQM MONTHLY", bottom: "CAPACITY", icon: "building" },
  { big: "MS & SS", top: "DUCT", bottom: "MANUFACTURING", icon: "badge" },
  { big: "SITE", top: "INSTALLATION", bottom: "SUPPORT", icon: "pin" },
];

function Icon({ name, className = "" }: { name: string; className?: string }) {
  const p = { fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  const paths: Record<string, React.ReactNode> = {
    shield: <><path d="M12 3l7 3v6c0 4-3 7-7 9-4-2-7-5-7-9V6z" {...p} /></>,
    building: <><path d="M4 21V5l8-2v18M12 21h8V9l-8-3M8 8h0M8 12h0M8 16h0M16 12h0M16 16h0" {...p} /></>,
    badge: <><circle cx="12" cy="10" r="6" {...p} /><path d="M9 15l-1 6 4-2 4 2-1-6" {...p} /></>,
    pin: <><path d="M12 21s7-6 7-11a7 7 0 1 0-14 0c0 5 7 11 7 11Z" {...p} /><circle cx="12" cy="10" r="2.5" {...p} /></>,
  };
  return <svg viewBox="0 0 24 24" className={className} aria-hidden="true">{paths[name]}</svg>;
}

function ControlArrow({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-black/20 text-white backdrop-blur transition hover:bg-white hover:text-[#071426]"
    >
      {children}
    </button>
  );
}

export function HeroPremium({ slides }: { slides: HeroSlide[] }) {
  const reduce = useReducedMotion();
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const count = slides.length;

  const next = useCallback(() => setCurrent((p) => (p + 1) % count), [count]);
  const prev = useCallback(() => setCurrent((p) => (p - 1 + count) % count), [count]);

  useEffect(() => {
    if (count < 2 || paused || reduce) return;
    const t = window.setInterval(next, AUTOPLAY);
    return () => window.clearInterval(t);
  }, [count, paused, reduce, next]);
  useEffect(() => {
    const v = () => setPaused(document.hidden);
    document.addEventListener("visibilitychange", v);
    return () => document.removeEventListener("visibilitychange", v);
  }, []);

  if (!count) return null;
  const slide = slides[current];
  const image = slide.imageUrl || "/images/hero-3.jpg";
  // Two-tone heading: split title roughly in half (white / brand blue).
  const words = slide.title.trim().split(/\s+/);
  const mid = Math.ceil(words.length / 2);
  const line1 = words.slice(0, mid).join(" ");
  const line2 = words.slice(mid).join(" ");

  return (
    <section
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      aria-label="MSNSS hero"
      className={`relative w-full overflow-hidden bg-[#06111f] text-white ${HERO_HEIGHT}`}
    >
      {/* Background slider */}
      <AnimatePresence mode="sync">
        <motion.div
          key={slide.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.1 }}
          className="absolute inset-0"
        >
          <motion.div
            className="absolute inset-0"
            initial={reduce ? { scale: 1 } : { scale: 1.09 }}
            animate={{ scale: 1 }}
            transition={{ duration: 7, ease: "easeOut" }}
          >
            <SmartImage
              src={image}
              alt=""
              fill
              priority
              sizes="100vw"
              className="object-cover object-center"
            />
          </motion.div>
        </motion.div>
      </AnimatePresence>

      {/* Overlays for readability */}
      <div className="absolute inset-0 bg-[#03101e]/55" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#03101e] via-[#03101e]/85 to-[#03101e]/10" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#03101e] via-transparent to-[#03101e]/30" />
      <div className="pointer-events-none absolute -left-40 top-1/4 h-[480px] w-[480px] rounded-full bg-brand/15 blur-[130px]" />

      {/* Content — fixed box, vertically centred, identical per slide */}
      <div className="relative z-10 mx-auto flex h-full w-full max-w-7xl flex-col justify-center px-4 py-10 pb-16 sm:px-6 sm:py-12 sm:pb-20 lg:py-16 lg:pb-24">
        <div className="max-w-3xl">
          <AnimatePresence mode="wait">
            <motion.div
              key={slide.id}
              initial={reduce ? { opacity: 0 } : { opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -14 }}
              transition={{ duration: 0.55 }}
            >
              <span className="inline-flex -skew-x-6 items-center gap-2 bg-brand px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-white shadow-lg sm:px-4 sm:text-xs">
                <span className="skew-x-6">M S HVAC Engineers</span>
              </span>

              <h1 className="mt-4 text-[23px] font-black uppercase leading-[1.05] tracking-tight sm:mt-5 sm:text-4xl sm:leading-[0.98] lg:text-5xl xl:text-6xl">
                <span className="block">{line1}</span>
                {line2 && <span className="block text-[#1686e8]">{line2}</span>}
              </h1>

              {slide.supportingLine && (
                <p className="mt-3 text-sm font-semibold uppercase tracking-[0.05em] text-white/90 sm:mt-4 sm:text-lg lg:text-xl">
                  {slide.supportingLine}
                </p>
              )}

              <div className="mt-4 h-1 w-20 rounded-full bg-brand" />

              <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-300 sm:mt-5 sm:text-base sm:leading-7 lg:text-lg lg:leading-8">
                {slide.subtitle}
              </p>

              {/* CTAs — always left-aligned, identical height on every
                  breakpoint (primary carries a transparent border so both
                  buttons measure exactly the same). */}
              <div className="mt-6 flex flex-wrap items-center gap-2 sm:mt-7 sm:gap-4 lg:mt-8">
                <Link
                  href={slide.primaryCtaLink || "/products"}
                  className="group inline-flex min-w-0 items-center justify-center gap-2 rounded-lg border border-transparent bg-brand px-3.5 py-3 text-center text-xs font-bold text-white shadow-[0_10px_30px_rgba(14,124,196,.35)] transition hover:bg-brand-dark sm:px-7 sm:text-sm"
                >
                  <span className="truncate">{slide.primaryCtaLabel || "Explore Solutions"}</span>
                  <span className="hidden transition-transform group-hover:translate-x-1 sm:inline" aria-hidden>→</span>
                </Link>
                <Link
                  href={slide.secondaryCtaLink || "/contact"}
                  className="inline-flex min-w-0 items-center justify-center gap-2 rounded-lg border border-white/40 bg-white/5 px-3.5 py-3 text-center text-xs font-bold text-white backdrop-blur transition hover:bg-white hover:text-[#071426] sm:px-7 sm:text-sm"
                >
                  <span className="truncate">{slide.secondaryCtaLabel || "Request a Quote"}</span>
                </Link>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Trust points — uniform cards and one shared scale per breakpoint */}
          <div className="mt-7 grid max-w-2xl grid-cols-2 gap-4 border-t border-white/15 pt-5 sm:mt-9 sm:grid-cols-4 sm:gap-5 sm:pt-7 lg:mt-10">
            {TRUST.map((t) => (
              <div key={t.bottom} className="flex items-center gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-brand/40 bg-brand/10 text-cyan-300 sm:h-10 sm:w-10">
                  <Icon name={t.icon} className="h-4 w-4 sm:h-5 sm:w-5" />
                </span>
                <div>
                  <div className="text-base font-extrabold leading-none text-white sm:text-lg">{t.big}</div>
                  <div className="mt-1 text-[9px] font-bold uppercase leading-tight tracking-wide text-slate-300 sm:text-[10px]">{t.top}<br />{t.bottom}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Controls — arrows only, kept clear of the fixed content box */}
      {count > 1 && (
        <div className="absolute bottom-5 right-4 z-20 flex items-center gap-2 sm:bottom-6 sm:right-6">
          <ControlArrow label="Previous slide" onClick={prev}>
            <span aria-hidden>←</span>
          </ControlArrow>
          <ControlArrow label="Next slide" onClick={next}>
            <span aria-hidden>→</span>
          </ControlArrow>
        </div>
      )}

      {/* Autoplay progress */}
      {!paused && !reduce && count > 1 && (
        <motion.div
          key={current}
          initial={{ width: "0%" }}
          animate={{ width: "100%" }}
          transition={{ duration: AUTOPLAY / 1000, ease: "linear" }}
          className="absolute bottom-0 left-0 z-30 h-[3px] bg-brand"
        />
      )}
    </section>
  );
}