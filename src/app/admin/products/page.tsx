"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { AdminPage, Modal, Field, inputCls, EmptyState, TableSkeleton, ListInput, ImageField, MediaListEditor, HomePlacementFields, type MediaListValue } from "@/components/admin/AdminUI";
import { PRODUCT_CATEGORIES } from "@/lib/site";
import type { Product } from "@/db/schema";

type SpecRowForm = { label: string; value: string };
type FaqRowForm = { question: string; answer: string };
type AppRowForm = { title: string; description: string };

type Form = {
  id?: number;
  name: string;
  slug: string;
  category: string;
  shortDescription: string;
  fullDescription: string;
  longDescription: string;
  material: string;
  imageUrl: string;
  applications: string;
  specifications: string;
  features: string;
  benefits: string;
  techSpecs: SpecRowForm[];
  manufacturingProcess: string;
  installationInformation: string;
  maintenanceInformation: string;
  industries: string;
  gallery: string;
  videoUrl: string;
  relatedProductIds: number[];
  showOnHome: boolean;
  homeOrder: number;
  showcaseItems: MediaListValue[];
  h1: string;
  primaryKeyword: string;
  secondaryKeywords: string;
  seoTags: string;
  designFabrication: string;
  supplyAcrossIndia: string;
  faqs: FaqRowForm[];
  applicationDetails: AppRowForm[];
  featured: boolean;
  seoTitle: string;
  seoDescription: string;
  seoKeywords: string;
  sortOrder: number;
  active: boolean;
};

const empty: Form = {
  name: "", slug: "", category: PRODUCT_CATEGORIES[0], shortDescription: "",
  fullDescription: "", longDescription: "", material: "", imageUrl: "",
  applications: "", specifications: "", features: "", benefits: "", techSpecs: [],
  manufacturingProcess: "", installationInformation: "", maintenanceInformation: "", industries: "",
  gallery: "", videoUrl: "", relatedProductIds: [], featured: false,
  showOnHome: true, homeOrder: 0, showcaseItems: [],
  h1: "", primaryKeyword: "", secondaryKeywords: "", seoTags: "",
  designFabrication: "", supplyAcrossIndia: "", faqs: [], applicationDetails: [],
  seoTitle: "", seoDescription: "", seoKeywords: "", sortOrder: 0, active: false,
};

const join = (a: string[] | null | undefined) => (a && a.length ? a.join("\n") : "");

function toForm(p: Product): Form {
  return {
    id: p.id, name: p.name, slug: p.slug, category: p.category,
    shortDescription: p.shortDescription, fullDescription: p.fullDescription,
    longDescription: p.longDescription ?? "", material: p.material ?? "",
    imageUrl: p.imageUrl, applications: join(p.applications),
    specifications: join(p.specifications), features: join(p.features), benefits: join(p.benefits),
    techSpecs: (p.technicalSpecifications ?? []).filter((s) => s && s.label && s.value),
    manufacturingProcess: join(p.manufacturingProcess),
    installationInformation: join(p.installationInformation),
    maintenanceInformation: join(p.maintenanceInformation),
    industries: join(p.industries),
    gallery: join(p.gallery), videoUrl: p.videoUrl ?? "",
    relatedProductIds: p.relatedProductIds ?? [],
    showOnHome: p.showOnHome ?? true, homeOrder: p.homeOrder ?? 0,
    h1: p.h1 ?? "", primaryKeyword: p.primaryKeyword ?? "",
    secondaryKeywords: (p.secondaryKeywords ?? []).join(", "),
    seoTags: (p.seoTags ?? []).join(", "),
    designFabrication: p.designFabrication ?? "", supplyAcrossIndia: p.supplyAcrossIndia ?? "",
    faqs: (p.faqs ?? []).filter((f) => f && f.question && f.answer),
    applicationDetails: (p.applicationDetails ?? []).filter((a) => a && a.title),
    showcaseItems: (p.showcaseItems ?? []).map((i) => ({
      type: i.type === "video" ? "video" : "image",
      url: String(i.url || ""),
      label: String(i.label || ""),
    })),
    featured: p.featured ?? false,
    seoTitle: p.seoTitle ?? "", seoDescription: p.seoDescription ?? "", seoKeywords: p.seoKeywords ?? "",
    sortOrder: p.sortOrder, active: p.active,
  };
}

const splitLines = (s: string) => s.split(/\n/).map((x) => x.trim()).filter(Boolean);
const splitComma = (s: string) => s.split(",").map((x) => x.trim()).filter(Boolean);

export default function ProductsAdmin() {
  const [items, setItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<Form | null>(null);
  const [saving, setSaving] = useState(false);
  const [category, setCategory] = useState("all");
  const [notice, setNotice] = useState("");

  async function load() {
    setLoading(true);
    const res = await fetch("/api/admin/products");
    setItems(await res.json());
    setLoading(false);
  }
  useEffect(() => {
    const selected = new URLSearchParams(window.location.search).get("category");
    Promise.resolve().then(() => {
      load();
      if (selected && PRODUCT_CATEGORIES.includes(selected)) setCategory(selected);
    });
  }, []);
  const visibleItems = category === "all" ? items : items.filter((item) => item.category === category);

  async function save(e: FormEvent) {
    e.preventDefault();
    if (!form) return;
    setSaving(true);
    const payload = {
      ...form,
      applications: splitComma(form.applications),
      specifications: splitComma(form.specifications),
      features: splitLines(form.features),
      benefits: splitLines(form.benefits),
      manufacturingProcess: splitLines(form.manufacturingProcess),
      installationInformation: splitLines(form.installationInformation),
      maintenanceInformation: splitLines(form.maintenanceInformation),
      industries: splitLines(form.industries),
      technicalSpecifications: form.techSpecs.filter((s) => s.label.trim() && s.value.trim()).map((s) => ({ label: s.label.trim(), value: s.value.trim() })),
      gallery: splitLines(form.gallery),
      videoUrl: form.videoUrl.trim() || null,
      relatedProductIds: form.relatedProductIds.map(Number).filter(Boolean),
      showOnHome: form.showOnHome,
      homeOrder: form.homeOrder,
      showcaseItems: form.showcaseItems
        .filter((i) => i.url.trim())
        .map((i) => ({ type: i.type, url: i.url.trim(), label: (i.label || "").trim() })),
      h1: form.h1.trim(),
      primaryKeyword: form.primaryKeyword.trim(),
      secondaryKeywords: splitComma(form.secondaryKeywords),
      seoTags: splitComma(form.seoTags),
      designFabrication: form.designFabrication.trim(),
      supplyAcrossIndia: form.supplyAcrossIndia.trim(),
      faqs: form.faqs.filter((f) => f.question.trim() && f.answer.trim()),
      applicationDetails: form.applicationDetails.filter((a) => a.title.trim()),
    };
    const url = form.id ? `/api/admin/products/${form.id}` : "/api/admin/products";
    const response = await fetch(url, {
      method: form.id ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const result = await response.json();
    setSaving(false);
    if (!response.ok) { setNotice(result.error || "Unable to save product. Please try again."); return; }
    setNotice(`Product ${form.id ? "updated" : "created"} successfully.`);
    setForm(null);
    load();
  }

  async function remove(id: number) {
    if (!confirm("Delete this product?")) return;
    const response = await fetch(`/api/admin/products/${id}`, { method: "DELETE" });
    if (!response.ok) { setNotice("Unable to delete product. Please try again."); return; }
    setItems((p) => p.filter((x) => x.id !== id));
    setNotice("Product deleted successfully.");
  }

  const setSpecRow = (i: number, key: keyof SpecRowForm, value: string) =>
    setForm((f) => {
      if (!f) return f;
      const techSpecs = f.techSpecs.map((row, idx) => (idx === i ? { ...row, [key]: value } : row));
      return { ...f, techSpecs };
    });

  return (
    <AdminPage
      title="Products"
      action={
        <button onClick={() => setForm(empty)} className="rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark">
          + Add Product
        </button>
      }
    >
      {notice && <button onClick={() => setNotice("")} className="mb-4 w-full rounded-lg bg-blue-50 p-3 text-left text-sm text-blue-800">{notice} ×</button>}
      <div className="mb-5 rounded-xl border border-slate-200 bg-white p-4">
        <label className="mb-1 block text-sm font-medium text-slate-700">Content Type</label>
        <select className={inputCls} value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="all">All products and machinery</option>
          {PRODUCT_CATEGORIES.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
      </div>
      {loading ? (
        <TableSkeleton />
      ) : visibleItems.length === 0 ? (
        <EmptyState icon="📦" title="No records found" text="Add content in this category or change the filter." />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-500">
              <tr><th className="p-3">Product</th><th className="p-3">Category</th><th className="p-3">Featured</th><th className="p-3">Active</th><th className="p-3">Actions</th></tr>
            </thead>
            <tbody>
              {visibleItems.map((p) => (
                <tr key={p.id} className="border-t border-slate-100 hover:bg-slate-50">
                  <td className="p-3">
                    <div className="flex items-center gap-3">
                      <img src={p.imageUrl} alt="" className="h-10 w-10 rounded object-cover" />
                      <span className="font-medium text-ink">{p.name}</span>
                    </div>
                  </td>
                  <td className="p-3 text-slate-600">{p.category}</td>
                  <td className="p-3">{p.featured ? "⭐" : "—"}</td>
                  <td className="p-3">{p.active ? "✅" : "—"}</td>
                  <td className="p-3">
                    <div className="flex gap-2">
                      <button onClick={() => setForm(toForm(p))} className="rounded bg-slate-100 px-3 py-1 text-xs font-semibold hover:bg-slate-200">Edit</button>
                      <button onClick={() => remove(p.id)} className="rounded bg-red-50 px-3 py-1 text-xs font-semibold text-red-600 hover:bg-red-100">Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={!!form} onClose={() => setForm(null)} title={form?.id ? "Edit Product" : "Add Product"}>
        {form && (
          <form onSubmit={save} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Name"><input required className={inputCls} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
              <Field label="Slug (optional)"><input className={inputCls} value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="auto from name" /></Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Category">
                <select className={inputCls} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                  {PRODUCT_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                </select>
              </Field>
              <ImageField label="Main Image (square, ~2:2)" value={form.imageUrl} onChange={(url) => setForm({ ...form, imageUrl: url })} category="products" hint="Drag & drop or click — uploaded to Cloudinary." />
            </div>
            <Field label="Short Description"><input required className={inputCls} value={form.shortDescription} onChange={(e) => setForm({ ...form, shortDescription: e.target.value })} /></Field>
            <Field label="Full Description"><textarea required rows={3} className={inputCls} value={form.fullDescription} onChange={(e) => setForm({ ...form, fullDescription: e.target.value })} /></Field>
            <Field label="Long Description (extended overview paragraph)"><textarea rows={4} className={inputCls} value={form.longDescription} onChange={(e) => setForm({ ...form, longDescription: e.target.value })} /></Field>
            <Field label="Material / Construction"><input className={inputCls} value={form.material} onChange={(e) => setForm({ ...form, material: e.target.value })} placeholder="e.g. CRCA MS sheet, 22G, SMACNA straight seams" /></Field>

            <ListInput label="Applications (comma separated)" value={form.applications.split(",").filter(Boolean)} onChange={(a) => setForm({ ...form, applications: a.join(", ") })} placeholder="One application per line" rows={3} />
            <ListInput label="Specifications (comma separated)" value={form.specifications.split(",").filter(Boolean)} onChange={(a) => setForm({ ...form, specifications: a.join(", ") })} placeholder="One spec per line" rows={3} />
            <ListInput label="Key Features" value={form.features.split("\n").filter(Boolean)} onChange={(a) => setForm({ ...form, features: a.join("\n") })} rows={4} />
            <ListInput label="Benefits" value={form.benefits.split("\n").filter(Boolean)} onChange={(a) => setForm({ ...form, benefits: a.join("\n") })} rows={4} />

            <div>
              <span className="mb-1 block text-sm font-medium text-slate-700">Technical Specifications (label / value)</span>
              <div className="space-y-2">
                {form.techSpecs.map((row, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input
                      className={inputCls}
                      placeholder="Label (e.g. Steel Grade)"
                      value={row.label}
                      onChange={(e) => setSpecRow(i, "label", e.target.value)}
                    />
                    <input
                      className={inputCls}
                      placeholder="Value (e.g. CRCA IS 513)"
                      value={row.value}
                      onChange={(e) => setSpecRow(i, "value", e.target.value)}
                    />
                    <button type="button" onClick={() => setForm((f) => f && ({ ...f, techSpecs: f.techSpecs.filter((_, idx) => idx !== i) }))} className="shrink-0 rounded bg-red-50 px-2 py-1 text-xs text-red-600 hover:bg-red-100">✕</button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => setForm((f) => f && ({ ...f, techSpecs: [...f.techSpecs, { label: "", value: "" }] }))}
                  className="rounded-md border border-dashed border-brand px-3 py-1.5 text-xs font-semibold text-brand hover:bg-brand/5"
                >
                  + Add row
                </button>
              </div>
            </div>

            <ListInput label="Manufacturing Process (steps)" value={form.manufacturingProcess.split("\n").filter(Boolean)} onChange={(a) => setForm({ ...form, manufacturingProcess: a.join("\n") })} rows={3} />
            <ListInput label="Installation Information" value={form.installationInformation.split("\n").filter(Boolean)} onChange={(a) => setForm({ ...form, installationInformation: a.join("\n") })} rows={3} />
            <ListInput label="Maintenance Information" value={form.maintenanceInformation.split("\n").filter(Boolean)} onChange={(a) => setForm({ ...form, maintenanceInformation: a.join("\n") })} rows={3} />
            <ListInput label="Industries / Applications served" value={form.industries.split("\n").filter(Boolean)} onChange={(a) => setForm({ ...form, industries: a.join("\n") })} rows={3} />

            <Field label="Hero Images — up to 6 (one image URL per line, shown in order)">
              <textarea rows={3} className={inputCls} value={form.gallery} onChange={(e) => setForm({ ...form, gallery: e.target.value })} placeholder="https://res.cloudinary.com/.../photo-1.jpg" />
              <p className="mt-1 text-xs text-slate-500">These fill the product hero gallery. Leave empty to use the main image.</p>
            </Field>
            <Field label="Hero Video (MP4/WebM link — shown as the last hero slide)">
              <input className={inputCls} value={form.videoUrl} onChange={(e) => setForm({ ...form, videoUrl: e.target.value })} placeholder="https://.../product-demo.mp4" />
            </Field>

            <div className="sm:col-span-2">
              <MediaListEditor
                label="Fabrication &amp; Project Installations — images &amp; videos"
                value={form.showcaseItems}
                onChange={(showcaseItems) => setForm({ ...form, showcaseItems })}
                category="products"
                addLabel="Add showcase item"
              />
            </div>

            <Field label="Related Products">
              <select
                multiple
                className={inputCls}
                value={form.relatedProductIds.map(String)}
                onChange={(e) => {
                  const ids = Array.from(e.target.selectedOptions).map((o) => Number(o.value));
                  setForm({ ...form, relatedProductIds: ids });
                }}
              >
                {items.filter((p) => p.id !== form.id).map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </Field>

            <div className="sm:col-span-2 rounded-lg border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Editorial Content</p>
              <div className="mt-3 space-y-3">
                <Field label="H1 (page heading)">
                  <input className={inputCls} value={form.h1} onChange={(e) => setForm({ ...form, h1: e.target.value })} placeholder="MS Rectangular Duct Manufacturer & Supplier in Mumbai, India" />
                </Field>
                <Field label="Design & Fabrication">
                  <textarea rows={4} className={inputCls} value={form.designFabrication} onChange={(e) => setForm({ ...form, designFabrication: e.target.value })} placeholder="**MS Rectangular Duct design and fabrication** process…" />
                </Field>
                <Field label="Supply Across India">
                  <textarea rows={3} className={inputCls} value={form.supplyAcrossIndia} onChange={(e) => setForm({ ...form, supplyAcrossIndia: e.target.value })} />
                </Field>
              </div>
            </div>

            <div className="sm:col-span-2 rounded-lg border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Applications (heading + paragraph)</p>
                <button type="button" onClick={() => setForm({ ...form, applicationDetails: [...form.applicationDetails, { title: "", description: "" }] })} className="rounded bg-white px-2.5 py-1 text-xs font-semibold text-brand ring-1 ring-slate-200">+ Add</button>
              </div>
              <div className="mt-3 space-y-2">
                {form.applicationDetails.map((a, i) => (
                  <div key={i} className="flex flex-wrap items-start gap-2 rounded-md border border-slate-200 bg-white p-2">
                    <input className={`${inputCls} w-52`} placeholder="Heading" value={a.title} onChange={(e) => setForm({ ...form, applicationDetails: form.applicationDetails.map((x, j) => j === i ? { ...x, title: e.target.value } : x) })} />
                    <textarea rows={2} className={`${inputCls} flex-1 min-w-[220px]`} placeholder="Description" value={a.description} onChange={(e) => setForm({ ...form, applicationDetails: form.applicationDetails.map((x, j) => j === i ? { ...x, description: e.target.value } : x) })} />
                    <button type="button" onClick={() => setForm({ ...form, applicationDetails: form.applicationDetails.filter((_, j) => j !== i) })} className="rounded bg-red-50 px-2 py-1 text-xs text-red-700">Remove</button>
                  </div>
                ))}
                {!form.applicationDetails.length && <p className="text-xs text-slate-400">No application blocks yet.</p>}
              </div>
            </div>

            <div className="sm:col-span-2 rounded-lg border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">FAQs</p>
                <button type="button" onClick={() => setForm({ ...form, faqs: [...form.faqs, { question: "", answer: "" }] })} className="rounded bg-white px-2.5 py-1 text-xs font-semibold text-brand ring-1 ring-slate-200">+ Add</button>
              </div>
              <div className="mt-3 space-y-2">
                {form.faqs.map((f, i) => (
                  <div key={i} className="flex flex-wrap items-start gap-2 rounded-md border border-slate-200 bg-white p-2">
                    <input className={`${inputCls} w-64`} placeholder="Question" value={f.question} onChange={(e) => setForm({ ...form, faqs: form.faqs.map((x, j) => j === i ? { ...x, question: e.target.value } : x) })} />
                    <textarea rows={2} className={`${inputCls} flex-1 min-w-[220px]`} placeholder="Answer" value={f.answer} onChange={(e) => setForm({ ...form, faqs: form.faqs.map((x, j) => j === i ? { ...x, answer: e.target.value } : x) })} />
                    <button type="button" onClick={() => setForm({ ...form, faqs: form.faqs.filter((_, j) => j !== i) })} className="rounded bg-red-50 px-2 py-1 text-xs text-red-700">Remove</button>
                  </div>
                ))}
                {!form.faqs.length && <p className="text-xs text-slate-400">No FAQs yet — the page falls back to generated answers.</p>}
              </div>
            </div>

            <details className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <summary className="cursor-pointer text-sm font-semibold text-slate-700">SEO Settings</summary>
              <div className="mt-3 space-y-3">
                <Field label="SEO Title"><input className={inputCls} value={form.seoTitle} onChange={(e) => setForm({ ...form, seoTitle: e.target.value })} /></Field>
                <Field label="SEO Description"><textarea rows={2} className={inputCls} value={form.seoDescription} onChange={(e) => setForm({ ...form, seoDescription: e.target.value })} /></Field>
                <Field label="SEO Keywords"><input className={inputCls} value={form.seoKeywords} onChange={(e) => setForm({ ...form, seoKeywords: e.target.value })} /></Field>
                <Field label="Primary Keyword"><input className={inputCls} value={form.primaryKeyword} onChange={(e) => setForm({ ...form, primaryKeyword: e.target.value })} /></Field>
                <Field label="Secondary Keywords (comma separated)"><input className={inputCls} value={form.secondaryKeywords} onChange={(e) => setForm({ ...form, secondaryKeywords: e.target.value })} /></Field>
                <Field label="SEO Tags (8–15, comma separated)"><input className={inputCls} value={form.seoTags} onChange={(e) => setForm({ ...form, seoTags: e.target.value })} /></Field>
              </div>
            </details>

            <div className="sm:col-span-2">
              <HomePlacementFields
                showOnHome={form.showOnHome}
                homeOrder={form.homeOrder}
                onChange={(v) => setForm({ ...form, ...v })}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Sort Order"><input type="number" className={inputCls} value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })} /></Field>
              <label className="mt-7 flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} /> Active
              </label>
              <label className="mt-7 flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.featured} onChange={(e) => setForm({ ...form, featured: e.target.checked })} /> Featured (homepage spot)
              </label>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setForm(null)} className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold">Cancel</button>
              <button disabled={saving} className="rounded-md bg-brand px-5 py-2 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-60">{saving ? "Saving..." : "Save"}</button>
            </div>
          </form>
        )}
      </Modal>
    </AdminPage>
  );
}