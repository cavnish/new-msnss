"use client";

import Link from "next/link";
import { useReducedMotion } from "framer-motion";
import type { Client } from "@/db/schema";
import SmartImage from "@/components/SmartImage";

/**
 * Premium client logo row — one horizontal track of individual wide cards that
 * glides continuously from left to right.
 *
 * Card: ~185×80px, 12px radius, subtle light border, near-white surface.
 * Gaps: 20px between every card. Logo centered, aspect-ratio preserved.
 *
 * Motion: the track is duplicated and translated from -50% to 0, so the logos
 * travel left → right and loop seamlessly. It pauses on hover and freezes
 * entirely for `prefers-reduced-motion`, where the row becomes a plain
 * horizontally scrollable strip instead.
 */
function LogoCard({ client }: { client: Client }) {
  return (
    <Link
      href={`/clients/${client.slug}`}
      title={`View MSNSS portfolio for ${client.name}`}
      className="group flex h-[80px] w-[180px] shrink-0 items-center justify-center rounded-[12px] border border-slate-200/80 bg-[#fafbfc] px-5 transition-colors duration-200 hover:border-brand/30 hover:bg-white sm:w-[185px]"
    >
      <SmartImage
        src={client.logoUrl}
        alt={client.logoAlt || `${client.name} logo`}
        width={160}
        height={56}
        loading="lazy"
        sizes="180px"
        className="h-auto max-h-[52px] w-auto max-w-full object-contain"
      />
    </Link>
  );
}

function Track({ clients, label }: { clients: Client[]; label: string }) {
  return (
    <>
      {clients.map((c) => (
        <div key={`${label}-${c.id}`}>
          <LogoCard client={c} />
        </div>
      ))}
    </>
  );
}

export function ClientLogoRow({ clients }: { clients: Client[] }) {
  const reduce = useReducedMotion();
  if (!clients.length) return null;

  // Seamless loop: the track holds the set twice and slides exactly one set
  // width, so the wrap point is invisible.
  const loopClients = clients.length < 4 ? [...clients, ...clients, ...clients] : clients;
  const duration = Math.max(24, loopClients.length * 5.5);

  return (
    <section
      aria-label="Trusted clients"
      className="relative overflow-hidden bg-white py-8 sm:py-10"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Heading strip */}
        <div className="mb-5 flex items-center justify-center gap-3">
          <span className="h-px w-8 bg-slate-300" aria-hidden="true" />
          <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-400">
            Trusted By
          </span>
          <span className="h-px w-8 bg-slate-300" aria-hidden="true" />
        </div>

        {reduce ? (
          /* Static, manually scrollable strip */
          <div className="flex gap-5 overflow-x-auto pb-1 scrollbar-none">
            {clients.map((c) => (
              <LogoCard key={c.id} client={c} />
            ))}
          </div>
        ) : (
          <div className="marquee-pause relative">
            {/* Edge fades so cards dissolve in and out rather than clip */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute left-0 top-0 z-10 h-full w-10 bg-gradient-to-r from-white via-white/85 to-transparent sm:w-16"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute right-0 top-0 z-10 h-full w-10 bg-gradient-to-l from-white via-white/85 to-transparent sm:w-16"
            />

            <div
              className="animate-marquee-right flex w-max gap-5"
              style={{ animationDuration: `${duration}s` }}
            >
              <Track clients={loopClients} label="a" />
              <Track clients={loopClients} label="b" />
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
