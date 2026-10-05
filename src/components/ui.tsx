import Link from "next/link";
import type { ReactNode } from "react";
import { Reveal } from "@/components/motion/Motion";
import { Magnetic } from "@/components/Magnetic";
import SmartImage from "@/components/SmartImage";

/**
 * Shared UI primitives. Every public page composes its rhythm from these, so
 * visual upgrades here propagate across the whole site at once.
 */

export function SectionHeading({
  eyebrow,
  title,
  subtitle,
  center = true,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  center?: boolean;
}) {
  return (
    <Reveal className={`mb-10 ${center ? "text-center" : ""}`}>
      {eyebrow && (
        <div className={center ? "flex justify-center" : ""}>
          <span className="eyebrow">{eyebrow}</span>
        </div>
      )}
      <h2
        className={`mt-4 text-balance text-[1.75rem] font-extrabold leading-[1.12] tracking-[-0.022em] text-ink sm:text-4xl lg:text-[2.65rem] lg:leading-[1.08] ${
          center ? "mx-auto max-w-3xl" : "max-w-3xl"
        }`}
      >
        {title}
      </h2>
      {subtitle && (
        <p
          className={`mt-4 text-pretty text-[15px] leading-7 text-slate-600 sm:text-base sm:leading-8 ${
            center ? "mx-auto max-w-2xl" : "max-w-2xl"
          }`}
        >
          {subtitle}
        </p>
      )}
      {center && (
        <div className="mx-auto mt-6 h-1 w-16 rounded-full bg-gradient-to-r from-brand to-sky-400" />
      )}
    </Reveal>
  );
}

export function PageHeader({
  title,
  subtitle,
  crumb,
}: {
  title: string;
  subtitle?: string;
  crumb?: string;
}) {
  return (
    <section className="surface-soft grain relative overflow-hidden border-b border-slate-200/80 py-14 sm:py-16">
      {/* Ambient brand blooms */}
      <div
        aria-hidden="true"
        className="animate-aurora pointer-events-none absolute -right-16 -top-20 h-80 w-80 rounded-full bg-brand-light/80 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-24 bottom-0 h-64 w-64 rounded-full bg-sky-100/70 blur-3xl"
      />
      <div aria-hidden="true" className="eng-grid pointer-events-none absolute inset-0 opacity-40" />

      <div className="relative mx-auto max-w-6xl px-5 sm:px-6">
        {crumb && (
          <nav aria-label="Breadcrumb" className="mb-3">
            <span className="eyebrow text-[10px] text-slate-500">{crumb}</span>
          </nav>
        )}
        <h1 className="text-balance max-w-3xl text-3xl font-extrabold leading-[1.1] tracking-[-0.025em] text-ink sm:text-5xl lg:text-[3.25rem]">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-4 max-w-2xl text-pretty text-base leading-7 text-slate-600 sm:text-lg sm:leading-8">
            {subtitle}
          </p>
        )}
      </div>
    </section>
  );
}

export function CTASection() {
  return (
    <section
      aria-labelledby="cta-band-heading"
      className="relative isolate overflow-hidden bg-[#062043]"
    >
      {/* Photographic band — real ducting, graded deep blue */}
      <SmartImage
        src="/images/hero-2.jpg"
        alt=""
        aria-hidden="true"
        fill
        priority={false}
        sizes="100vw"
        className="object-cover object-center opacity-[0.55]"
      />
      {/* Cinematic grade: open in the centre, closed at both edges */}
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(100deg, rgba(5,22,48,0.97) 0%, rgba(7,34,72,0.9) 34%, rgba(9,48,96,0.7) 62%, rgba(6,26,58,0.9) 100%)",
        }}
      />
      <div aria-hidden="true" className="eng-grid-dark absolute inset-0 opacity-20" />
      <div aria-hidden="true" className="animate-sheen absolute inset-0" />
      {/* Accent rule that lifts the left edge, like the reference */}
      <div
        aria-hidden="true"
        className="absolute bottom-0 left-0 h-1 w-40 bg-gradient-to-r from-brand via-sky-400 to-transparent sm:w-64"
      />

      <div className="relative mx-auto max-w-7xl px-5 py-12 sm:px-6 lg:py-14">
        <div className="flex flex-col items-start gap-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <h2
              id="cta-band-heading"
              className="text-balance text-2xl font-extrabold leading-[1.14] tracking-[-0.022em] text-white sm:text-3xl lg:text-[2.35rem]"
            >
              Planning Your Next HVAC Ducting Project?
            </h2>
            <p className="mt-3 text-pretty text-base leading-7 text-white/80 sm:text-lg">
              Talk to our engineering team about fabrication, supply and installation.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Magnetic>
              <Link
                href="/contact"
                className="btn-primary inline-flex items-center gap-2.5 rounded-xl px-6 py-3.5 text-sm font-bold"
              >
                <svg
                  viewBox="0 0 24 24"
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.9}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <rect x="2.5" y="5" width="19" height="14" rx="2.5" />
                  <path d="m3 7 8.4 5.6a1.5 1.5 0 0 0 1.7 0L21 7" />
                </svg>
                Request a Quote
              </Link>
            </Magnetic>
            <Magnetic>
              <a
                href="https://wa.me/917021094388"
                target="_blank"
                rel="noreferrer"
                className="btn-ghost inline-flex items-center gap-2.5 rounded-xl border border-white/35 bg-white/[0.08] px-6 py-3.5 text-sm font-bold text-white backdrop-blur hover:bg-white hover:text-[#0a3470]"
              >
                <svg
                  viewBox="0 0 24 24"
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.9}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M4 13v-1a8 8 0 0 1 16 0v1" />
                  <rect x="2.5" y="13" width="4.5" height="7" rx="2.2" />
                  <rect x="17" y="13" width="4.5" height="7" rx="2.2" />
                  <path d="M20 20a3.5 3.5 0 0 1-3.5 3H13" />
                </svg>
                Talk to Our Engineering Team
              </a>
            </Magnetic>
          </div>
        </div>
      </div>
    </section>
  );
}

export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`card-premium card-glow p-6 ${className}`}>{children}</div>
  );
}
