"use client";

import { motion } from "framer-motion";
import type { Product } from "@/db/schema";

interface ProductFAQProps {
  product: Product;
}

export function ProductFAQ({ product }: ProductFAQProps) {
  // CMS-authored FAQs take priority; the generated set below is a fallback for
  // products the team has not written yet.
  const authored = (product.faqs ?? []).filter((f) => f && f.question && f.answer);
  if (authored.length) {
    return (
      <section className="bg-slate-50/70 border-t border-slate-200/70 py-14 sm:py-18">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">
              Frequently Asked Questions
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Common engineering and procurement questions regarding {product.name}.
            </p>
          </div>
          <div className="space-y-3">
            {authored.map((f) => (
              <details
                key={f.question}
                className="group rounded-xl border border-slate-200 bg-white px-5 py-4 transition hover:border-brand/30"
              >
                <summary className="flex cursor-pointer list-none items-start justify-between gap-4 text-[15px] font-semibold text-ink">
                  {f.question}
                  <span className="mt-0.5 text-brand transition group-open:rotate-45" aria-hidden="true">＋</span>
                </summary>
                <p className="mt-3 text-sm leading-7 text-slate-600">{f.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>
    );
  }

  const applicationAnswer =
    product.applications && product.applications.length
      ? `${product.name} is engineered for ${product.applications.join(", ")}, fabricated strictly to approved project specifications.`
      : `Applications for ${product.name} are confirmed against approved architectural and MEP drawings.`;

  const faqs = [
    {
      q: `What standards and grades are used for ${product.name}?`,
      a: `MSNSS fabricates ${product.name} in compliance with SMACNA, DW 144, and IS 655 specifications. Depending on design requirements, we use certified high-grade mild steel (MS) or stainless steel (SS 304 / SS 316) with precision gauge control.`,
    },
    {
      q: `Where is ${product.name} typically specified?`,
      a: applicationAnswer,
    },
    {
      q: `How do I request a custom dimensional takeoff or quote?`,
      a: `Send your BOQ, duct layout drawings, and site location to sales@msnss.com or via our online inquiry form. Our engineering team will review gauges, joints, and installation scope before submitting a detailed proposal.`,
    },
    {
      q: `Does MSNSS provide on-site duct erection and installation?`,
      a: `Yes, MSNSS provides end-to-end execution including factory fabrication, transport, staging, and site installation by certified duct erectors with complete quality checks.`,
    },
  ];

  return (
    <section className="bg-slate-50/70 border-t border-slate-200/70 py-14 sm:py-18">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h2 className="text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">
            Frequently Asked Questions
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Common engineering and procurement questions regarding {product.name}.
          </p>
        </div>

        <div className="space-y-3.5">
          {faqs.map((faq, idx) => (
            <motion.details
              key={idx}
              open={idx === 0}
              className="group rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm transition-all open:border-brand/30 open:shadow-md"
            >
              <summary className="flex cursor-pointer items-center justify-between text-base font-bold text-ink hover:text-brand focus-visible:outline-none">
                <span>{faq.q}</span>
                <span className="ml-4 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-600 group-open:rotate-180 group-open:bg-brand-light group-open:text-brand transition-transform">
                  ▼
                </span>
              </summary>
              <p className="mt-3.5 text-sm leading-relaxed text-slate-600 border-t border-slate-100 pt-3">
                {faq.a}
              </p>
            </motion.details>
          ))}
        </div>
      </div>
    </section>
  );
}
