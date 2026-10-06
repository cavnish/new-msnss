import Link from "next/link";
import { HeroPremium } from "@/components/HeroPremium";
import { AboutSection } from "@/components/AboutSection";
import { HomeServiceSection } from "@/components/HomeServiceSection";
import { InquiryForm } from "@/components/InquiryForm";
import { Testimonials } from "@/components/Testimonials";
import { Reveal } from "@/components/motion/Motion";
import { SITE } from "@/lib/site";
import { HomeProductSection } from "@/components/HomeProductSection";
import { ProjectBentoSection } from "@/components/ProjectBentoSection";
import { CTASection } from "@/components/ui";
import { ClientLogoRow } from "@/components/ClientLogoRow";
import { WhyChooseSection } from "@/components/WhyChooseSection";
import { ProcessSection } from "@/components/ProcessSection";
import { ApplicationsSection } from "@/components/ApplicationsSection";
import SmartImage from "@/components/SmartImage";

import {
  getHeroSlides,
  getHomeProducts,
  getHomeServices,
  getLogoRowClients,
  getProducts,
  getSectionMedia,
  getTestimonials,
} from "@/lib/queries";

// Static-first: the page is generated once and re-validated on every publish.
export const revalidate = 300;

const PLANT_MACHINERY = [
  "Plasma Cutting Machine",
  "Flange & Hole Press",
  "Bending & Punching",
  "Gas Welding",
  "Spray Painting",
  "Finished Duct Storage",
];

export default async function HomePage() {
  // Card placement for every home grid is chosen by the admin through the
  // `showOnHome` / `homeOrder` fields in the CMS.
  const [slides, featuredProducts, services, testimonials, logoClients, allProducts, homeImages] =
    await Promise.all([
      getHeroSlides(),
      getHomeProducts(9),
      getHomeServices(6),
      getTestimonials(),
      getLogoRowClients(),
      getProducts(),
      Promise.all([
        getSectionMedia("home-facility"),
        getSectionMedia("home-brief-bg"),
        getSectionMedia("home-about-main"),
        getSectionMedia("home-about-overlay"),
      ]).catch(() => [[], [], [], []]),
    ]);

  // Single-image home slots: first visible CMS row wins, built-in default otherwise.
  const firstRow = (rows: unknown) =>
    Array.isArray(rows) && rows.length ? (rows[0] as Record<string, unknown>) : null;

  const facilityRow = firstRow(homeImages[0]);
  const facilityImage = String(facilityRow?.imageUrl || "").trim() || "/images/factory.jpg";
  const facilityAlt = String(facilityRow?.altText || "").trim() || "Inside the MSNSS manufacturing facility";

  const briefRow = firstRow(homeImages[1]);
  const briefBg = String(briefRow?.imageUrl || "").trim() || "/images/hero-1.jpg";

  const aboutMainRow = firstRow(homeImages[2]);
  const aboutMain = String(aboutMainRow?.imageUrl || "").trim() || "/images/factory.jpg";
  const aboutMainAlt = String(aboutMainRow?.altText || "").trim() || "Inside the MSNSS HVAC duct manufacturing facility";

  const aboutOverlayRow = firstRow(homeImages[3]);
  const aboutOverlay = String(aboutOverlayRow?.imageUrl || "").trim() || "/images/hero-3.jpg";
  const aboutOverlayAlt = String(aboutOverlayRow?.altText || "").trim() || "MSNSS HVAC duct installation on site";

  return (
    <>
      <HeroPremium slides={slides} />

      {/* Client Logos — premium card row */}
      <ClientLogoRow clients={logoClients} />

      {/* About */}
      <AboutSection
        mainImage={aboutMain}
        overlayImage={aboutOverlay}
        mainAlt={aboutMainAlt}
        overlayAlt={aboutOverlayAlt}
      />

      {/* Products */}
      <HomeProductSection products={featuredProducts} />

      {/* Why Industry Leaders Choose MSNSS */}
      <WhyChooseSection />

      {/* Our Process */}
      <ProcessSection />

      {/* Manufacturing facility */}
      <section id="facility" className="bg-slate-50 py-12 sm:py-14">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 sm:px-6 lg:grid-cols-2 lg:gap-12">
          <Reveal className="group overflow-hidden rounded-2xl border border-slate-200 shadow-lg">
            <SmartImage
              src={facilityImage}
              alt={facilityAlt}
              width={1024}
              height={768}
              className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
            />
          </Reveal>
          <Reveal delay={0.1}>
            <h2 className="text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">
              Inside the MSNSS Manufacturing Facility
            </h2>
            <p className="mt-4 text-slate-600">
              Manufacturing is where quality begins. Our plant is fitted with
              machines for accurate duct forming, cutting, bending, punching,
              welding and finishing.
            </p>
            <div className="mt-6 grid grid-cols-2 gap-3 text-sm text-slate-700">
              {PLANT_MACHINERY.map((m) => (
                <div
                  key={m}
                  className="flex items-center gap-2 rounded-lg border border-slate-100 bg-white px-3 py-2"
                >
                  <span className="text-brand">▪</span> {m}
                </div>
              ))}
            </div>
            <Link
              href="/plant-and-machinery"
              className="mt-7 inline-flex items-center gap-2 rounded-lg bg-brand px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-dark"
            >
              Explore Plant &amp; Machinery →
            </Link>
          </Reveal>
        </div>
      </section>

      {/* Services & Solutions */}
      <HomeServiceSection services={services} />

      {/* Ducting Solutions Across Critical Applications */}
      <ApplicationsSection />

      {/* Projects That Speak for Our Work — bento mosaic */}
      <ProjectBentoSection />

      <Testimonials items={testimonials} />

      {/* Have a project in mind — dark brief panel + compact form */}
      <section id="brief" className="bg-slate-50 py-12 sm:py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="overflow-hidden rounded-2xl shadow-premium-lg ring-1 ring-slate-900/10">
            <div className="grid gap-0 lg:grid-cols-[1.02fr_1fr]">
              {/* ── Left: dark brief panel over real plant photography ── */}
              <div className="relative isolate overflow-hidden bg-[#08213f]">
                <SmartImage
                  src={briefBg}
                  alt=""
                  aria-hidden="true"
                  fill
                  sizes="(min-width:1024px) 52vw, 100vw"
                  className="object-cover object-center opacity-40"
                />
                <div
                  aria-hidden="true"
                  className="absolute inset-0"
                  style={{
                    background:
                      "linear-gradient(115deg, rgba(6,24,50,0.97) 0%, rgba(8,33,63,0.93) 45%, rgba(10,44,82,0.82) 100%)",
                  }}
                />
                <div aria-hidden="true" className="eng-grid-dark absolute inset-0 opacity-25" />
                {/* Signature accent stripe */}
                <div
                  aria-hidden="true"
                  className="absolute bottom-0 left-0 h-1.5 w-36 bg-gradient-to-r from-brand via-sky-400 to-transparent sm:w-56"
                />

                <div className="relative p-7 sm:p-11">
                  <span className="eyebrow text-sky-300">We&apos;re here to help</span>
                  <h2 className="mt-4 text-balance text-[1.75rem] font-extrabold leading-[1.1] tracking-[-0.024em] text-white sm:text-4xl">
                    Have a project in mind?
                  </h2>
                  <p className="mt-4 max-w-md text-pretty text-sm leading-7 text-slate-300 sm:text-base">
                    Share your drawings, specifications and production requirements.
                    Our engineers will review them and come back to you with a clear
                    next step.
                  </p>

                  <ul className="mt-8 space-y-3.5">
                    <li>
                      <a
                        href={`tel:${SITE.phones[0].replace(/\s/g, "")}`}
                        className="group flex items-center gap-3.5 text-slate-200 transition hover:text-white"
                      >
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.07] text-sky-300 transition group-hover:border-brand/50 group-hover:bg-brand/20">
                          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6.5 3.5h3l1.5 4-2 1.5a13 13 0 0 0 6 6l1.5-2 4 1.5v3a2 2 0 0 1-2.2 2A16.5 16.5 0 0 1 4.5 5.7a2 2 0 0 1 2-2.2Z"/></svg>
                        </span>
                        <span className="min-w-0">
                          <span className="block text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">Call us</span>
                          <span className="block truncate text-sm font-semibold">{SITE.phones[0]}</span>
                        </span>
                      </a>
                    </li>
                    <li>
                      <a
                        href={`mailto:${SITE.emails[0]}`}
                        className="group flex items-center gap-3.5 text-slate-200 transition hover:text-white"
                      >
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.07] text-sky-300 transition group-hover:border-brand/50 group-hover:bg-brand/20">
                          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="2.5" y="5" width="19" height="14" rx="2.5"/><path d="m3 7 8.4 5.6a1.5 1.5 0 0 0 1.7 0L21 7"/></svg>
                        </span>
                        <span className="min-w-0">
                          <span className="block text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">Email</span>
                          <span className="block truncate text-sm font-semibold">{SITE.emails[0]}</span>
                        </span>
                      </a>
                    </li>
                    <li>
                      <div className="flex items-start gap-3.5 text-slate-200">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.07] text-sky-300">
                          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 21s7-6 7-11a7 7 0 1 0-14 0c0 5 7 11 7 11Z"/><circle cx="12" cy="10" r="2.5"/></svg>
                        </span>
                        <span className="min-w-0">
                          <span className="block text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">Visit us</span>
                          <span className="block text-sm font-semibold leading-6">{SITE.address}</span>
                        </span>
                      </div>
                    </li>
                  </ul>
                </div>
              </div>

              {/* ── Right: compact form ── */}
              <div className="bg-white p-6 sm:p-9">
                <p className="text-sm text-slate-500">
                  Fill in the form and we&apos;ll get back to you shortly.
                </p>
                <div className="mt-5">
                  <InquiryForm
                    source="homepage"
                    ctaLabel="Get a Free Consultation"
                    products={allProducts.map((p) => ({ name: p.name, slug: p.slug }))}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <CTASection />
    </>
  );
}
