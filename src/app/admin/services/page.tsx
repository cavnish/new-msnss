"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { AdminPage, Modal, Field, inputCls, EmptyState, TableSkeleton, ListInput, ImageField, HomePlacementFields } from "@/components/admin/AdminUI";
import type { Service } from "@/db/schema";

type FaqForm = { question: string; answer: string };

type Form = {
  id?: number; name: string; slug: string; icon: string;
  shortDescription: string; fullDescription: string;
  imageUrl: string; gallery: string; videoUrl: string; highlights: string;
  capabilities: string; benefits: string; process: string; equipment: string; applications: string;
  faqs: FaqForm[];
  featured: boolean; seoTitle: string; seoDescription: string; seoKeywords: string;
  sortOrder: number; active: boolean;
  showOnHome: boolean; homeOrder: number;
};

const empty: Form = {
  name: "", slug: "", icon: "🔧", shortDescription: "", fullDescription: "",
  imageUrl: "", gallery: "", videoUrl: "", highlights: "",
  capabilities: "", benefits: "", process: "", equipment: "", applications: "", faqs: [],
  featured: false, seoTitle: "", seoDescription: "", seoKeywords: "", sortOrder: 0, active: false,
  showOnHome: true, homeOrder: 0,
};

const join = (a: string[] | null | undefined) => (a && a.length ? a.join("\n") : "");

function toForm(s: Service): Form {
  return {
    id: s.id, name: s.name, slug: s.slug, icon: s.icon,
    shortDescription: s.shortDescription, fullDescription: s.fullDescription,
    imageUrl: s.imageUrl ?? "", gallery: join(s.gallery),
    videoUrl: s.videoUrl ?? "", highlights: join(s.highlights),
    capabilities: join(s.capabilities), benefits: join(s.benefits), process: join(s.process),
    equipment: join(s.equipment), applications: join(s.applications),
    faqs: (s.faqs ?? []).filter((f) => f && f.question && f.answer),
    featured: s.featured ?? false, seoTitle: s.seoTitle ?? "", seoDescription: s.seoDescription ?? "", seoKeywords: s.seoKeywords ?? "",
    sortOrder: s.sortOrder, active: s.active,
    showOnHome: s.showOnHome ?? true, homeOrder: s.homeOrder ?? 0,
  };
}

const splitLines = (s: string) => s.split(/\n/).map((x) => x.trim()).filter(Boolean);

export default function ServicesAdmin() {
  const [items, setItems] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<Form | null>(null);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");

  async function load() {
    setLoading(true);
    setItems(await (await fetch("/api/admin/services")).json());
    setLoading(false);
  }
  useEffect(() => { Promise.resolve().then(load); }, []);

  async function save(e: FormEvent) {
    e.preventDefault();
    if (!form) return;
    setSaving(true);
    const payload = {
      ...form,
      gallery: splitLines(form.gallery),
      highlights: splitLines(form.highlights),
      capabilities: splitLines(form.capabilities),
      benefits: splitLines(form.benefits),
      process: splitLines(form.process),
      equipment: splitLines(form.equipment),
      applications: splitLines(form.applications),
      faqs: form.faqs.filter((f) => f.question.trim() && f.answer.trim()).map((f) => ({ question: f.question.trim(), answer: f.answer.trim() })),
      imageUrl: form.imageUrl.trim() || null,
      videoUrl: form.videoUrl.trim() || null,
    };
    const url = form.id ? `/api/admin/services/${form.id}` : "/api/admin/services";
    const response = await fetch(url, { method: form.id ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    const result = await response.json();
    setSaving(false);
    if (!response.ok) { setNotice(result.error || "Unable to save solution. Please try again."); return; }
    setNotice(`Solution ${form.id ? "updated" : "created"} successfully.`);
    setForm(null); load();
  }
  async function remove(id: number) {
    if (!confirm("Delete this service?")) return;
    const response = await fetch(`/api/admin/services/${id}`, { method: "DELETE" });
    if (!response.ok) { setNotice("Unable to delete solution. Please try again."); return; }
    setItems((p) => p.filter((x) => x.id !== id));
    setNotice("Solution deleted successfully.");
  }

  const setFaq = (i: number, key: keyof FaqForm, value: string) =>
    setForm((f) => {
      if (!f) return f;
      const faqs = f.faqs.map((row, idx) => (idx === i ? { ...row, [key]: value } : row));
      return { ...f, faqs };
    });

  return (
    <AdminPage title="Solutions" action={<button onClick={() => setForm(empty)} className="rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark">+ Add Service</button>}>
      {notice && <button onClick={() => setNotice("")} className="mb-4 w-full rounded-lg bg-blue-50 p-3 text-left text-sm text-blue-800">{notice} ×</button>}
      {loading ? <TableSkeleton /> : items.length === 0 ? (
        <EmptyState icon="🔧" title="No services" text="Add your first service." />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-500"><tr><th className="p-3">Service</th><th className="p-3">Media</th><th className="p-3">Featured</th><th className="p-3">Active</th><th className="p-3">Actions</th></tr></thead>
            <tbody>
              {items.map((s) => (
                <tr key={s.id} className="border-t border-slate-100 hover:bg-slate-50">
                  <td className="p-3">
                    <div className="flex items-center gap-3">
                      {s.imageUrl ? <img src={s.imageUrl} alt="" className="h-10 w-10 rounded object-cover" /> : <span className="flex h-10 w-10 items-center justify-center rounded bg-slate-100 text-lg">{s.icon || "◇"}</span>}
                      <span className="font-medium text-ink">{s.name}</span>
                    </div>
                  </td>
                  <td className="p-3 text-xs text-slate-500">{(s.gallery?.length || 0)} photo{(s.gallery?.length || 0) === 1 ? "" : "s"}{s.videoUrl ? " · video" : ""}</td>
                  <td className="p-3">{s.featured ? "⭐" : "—"}</td>
                  <td className="p-3">{s.active ? "✅" : "—"}</td>
                  <td className="p-3"><div className="flex gap-2">
                    <button onClick={() => setForm(toForm(s))} className="rounded bg-slate-100 px-3 py-1 text-xs font-semibold hover:bg-slate-200">Edit</button>
                    <button onClick={() => remove(s.id)} className="rounded bg-red-50 px-3 py-1 text-xs font-semibold text-red-600 hover:bg-red-100">Delete</button>
                  </div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={!!form} onClose={() => setForm(null)} title={form?.id ? "Edit Service" : "Add Service"}>
        {form && (
          <form onSubmit={save} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Name"><input required className={inputCls} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
              <Field label="Icon (emoji)"><input className={inputCls} value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })} /></Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Short Description"><input required className={inputCls} value={form.shortDescription} onChange={(e) => setForm({ ...form, shortDescription: e.target.value })} /></Field>
              <ImageField label="Main Image" value={form.imageUrl} onChange={(url) => setForm({ ...form, imageUrl: url })} category="services" hint="Drag & drop or click — uploaded to Cloudinary." />
            </div>
            <Field label="Full Description"><textarea required rows={4} className={inputCls} value={form.fullDescription} onChange={(e) => setForm({ ...form, fullDescription: e.target.value })} /></Field>
            <ListInput label="Highlights" value={form.highlights.split("\n").filter(Boolean)} onChange={(a) => setForm({ ...form, highlights: a.join("\n") })} placeholder="Drawing-based execution, MS & SS options" rows={3} />
            <ListInput label="Capabilities" value={form.capabilities.split("\n").filter(Boolean)} onChange={(a) => setForm({ ...form, capabilities: a.join("\n") })} rows={3} />
            <ListInput label="Benefits" value={form.benefits.split("\n").filter(Boolean)} onChange={(a) => setForm({ ...form, benefits: a.join("\n") })} rows={3} />
            <ListInput label="Process / Methodology (steps)" value={form.process.split("\n").filter(Boolean)} onChange={(a) => setForm({ ...form, process: a.join("\n") })} rows={3} />
            <ListInput label="Equipment / Machinery used" value={form.equipment.split("\n").filter(Boolean)} onChange={(a) => setForm({ ...form, equipment: a.join("\n") })} rows={3} />
            <ListInput label="Applications" value={form.applications.split("\n").filter(Boolean)} onChange={(a) => setForm({ ...form, applications: a.join("\n") })} rows={3} />

            <div>
              <span className="mb-1 block text-sm font-medium text-slate-700">FAQs (question / answer)</span>
              <div className="space-y-3">
                {form.faqs.map((f, i) => (
                  <div key={i} className="space-y-1.5 rounded-lg border border-slate-200 p-2.5">
                    <div className="flex items-center gap-2">
                      <input className={inputCls} placeholder="Question" value={f.question} onChange={(e) => setFaq(i, "question", e.target.value)} />
                      <button type="button" onClick={() => setForm((s) => s && ({ ...s, faqs: s.faqs.filter((_, idx) => idx !== i) }))} className="shrink-0 rounded bg-red-50 px-2 py-1 text-xs text-red-600 hover:bg-red-100">✕</button>
                    </div>
                    <textarea className={inputCls} rows={2} placeholder="Answer" value={f.answer} onChange={(e) => setFaq(i, "answer", e.target.value)} />
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => setForm((s) => s && ({ ...s, faqs: [...s.faqs, { question: "", answer: "" }] }))}
                  className="rounded-md border border-dashed border-brand px-3 py-1.5 text-xs font-semibold text-brand hover:bg-brand/5"
                >
                  + Add FAQ
                </button>
              </div>
            </div>

            <Field label="Photo Gallery (one image URL per line)">
              <textarea rows={3} className={inputCls} value={form.gallery} onChange={(e) => setForm({ ...form, gallery: e.target.value })} placeholder="https://res.cloudinary.com/.../photo-1.jpg" />
            </Field>
            <Field label="Video URL (MP4/WebM link)"><input className={inputCls} value={form.videoUrl} onChange={(e) => setForm({ ...form, videoUrl: e.target.value })} placeholder="https://.../service-demo.mp4" /></Field>

            <details className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <summary className="cursor-pointer text-sm font-semibold text-slate-700">SEO Settings</summary>
              <div className="mt-3 space-y-3">
                <Field label="SEO Title"><input className={inputCls} value={form.seoTitle} onChange={(e) => setForm({ ...form, seoTitle: e.target.value })} /></Field>
                <Field label="SEO Description"><textarea rows={2} className={inputCls} value={form.seoDescription} onChange={(e) => setForm({ ...form, seoDescription: e.target.value })} /></Field>
                <Field label="SEO Keywords"><input className={inputCls} value={form.seoKeywords} onChange={(e) => setForm({ ...form, seoKeywords: e.target.value })} /></Field>
              </div>
            </details>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="sm:col-span-2">
                <HomePlacementFields showOnHome={form.showOnHome} homeOrder={form.homeOrder} onChange={(v) => setForm({ ...form, ...v })} />
              </div>
              <Field label="Sort Order"><input type="number" className={inputCls} value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })} /></Field>
              <label className="mt-7 flex items-center gap-2 text-sm"><input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} /> Active</label>
              <label className="mt-7 flex items-center gap-2 text-sm"><input type="checkbox" checked={form.featured} onChange={(e) => setForm({ ...form, featured: e.target.checked })} /> Featured</label>
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