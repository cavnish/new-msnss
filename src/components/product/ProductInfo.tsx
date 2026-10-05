"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import type { Product } from "@/db/schema";
import { SITE } from "@/lib/site";
import { oneLiner, bodyCopy } from "@/lib/product-copy";
import { CheckCircleIcon, HeadsetIcon, ArrowRightIcon } from "./ProductIcons";

const PHONE = SITE.phones[0] ?? "+91 70210 94388";

interface ProductInfoProps {
  product: Product;
}

/**
 * Up to four short, scannable highlights for the hero.
 *
 * `benefits` already holds concise phrases ("Quality mild steel material"), so
 * they are preferred. Feature sentences are trimmed to their leading label
 * ("High strength: Reinforced lock seams…" -> "High strength") when benefits
 * are absent, so the hero never shows a paragraph as a bullet.
 */
function heroHighlights(product: Product): string[] {
  const benefits = (product.benefits ?? []).filter(Boolean);
  if (benefits.length) return benefits.slice(0, 4);

  const features = (product.features ?? []).filter(Boolean);
  const trimmed = features
    .map((f) => f.split(":")[0].trim())
    .filter((f) => f.length > 0 && f.length <= 64);
  if (trimmed.length) return trimmed.slice(0, 4);

  const specs = product.technicalSpecifications ?? [];
  return specs
    .slice(0, 4)
    .map((s) => (typeof s === "object" && s ? s.label : ""))
    .filter((label): label is string => Boolean(label));
}

export function ProductInfo({ product }: ProductInfoProps) {
  const reduce = useReducedMotion();
  const highlights = heroHighlights(product);
  const description = bodyCopy(product.longDescription || product.fullDescription);

  /*
   * `short_description` is meant to be a one-liner but is frequently a whole
   * paragraph, and the product itself can have no usable value line at all
   * ("MS rectangular ducts"). Deriving it keeps the hero on a single line and
   * always gives it something meaningful to say.
   */
  const rawLine = product.shortDescription?.trim() ?? "";
  const valueProposition =
    oneLiner(rawLine) || oneLiner(product.longDescription) || oneLiner(product.fullDescription);

  return (
    <motion.div
      initial={reduce ? { opacity: 0 } : { opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="flex min-w-0 flex-col"
    >
      {/* category label — the single eyebrow on this page */}
      <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-brand">
        {product.category}
      </span>

      <h1 className="mt-3 text-[30px] font-extrabold leading-[1.1] tracking-[-0.022em] text-ink sm:text-[38px] lg:text-[44px]">
        {product.h1 || product.name}
      </h1>

      {/* one-line value proposition */}
      {valueProposition && (
        <p className="mt-3.5 text-[17px] font-medium leading-snug text-slate-800 sm:text-xl">
          {valueProposition}
        </p>
      )}

      {/* concise detail — capped to four lines so the CTAs stay in reach */}
      <div className="mt-4 space-y-2.5 text-[15px] leading-7 text-slate-600">
        <p className="text-pretty lg:line-clamp-4">{description}</p>
        {product.material && (
          <p>
            <span className="font-semibold text-ink">Material: </span>
            {product.material}
          </p>
        )}
      </div>

      {/* key highlights */}
      {highlights.length > 0 && (
        <ul className="mt-5 grid gap-x-4 gap-y-2 sm:grid-cols-2">
          {highlights.map((h) => (
            <li key={h} className="flex items-start gap-2.5 text-sm font-medium text-slate-700">
              <CheckCircleIcon className="mt-0.5 h-[18px] w-[18px] shrink-0 text-brand" />
              <span className="text-pretty">{h}</span>
            </li>
          ))}
        </ul>
      )}

      {/* CTAs */}
      <div className="mt-7 flex flex-wrap items-center gap-3">
        <Link
          href={`/contact?source=product:${product.slug}`}
          className="group inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg bg-brand px-7 py-3.5 text-[15px] font-semibold text-white shadow-md shadow-brand/20 transition hover:bg-brand-dark hover:shadow-lg active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
        >
          Get a Quote
          <ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </Link>

        <a
          href={`tel:${PHONE.replace(/\s+/g, "")}`}
          className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg border border-slate-300 bg-white px-6 py-3.5 text-[15px] font-semibold text-slate-800 shadow-sm transition hover:border-brand hover:text-brand active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
        >
          <HeadsetIcon className="h-[18px] w-[18px] text-brand" />
          Talk to Our Engineering Team
        </a>
      </div>
    </motion.div>
  );
}
