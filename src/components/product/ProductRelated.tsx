"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import type { Product } from "@/db/schema";
import SmartImage from "@/components/SmartImage";
import { ArrowRightIcon } from "./ProductIcons";

interface ProductRelatedProps {
  products: Product[];
}

export function ProductRelated({ products }: ProductRelatedProps) {
  const reduce = useReducedMotion();

  if (!products || products.length === 0) return null;

  return (
    <section className="cv-auto bg-white border-t border-slate-200/80 py-16 sm:py-20 lg:py-24">
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8">
        {/* Stacked header — one focused message, no split header. */}
        <div className="max-w-[62ch]">
          <h2 className="text-[26px] font-extrabold leading-[1.15] tracking-[-0.022em] text-ink sm:text-3xl lg:text-[34px]">
            Related Products
          </h2>
          <p className="mt-3 text-[15px] leading-7 text-slate-600 sm:text-base">
            Complementary ducting systems, volume control dampers, and ventilation fittings manufactured
            by MSNSS.
          </p>
        </div>

        {/*
          Hairline-separated grid, not cards: elevation adds nothing here, and
          three bordered card grids on one page reads as a template.
        */}
        <div className="mt-10 grid grid-cols-2 gap-x-6 gap-y-10 sm:gap-x-8 lg:grid-cols-4">
          {products.slice(0, 4).map((item, idx) => (
            <motion.div
              key={item.id}
              initial={reduce ? { opacity: 0 } : { opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.15 }}
              transition={{
                duration: 0.4,
                delay: reduce ? 0 : Math.min(idx * 0.06, 0.24),
                ease: [0.22, 1, 0.36, 1],
              }}
            >
              <Link
                href={`/products/${item.slug}`}
                className="group flex flex-col border-t border-slate-200 pt-4 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
              >
                <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-slate-100">
                  <SmartImage
                    src={item.imageUrl}
                    alt={`${item.name} manufactured by MSNSS`}
                    fill
                    sizes="(min-width: 1024px) 22vw, (min-width: 640px) 45vw, 50vw"
                    loading="lazy"
                    className="object-cover transition duration-500 group-hover:scale-105"
                  />
                </div>

                <h3 className="mt-4 text-[15px] font-bold text-ink transition-colors group-hover:text-brand line-clamp-1">
                  {item.name}
                </h3>
                <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-slate-600">
                  {item.shortDescription}
                </p>

                <span className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-brand">
                  View Product
                  <ArrowRightIcon className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                </span>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
