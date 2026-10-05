import type { Metadata } from "next";
import { CTASection, PageHeader } from "@/components/ui";
import { MotionReveal } from "@/components/MotionReveal";
import { ServicePremiumCard } from "@/components/ServicePremiumCard";
import { WhyChooseSection } from "@/components/WhyChooseSection";
import { ApplicationsSection } from "@/components/ApplicationsSection";
import { ProcessSection } from "@/components/ProcessSection";
import { getServices } from "@/lib/queries";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "HVAC Ducting Solutions",
  description:
    "Explore MSNSS duct manufacturing, fabrication, installation, insulation, coating and surface treatment solutions.",
  alternates: { canonical: "/solutions" },
  openGraph: {
    title: "HVAC Ducting Solutions | MSNSS",
    description:
      "Manufacturing, fabrication, finishing and installation support for HVAC ducting projects.",
  },
};

export default async function SolutionsPage() {
  const solutions = await getServices();

  return (
    <>
      <PageHeader
        title="Complete Ducting Solutions"
        subtitle="Manufacturing, fabrication, finishing and installation support for project requirements."
        crumb="Solutions"
      />

      <section className="relative overflow-hidden bg-white py-14 sm:py-20">
        {/* Background grid texture */}
        <div className="pointer-events-none absolute inset-0 eng-grid opacity-[0.3]" />
        {/* Ambient glows */}
        <div className="pointer-events-none absolute -right-40 -top-40 h-[500px] w-[500px] rounded-full bg-brand-light/50 blur-3xl" />
        <div className="pointer-events-none absolute -left-40 bottom-0 h-96 w-96 rounded-full bg-cyan-50/60 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Section header matching the products page */}
          <MotionReveal className="mx-auto mb-10 max-w-3xl text-center sm:mb-12">
            <div className="mb-4 inline-flex items-center justify-center gap-2.5 text-[11px] font-extrabold uppercase tracking-[0.22em] text-brand">
              <span className="h-0.5 w-5 rounded-full bg-brand" />
              <span>Manufacturer · Fabricator · Installer</span>
              <span className="h-0.5 w-5 rounded-full bg-brand" />
            </div>
            <h2 className="text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
              Support Across the Ducting Project Cycle
            </h2>
            <p className="mt-4 leading-7 text-slate-600">
              Browse the work currently offered by MSNSS. All published solution
              content is controlled through the existing admin CMS.
            </p>
          </MotionReveal>

          {/* Grid matching the premium product card design */}
          {solutions.length ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 lg:gap-6">
              {solutions.map((solution, index) => (
                <ServicePremiumCard key={solution.id} service={solution} index={index} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 py-20 text-center">
              <div className="text-5xl">🛠️</div>
              <h2 className="mt-4 text-lg font-bold text-ink">No solutions published</h2>
              <p className="mt-1 text-sm text-slate-500">
                Solutions will appear here after admin publication.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Why Industry Leaders Choose MSNSS */}
      <WhyChooseSection />

      {/* Ducting Solutions Across Critical Applications */}
      <ApplicationsSection />

      {/* Our Process */}
      <ProcessSection />

      <CTASection />
    </>
  );
}