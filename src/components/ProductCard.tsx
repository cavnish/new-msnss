"use client";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import type { Product } from "@/db/schema";
import SmartImage from "@/components/SmartImage";

export function ProductCard({ product, index = 0 }: { product: Product; index?: number }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial={reduce ? { opacity: 0 } : { opacity: 0, y: 18, scale: 0.98 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: reduce ? 0.15 : 0.45, delay: reduce ? 0 : Math.min(index * 0.05, 0.25) }}
      whileHover={reduce ? undefined : { y: -6 }}
      className="h-full"
    >
      <Link
        href={`/products/${product.slug}`}
        className="group relative flex aspect-square flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm outline-none transition hover:border-brand/50 hover:shadow-xl focus-visible:ring-2 focus-visible:ring-brand sm:rounded-2xl"
      >
        <div className="zoom-frame absolute inset-0">
          <motion.div
            className="h-full w-full"
            whileHover={reduce ? undefined : { scale: 1.07 }}
            transition={{ duration: 0.5 }}
          >
            <SmartImage
              src={product.imageUrl}
              alt={`${product.name} manufactured by MSNSS`}
              fill
              sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 100vw"
              loading="lazy"
              className="object-cover transition duration-500"
            />
          </motion.div>
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-slate-950/10 to-transparent opacity-0 transition duration-300 group-hover:opacity-100" />
        </div>
        <div className="relative mt-auto flex flex-1 flex-col p-4 sm:p-6">
          <h3 className="line-clamp-2 text-sm font-bold text-white drop-shadow-sm sm:text-xl">{product.name}</h3>
          <p className="mt-1.5 line-clamp-2 text-xs leading-5 text-white/80 sm:line-clamp-3 sm:text-sm sm:leading-6">
            {product.shortDescription}
          </p>
          <div className="mt-3 flex items-center justify-between sm:mt-4">
            <span className="text-[11px] uppercase tracking-[0.16em] text-white/75 sm:text-xs">View Details</span>
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur transition group-hover:translate-x-1 group-hover:bg-brand sm:h-8 sm:w-8">
              →
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}