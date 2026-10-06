import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CTASection } from "@/components/ui";
import { FireRatedSection } from "@/components/FireRatedSection";
import { ProductGallery } from "@/components/product/ProductGallery";
import { ProductInfo } from "@/components/product/ProductInfo";
import { ProductKeyFeatures } from "@/components/product/ProductKeyFeatures";
import { ProductShowcase, type ShowcaseImageItem } from "@/components/product/ProductShowcase";
import { ProductTechnicalDetails } from "@/components/product/ProductTechnicalDetails";
import { ProductFAQ } from "@/components/product/ProductFAQ";
import { ProductRelated } from "@/components/product/ProductRelated";
import { getProductBySlug, getProducts, getProductsByIds, getProjects, getLogoRowClients } from "@/lib/queries";
import { ClientLogoRow } from "@/components/ClientLogoRow";

export const revalidate = 300;

/** Pre-render every published product so the page ships as static HTML. */
export async function generateStaticParams() {
  const items = await getProducts();
  return items.map((p) => ({ slug: p.slug }));
}

export const dynamicParams = true;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Product Not Found" };

  const title = product.seoTitle || `${product.name} | HVAC Ducting Manufacturer | MSNSS`;
  const description = product.seoDescription || product.shortDescription;
  const keywords = product.seoKeywords || undefined;
  const primaryImg = product.imageUrl || "/images/factory.jpg";

  return {
    title,
    description,
    keywords,
    alternates: { canonical: `/products/${product.slug}` },
    openGraph: {
      title,
      description,
      type: "website",
      images: [
        {
          url: primaryImg,
          alt: `${product.name} manufactured by MSNSS`,
          width: 1200,
          height: 1200,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [primaryImg],
    },
  };
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  // Fetch all products to resolve related items
  const [allProducts, projectsList, clientList] = await Promise.all([
    getProducts(),
    getProjects().catch(() => []),
    getLogoRowClients().catch(() => []),
  ]);

  const relatedIds = (product.relatedProductIds ?? []).filter((id) => id !== product.id);
  let related = await getProductsByIds(relatedIds);
  if (related.length < 4) {
    const sameCategory = allProducts.filter(
      (item) => item.id !== product.id && (item.category === product.category || item.featured)
    );
    const missing = sameCategory
      .filter((item) => !related.some((r) => r.id === item.id))
      .slice(0, 4 - related.length);
    related = [...related, ...missing];
  }
  related = related.slice(0, 8);

  const heroImage = product.imageUrl || "/images/factory.jpg";

  // Hero — a single main image driven by the CMS "Main Image" field.

  // "Fabrication & Project Installations" — admin-managed image/video entries.
  // Falls back to a set derived from the hero media when none are configured.
  const showcaseLabels = [
    "Duct Fabrication",
    "Flange & Joint Detail",
    "Multiple Configurations",
    "High-Pressure Airflow",
    "Cleanroom Duct Finish",
    "On-Site Installation",
  ];

  const configuredShowcase = Array.isArray(product.showcaseItems)
    ? product.showcaseItems.filter((i) => i && i.url)
    : [];

  const showcaseImages: ShowcaseImageItem[] = configuredShowcase.length
    ? configuredShowcase.slice(0, 12).map((item) => ({
        url: String(item.url),
        label: String(item.label || ""),
        alt: `${product.name} — ${item.label || "project installation"}`,
        type: item.type === "video" ? ("video" as const) : ("image" as const),
      }))
    : showcaseLabels.map((label) => ({
        url: heroImage,
        label,
        alt: `${product.name} — ${label}`,
        type: "image" as const,
      }));

  const applicationAnswer =
    product.applications && product.applications.length
      ? `${product.name} can be considered for ${product.applications.join(
          ", "
        )}, subject to approved project requirements.`
      : `Applications for ${product.name} are confirmed against approved drawings and project specifications.`;

  // Structured Data (JSON-LD)
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Product",
      name: product.name,
      image: [heroImage],
      description: product.shortDescription,
      category: product.category,
      material: product.material || undefined,
      brand: { "@type": "Brand", name: "MSNSS" },
      manufacturer: { "@type": "Organization", name: "MSNSS – M S HVAC Engineers" },
      offers: {
        "@type": "Offer",
        priceCurrency: "INR",
        availability: "https://schema.org/InStock",
        url: `https://msnss.com/products/${product.slug}`,
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: "https://msnss.com" },
        { "@type": "ListItem", position: 2, name: "Products", item: "https://msnss.com/products" },
        {
          "@type": "ListItem",
          position: 3,
          name: product.name,
          item: `https://msnss.com/products/${product.slug}`,
        },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          name: `What is ${product.name}?`,
          acceptedAnswer: {
            "@type": "Answer",
            text: product.fullDescription,
          },
        },
        {
          "@type": "Question",
          name: `Where is ${product.name} used?`,
          acceptedAnswer: {
            "@type": "Answer",
            text: applicationAnswer,
          },
        },
      ],
    },
  ];

  return (
    <>
      {/* Search Engine Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* ── 1. PRODUCT — dominant split hero ───────────────────────────── */}
      <section className="relative bg-white py-6 sm:py-8 lg:min-h-[100dvh] lg:py-[clamp(1rem,2dvh,2rem)] lg:flex lg:flex-col lg:justify-center">
        <div className="pointer-events-none absolute inset-0 eng-grid opacity-40" aria-hidden="true" />
        <div
          className="pointer-events-none absolute -left-32 top-0 h-[clamp(320px,40dvh,420px)] w-[clamp(320px,40dvh,420px)] rounded-full bg-brand-light/60 blur-3xl"
          aria-hidden="true"
        />
        <div className="relative mx-auto w-full max-w-[1400px] px-4 sm:px-6 lg:px-8">
          <div className="grid items-stretch gap-6 lg:grid-cols-12 lg:gap-10 xl:gap-12">
            {/* LEFT — hero image */}
            <div className="min-w-0 lg:col-span-7 lg:flex lg:flex-col lg:justify-center">
              <ProductGallery image={heroImage} title={product.name} />
            </div>

            {/* RIGHT — product identity, detail and CTAs */}
            <div className="min-w-0 lg:col-span-5 lg:flex lg:max-h-[calc(100dvh-2*clamp(1rem,2dvh,2rem))] lg:flex-col lg:justify-center">
              <ProductInfo product={product} />
            </div>
          </div>
        </div>
      </section>

      {/* ── 2. TECHNICAL INFORMATION + WHERE IT IS USED ─────────────────── */}
      <ProductTechnicalDetails product={product} />

      {/* ── 3. KEY FEATURES ────────────────────────────────────────────── */}
      <ProductKeyFeatures product={product} />

      {/* ── 4. APPLICATION & RANGE SHOWCASE ────────────────────────────── */}
      <ProductShowcase images={showcaseImages} productTitle={product.name} />

      {/* ── 5. RELATED PRODUCTS ────────────────────────────────────────── */}
      <ProductRelated products={related} />

      {/* ── 5b. FIRE-RATED SOLUTIONS — CMS-managed photo (`home-fire-rated`).
          Skipped on the fire-rated product itself to avoid a self-link. ── */}
      {slug !== "fire-rated-duct" && <FireRatedSection />}

      {/* ── 6. TRUSTED CLIENTS ─────────────────────────────────────────── */}
      <ClientLogoRow clients={clientList} />

      {/* ── 7. FAQ ─────────────────────────────────────────────────────── */}
      <ProductFAQ product={product} />

      {/* ── 8. FINAL CTA ───────────────────────────────────────────────── */}
      <CTASection />
    </>
  );
}