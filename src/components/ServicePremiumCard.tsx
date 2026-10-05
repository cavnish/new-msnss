"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import type { Service } from "@/db/schema";
import SmartImage from "@/components/SmartImage";
import { Tilt } from "@/components/Tilt";

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

// Real project/facility media used when a service has not uploaded its own image.
const FALLBACK_IMAGES = [
  "/images/factory.jpg",
  "/images/about.jpg",
  "/images/fire-rated.jpg",
  "/images/image%20(9).png",
];

export function ServicePremiumCard({
  service,
  index,
}: {
  service: Service;
  index: number;
}) {
  const reduce = useReducedMotion();
  const image =
    service.imageUrl ||
    FALLBACK_IMAGES[index % FALLBACK_IMAGES.length];

  return (
    <motion.article
      initial={reduce ? { opacity: 0 } : { opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.12 }}
      transition={{
        duration: reduce ? 0.15 : 0.5,
        delay: reduce ? 0 : Math.min(index * 0.07, 0.35),
        ease: [0.22, 1, 0.36, 1],
      }}
      className="card-premium card-glow group relative flex h-full flex-col overflow-hidden"
    >
      <Tilt max={6} perspective={900} className="h-full">
      <Link
        href={`/solutions/${service.slug}`}
        className="flex h-full flex-col rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
        aria-label={`View details for ${service.name}`}
      >
        {/* ── Image Container (4:3 ratio) ── */}
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-100">
          {/* Hover overlay + animated arrow button */}
          <div className="absolute inset-0 z-10 flex items-center justify-center transition-all duration-300 group-hover:bg-brand/10">
            <div className="flex h-11 w-11 scale-75 items-center justify-center rounded-full bg-white/90 text-brand opacity-0 shadow-md backdrop-blur-sm transition-all duration-300 group-hover:scale-100 group-hover:opacity-100">
              <ArrowUpRight className="h-4 w-4" />
            </div>
          </div>

          {/* Solution image with Ken Burns-style zoom */}
          <SmartImage
            src={image}
            alt={`${service.name} — HVAC ducting solution offered by MSNSS`}
            fill
            sizes="(min-width: 1280px) 390px, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            loading="lazy"
            className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.06]"
          />

          {/* Subtle bottom vignette */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-white/20 to-transparent" />
        </div>

        {/* ── Card Body ── */}
        <div className="flex flex-1 flex-col p-5 sm:p-6">
          {/* Solution name */}
          <h3 className="text-[15px] font-bold leading-snug tracking-tight text-ink transition-colors duration-200 group-hover:text-brand sm:text-base">
            {service.name}
          </h3>

          {/* Short description */}
          <p className="mt-2 line-clamp-2 text-[13px] leading-relaxed text-slate-500 sm:text-sm">
            {service.shortDescription}
          </p>

          {/* Spacer pushes CTA to bottom */}
          <div className="flex-1" />

          {/* Divider */}
          <div className="mt-4 h-px w-full bg-slate-100 transition-colors duration-200 group-hover:bg-brand/15" />

          {/* CTA row */}
          <div className="mt-4 flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-brand">
              Explore Solution
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-slate-400 transition-all duration-200 group-hover:border-brand group-hover:bg-brand group-hover:text-white">
              <ArrowUpRight className="h-3.5 w-3.5" />
            </div>
          </div>
        </div>
      </Link>
      </Tilt>
    </motion.article>
  );
}