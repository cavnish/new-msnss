"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import type { Service } from "@/db/schema";
import { ServicePremiumCard } from "@/components/ServicePremiumCard";

function GridIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}

function ArrowUpRight({ className = "" }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M7 17L17 7M17 7H7M17 7v10" />
    </svg>
  );
}

export function HomeServiceSection({ services }: { services: Service[] }) {
  const reduce = useReducedMotion();

  // Show up to 6 services for a clean 3-column layout
  const displayServices = services.slice(0, 6);
  const totalCount = services.length;

  if (!totalCount) return null;

  return (
    <section
      id="services"
      aria-labelledby="home-services-heading"
      className="relative overflow-hidden bg-white py-14 sm:py-20 lg:py-24"
    >
      {/* Background grid texture */}
      <div className="pointer-events-none absolute inset-0 eng-grid opacity-[0.3]" />
      {/* Ambient glows */}
      <div className="pointer-events-none absolute -right-40 -top-40 h-[500px] w-[500px] rounded-full bg-brand-light/50 blur-3xl" />
      <div className="pointer-events-none absolute -left-40 bottom-0 h-96 w-96 rounded-full bg-cyan-50/60 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* ── Section Header ── */}
        <motion.div
          initial={reduce ? { opacity: 0 } : { opacity: 0, y: 22 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={{ duration: reduce ? 0.2 : 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="mb-10 sm:mb-12 lg:mb-14"
        >
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-2xl">
              <h2
                id="home-services-heading"
                className="text-3xl font-extrabold tracking-tight text-ink sm:text-4xl lg:text-[2.6rem] lg:leading-[1.1]"
              >
                End-to-End{" "}
                <span className="text-gradient-brand">HVAC Ducting</span>{" "}
                Solutions
              </h2>
              <p className="mt-3 max-w-xl text-sm leading-relaxed text-slate-600 sm:text-[15px] sm:leading-7">
                From fabrication and finishing to installation, every MSNSS
                service is delivered with the same precision, materials and
                quality standards as our manufactured products.
              </p>
            </div>

            {/* Desktop "View All" link beside the heading */}
            {totalCount > 0 && (
              <div className="hidden shrink-0 sm:block">
                <Link
                  href="/solutions"
                  className="group inline-flex items-center gap-2 rounded-xl border-2 border-brand px-6 py-3 text-sm font-bold text-brand transition-all duration-200 hover:bg-brand hover:text-white"
                >
                  <GridIcon className="h-4 w-4" />
                  View All {totalCount} Solutions
                  <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </Link>
              </div>
            )}
          </div>
        </motion.div>

        {/* ── Service Grid ── */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 lg:gap-6">
          {displayServices.map((service, idx) => (
            <ServicePremiumCard key={service.id} service={service} index={idx} />
          ))}
        </div>

        {/* ── Mobile "View All" CTA (hidden on sm+) ── */}
        {totalCount > 0 && (
          <motion.div
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: reduce ? 0.2 : 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="mt-8 text-center sm:hidden"
          >
            <Link
              href="/solutions"
              className="group inline-flex items-center gap-2 rounded-xl border-2 border-brand px-7 py-3 text-sm font-bold text-brand transition-all duration-200 hover:bg-brand hover:text-white"
            >
              <GridIcon className="h-4 w-4" />
              View All Solutions
              <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>
          </motion.div>
        )}
      </div>
    </section>
  );
}