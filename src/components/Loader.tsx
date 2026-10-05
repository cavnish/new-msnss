"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useMotionValue, useReducedMotion } from "framer-motion";
import { Logo } from "@/components/Logo";

interface LoaderProps {
  duration?: number;
  eager?: boolean;
  onComplete?: () => void;
}

/** Renders a MotionValue as live percentage text (framer-motion v13-safe). */
function MotionPercent({ value }: { value: ReturnType<typeof useMotionValue<number>> }) {
  const [text, setText] = useState("0");
  useEffect(() => value.on("change", (v) => setText(`${Math.min(100, Math.floor(v * 100))}`)), [value]);
  return (
    <span className="tabular-nums tracking-[0.1em]">
      {text}
      <span className="text-cyan-400/60">%</span>
    </span>
  );
}

/**
 * Premium Full-Screen Loading Overlay for MSNSS
 *
 * - Blurred galvanized-duct photography backdrop with a slow scale drift
 * - Centered official MSNSS logo with an animated drew-in reveal, breathing
 *   brand glow and a gentle floating stand-in
 * - Deterministic linear progress bar with a live percentage readout
 * - Clean fade-out reveal into the website
 * - Responsive on desktop / tablet / mobile + fully reduced-motion aware
 */
export function Loader({ duration = 1500, eager = false, onComplete }: LoaderProps) {
  const reduce = useReducedMotion();
  const [done, setDone] = useState(false);
  const [visible, setVisible] = useState(true);

  // Timed completion + clean exit (kept brief so the splash feels snappy).
  useEffect(() => {
    const t = setTimeout(() => setDone(true), reduce ? 320 : duration);
    return () => clearTimeout(t);
  }, [duration, reduce]);

  useEffect(() => {
    if (!done) return;
    const t = setTimeout(() => {
      setVisible(false);
      onComplete?.();
    }, reduce ? 50 : 420);
    return () => clearTimeout(t);
  }, [done, reduce, onComplete]);

  // Prevent background scrolling while the overlay is active.
  useEffect(() => {
    if (!visible) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [visible]);

  // Deterministic progress 0 → 100%.
  const progress = useMotionValue(0);
  useEffect(() => {
    const start = performance.now();
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min((t - start) / (reduce ? 320 : duration), 1);
      progress.set(p);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [duration, reduce, progress]);

  if (!eager && !visible) return null;

  return (
    <AnimatePresence mode="wait">
      {visible ? (
        <motion.div
          key="msnss-fullscreen-loader"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: reduce ? 1 : 1.02, y: reduce ? 0 : -8 }}
          transition={{ duration: reduce ? 0.12 : 0.5, ease: [0.22, 1, 0.36, 1] }}
          aria-label="Loading MSNSS – M S HVAC Engineers"
          role="status"
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden bg-[#070e18] select-none"
        >
          {/* 1. Blurred duct photography backdrop (fast, cached from the site) */}
          <motion.div
            className="pointer-events-none absolute inset-0 opacity-25"
            initial={reduce ? undefined : { scale: 1.08 }}
            animate={reduce ? { opacity: 1 } : { scale: 1.16, opacity: 1 }}
            transition={{ duration: reduce ? 0.1 : 14, ease: "easeOut" }}
          >
            <img
              src="/images/factory.jpg"
              alt=""
              aria-hidden="true"
              className="h-full w-full object-cover blur-[7px] saturate-[0.85]"
            />
          </motion.div>

          {/* 2. Cinematic vignette + brand tint */}
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse 80% 65% at 50% 45%, rgba(14,124,196,0.16) 0%, transparent 60%), radial-gradient(ellipse 130% 110% at 50% 50%, transparent 30%, #070e18 100%)",
            }}
          />

          {/* 3. Centered content: animated official MSNSS logo + linear progress */}
          <motion.div
            initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.92, y: 14, filter: "blur(8px)" }}
            animate={{ opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: reduce ? 0.15 : 0.85, ease: [0.22, 1, 0.36, 1] }}
            className="relative z-10 flex w-full flex-col items-center px-4 text-center"
          >
            {/* Breathing brand glow + two staggered brand-energy pulse rings */}
            <div className="relative flex items-center justify-center">
              <motion.div
                aria-hidden="true"
                className="absolute -inset-10 rounded-full bg-brand/25 blur-3xl sm:-inset-14"
                animate={reduce ? { opacity: 0.5 } : { opacity: [0.4, 0.75, 0.4] }}
                transition={{ duration: 3.4, repeat: Infinity, ease: "easeInOut" }}
              />
              {!reduce && (
                <>
                  <div aria-hidden="true" className="absolute inset-0 -m-8 animate-pulse-ring rounded-full border border-cyan-400/25 sm:-m-10" />
                  <div aria-hidden="true" className="absolute inset-0 -m-14 animate-pulse-ring rounded-full border border-brand/25 [animation-delay:1.2s] sm:-m-16" />
                </>
              )}

              {/* The official MSNSS logo (identical mark to the site header) */}
              <motion.div
                animate={reduce ? { y: 0 } : { y: [0, -5, 0] }}
                transition={{ duration: 5.5, repeat: reduce ? 0 : Infinity, ease: "easeInOut" }}
                className="origin-center scale-[1.5] sm:scale-[1.85] lg:scale-[2.1]"
              >
                <Logo light className="drop-shadow-[0_0_28px_rgba(14,124,196,0.45)]" />
              </motion.div>
            </div>

            {/* Deterministic linear progress bar + percentage */}
            <div className="mt-9 flex flex-col items-center gap-2.5 sm:mt-12">
              <div className="relative h-[3px] w-56 max-w-[80vw] overflow-hidden rounded-full border border-white/10 bg-slate-800/90 sm:w-80">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-brand via-cyan-400 to-sky-300 shadow-[0_0_12px_rgba(56,189,248,0.7)]"
                  style={{ width: "100%" }}
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{
                    duration: reduce ? 0.25 : duration / 1000,
                    ease: "linear",
                  }}
                />
              </div>
              <div className="flex items-baseline gap-2 text-[10px] font-medium tracking-[0.22em] text-cyan-400/80">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-cyan-400" />
                <span className="uppercase">Loading</span>
                <MotionPercent value={progress} />
              </div>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}