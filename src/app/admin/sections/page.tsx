"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
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
 * Admin surface for the imagery used by the homepage section images and marketing sections:
 *   • Homepage Section Images (single-image slots with built-in fallbacks):
 *       1. home-about-main       → About section (large main photo)
 *       2. home-about-overlay    → About section (overlapping accent photo)
 *       3. home-fire-rated       → Fire-Rated Solutions split panel
 *       4. home-facility         → Inside the MSNSS Manufacturing Facility
 *       5. home-brief-bg         → "Have a project in mind" brief panel backdrop
 *       6. home-cta-bg           → Closing CTA band backdrop
 *   • Multi-image marketing sections:
 *       • "Why Industry Leaders Choose MSNSS" (tiles + centre map)
 *       • "Ducting Solutions Across Critical Applications" (grid tiles)
 *
 * All uploads/replacements/deletions use the section_media CRUD & publish system,
 * syncing directly to PostgreSQL and publishing an atomic static content snapshot.
 * When deleted, slots instantly restore their built-in fallback defaults.
 */

const SINGLE_SLOTS = [
  {
    key: "home-about-main",
    title: "About — Main Photo",
    usedIn: "Home → About composition (primary large photo)",
    fallback: "/images/factory.jpg",
    anchor: "/#about",
    aspectRatio: "4 / 3",
    recommendation: "Landscape 4:3 (approx. 1024 × 768 px)",
    description: "Main photograph showing HVAC duct manufacturing inside the facility.",
  },
  {
    key: "home-about-overlay",
    title: "About — Overlapping Photo",
    usedIn: "Home → About composition (floating accent photo)",
    fallback: "/images/hero-3.jpg",
    anchor: "/#about",
    aspectRatio: "16 / 10",
    recommendation: "Landscape 16:10 (approx. 448 × 320 px)",
    description: "Secondary badge photo showing finished duct installation on site.",
  },
  {
    key: "home-fire-rated",
    title: "Fire-Rated Solutions Photo",
    usedIn: "Home → Fire Protection split panel (also on product pages)",
    fallback: "/images/fire-rated.jpg",
    anchor: "/#fire-rated",
    aspectRatio: "4 / 3",
    recommendation: "Landscape 4:3 (approx. 1024 × 768 px)",
    description: "Featured duct installation highlighting certified fire-rated coatings.",
  },
  {
    key: "home-facility",
    title: "Manufacturing Facility Photo",
    usedIn: "Home → Inside the MSNSS Manufacturing Facility",
    fallback: "/images/factory.jpg",
    anchor: "/#facility",
    aspectRatio: "4 / 3",
    recommendation: "Landscape 4:3 (approx. 1024 × 768 px)",
    description: "Plant photo showcasing workshop machinery, sheet forming, and cutting.",
  },
  {
    key: "home-brief-bg",
    title: "Project Brief Panel Background",
    usedIn: "Home → “Have a project in mind?” dark panel backdrop",
    fallback: "/images/hero-1.jpg",
    anchor: "/#brief",
    aspectRatio: "16 / 9",
    recommendation: "Wide 16:9 (approx. 1920 × 1080 px)",
    description: "Subtle atmospheric photography overlaid behind the dark contact panel.",
  },
  {
    key: "home-cta-bg",
    title: "Closing CTA Band Background",
    usedIn: "Shared closing CTA band (home & all pages)",
    fallback: "/images/hero-2.jpg",
    anchor: "/#cta-band",
    aspectRatio: "21 / 9",
    recommendation: "Panoramic 21:9 or 16:9 (approx. 1920 × 600 px)",
    description: "Photographic backdrop showing real ducting with graded blue contrast.",
  },
] as const;

type SingleSlot = (typeof SINGLE_SLOTS)[number];

const MULTI_GROUPS = [
  {
    key: "why-choose",
    title: "Why Choose MSNSS — Project Tiles",
    hint: "Add up to 3 tiles. Title becomes the label, caption the sub-label.",
  },
  {
    key: "why-choose-map",
    title: "Why Choose MSNSS — Centre Map",
    hint: "Use a single image. Title becomes the pill text below the map.",
  },
  {
    key: "applications",
    title: "Ducting Solutions Across Critical Applications",
    hint: "Each tile is one application. Title becomes the label on the tile.",
  },
] as const;

type MultiDraft = {
  id?: number;
  sectionKey: string;
  title: string;
  imageUrl: string;
  altText: string;
  caption: string;
  sortOrder: number;
  active: boolean;
};

type SlotEditorState = {
  slot: SingleSlot;
  existingId?: number;
  imageUrl: string;
  altText: string;
  active: boolean;
};

export default function SectionsAdmin() {
  const [items, setItems] = useState<SectionMedia[]>([]);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState<{ text: string; type: "success" | "error" | "info" } | null>(
    null
  );
  const [activeTab, setActiveTab] = useState<"home-slots" | "multi-sections">("home-slots");

  // Single Slot Modals
  const [previewModalSlot, setPreviewModalSlot] = useState<SingleSlot | null>(null);
  const [slotEditor, setSlotEditor] = useState<SlotEditorState | null>(null);
  const [savingSlot, setSavingSlot] = useState(false);
  const [deletingKey, setDeletingKey] = useState<string | null>(null);

  // Multi-Section Draft Modal
  const [multiDraft, setMultiDraft] = useState<MultiDraft | null>(null);
  const [savingMulti, setSavingMulti] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/section-media");
      if (!res.ok) throw new Error((await res.json()).error || "Unable to load section images");
      setItems(await res.json());
    } catch (e) {
      setNotice({ text: (e as Error).message, type: "error" });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void Promise.resolve().then(load);
  }, []);

  /* ──────────────── Single Slot CRUD Actions ──────────────── */

  function openUpload(slot: SingleSlot) {
    const winner = items.find((i) => i.sectionKey === slot.key && i.active !== false);
    const existing = winner || items.find((i) => i.sectionKey === slot.key);
    setSlotEditor({
      slot,
      existingId: existing?.id,
      imageUrl: existing?.imageUrl || "",
      altText: existing?.altText || "",
      active: existing ? existing.active : true,
    });
  }

  async function handleSaveSlot(e: React.FormEvent) {
    e.preventDefault();
    if (!slotEditor) return;
    if (!slotEditor.imageUrl.trim()) {
      setNotice({ text: "Please upload or provide an image URL before saving.", type: "error" });
      return;
    }

    setSavingSlot(true);
    try {
      const payload = {
        sectionKey: slotEditor.slot.key,
        title: slotEditor.slot.title,
        imageUrl: slotEditor.imageUrl.trim(),
        altText: slotEditor.altText.trim(),
        caption: slotEditor.slot.usedIn,
        sortOrder: 0,
        active: slotEditor.active,
      };

      let res: Response;
      if (slotEditor.existingId) {
        res = await fetch(`/api/admin/section-media/${slotEditor.existingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        // Clean up any stale inactive rows for this slotKey before inserting fresh
        await fetch(
          `/api/admin/section-media?sectionKey=${encodeURIComponent(slotEditor.slot.key)}`,
          { method: "DELETE" }
        ).catch(() => null);

        res = await fetch("/api/admin/section-media", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Unable to save section image");

      setNotice({
        text: `“${slotEditor.slot.title}” image saved and published live to the homepage!`,
        type: "success",
      });
      setSlotEditor(null);
      setPreviewModalSlot(null);
      await load();
    } catch (err) {
      setNotice({ text: (err as Error).message, type: "error" });
    } finally {
      setSavingSlot(false);
    }
  }

  async function handleDeleteSlot(slot: SingleSlot) {
    if (
      !confirm(
        `Delete custom image for “${slot.title}”?\n\nThe homepage will immediately revert to the built-in fallback default (${slot.fallback}).`
      )
    ) {
      return;
    }

    setDeletingKey(slot.key);
    try {
      const res = await fetch(
        `/api/admin/section-media?sectionKey=${encodeURIComponent(slot.key)}`,
        { method: "DELETE" }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Unable to delete section image");

      setNotice({
        text: `Custom image for “${slot.title}” deleted. Built-in default (${slot.fallback}) restored and published live!`,
        type: "success",
      });
      setPreviewModalSlot(null);
      await load();
    } catch (err) {
      setNotice({ text: (err as Error).message, type: "error" });
    } finally {
      setDeletingKey(null);
    }
  }

  /* ──────────────── Multi-Section Actions ──────────────── */

  async function handleSaveMulti(e: React.FormEvent) {
    e.preventDefault();
    if (!multiDraft) return;
    if (!multiDraft.imageUrl.trim()) {
      setNotice({ text: "Please upload or paste an image URL before saving.", type: "error" });
      return;
    }
    setSavingMulti(true);
    try {
      const res = await fetch(
        multiDraft.id ? `/api/admin/section-media/${multiDraft.id}` : "/api/admin/section-media",
        {
          method: multiDraft.id ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(multiDraft),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Unable to save image");
      setNotice({
        text: `Marketing section image ${multiDraft.id ? "updated" : "added"} and published.`,
        type: "success",
      });
      setMultiDraft(null);
      await load();
    } catch (err) {
      setNotice({ text: (err as Error).message, type: "error" });
    } finally {
      setSavingMulti(false);
    }
  }

  async function removeMultiRow(row: SectionMedia) {
    if (!confirm("Delete this section image? The site will update immediately.")) return;
    const res = await fetch(`/api/admin/section-media/${row.id}`, { method: "DELETE" });
    const data = await res.json();
    setNotice({
      text: res.ok ? "Image deleted and published." : data.error || "Unable to delete",
      type: res.ok ? "success" : "error",
    });
    await load();
  }

  async function toggleMultiActive(row: SectionMedia) {
    const res = await fetch(`/api/admin/section-media/${row.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !row.active }),
    });
    if (!res.ok) {
      setNotice({ text: (await res.json()).error || "Unable to update", type: "error" });
    }
    await load();
  }

  // Count active custom slots
  const customCount = SINGLE_SLOTS.filter((s) =>
    items.some((i) => i.sectionKey === s.key && i.active !== false && i.imageUrl?.trim())
  ).length;

  return (
    <AdminPage
      title="Home Page Section Images"
      action={
        <div className="flex items-center gap-2">
          <Link
            href="/"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            <span>View Live Site</span>
            <span aria-hidden="true">↗</span>
          </Link>
        </div>
      }
    >
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="mb-4 flex items-center gap-1.5 text-xs text-slate-500">
        <Link href="/admin" className="font-medium text-slate-600 hover:text-brand">
          Admin
        </Link>
        <span>/</span>
        <span className="font-medium text-brand">Sections</span>
        <span>/</span>
        <span className="font-semibold text-slate-900">Home Page Section Images</span>
      </nav>

      {/* Notifications */}
      {notice && (
        <div
          role="alert"
          className={`mb-5 flex items-center justify-between rounded-xl p-3.5 text-sm shadow-sm transition ${
            notice.type === "success"
              ? "border border-green-200 bg-green-50 text-green-900"
              : notice.type === "error"
              ? "border border-red-200 bg-red-50 text-red-900"
              : "border border-blue-200 bg-blue-50 text-blue-900"
          }`}
        >
          <div className="flex items-center gap-2">
            <span>{notice.type === "success" ? "✓" : notice.type === "error" ? "⚠" : "ℹ"}</span>
            <span className="font-medium">{notice.text}</span>
          </div>
          <button
            onClick={() => setNotice(null)}
            className="rounded p-1 text-xs opacity-70 hover:opacity-100"
            aria-label="Dismiss notice"
          >
            ✕
          </button>
        </div>
      )}

      {/* Header Info & Stats Bar */}
      <div className="mb-6 rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-slate-50/50 p-5 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="max-w-2xl">
            <h2 className="text-base font-bold text-ink">
              Direct Marketing &amp; Homepage Photography Controls
            </h2>
            <p className="mt-1 text-xs leading-relaxed text-slate-600">
              Manage the 6 core homepage section photo slots. Each slot features instant live preview,
              drag-and-drop upload, image replace, and deletion with automatic rollback to built-in
              defaults. Changes publish atomically to the live site via the versioned content store.
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <div className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-center shadow-xs">
              <span className="block text-xl font-extrabold text-emerald-600">{customCount}</span>
              <span className="text-[11px] font-semibold text-slate-500">Custom Active</span>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-center shadow-xs">
              <span className="block text-xl font-extrabold text-slate-600">
                {SINGLE_SLOTS.length - customCount}
              </span>
              <span className="text-[11px] font-semibold text-slate-500">Using Defaults</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="mb-6 flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab("home-slots")}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-semibold transition ${
            activeTab === "home-slots"
              ? "border-brand text-brand"
              : "border-transparent text-slate-600 hover:text-ink"
          }`}
        >
          <span>Home Page Section Images</span>
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-bold ${
              activeTab === "home-slots" ? "bg-brand/10 text-brand" : "bg-slate-100 text-slate-600"
            }`}
          >
            6 slots
          </span>
        </button>
        <button
          onClick={() => setActiveTab("multi-sections")}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-semibold transition ${
            activeTab === "multi-sections"
              ? "border-brand text-brand"
              : "border-transparent text-slate-600 hover:text-ink"
          }`}
        >
          <span>Multi-Image Sections</span>
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-bold ${
              activeTab === "multi-sections"
                ? "bg-brand/10 text-brand"
                : "bg-slate-100 text-slate-600"
            }`}
          >
            Why Choose &amp; Applications
          </span>
        </button>
      </div>

      {loading ? (
        <TableSkeleton />
      ) : activeTab === "home-slots" ? (
        /* ──────────────── 6 Homepage Section Image Controls ──────────────── */
        <div className="space-y-6">
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {SINGLE_SLOTS.map((slot) => {
              const rows = items.filter((i) => i.sectionKey === slot.key);
              // First visible row wins
              const winner = rows.find((r) => r.active !== false && r.imageUrl?.trim());
              const isCustom = Boolean(winner);
              const effectiveUrl = winner?.imageUrl || slot.fallback;
              const isDeleting = deletingKey === slot.key;

              return (
                <article
                  key={slot.key}
                  id={`slot-${slot.key}`}
                  data-slot={slot.key}
                  className="flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-xs transition hover:border-slate-300 hover:shadow-md"
                >
                  {/* Card Header */}
                  <div className="border-b border-slate-100 bg-slate-50/70 p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="truncate text-sm font-bold text-ink" title={slot.title}>
                          {slot.title}
                        </h3>
                        <p className="mt-0.5 truncate text-xs text-slate-500" title={slot.usedIn}>
                          {slot.usedIn}
                        </p>
                      </div>
                      {isCustom ? (
                        <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700 ring-1 ring-emerald-600/20">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                          Custom Live
                        </span>
                      ) : (
                        <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-600">
                          <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                          Built-in Default
                        </span>
                      )}
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[11px] font-medium text-slate-600">
                        {slot.key}
                      </code>
                      <span className="text-[11px] text-slate-400">· {slot.recommendation}</span>
                    </div>
                  </div>

                  {/* Card Media Preview */}
                  <div className="p-4">
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => setPreviewModalSlot(slot)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") setPreviewModalSlot(slot);
                      }}
                      className="group relative cursor-pointer overflow-hidden rounded-xl border border-slate-200 bg-slate-100 focus:outline-hidden focus:ring-2 focus:ring-brand"
                      style={{ aspectRatio: slot.aspectRatio }}
                      title="Click to view full preview"
                    >
                      <img
                        src={effectiveUrl}
                        alt={winner?.altText || slot.title}
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                      />

                      {/* Hover Overlay */}
                      <div className="absolute inset-0 flex items-center justify-center bg-slate-950/40 opacity-0 backdrop-blur-[2px] transition duration-200 group-hover:opacity-100">
                        <span className="inline-flex items-center gap-1.5 rounded-lg bg-white/95 px-3 py-1.5 text-xs font-bold text-slate-900 shadow-md">
                          <span>🔍</span>
                          <span>Click to Preview</span>
                        </span>
                      </div>

                      {/* Corner Badge */}
                      <div className="absolute bottom-2 left-2 rounded-md bg-black/70 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur-xs">
                        {isCustom ? "Custom Upload" : "Default Fallback"}
                      </div>
                    </div>

                    {/* Secondary Fallback Reference strip */}
                    <div className="mt-3 flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50/80 px-2.5 py-1.5 text-xs">
                      <div className="flex items-center gap-2 truncate">
                        <img
                          src={slot.fallback}
                          alt="Fallback thumbnail"
                          className="h-6 w-9 shrink-0 rounded border border-slate-200 object-cover"
                        />
                        <span className="truncate text-[11px] text-slate-600">
                          Fallback: <span className="font-mono text-slate-500">{slot.fallback}</span>
                        </span>
                      </div>
                      <span className="shrink-0 text-[10px] text-slate-400">Restores on delete</span>
                    </div>
                  </div>

                  {/* Card Controls */}
                  <div className="border-t border-slate-100 bg-slate-50/40 p-4 pt-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {/* Preview button */}
                        <button
                          type="button"
                          onClick={() => setPreviewModalSlot(slot)}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs transition hover:bg-slate-50"
                        >
                          <span>Preview</span>
                        </button>

                        {/* Upload / Replace button */}
                        <button
                          type="button"
                          onClick={() => openUpload(slot)}
                          className="inline-flex items-center gap-1 rounded-lg bg-brand px-3 py-1.5 text-xs font-semibold text-white shadow-2xs transition hover:bg-brand-dark"
                        >
                          <span>{isCustom ? "Replace" : "Upload"}</span>
                        </button>

                        {/* Delete button (only when custom) */}
                        {isCustom && (
                          <button
                            type="button"
                            disabled={isDeleting}
                            onClick={() => handleDeleteSlot(slot)}
                            className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50/80 px-2.5 py-1.5 text-xs font-semibold text-red-700 transition hover:bg-red-100 disabled:opacity-60"
                            title="Revert to built-in default"
                          >
                            <span>{isDeleting ? "Deleting…" : "Delete"}</span>
                          </button>
                        )}
                      </div>

                      {/* View on site link */}
                      <Link
                        href={slot.anchor}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-brand"
                        title="Jump to this section on the live homepage"
                      >
                        <span>View on site</span>
                        <span aria-hidden="true">→</span>
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      ) : (
        /* ──────────────── Multi-Image Sections ──────────────── */
        <div className="space-y-8">
          {MULTI_GROUPS.map((group) => {
            const rows = items.filter((i) => i.sectionKey === group.key);
            return (
              <section key={group.key} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
                  <div>
                    <h2 className="text-base font-bold text-ink">{group.title}</h2>
                    <p className="mt-0.5 text-xs text-slate-500">{group.hint}</p>
                    <code className="mt-1 inline-block font-mono text-[11px] text-slate-400">
                      key: {group.key}
                    </code>
                  </div>
                  <button
                    onClick={() =>
                      setMultiDraft({
                        sectionKey: group.key,
                        title: "",
                        imageUrl: "",
                        altText: "",
                        caption: "",
                        sortOrder: rows.length,
                        active: true,
                      })
                    }
                    className="rounded-lg bg-brand px-3.5 py-2 text-xs font-semibold text-white shadow-2xs hover:bg-brand-dark"
                  >
                    + Add Image Tile
                  </button>
                </div>

                {!rows.length ? (
                  <div className="mt-4">
                    <EmptyState
                      icon="🖼️"
                      title="No custom images added yet"
                      text="The website is currently using its built-in default imagery for this section."
                    />
                  </div>
                ) : (
                  <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {rows.map((row) => (
                      <div
                        key={row.id}
                        className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50/50"
                      >
                        <img
                          src={row.imageUrl}
                          alt={row.altText || row.title}
                          className="h-36 w-full bg-slate-100 object-cover"
                        />
                        <div className="p-3.5">
                          <p className="truncate text-sm font-semibold text-ink">
                            {row.title || "(no title)"}
                          </p>
                          <p className="truncate text-xs text-slate-500">{row.caption || "—"}</p>
                          <div className="mt-3 flex flex-wrap gap-1.5">
                            <button
                              onClick={() =>
                                setMultiDraft({
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
                              className="rounded-md bg-white border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => toggleMultiActive(row)}
                              className={`rounded-md px-2.5 py-1 text-xs font-medium ${
                                row.active
                                  ? "bg-amber-50 text-amber-700 hover:bg-amber-100"
                                  : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                              }`}
                            >
                              {row.active ? "Hide" : "Show"}
                            </button>
                            <button
                              onClick={() => removeMultiRow(row)}
                              className="rounded-md bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700 hover:bg-red-100"
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

      {/* ──────────────── Lightbox / Preview Modal ──────────────── */}
      {previewModalSlot && (() => {
        const slot = previewModalSlot;
        const winner = items.find((i) => i.sectionKey === slot.key && i.active !== false && i.imageUrl?.trim());
        const isCustom = Boolean(winner);
        const effectiveUrl = winner?.imageUrl || slot.fallback;

        return (
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="preview-modal-title"
            className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-xs"
          >
            <div className="relative my-8 w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-2xl">
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
                <div>
                  <h2 id="preview-modal-title" className="text-base font-bold text-ink">
                    Section Preview: {slot.title}
                  </h2>
                  <p className="mt-0.5 text-xs text-slate-500">{slot.usedIn}</p>
                </div>
                <button
                  onClick={() => setPreviewModalSlot(null)}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                  aria-label="Close preview"
                >
                  ✕
                </button>
              </div>

              {/* Modal Content */}
              <div className="max-h-[75vh] space-y-5 overflow-y-auto p-6">
                {/* Active Image Box */}
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Currently Live on Homepage
                    </span>
                    {isCustom ? (
                      <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-600/20">
                        Custom Image Active
                      </span>
                    ) : (
                      <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
                        Built-in Fallback Default Active
                      </span>
                    )}
                  </div>
                  <div
                    className="relative overflow-hidden rounded-xl border border-slate-200 bg-slate-900"
                    style={{ maxHeight: "380px" }}
                  >
                    <img
                      src={effectiveUrl}
                      alt={winner?.altText || slot.title}
                      className="mx-auto max-h-[380px] w-full object-contain"
                    />
                  </div>
                </div>

                {/* Metadata Details */}
                <div className="grid gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs sm:grid-cols-2">
                  <div>
                    <span className="font-semibold text-slate-500">Slot Key:</span>
                    <code className="ml-2 rounded bg-white px-1.5 py-0.5 font-mono font-medium text-slate-700 border border-slate-200">
                      {slot.key}
                    </code>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-500">Usage:</span>
                    <span className="ml-2 font-medium text-slate-700">{slot.usedIn}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-500">Recommended Ratio:</span>
                    <span className="ml-2 font-medium text-slate-700">{slot.recommendation}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-500">Alt Text:</span>
                    <span className="ml-2 italic text-slate-700">
                      {winner?.altText || "(using default system alt text)"}
                    </span>
                  </div>
                  <div className="sm:col-span-2 truncate">
                    <span className="font-semibold text-slate-500">Image URL:</span>
                    <a
                      href={effectiveUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="ml-2 font-mono text-brand hover:underline"
                    >
                      {effectiveUrl}
                    </a>
                  </div>
                </div>

                {/* Comparison against Fallback (if custom image is active) */}
                {isCustom && (
                  <div className="rounded-xl border border-dashed border-slate-300 bg-white p-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={slot.fallback}
                        alt="Built-in fallback"
                        className="h-16 w-24 shrink-0 rounded-lg border border-slate-200 object-cover"
                      />
                      <div>
                        <h4 className="text-xs font-bold text-slate-700">
                          Built-in Default Fallback
                        </h4>
                        <p className="mt-0.5 text-xs text-slate-500">
                          If you delete this custom image, MSNSS will immediately restore this default image:
                          <span className="ml-1 font-mono text-slate-600">{slot.fallback}</span>
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 bg-slate-50 px-6 py-4">
                <Link
                  href={slot.anchor}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50"
                >
                  <span>View Section on Site</span>
                  <span>↗</span>
                </Link>

                <div className="flex items-center gap-2">
                  {isCustom && (
                    <button
                      type="button"
                      onClick={() => handleDeleteSlot(slot)}
                      className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2 text-xs font-semibold text-red-700 hover:bg-red-100"
                    >
                      Delete Custom Image
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setPreviewModalSlot(null);
                      openUpload(slot);
                    }}
                    className="rounded-lg bg-brand px-4 py-2 text-xs font-semibold text-white shadow-2xs hover:bg-brand-dark"
                  >
                    {isCustom ? "Replace Image" : "Upload Image"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewModalSlot(null)}
                    className="rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ──────────────── Single Slot Upload / Replace Modal ──────────────── */}
      {slotEditor && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="slot-editor-title"
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-xs"
        >
          <div className="my-8 w-full max-w-xl rounded-2xl bg-white shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-200 p-5">
              <div>
                <h2 id="slot-editor-title" className="text-base font-bold text-ink">
                  {slotEditor.existingId ? "Replace Image" : "Upload Image"} — {slotEditor.slot.title}
                </h2>
                <p className="mt-0.5 text-xs text-slate-500">{slotEditor.slot.usedIn}</p>
              </div>
              <button
                onClick={() => setSlotEditor(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                aria-label="Close dialog"
              >
                ✕
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveSlot} className="space-y-4 p-5">
              {/* Reference Box */}
              <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3 text-xs text-slate-600">
                <div className="flex items-center justify-between">
                  <span>
                    Slot Key: <strong className="font-mono text-ink">{slotEditor.slot.key}</strong>
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Ratio: {slotEditor.slot.recommendation}
                  </span>
                </div>
                <p className="mt-1 text-[11px] text-slate-500">
                  Built-in fallback: <code className="text-slate-700">{slotEditor.slot.fallback}</code> (reverts automatically if deleted).
                </p>
              </div>

              {/* Upload Field */}
              <ImageField
                label="Image File or URL"
                value={slotEditor.imageUrl}
                onChange={(url) => setSlotEditor({ ...slotEditor, imageUrl: url })}
                category="sections"
                hint="PNG / JPEG / WebP / AVIF. Drag & drop file or browse."
              />

              {/* Alt Text */}
              <Field label="Alt Text (SEO & Accessibility)">
                <input
                  className={inputCls}
                  value={slotEditor.altText}
                  onChange={(e) => setSlotEditor({ ...slotEditor, altText: e.target.value })}
                  placeholder={`e.g. ${slotEditor.slot.title} at MSNSS factory`}
                />
              </Field>

              {/* Active Toggle */}
              <label className="flex items-center gap-2 pt-1 text-xs font-medium text-slate-700">
                <input
                  type="checkbox"
                  checked={slotEditor.active}
                  onChange={(e) => setSlotEditor({ ...slotEditor, active: e.target.checked })}
                  className="rounded border-slate-300 text-brand focus:ring-brand"
                />
                <span>Active &amp; published immediately to the website</span>
              </label>

              {/* Action Buttons */}
              <div className="flex justify-end gap-2 border-t border-slate-200 pt-4">
                <button
                  type="button"
                  onClick={() => setSlotEditor(null)}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingSlot || !slotEditor.imageUrl.trim()}
                  className="rounded-lg bg-brand px-5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-brand-dark disabled:opacity-50"
                >
                  {savingSlot ? "Saving & Publishing…" : "Save & Publish"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ──────────────── Multi-Section Draft Modal ──────────────── */}
      {multiDraft && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-xs"
        >
          <div className="my-8 w-full max-w-2xl rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 p-5">
              <h2 className="text-base font-bold text-ink">
                {multiDraft.id ? "Edit Section Image Tile" : "Add Section Image Tile"}
              </h2>
              <button
                onClick={() => setMultiDraft(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSaveMulti} className="space-y-4 p-5">
              <ImageField
                label="Image"
                value={multiDraft.imageUrl}
                onChange={(url) => setMultiDraft({ ...multiDraft, imageUrl: url })}
                category="sections"
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Title / Label">
                  <input
                    className={inputCls}
                    value={multiDraft.title}
                    onChange={(e) => setMultiDraft({ ...multiDraft, title: e.target.value })}
                    placeholder="e.g. Commercial Kitchens"
                  />
                </Field>
                <Field label="Caption / Sub-label">
                  <input
                    className={inputCls}
                    value={multiDraft.caption}
                    onChange={(e) => setMultiDraft({ ...multiDraft, caption: e.target.value })}
                    placeholder="e.g. Grease-safe exhaust ducting"
                  />
                </Field>
              </div>
              <Field label="Alt text (accessibility & SEO)">
                <input
                  className={inputCls}
                  value={multiDraft.altText}
                  onChange={(e) => setMultiDraft({ ...multiDraft, altText: e.target.value })}
                />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Display order">
                  <input
                    type="number"
                    className={inputCls}
                    value={multiDraft.sortOrder}
                    onChange={(e) =>
                      setMultiDraft({ ...multiDraft, sortOrder: Number(e.target.value) || 0 })
                    }
                  />
                </Field>
                <label className="mt-7 flex items-center gap-2 text-xs font-medium">
                  <input
                    type="checkbox"
                    checked={multiDraft.active}
                    onChange={(e) => setMultiDraft({ ...multiDraft, active: e.target.checked })}
                  />
                  Visible on the website
                </label>
              </div>
              <div className="flex justify-end gap-2 border-t border-slate-200 pt-4">
                <button
                  type="button"
                  onClick={() => setMultiDraft(null)}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700"
                >
                  Cancel
                </button>
                <button
                  disabled={savingMulti}
                  className="rounded-lg bg-brand px-5 py-2 text-xs font-semibold text-white hover:bg-brand-dark disabled:opacity-60"
                >
                  {savingMulti ? "Saving…" : "Save & Publish"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminPage>
  );
}
