import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader, CTASection } from "@/components/ui";
import { PremiumProductCard } from "@/components/ProductPremiumCard";
import { MotionReveal } from "@/components/MotionReveal";
import { PlanToInstallation } from "@/components/PlanToInstallation";
import { getProducts } from "@/lib/queries";
import { PRODUCT_CATEGORIES } from "@/lib/site";

export const metadata: Metadata = {
  title: "HVAC Ducting Products",
  description:
    "Explore CMS-managed MSNSS MS and SS HVAC ducting products, accessories, coating systems and manufacturing equipment.",
  alternates: { canonical: "/products" },
  openGraph: {
    title: "HVAC Ducting Products | MSNSS",
    description:
      "MS and SS ducting products for commercial, industrial and infrastructure project requirements.",
  },
};
export const dynamic = "force-dynamic";

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category } = await searchParams;
  const active = category && PRODUCT_CATEGORIES.includes(category) ? category : undefined;
  const products = await getProducts(active);

  return (
    <>
      <PageHeader
        title={active || "Our Ducting Products"}
        subtitle="Reliable products manufactured and fabricated for project-specific HVAC and ventilation requirements."
        crumb="Products"
      />

      <section className="relative overflow-hidden bg-white py-14 sm:py-20">
        {/* Background grid texture */}
        <div className="pointer-events-none absolute inset-0 eng-grid opacity-[0.3]" />
        {/* Ambient glows */}
        <div className="pointer-events-none absolute -right-40 -top-40 h-[500px] w-[500px] rounded-full bg-brand-light/50 blur-3xl" />
        <div className="pointer-events-none absolute -left-40 bottom-0 h-96 w-96 rounded-full bg-cyan-50/60 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <MotionReveal className="mx-auto mb-10 max-w-3xl text-center sm:mb-12">
            <div className="mb-4 inline-flex items-center justify-center gap-2.5 text-[11px] font-extrabold uppercase tracking-[0.22em] text-brand">
              <span className="h-0.5 w-5 rounded-full bg-brand" />
              <span>Manufactured for Project Requirements</span>
              <span className="h-0.5 w-5 rounded-full bg-brand" />
            </div>
            <h2 className="text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
              MS &amp; SS Ducting, Components and Accessories
            </h2>
            <p className="mt-4 leading-7 text-slate-600">
              Browse active products managed by the MSNSS team. Product materials,
              dimensions and finishes are confirmed against approved project
              requirements.
            </p>
          </MotionReveal>

          {/* Category filter */}
          <nav
            aria-label="Product categories"
            className="mb-10 flex flex-wrap justify-center gap-3 sm:mb-12"
          >
            <Link
              href="/products"
              className={`rounded-full px-5 py-2 text-sm font-semibold transition ${
                !active
                  ? "bg-brand text-white shadow-md"
                  : "border border-slate-300 bg-white text-slate-600 hover:border-brand hover:text-brand"
              }`}
            >
              All
            </Link>
            {PRODUCT_CATEGORIES.map((item) => (
              <Link
                key={item}
                href={`/products?category=${encodeURIComponent(item)}`}
                className={`rounded-full px-5 py-2 text-sm font-semibold transition ${
                  active === item
                    ? "bg-brand text-white shadow-md"
                    : "border border-slate-300 bg-white text-slate-600 hover:border-brand hover:text-brand"
                }`}
              >
                {item}
              </Link>
            ))}
          </nav>

          {/* Product grid matching homepage premium card design */}
          {products.length ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 lg:gap-6">
              {products.map((product, index) => (
                <PremiumProductCard key={product.id} product={product} index={index} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 py-20 text-center">
              <div className="text-5xl">📦</div>
              <h2 className="mt-4 text-lg font-bold text-ink">No products published</h2>
              <p className="mt-1 text-sm text-slate-500">
                Products in this category will appear after admin publication.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* From Plan to Installation */}
      <PlanToInstallation />

      <CTASection />
    </>
  );
}