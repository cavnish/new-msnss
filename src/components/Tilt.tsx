"use client";

import {
  useCallback,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Tilt — pointer-tracked 3D perspective card
 * ─────────────────────────────────────────────────────────────────────────────
 * Gives a flat surface real depth: the card rotates toward the pointer, inner
 * layers parallax at different distances, and a soft specular highlight tracks
 * the cursor across the face.
 *
 * Everything animates through CSS custom properties on transform/opacity only,
 * so the work stays on the GPU. Rotation is written straight to the element
 * style inside a rAF — no React re-render per pointer move.
 *
 * Falls back to a completely flat card for touch devices and for anyone who
 * prefers reduced motion.
 */

export interface TiltProps {
  children: ReactNode;
  className?: string;
  /** Maximum rotation in degrees. Default 7. */
  max?: number;
  /** Perspective distance in px. Default 1000. */
  perspective?: number;
  /** Disable the effect entirely (e.g. on very small cards). */
  disabled?: boolean;
  style?: CSSProperties;
}

export function Tilt({
  children,
  className = "",
  max = 7,
  perspective = 1000,
  disabled = false,
  style,
}: TiltProps) {
  const ref = useRef<HTMLDivElement>(null);
  const frame = useRef<number | null>(null);
  const [active, setActive] = useState(false);

  const flat = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    el.style.setProperty("--tilt-x", "0deg");
    el.style.setProperty("--tilt-y", "0deg");
    el.style.setProperty("--tilt-mx", "50%");
    el.style.setProperty("--tilt-my", "50%");
    el.style.setProperty("--tilt-o", "0");
  }, []);

  const onPointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (disabled || e.pointerType === "touch") return;
      const el = ref.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width;
      const py = (e.clientY - rect.top) / rect.height;
      const clampedX = Math.min(Math.max(px, 0), 1);
      const clampedY = Math.min(Math.max(py, 0), 1);

      if (frame.current !== null) cancelAnimationFrame(frame.current);
      frame.current = requestAnimationFrame(() => {
        el.style.setProperty("--tilt-y", `${(clampedX - 0.5) * 2 * max}deg`);
        el.style.setProperty("--tilt-x", `${(0.5 - clampedY) * 2 * max}deg`);
        el.style.setProperty("--tilt-mx", `${clampedX * 100}%`);
        el.style.setProperty("--tilt-my", `${clampedY * 100}%`);
        el.style.setProperty("--tilt-o", "1");
      });
    },
    [disabled, max]
  );

  const onPointerLeave = useCallback(() => {
    if (frame.current !== null) cancelAnimationFrame(frame.current);
    setActive(false);
    flat();
  }, [flat]);

  return (
    <div
      ref={ref}
      onPointerMove={onPointerMove}
      onPointerEnter={() => !disabled && setActive(true)}
      onPointerLeave={onPointerLeave}
      className={`tilt-root ${className}`}
      style={{ ["--tilt-p" as string]: `${perspective}px`, ...style }}
      data-active={active ? "true" : "false"}
    >
      <div className="tilt-inner">{children}</div>
    </div>
  );
}

/**
 * A layer inside a Tilt that sits at its own depth. Larger `z` pushes the
 * element further toward the viewer as the card rotates.
 */
export function TiltLayer({
  children,
  z = 0,
  className = "",
}: {
  children: ReactNode;
  z?: number;
  className?: string;
}) {
  return (
    <div
      className={`tilt-layer ${className}`}
      style={{ ["--tilt-z" as string]: `${z}px` }}
    >
      {children}
    </div>
  );
}
