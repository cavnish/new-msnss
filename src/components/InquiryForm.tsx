"use client";

import { useState } from "react";
import { PRODUCT_LINKS, SOLUTION_LINKS } from "@/lib/site";

type Result = {
  status: "idle" | "loading" | "success" | "error";
  message?: string;
  reference?: string;
  name?: string;
};
export type InquiryProduct = { name: string; slug: string };

/**
 * Compact inquiry form.
 *
 * The four fields that matter most (name, email, phone, company) sit in a
 * tight 2×2 block with a short message box, so the whole form fits a single
 * screen. Everything else the CMS collects — city, location, product,
 * solution, project type, quantity — is collapsed into "Add project details"
 * and still posts to the same API payload.
 */
export function InquiryForm({
  source = "contact",
  products,
  ctaLabel = "Request a Quote",
}: {
  source?: string;
  products?: InquiryProduct[];
  ctaLabel?: string;
}) {
  const [result, setResult] = useState<Result>({ status: "idle" });

  const productOptions =
    products && products.length ? products.map((p) => p.name) : PRODUCT_LINKS.map(([n]) => n);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());
    setResult({ status: "loading" });
    try {
      const r = await fetch("/api/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error);
      setResult({ status: "success", reference: j.reference, name: String(data.name) });
      form.reset();
    } catch (x) {
      setResult({ status: "error", message: (x as Error).message });
    }
  }

  if (result.status === "success")
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-8 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-2xl text-emerald-700">
          ✓
        </div>
        <h3 className="mt-4 text-lg font-bold text-emerald-900">Inquiry Submitted</h3>
        <p className="mt-2 text-sm text-emerald-800">
          Thank you, {result.name}. Our team will review your requirement and contact you.
        </p>
        <p className="mt-3 text-xs text-emerald-700">
          Reference: <strong>{result.reference}</strong>
        </p>
        <button
          onClick={() => setResult({ status: "idle" })}
          className="btn-micro mt-5 rounded-lg bg-emerald-700 px-5 py-2.5 text-sm font-semibold text-white"
        >
          Send Another Inquiry
        </button>
      </div>
    );

  return (
    <form id="inquiry-form" onSubmit={submit} className="space-y-3 scroll-mt-24">
      <input type="hidden" name="source" value={source} />
      {/* Honeypot */}
      <div className="absolute -left-[9999px]" aria-hidden="true">
        <label>
          Website
          <input name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      {/* 2×2 essentials — the whole point of the compact layout */}
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Name *">
          <input name="name" required className={inputCls} placeholder="Your full name" />
        </Field>
        <Field label="Email *">
          <input name="email" type="email" required className={inputCls} placeholder="you@company.com" />
        </Field>
        <Field label="Phone *">
          <input name="phone" required className={inputCls} placeholder="+91 00000 00000" />
        </Field>
        <Field label="Company">
          <input name="company" className={inputCls} placeholder="Company name" />
        </Field>
      </div>

      <Field label="Message *">
        <textarea
          name="message"
          required
          minLength={10}
          rows={3}
          className={`${inputCls} resize-none`}
          placeholder="Tell us about your drawings and requirements…"
        />
      </Field>

      {/* Optional detail — keeps the form one-screen tall */}
      <details className="group rounded-lg border border-slate-200 bg-slate-50/70 px-3 py-2">
        <summary className="cursor-pointer list-none text-xs font-semibold text-slate-600 transition hover:text-brand">
          <span className="mr-1.5 inline-block text-brand transition group-open:rotate-90">▸</span>
          Add project details
          <span className="ml-1.5 font-normal text-slate-400">(optional)</span>
        </summary>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <Field label="City">
            <input name="city" className={inputCls} />
          </Field>
          <Field label="Project Location">
            <input name="projectLocation" className={inputCls} />
          </Field>
          <Field label="Product">
            <select name="productInterest" className={inputCls}>
              <option value="">Select product</option>
              {productOptions.map((n) => (
                <option key={n}>{n}</option>
              ))}
            </select>
          </Field>
          <Field label="Solution">
            <select name="solutionInterest" className={inputCls}>
              <option value="">Select solution</option>
              {SOLUTION_LINKS.map(([n]) => (
                <option key={n}>{n}</option>
              ))}
            </select>
          </Field>
          <Field label="Project Type">
            <input name="projectType" className={inputCls} placeholder="Commercial, industrial…" />
          </Field>
          <Field label="Quantity / Approx. Area">
            <input name="quantity" className={inputCls} placeholder="Example: 500 SQM" />
          </Field>
        </div>
      </details>

      <label className="flex items-start gap-2 text-xs leading-5 text-slate-600">
        <input type="checkbox" name="consent" required className="mt-0.5 h-4 w-4 rounded border-slate-300 text-brand focus:ring-brand/30" />
        I agree to be contacted regarding this inquiry.
      </label>

      {result.status === "error" && (
        <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {result.message}
        </p>
      )}

      <button
        disabled={result.status === "loading"}
        className="btn-primary flex w-full items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-bold"
      >
        {result.status === "loading" ? "Submitting…" : ctaLabel}
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.3} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M5 12h14M13 6l6 6-6 6" />
        </svg>
      </button>

      <p className="text-center text-[11px] leading-4 text-slate-400">
        Attachments? Submit the form first, then reply to the confirmation email with your PDF,
        drawing or image.
      </p>
    </form>
  );
}

const inputCls =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-ink placeholder:text-slate-400 outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/15";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold tracking-wide text-slate-600">{label}</span>
      {children}
    </label>
  );
}
