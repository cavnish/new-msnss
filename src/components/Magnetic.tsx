"use client";

import { useCallback, useRef, type ReactNode } from "react";

/**
 * Magnetic — the element leans toward the cursor and springs back on leave.
 * Classic premium CTA micro-interaction; pure transform, rAF-throttled, and
 * inert for touch and reduced-motion users.
 */
export function Magnetic({
  children,
  strength = 0.28,
  className = "",
}: {
  children: ReactNode;
  strength?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const frame = useRef<number | null>(null);

  const move = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const el = ref.current;
      if (!el || e.pointerType === "touch") return;
      const r = el.getBoundingClientRect();
      const x = e.clientX - (r.left + r.width / 2);
      const y = e.clientY - (r.top + r.height / 2);
      if (frame.current !== null) cancelAnimationFrame(frame.current);
      frame.current = requestAnimationFrame(() => {
        el.style.setProperty("--mag-x", `${x * strength}px`);
        el.style.setProperty("--mag-y", `${y * strength}px`);
        el.style.setProperty("--mag-s", "1.045");
      });
    },
    [strength]
  );

  const leave = useCallback(() => {
    if (frame.current !== null) cancelAnimationFrame(frame.current);
    const el = ref.current;
    if (!el) return;
    el.style.setProperty("--mag-x", "0px");
    el.style.setProperty("--mag-y", "0px");
    el.style.setProperty("--mag-s", "1");
  }, []);

  return (
    <div
      ref={ref}
      onPointerMove={move}
      onPointerLeave={leave}
      className={`magnetic ${className}`}
    >
      {children}
    </div>
  );
}
