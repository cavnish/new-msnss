import type { ReactNode } from "react";
import { Navbar, type NavProduct } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { FloatingActions } from "@/components/FloatingActions";
import { ScrollProgress } from "@/components/motion/Motion";
import { RouteAwareSection } from "@/components/RouteAwareSection";
import { RouteAwareLogoRow } from "@/components/RouteAwareLogoRow";
import { ProjectBentoSection } from "@/components/ProjectBentoSection";
import { ClientLogoRowSection } from "@/components/ClientLogoRowSection";
import { getProducts } from "@/lib/queries";

export default async function SiteLayout({ children }: { children: ReactNode }) {
  // All active products, loaded server-side so the nav is always in sync
  // with the CMS (no stale/404 product links).
  const navProducts: NavProduct[] = (await getProducts()).map((p) => ({
    name: p.name,
    slug: p.slug,
    category: p.category,
    shortDescription: p.shortDescription,
    featured: p.featured,
    imageUrl: p.imageUrl,
  }));

  return (
    <>
      <ScrollProgress />
      <Navbar products={navProducts} />
      <main className="min-h-screen">{children}</main>
      {/* "Projects That Speak for Our Work" runs on every route. Home places its
          own copy mid-page, so it is skipped here — never duplicated. */}
      <RouteAwareSection hiddenOn={["/"]}>
        <ProjectBentoSection />
      </RouteAwareSection>
      {/* Exactly one client logo strip per page: pages that place their own
          (home, product detail) are skipped here to avoid duplication. */}
      <RouteAwareLogoRow>
        <ClientLogoRowSection />
      </RouteAwareLogoRow>
      <Footer />
      <FloatingActions />
    </>
  );
}
