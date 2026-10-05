"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

/**
 * Routes that render the client logo strip themselves at a bespoke position
 * (home places it straight after the hero, product pages after the specs).
 * On every other route the shared layout supplies the strip — so each page
 * shows it exactly once, never twice.
 */
const SELF_MANAGED = [/^\/$/, /^\/products\/[^/]+$/];

export function RouteAwareLogoRow({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  if (SELF_MANAGED.some((re) => re.test(pathname || ""))) return null;
  return <>{children}</>;
}
