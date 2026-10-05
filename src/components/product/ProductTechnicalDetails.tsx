"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { Product, SpecRow } from "@/db/schema";
import { CheckCircleIcon, LayersIcon, ShieldCheckIcon, WrenchIcon } from "./ProductIcons";

interface ProductTechnicalDetailsProps {
  product: Product;
}

const EASE = [0.22, 1, 0.36, 1] as const;

/** Normalises the two shapes the CMS allows for specifications. */
function specRows(product: Product): { label: string; value: string }[] {
  const source = (product.technicalSpecifications ?? []).length
    ? product.technicalSpecifications
    : product.specifications;
  if (!source?.length) return [];

  if (typeof source[0] === "object") {
    return (source as SpecRow[])
      .filter((r) => r && r.label)
      .map((r) => ({ label: r.label, value: r.value ?? "" }));
  }
  return (source as string[])
    .filter(Boolean)
    .map((line) => {
      const i = line.indexOf(":");
      return i === -1
        ? { label: line, value: "" }
        : { label: line.slice(0, i).trim(), value: line.slice(i + 1).trim() };
    })
    .filter((r) => r.label);
}

/**
 * "Technical Information + Where It Is Used".
 *
 * Deliberately not a specification table: a long label/value grid reads as a
 * template. Instead the data is grouped — a featured tile plus a 2-column card
 * grid for the remaining rows — with the sectors and application areas given
 * their own full-width band underneath.
 */
export function ProductTechnicalDetails({ product }: ProductTechnicalDetailsProps) {
  const reduce = useReducedMotion();

  const specs = specRows(product);
  const sectors = (product.industries ?? []).filter(Boolean);
  const uses = (product.applications ?? []).filter(Boolean);
  const install = (product.installationInformation ?? []).filter(Boolean);
  const maintain = (product.maintenanceInformation ?? []).filter(Boolean);
  const process = (product.manufacturingProcess ?? []).filter(Boolean);

  if (!specs.length && !sectors.length && !uses.length && !install.length && !process.length) {
    return null;
  }

  const [lead, ...rest] = specs;

  return (
    <section className="border-t border-slate-200/80 bg-white py-16 sm:py-20 lg:py-24">
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8">
        {/* stacked header — no split header, one focused message */}
        <div className="max-w-[62ch]">
          <h2 className="text-[26px] font-extrabold leading-[1.15] tracking-[-0.022em] text-ink sm:text-3xl lg:text-[34px]">
            Technical Information
          </h2>
          <p className="mt-3 text-[15px] leading-7 text-slate-600 sm:text-base">
            Certified gauges, materials and joining systems for {product.name}, fabricated against approved
            project drawings.
          </p>
        </div>

        {/* featured spec + card grid */}
        {specs.length > 0 && (
          <div className="mt-10 grid gap-4 lg:grid-cols-3">
            {lead && (
              <motion.div
                initial={reduce ? { opacity: 0 } : { opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.25 }}
                transition={{ duration: 0.45, ease: EASE }}
                className="relative overflow-hidden rounded-2xl bg-ink p-7 text-white lg:row-span-2"
              >
                <div className="eng-grid-dark absolute inset-0 opacity-30" aria-hidden="true" />
                <div className="relative">
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-cyan-300">
                    {lead.label}
                  </p>
                  <p className="mt-4 text-[28px] font-extrabold leading-tight text-white sm:text-[32px]">
                    {lead.value || "—"}
                  </p>
                  <div className="mt-7 h-px w-16 bg-white/25" aria-hidden="true" />
                  <p className="mt-5 text-sm leading-6 text-slate-300">
                    {product.material || `Supplied in ${product.category.toLowerCase()} grade mild steel.`}
                  </p>
                </div>
              </motion.div>
            )}

            <div className="grid gap-4 sm:grid-cols-2 lg:col-span-2 lg:content-start">
              {rest.slice(0, 8).map((row, i) => (
                <motion.div
                  key={`${row.label}-${i}`}
                  initial={reduce ? { opacity: 0 } : { opacity: 0, y: 14 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ duration: 0.4, delay: reduce ? 0 : i * 0.04, ease: EASE }}
                  className="rounded-2xl border border-slate-200 bg-slate-50/60 p-5 transition hover:border-brand/35 hover:bg-white"
                >
                  <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">
                    {row.label}
                  </p>
                  <p className="mt-2 text-[15px] font-semibold leading-snug text-ink">
                    {row.value || "—"}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* where it is used — full-width band, distinct layout family */}
        {(uses.length > 0 || sectors.length > 0) && (
          <div className="mt-14 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50/70">
            <div className="grid lg:grid-cols-2">
              {uses.length > 0 && (
                <div className="border-b border-slate-200 p-7 sm:p-9 lg:border-b-0 lg:border-r">
                  <div className="flex items-center gap-2.5 text-brand">
                    <LayersIcon className="h-5 w-5" />
                    <h3 className="text-base font-bold text-ink">Where It Is Used</h3>
                  </div>
                  <ul className="mt-5 space-y-2.5">
                    {uses.map((u) => (
                      <li key={u} className="flex items-start gap-2.5 text-sm leading-6 text-slate-700">
                        <CheckCircleIcon className="mt-0.5 h-[18px] w-[18px] shrink-0 text-brand" />
                        <span>{u}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {sectors.length > 0 && (
                <div className="p-7 sm:p-9">
                  <div className="flex items-center gap-2.5 text-brand">
                    <ShieldCheckIcon className="h-5 w-5" />
                    <h3 className="text-base font-bold text-ink">Industry Sectors Served</h3>
                  </div>
                  <div className="mt-5 flex flex-wrap gap-2">
                    {sectors.map((s) => (
                      <span
                        key={s}
                        className="rounded-lg border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* fabrication process — numbered steps, third layout family */}
        {process.length > 0 && (
          <div className="mt-14">
            <h3 className="text-lg font-extrabold tracking-tight text-ink">Fabrication Process</h3>
            <ol className="mt-6 grid gap-px overflow-hidden rounded-2xl border border-slate-200 bg-slate-200 sm:grid-cols-2 lg:grid-cols-4">
              {process.map((step, i) => (
                <li key={i} className="bg-white p-6">
                  <span className="font-mono text-xs font-bold text-brand">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <p className="mt-2.5 text-sm leading-6 text-slate-700">{step}</p>
                </li>
              ))}
            </ol>
          </div>
        )}

        {/* installation & maintenance */}
        {(install.length > 0 || maintain.length > 0) && (
          <div className="mt-14 grid gap-4 md:grid-cols-2">
            {install.length > 0 && (
              <div className="rounded-2xl border border-slate-200 p-6 sm:p-7">
                <div className="flex items-center gap-2.5 text-brand">
                  <WrenchIcon className="h-5 w-5" />
                  <h3 className="text-base font-bold text-ink">Site Installation</h3>
                </div>
                <ul className="mt-4 space-y-2">
                  {install.map((item, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm leading-6 text-slate-600">
                      <span className="mt-0.5 font-mono text-[11px] font-bold text-brand">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {maintain.length > 0 && (
              <div className="rounded-2xl border border-slate-200 p-6 sm:p-7">
                <div className="flex items-center gap-2.5 text-brand">
                  <ShieldCheckIcon className="h-5 w-5" />
                  <h3 className="text-base font-bold text-ink">Inspection &amp; Maintenance</h3>
                </div>
                <ul className="mt-4 space-y-2">
                  {maintain.map((item, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm leading-6 text-slate-600">
                      <CheckCircleIcon className="mt-0.5 h-[18px] w-[18px] shrink-0 text-brand" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
