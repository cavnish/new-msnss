"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

/**
 * Renders a shared section from the layout only on routes that do not place
 * that section themselves. Guarantees every page shows a section exactly once
 * while still letting individual pages choose a bespoke position for it.
 *
 * `hiddenOn` entries are plain path strings so they serialise cleanly from a
 * Server Component. An entry matches its own path and any descendant:
 *   "/"      → the home page only
 *   "/work"  → /work and /work/anything
 */
export function RouteAwareSection({
  children,
  hiddenOn = [],
  hiddenDescendantsOf = [],
}: {
  children: ReactNode;
  hiddenOn?: string[];
  /**
   * Hide only on descendant routes, keeping the entry path itself visible.
   * E.g. "/products" hides /products/anything but not /products.
   */
  hiddenDescendantsOf?: string[];
}) {
  const pathname = usePathname() || "";
  const hidden =
    hiddenOn.some((entry) => {
      if (entry === "/") return pathname === "/";
      return pathname === entry || pathname.startsWith(`${entry}/`);
    }) ||
    hiddenDescendantsOf.some((entry) => pathname.startsWith(`${entry}/`));
  if (hidden) return null;
  return <>{children}</>;
}
