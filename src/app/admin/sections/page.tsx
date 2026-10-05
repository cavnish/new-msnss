"use client";

import { useEffect, useState } from "react";
import {
  AdminPage,
  EmptyState,
  Field,
  ImageField,
  TableSkeleton,
  inputCls,
} from "@/components/admin/AdminUI";
import type { SectionMedia } from "@/db/schema";

/**
 * Admin surface for the imagery used by the two fixed marketing sections:
 *   • "Why Industry Leaders Choose MSNSS"  → tiles + centre map
 *   • "Ducting Solutions Across Critical Applications" → grid tiles
 * Only images are managed here; the section copy stays in the shared components.
 */

const GROUPS = [
  {
    key: "why-choose",
    title: "Why Choose MSNSS — project tiles",
    hint: "Add up to 3 tiles. Title becomes the label, caption the sub-label.",
  },
  {
    key: "why-choose-map",
    title: "Why Choose MSNSS — centre map",
    hint: "Use a single image. Title becomes the pill text below the map.",
  },
  {
    key: "applications",
    title: "Ducting Solutions Across Critical Applications",
    hint: "Each tile is one application. Title becomes the label on the tile.",
  },
] as const;

type Draft = {
  id?: number;
  sectionKey: string;
  title: string;
  imageUrl: string;
  altText: string;
  caption: string;
  sortOrder: number;
  active: boolean;
};

const blank = (sectionKey: string): Draft => ({
  sectionKey,
  title: "",
  imageUrl: "",
  altText: "",
  caption: "",
  sortOrder: 0,
  active: true,
});

export default function SectionsAdmin() {
  const [items, setItems] = useState<SectionMedia[]>([]);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState("");
  const [draft, setDraft] = useState<Draft | null>(null);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/section-media");
      if (!res.ok) throw new Error((await res.json()).error || "Unable to load section images");
      setItems(await res.json());
    } catch (e) {
      setNotice((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void Promise.resolve().then(load);
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!draft) return;
    if (!draft.imageUrl.trim()) {
      setNotice("Please upload or paste an image URL before saving.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(
        draft.id ? `/api/admin/section-media/${draft.id}` : "/api/admin/section-media",
        {
          method: draft.id ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(draft),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Unable to save the image");
      setNotice(`Section image ${draft.id ? "updated" : "added"} and published.`);
      setDraft(null);
      await load();
    } catch (err) {
      setNotice((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function remove(row: SectionMedia) {
    if (!confirm("Delete this section image?")) return;
    const res = await fetch(`/api/admin/section-media/${row.id}`, { method: "DELETE" });
    const data = await res.json();
    setNotice(res.ok ? "Section image deleted and published." : data.error || "Unable to delete");
    await load();
  }

  async function toggleActive(row: SectionMedia) {
    const res = await fetch(`/api/admin/section-media/${row.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !row.active }),
    });
    if (!res.ok) setNotice((await res.json()).error || "Unable to update");
    await load();
  }

  return (
    <AdminPage
      title="Home Page Section Images"
      action={
        <a href="/" target="_blank" rel="noreferrer" className="rounded-md border bg-white px-4 py-2 text-sm font-semibold">
          View Site
        </a>
      }
    >
      {notice && (
        <button onClick={() => setNotice("")} className="mb-4 w-full rounded-lg bg-blue-50 p-3 text-left text-sm text-blue-800">
          {notice} ×
        </button>
      )}

      <p className="mb-6 rounded-xl border bg-white p-4 text-sm text-slate-600">
        Control the photography shown in the two fixed marketing sections on the home page (and
        product / solution pages). Saving here publishes a new content version immediately.
      </p>

      {loading ? (
        <TableSkeleton />
      ) : (
        <div className="space-y-8">
          {GROUPS.map((group) => {
            const rows = items.filter((i) => i.sectionKey === group.key);
            return (
              <section key={group.key} className="rounded-xl border bg-white p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-bold text-ink">{group.title}</h2>
                    <p className="mt-1 text-sm text-slate-500">{group.hint}</p>
                  </div>
                  <button
                    onClick={() => setDraft(blank(group.key))}
                    className="rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white"
                  >
                    + Add Image
                  </button>
                </div>

                {!rows.length ? (
                  <div className="mt-4">
                    <EmptyState
                      icon="🖼️"
                      title="No images added yet"
                      text="The site is using its built-in default imagery for this section."
                    />
                  </div>
                ) : (
                  <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {rows.map((row) => (
                      <div key={row.id} className="overflow-hidden rounded-lg border border-slate-200">
                        <img
                          src={row.imageUrl}
                          alt={row.altText || row.title}
                          className="h-32 w-full bg-slate-100 object-cover"
                        />
                        <div className="p-3">
                          <p className="truncate text-sm font-semibold text-ink">
                            {row.title || "(no title)"}
                          </p>
                          <p className="truncate text-xs text-slate-500">{row.caption || "—"}</p>
                          <div className="mt-3 flex flex-wrap gap-2">
                            <button
                              onClick={() =>
                                setDraft({
                                  id: row.id,
                                  sectionKey: row.sectionKey,
                                  title: row.title,
                                  imageUrl: row.imageUrl,
                                  altText: row.altText,
                                  caption: row.caption,
                                  sortOrder: row.sortOrder,
                                  active: row.active,
                                })
                              }
                              className="rounded bg-slate-100 px-2 py-1 text-xs"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => toggleActive(row)}
                              className={`rounded px-2 py-1 text-xs ${
                                row.active ? "bg-amber-50 text-amber-700" : "bg-green-50 text-green-700"
                              }`}
                            >
                              {row.active ? "Hide" : "Show"}
                            </button>
                            <button
                              onClick={() => remove(row)}
                              className="rounded bg-red-50 px-2 py-1 text-xs text-red-700"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            );
          })}
        </div>
      )}

      {/* Editor */}
      {draft && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4">
          <div className="my-8 w-full max-w-2xl rounded-xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 p-5">
              <h2 className="text-lg font-bold text-ink">
                {draft.id ? "Edit Section Image" : "Add Section Image"}
              </h2>
              <button onClick={() => setDraft(null)} className="rounded p-1 text-slate-400 hover:bg-slate-100">
                ✕
              </button>
            </div>
            <form onSubmit={save} className="space-y-4 p-5">
              <ImageField
                label="Image"
                value={draft.imageUrl}
                onChange={(url) => setDraft({ ...draft, imageUrl: url })}
                category="uploads"
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Title / Label">
                  <input
                    className={inputCls}
                    value={draft.title}
                    onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                    placeholder="e.g. Commercial Kitchens"
                  />
                </Field>
                <Field label="Caption / Sub-label">
                  <input
                    className={inputCls}
                    value={draft.caption}
                    onChange={(e) => setDraft({ ...draft, caption: e.target.value })}
                    placeholder="e.g. Grease-safe exhaust ducting"
                  />
                </Field>
              </div>
              <Field label="Alt text (accessibility & SEO)">
                <input
                  className={inputCls}
                  value={draft.altText}
                  onChange={(e) => setDraft({ ...draft, altText: e.target.value })}
                />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Display order">
                  <input
                    type="number"
                    className={inputCls}
                    value={draft.sortOrder}
                    onChange={(e) => setDraft({ ...draft, sortOrder: Number(e.target.value) || 0 })}
                  />
                </Field>
                <label className="mt-7 flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={draft.active}
                    onChange={(e) => setDraft({ ...draft, active: e.target.checked })}
                  />
                  Visible on the website
                </label>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setDraft(null)}
                  className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold"
                >
                  Cancel
                </button>
                <button
                  disabled={saving}
                  className="rounded-md bg-brand px-5 py-2 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-60"
                >
                  {saving ? "Saving…" : "Save & Publish"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminPage>
  );
}
