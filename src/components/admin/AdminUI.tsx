"use client";

import type { ReactNode } from "react";
import { useCallback, useRef, useState } from "react";
import Image from "next/image";
import { cloudinaryImageLoader } from "@/lib/cloudinary-loader";
import { isCloudinaryUrl } from "@/lib/cloudinary-url";

export function AdminPage({
  title,
  action,
  children,
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="p-5 lg:p-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-extrabold text-ink">{title}</h1>
        {action}
      </div>
      {children}
    </div>
  );
}

export function Modal({
  open,
  onClose,
  title,
  children,
  wide = false,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  /** Wider canvas for editors that need room (e.g. image galleries). */
  wide?: boolean;
}) {
  if (!open) return null;
  const titleId = "admin-modal-title";
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={`my-8 w-full rounded-xl bg-white shadow-xl ${wide ? "max-w-5xl" : "max-w-2xl"}`}
      >
        <div className="flex items-center justify-between border-b border-slate-200 p-5">
          <h2 id={titleId} className="text-lg font-bold text-ink">{title}</h2>
          <button onClick={onClose} className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="max-h-[70vh] overflow-y-auto p-5">{children}</div>
      </div>
    </div>
  );
}

export type TabDef = { id: string; label: string; hint?: string; badge?: string | number };

/**
 * Horizontal tab strip for long admin forms.
 *
 * Renders inside a scroll container, so it sticks to the top and stays reachable
 * while the active panel scrolls. Follows the ARIA tabs pattern: arrow keys move
 * between tabs, Home/End jump to the ends, and only the active tab is tabbable.
 */
export function TabBar({
  tabs,
  active,
  onChange,
  idPrefix,
}: {
  tabs: TabDef[];
  active: string;
  onChange: (id: string) => void;
  idPrefix: string;
}) {
  const move = (delta: number) => {
    const i = tabs.findIndex((t) => t.id === active);
    const next = tabs[(i + delta + tabs.length) % tabs.length];
    if (next) onChange(next.id);
  };

  return (
    <div
      role="tablist"
      aria-label="Product editor sections"
      className="sticky top-0 z-20 -mx-5 -mt-5 mb-5 flex gap-1 overflow-x-auto border-b border-slate-200 bg-white px-5 pt-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      {tabs.map((tab, i) => {
        const selected = tab.id === active;
        return (
          <button
            key={tab.id}
            role="tab"
            type="button"
            id={`${idPrefix}-tab-${tab.id}`}
            aria-selected={selected}
            aria-controls={`${idPrefix}-panel-${tab.id}`}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(tab.id)}
            onKeyDown={(e) => {
              if (e.key === "ArrowRight") { e.preventDefault(); move(1); }
              else if (e.key === "ArrowLeft") { e.preventDefault(); move(-1); }
              else if (e.key === "Home") { e.preventDefault(); onChange(tabs[0].id); }
              else if (e.key === "End") { e.preventDefault(); onChange(tabs[tabs.length - 1].id); }
            }}
            className={`-mb-px flex shrink-0 items-center gap-2 rounded-t-lg border-b-2 px-4 py-2.5 text-sm font-semibold transition ${
              selected
                ? "border-brand text-brand"
                : "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-800"
            }`}
          >
            <span className="whitespace-nowrap">{tab.label}</span>
            {tab.badge !== undefined && tab.badge !== "" ? (
              <span
                className={`rounded-full px-2 py-0.5 text-[11px] font-bold tabular-nums ${
                  selected ? "bg-brand text-white" : "bg-slate-100 text-slate-600"
                }`}
              >
                {tab.badge}
              </span>
            ) : null}
            {tab.hint ? <span className="sr-only">{tab.hint}</span> : null}
            <span className="sr-only">{`tab ${i + 1} of ${tabs.length}`}</span>
          </button>
        );
      })}
    </div>
  );
}

/** Wrapper for one tab's content, wired to the tab strip for assistive tech. */
export function TabPanel({
  idPrefix,
  id,
  active,
  children,
}: {
  idPrefix: string;
  id: string;
  active: string;
  children: ReactNode;
}) {
  if (id !== active) return null;
  return (
    <div
      role="tabpanel"
      id={`${idPrefix}-panel-${id}`}
      aria-labelledby={`${idPrefix}-tab-${id}`}
      tabIndex={0}
      className="space-y-4 outline-none"
    >
      {children}
    </div>
  );
}


export const inputCls =
  "w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20";

export function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-slate-700">{label}</label>
      {children}
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  text,
}: {
  icon: string;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-white py-16 text-center">
      <div className="text-5xl">{icon}</div>
      <h3 className="mt-4 text-lg font-bold text-ink">{title}</h3>
      <p className="mt-1 text-slate-500">{text}</p>
    </div>
  );
}

export function TableSkeleton() {
  return (
    <div className="space-y-3">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="shimmer h-14 rounded-lg" />
      ))}
    </div>
  );
}

/** Uploads a single file to the admin media API with progress reporting. */
export function useImageUpload(category = "uploads") {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");

  const upload = useCallback(
    (file: File, extra?: Record<string, string>) =>
      new Promise<string | null>((resolve) => {
        setUploading(true);
        setProgress(0);
        setError("");
        const form = new FormData();
        form.append("file", file);
        form.append("category", category);
        if (extra) Object.entries(extra).forEach(([k, v]) => form.append(k, v));
        const xhr = new XMLHttpRequest();
        xhr.open("POST", "/api/admin/media");
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) setProgress(Math.round((e.loaded / e.total) * 100));
        };
        xhr.onload = () => {
          setUploading(false);
          if (xhr.status < 300) {
            try {
              const data = JSON.parse(xhr.responseText);
              resolve(data.url || data.secureUrl || null);
            } catch {
              resolve(null);
            }
          } else {
            try {
              const data = JSON.parse(xhr.responseText);
              setError(data.error || "Upload failed");
            } catch {
              setError("Upload failed");
            }
            resolve(null);
          }
        };
        xhr.onerror = () => {
          setUploading(false);
          setError("Network error during upload");
          resolve(null);
        };
        xhr.send(form);
      }),
    [category]
  );

  return { upload, uploading, progress, error };
}

/** Drag-and-drop image picker bound to an ImageField-style URL value. */
export function ImageField({
  label,
  value,
  onChange,
  category = "uploads",
  hint = "PNG / JPEG / WebP. Drag & drop or click.",
}: {
  label: string;
  value: string;
  onChange: (url: string) => void;
  category?: string;
  hint?: string;
}) {
  const { upload, uploading, progress, error } = useImageUpload(category);
  const [drag, setDrag] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const onFiles = async (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;
    const url = await upload(file);
    if (url) onChange(url);
  };

  return (
    <div>
      <span className="mb-1 block text-sm font-medium text-slate-700">{label}</span>
      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          onFiles(e.dataTransfer.files);
        }}
        className={`flex min-h-[110px] cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-4 text-center transition ${
          drag ? "border-brand bg-brand/5" : "border-slate-300 bg-slate-50 hover:border-brand/60"
        }`}
      >
        {value ? (
          <div className="w-full">
            <div className="relative mx-auto h-24 w-24 overflow-hidden rounded-lg border border-slate-200 bg-white">
              {/* Cloudinary assets use the responsive loader; local uploads
                  (/api/media, /uploads) and other URLs use Next's default
                  optimizer. Passing the Cloudinary loader for those warns
                  "loader does not implement width" and skips resizing. */}
              <Image
                src={value}
                alt={label}
                fill
                sizes="96px"
                loader={isCloudinaryUrl(value) ? cloudinaryImageLoader : undefined}
                className="object-cover"
              />
            </div>
            <span className="mt-2 block text-xs font-medium text-brand">{uploading ? `Uploading… ${progress}%` : "Click or drop to replace"}</span>
          </div>
        ) : uploading ? (
          <div className="w-full">
            <span className="text-sm font-semibold text-ink">Uploading… {progress}%</span>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
              <div className="h-full rounded-full bg-brand" style={{ width: `${progress}%` }} />
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-1">
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="text-slate-400">
              <path d="M12 16V4m0 0 4 4m-4-4L8 8" />
              <path d="M4 15v4a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-4" />
            </svg>
            <span className="text-xs text-slate-500">{hint}</span>
          </div>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/avif"
        className="hidden"
        onChange={(e) => {
          onFiles(e.target.files);
          e.target.value = "";
        }}
      />
      {error ? <span className="mt-1 block text-xs text-red-600">{error}</span> : null}
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="…or paste an image URL (Cloudinary / local)"
        className={`${inputCls} mt-2`}
        aria-label={`${label} URL`}
      />
    </div>
  );
}

/** Edits a string array as one-item-per-line. */
export function ListInput({
  label,
  value,
  onChange,
  placeholder = "One item per line",
  rows = 4,
}: {
  label: string;
  value: string[];
  onChange: (items: string[]) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <div>
      <span className="mb-1 block text-sm font-medium text-slate-700">{label}</span>
      <textarea
        className={inputCls}
        rows={rows}
        placeholder={placeholder}
        value={(value || []).join("\n")}
        onChange={(e) =>
          onChange(
            e.target.value
              .split("\n")
              .map((s) => s.trim())
              .filter(Boolean)
          )
        }
      />
    </div>
  );
}

/** One entry in the per-product image/video showcase. */
export type MediaListValue = {
  type: "image" | "video";
  url: string;
  label?: string;
};

/**
 * Reusable editor for a mixed list of images and videos.
 * Used for the per-product "Fabrication & Project Installations" showcase and
 * anywhere the admin needs to add/remove media rows dynamically.
 */
export function MediaListEditor({
  label,
  value,
  onChange,
  category = "uploads",
  addLabel = "Add media",
}: {
  label: string;
  value: MediaListValue[];
  onChange: (next: MediaListValue[]) => void;
  category?: string;
  addLabel?: string;
}) {
  const { upload, uploading } = useImageUpload(category);

  const update = (idx: number, patch: Partial<MediaListValue>) =>
    onChange(value.map((row, i) => (i === idx ? { ...row, ...patch } : row)));

  const remove = (idx: number) => onChange(value.filter((_, i) => i !== idx));

  const add = (type: "image" | "video") =>
    onChange([...value, { type, url: "", label: "" }]);

  const pickFile = async (idx: number, file: File) => {
    const url = await upload(file);
    if (url) update(idx, { url });
  };

  return (
    <div>
      <span className="mb-1 block text-sm font-medium text-slate-700">{label}</span>

      <div className="space-y-2">
        {value.map((row, idx) => (
          <div
            key={idx}
            className="rounded-lg border border-slate-200 bg-slate-50 p-2.5"
          >
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={row.type}
                onChange={(e) => update(idx, { type: e.target.value as "image" | "video" })}
                className={`${inputCls} w-28`}
                aria-label="Media type"
              >
                <option value="image">Image</option>
                <option value="video">Video</option>
              </select>

              <input
                value={row.label ?? ""}
                onChange={(e) => update(idx, { label: e.target.value })}
                placeholder="Label (e.g. Duct Fabrication)"
                className={`${inputCls} flex-1 min-w-[160px]`}
              />

              <button
                type="button"
                onClick={() => remove(idx)}
                className="rounded bg-red-50 px-2.5 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100"
              >
                Remove
              </button>
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-2">
              <input
                value={row.url}
                onChange={(e) => update(idx, { url: e.target.value })}
                placeholder={row.type === "video" ? "https://…/clip.mp4 (or upload)" : "Image URL (or upload)"}
                className={`${inputCls} flex-1 min-w-[200px]`}
              />
              {row.type === "image" ? (
                <label className="cursor-pointer rounded bg-white px-3 py-1.5 text-xs font-semibold text-brand ring-1 ring-slate-200 hover:bg-brand hover:text-white">
                  {uploading ? "Uploading…" : "Upload"}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) void pickFile(idx, f);
                      e.target.value = "";
                    }}
                  />
                </label>
              ) : null}
            </div>
          </div>
        ))}

        {!value.length && (
          <p className="rounded-lg border border-dashed border-slate-300 bg-white p-3 text-xs text-slate-500">
            No media added yet. The page will use the default gallery until you add items here.
          </p>
        )}
      </div>

      <div className="mt-2 flex gap-2">
        <button
          type="button"
          onClick={() => add("image")}
          className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:border-brand hover:text-brand"
        >
          + {addLabel} (image)
        </button>
        <button
          type="button"
          onClick={() => add("video")}
          className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:border-brand hover:text-brand"
        >
          + {addLabel} (video)
        </button>
      </div>
    </div>
  );
}

/** Moves an array entry from one index to another, returning a new array. */
function moveItem<T>(list: T[], from: number, to: number): T[] {
  if (to < 0 || to >= list.length) return list;
  const next = [...list];
  const [entry] = next.splice(from, 1);
  next.splice(to, 0, entry);
  return next;
}

/** Up/down reorder buttons shared by the ordered admin list editors. */
function ReorderButtons({
  index,
  count,
  onMove,
  noun,
  onAnnounce,
}: {
  index: number;
  count: number;
  onMove: (to: number) => void;
  noun: string;
  onAnnounce?: (message: string) => void;
}) {
  const btn =
    "flex h-8 w-8 items-center justify-center rounded-md border text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-25";
  const go = (to: number) => {
    onMove(to);
    onAnnounce?.(`${noun} moved to position ${to + 1} of ${count}`);
  };
  return (
    <div className="flex shrink-0 flex-col gap-1">
      <button
        type="button"
        onClick={() => go(index - 1)}
        disabled={index === 0}
        aria-label={`Move ${noun} ${index + 1} up to position ${index}`}
        title="Move up"
        className={`${btn} border-slate-300 bg-white text-slate-600 hover:border-brand hover:bg-brand hover:text-white`}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden="true">
          <path d="M6 15l6-6 6 6" />
        </svg>
      </button>
      <button
        type="button"
        onClick={() => go(index + 1)}
        disabled={index === count - 1}
        aria-label={`Move ${noun} ${index + 1} down to position ${index + 2}`}
        title="Move down"
        className={`${btn} border-slate-300 bg-white text-slate-600 hover:border-brand hover:bg-brand hover:text-white`}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden="true">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
    </div>
  );
}

/**
 * Editor for an ordered, length-capped list of image URLs.
 *
 * Backs the product hero/gallery field: every slot can be uploaded, replaced,
 * reordered or deleted, and the list can never grow past `max` slots. Values are
 * plain URLs, so whatever is saved here is exactly what the CMS stores and the
 * public page renders — nothing is generated client-side.
 *
 * `preview` adds an at-a-glance strip of every slot — filled and empty — in
 * display order, mirroring what a visitor sees on the public page.
 */
export function ImageListEditor({
  label,
  value,
  onChange,
  category = "uploads",
  max = 6,
  addLabel = "Add image",
  emptyText = "No images yet.",
  hint,
  preview = false,
  previewLabel = "Preview — displayed in this order",
}: {
  label: string;
  value: string[];
  onChange: (next: string[]) => void;
  category?: string;
  max?: number;
  addLabel?: string;
  emptyText?: string;
  hint?: string;
  preview?: boolean;
  previewLabel?: string;
}) {
  const { upload, uploading, error } = useImageUpload(category);
  const [busy, setBusy] = useState<number | null>(null);
  const [status, setStatus] = useState("");
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);

  const rows = value ?? [];
  const full = rows.length >= max;

  const update = (idx: number, url: string) =>
    onChange(rows.map((row, i) => (i === idx ? url : row)));

  const remove = (idx: number) => {
    setStatus(`Image at position ${idx + 1} deleted`);
    onChange(rows.filter((_, i) => i !== idx));
  };

  const move = (idx: number, to: number) => onChange(moveItem(rows, idx, to));

  const addSlot = () => {
    if (full) return;
    setStatus(`Empty position ${rows.length + 1} added`);
    onChange([...rows, ""]);
  };

  const pickFile = async (idx: number, file: File) => {
    setBusy(idx);
    const url = await upload(file);
    setBusy(null);
    if (url) {
      update(idx, url);
      setStatus(`Image uploaded to position ${idx + 1}`);
    }
  };

  const handleDragStart = (idx: number) => setDragIdx(idx);
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, idx: number) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverIdx(idx);
  };
  const handleDrop = (idx: number) => {
    if (dragIdx !== null && dragIdx !== idx) {
      move(dragIdx, idx);
      setStatus(`Image moved to public hero position ${idx + 1}`);
    }
    setDragIdx(null);
    setDragOverIdx(null);
  };
  const handleDragEnd = () => {
    setDragIdx(null);
    setDragOverIdx(null);
  };

  return (
    <div>
      <div className="mb-1 flex flex-wrap items-center justify-between gap-3">
        <span className="text-sm font-semibold text-ink">{label}</span>
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-bold tabular-nums ${
            full ? "bg-brand text-white" : "bg-slate-100 text-slate-600"
          }`}
        >
          {rows.length} / {max} images
        </span>
      </div>
      {hint ? <p className="mb-3 text-xs leading-5 text-slate-600">{hint}</p> : null}

      {/* ── position preview: every slot, in display order ─────────────── */}
      {preview && (
        <div className="mb-4 rounded-lg border border-slate-200 bg-slate-50 p-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            {previewLabel} — these positions map exactly to the public page hero
          </p>
          <ol className="flex flex-wrap gap-2.5">
            {Array.from({ length: max }, (_, slot) => {
              const url = rows[slot];
              const filled = slot < rows.length;
              return (
                <li key={slot} className="w-[104px] shrink-0">
                  <div className="relative h-[78px] w-full overflow-hidden rounded-md border border-slate-300 bg-white">
                    {url ? (
                      <Image
                        src={url}
                        alt=""
                        fill
                        sizes="104px"
                        loader={isCloudinaryUrl(url) ? cloudinaryImageLoader : undefined}
                        className="object-cover"
                      />
                    ) : filled ? (
                      <span className="flex h-full w-full items-center justify-center text-[10px] font-semibold uppercase text-slate-400">
                        Empty
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={addSlot}
                        disabled={full}
                        aria-label={`Add image at position ${slot + 1}`}
                        className="flex h-full w-full flex-col items-center justify-center gap-0.5 text-slate-400 hover:bg-brand/5 hover:text-brand disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                          <path d="M12 5v14M5 12h14" />
                        </svg>
                        <span className="text-[10px] font-semibold">Add to slot {slot + 1}</span>
                      </button>
                    )}
                    <span
                      className={`absolute left-0 top-0 px-1.5 py-0.5 text-[10px] font-bold tabular-nums ${
                        url ? "bg-ink/85 text-white" : "bg-slate-200 text-slate-500"
                      }`}
                    >
                      {slot + 1}
                    </span>
                  </div>
                  <p className="mt-1 truncate text-center text-[10px] font-medium text-slate-500">
                    {url ? `Public hero position ${slot + 1}` : `Empty slot ${slot + 1}`}
                  </p>
                </li>
              );
            })}
          </ol>
        </div>
      )}

      {/* ── per-slot CRUD rows ──────────────────────────────────────────── */}
      <div className="space-y-2">
        {rows.map((url, idx) => (
          <div
            key={idx}
            draggable
            onDragStart={() => handleDragStart(idx)}
            onDragOver={(e) => handleDragOver(e, idx)}
            onDrop={() => handleDrop(idx)}
            onDragEnd={handleDragEnd}
            className={`flex flex-wrap items-center gap-3 rounded-lg border bg-slate-50 p-2.5 transition ${
              dragIdx === idx
                ? "border-brand ring-2 ring-brand/20"
                : dragOverIdx === idx
                  ? "border-brand bg-brand/5"
                  : "border-slate-200"
            }`}
          >
            <span
              className="flex h-8 w-8 shrink-0 cursor-grab items-center justify-center rounded-md text-slate-400 hover:text-slate-600 active:cursor-grabbing"
              title="Drag to reorder"
              aria-hidden="true"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="9" cy="6" r="1.5" />
                <circle cx="15" cy="6" r="1.5" />
                <circle cx="9" cy="12" r="1.5" />
                <circle cx="15" cy="12" r="1.5" />
                <circle cx="9" cy="18" r="1.5" />
                <circle cx="15" cy="18" r="1.5" />
              </svg>
            </span>

            <ReorderButtons
              index={idx}
              count={rows.length}
              onMove={(to) => move(idx, to)}
              noun="image"
              onAnnounce={setStatus}
            />

            <span
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-ink text-xs font-bold tabular-nums text-white"
              aria-hidden="true"
            >
              {idx + 1}
            </span>

            <div className="relative h-16 w-24 shrink-0 overflow-hidden rounded-md border border-slate-200 bg-white">
              {url ? (
                <Image
                  src={url}
                  alt=""
                  fill
                  sizes="96px"
                  loader={isCloudinaryUrl(url) ? cloudinaryImageLoader : undefined}
                  className="object-cover"
                />
              ) : (
                <span className="flex h-full w-full items-center justify-center text-[10px] font-semibold uppercase text-slate-300">
                  Empty
                </span>
              )}
            </div>

            <div className="flex min-w-[220px] flex-1 flex-col gap-1.5">
              <input
                value={url}
                onChange={(e) => update(idx, e.target.value)}
                placeholder="Image URL (or upload)"
                aria-label={`Position ${idx + 1} image URL`}
                className={inputCls}
              />
              <div className="flex flex-wrap items-center gap-1.5">
                <label className="cursor-pointer rounded-md bg-white px-3 py-1.5 text-xs font-semibold text-brand ring-1 ring-slate-300 transition hover:bg-brand hover:text-white focus-within:ring-2 focus-within:ring-brand focus-within:ring-offset-1">
                  {busy === idx ? "Uploading…" : url ? "Replace image" : "Upload image"}
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/avif"
                    aria-label={`${busy === idx ? "Uploading" : url ? "Replace image" : "Upload image"} for position ${idx + 1}`}
                    className="sr-only"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) void pickFile(idx, f);
                      e.target.value = "";
                    }}
                  />
                </label>
                <button
                  type="button"
                  onClick={() => remove(idx)}
                  aria-label={`Delete image at position ${idx + 1}`}
                  className="rounded-md bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 transition hover:bg-red-100"
                >
                  Delete
                </button>
                <span className="text-xs font-medium text-slate-400">
                  Public hero position {idx + 1}
                </span>
              </div>
            </div>
          </div>
        ))}

        {!rows.length && (
          <p className="rounded-lg border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-500">
            {emptyText}
          </p>
        )}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={addSlot}
          disabled={full}
          className="rounded-md border-2 border-dashed border-brand px-4 py-2 text-sm font-semibold text-brand transition hover:bg-brand/5 disabled:cursor-not-allowed disabled:border-slate-300 disabled:text-slate-400"
        >
          + {addLabel}
        </button>
        {full ? (
          <span className="text-xs font-medium text-slate-500">
            Maximum of {max} images reached — delete one to add another.
          </span>
        ) : (
          <span className="text-xs font-medium text-slate-500">
            {max - rows.length} slot{max - rows.length === 1 ? "" : "s"} left.
          </span>
        )}
      </div>

      <p role="status" aria-live="polite" className="mt-2 text-xs font-medium text-brand">
        {status}
      </p>
      {uploading ? <p className="mt-1 text-xs text-slate-500">Uploading image…</p> : null}
      {error ? <p className="mt-1 text-xs text-red-600">{error}</p> : null}
    </div>
  );
}

/** One editable label/value pair, used for product technical specifications. */
export type KeyValueValue = { label: string; value: string };

/**
 * Editor for an ordered list of label/value rows with add, inline edit, delete
 * and reorder. Row order is the display order — the public page renders the
 * first row as the lead specification and the rest in sequence.
 */
export function KeyValueListEditor({
  label,
  value,
  onChange,
  labelPlaceholder = "Label (e.g. Steel Grade)",
  valuePlaceholder = "Value (e.g. CRCA IS 513)",
  addLabel = "Add row",
  emptyText = "No rows yet.",
  noun = "row",
}: {
  label: string;
  value: KeyValueValue[];
  onChange: (next: KeyValueValue[]) => void;
  labelPlaceholder?: string;
  valuePlaceholder?: string;
  addLabel?: string;
  emptyText?: string;
  noun?: string;
}) {
  const rows = value ?? [];

  const update = (idx: number, patch: Partial<KeyValueValue>) =>
    onChange(rows.map((row, i) => (i === idx ? { ...row, ...patch } : row)));

  const remove = (idx: number) => onChange(rows.filter((_, i) => i !== idx));

  const move = (idx: number, to: number) => onChange(moveItem(rows, idx, to));

  return (
    <div>
      <div className="mb-1 flex items-center justify-between gap-3">
        <span className="text-sm font-medium text-slate-700">{label}</span>
        <span className="text-xs font-semibold tabular-nums text-slate-400">
          {rows.length} {rows.length === 1 ? noun : `${noun}s`}
        </span>
      </div>

      <div className="space-y-2">
        {rows.map((row, idx) => (
          <div
            key={idx}
            className="flex flex-wrap items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 p-2"
          >
            <ReorderButtons
              index={idx}
              count={rows.length}
              onMove={(to) => move(idx, to)}
              noun={noun}
            />
            <span
              className="w-5 shrink-0 text-center font-mono text-xs font-bold text-slate-400"
              aria-hidden="true"
            >
              {idx + 1}
            </span>
            <input
              value={row.label}
              onChange={(e) => update(idx, { label: e.target.value })}
              placeholder={labelPlaceholder}
              aria-label={`${label} — ${noun} ${idx + 1} label`}
              className={`${inputCls} w-52`}
            />
            <input
              value={row.value}
              onChange={(e) => update(idx, { value: e.target.value })}
              placeholder={valuePlaceholder}
              aria-label={`${label} — ${noun} ${idx + 1} value`}
              className={`${inputCls} min-w-[180px] flex-1`}
            />
            <button
              type="button"
              onClick={() => remove(idx)}
              aria-label={`Delete ${noun} ${idx + 1}`}
              className="shrink-0 rounded bg-red-50 px-2.5 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100"
            >
              Delete
            </button>
          </div>
        ))}

        {!rows.length && (
          <p className="rounded-lg border border-dashed border-slate-300 bg-white p-3 text-xs text-slate-500">
            {emptyText}
          </p>
        )}
      </div>

      <button
        type="button"
        onClick={() => onChange([...rows, { label: "", value: "" }])}
        className="mt-2 rounded-md border border-dashed border-brand px-3 py-1.5 text-xs font-semibold text-brand hover:bg-brand/5"
      >
        + {addLabel}
      </button>
    </div>
  );
}

/** Compact checkbox + order pair used to place cards on the home page. */
export function HomePlacementFields({
  showOnHome,
  homeOrder,
  onChange,
}: {
  showOnHome: boolean;
  homeOrder: number;
  onChange: (next: { showOnHome: boolean; homeOrder: number }) => void;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        Home page placement
      </p>
      <div className="mt-2 flex flex-wrap items-center gap-4">
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={showOnHome}
            onChange={(e) => onChange({ showOnHome: e.target.checked, homeOrder })}
          />
          Show this card on the home page
        </label>
        <label className="flex items-center gap-2 text-sm text-slate-700">
          Order
          <input
            type="number"
            value={homeOrder}
            onChange={(e) =>
              onChange({ showOnHome, homeOrder: Number(e.target.value) || 0 })
            }
            className={`${inputCls} w-20`}
          />
        </label>
      </div>
    </div>
  );
}

/**
 * Uploads image files to the simple local product-upload endpoint
 * (`/api/admin/products/upload`), which stores them under
 * `public/uploads/products/[product-slug]/` and returns public URLs.
 * Cloudinary is never involved — uploads keep working with no external
 * dependencies, while pre-existing Cloudinary/external URLs keep rendering.
 */
async function uploadLocalProductImages(files: File[], slug?: string): Promise<string[]> {
  const form = new FormData();
  for (const file of files) form.append("files", file);
  if (slug) form.append("slug", slug);
  const res = await fetch("/api/admin/products/upload", { method: "POST", body: form });
  const data = await res.json().catch(() => null);
  if (!res.ok || !data?.success) {
    throw new Error(data?.error || "Upload failed. Please try again.");
  }
  const urls = (data.urls ?? (data.url ? [data.url] : [])).filter(Boolean);
  if (!urls.length) throw new Error("Upload returned no images.");
  return urls;
}

/**
 * Hero gallery editor for a product — the exact images (and order) rendered
 * by the public product-page hero. Position 1 is the main hero image;
 * the rest are thumbnails, in order.
 *
 * Upload-first: [+ Add Images] accepts multiple local files, stored via the
 * local upload endpoint. Per image: preview, replace, delete, drag-and-drop
 * reorder and "set as primary". Existing Cloudinary/external URLs are shown
 * as-is and preserved — there is no manual URL field.
 */
export function ProductHeroImageEditor({
  value,
  onChange,
  max = 6,
  slug,
}: {
  value: string[];
  onChange: (next: string[]) => void;
  max?: number;
  slug?: string;
}) {
  const rows = value ?? [];
  const full = rows.length >= max;
  const [busy, setBusy] = useState(false);
  const [replacing, setReplacing] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);
  const addRef = useRef<HTMLInputElement>(null);

  const move = (idx: number, to: number) => {
    if (to < 0 || to >= rows.length || to === idx) return;
    onChange(moveItem(rows, idx, to));
    setStatus(`Image moved to hero position ${to + 1} of ${rows.length}`);
  };

  const setPrimary = (idx: number) => {
    if (idx === 0) return;
    onChange(moveItem(rows, idx, 0));
    setStatus("Hero position 1 updated — this image is now the main hero image");
  };

  const remove = (idx: number) => {
    onChange(rows.filter((_, i) => i !== idx));
    setStatus(`Hero image at position ${idx + 1} deleted`);
  };

  const addFiles = async (files: FileList | null) => {
    const picked = Array.from(files ?? []).filter((f) => f.size > 0);
    if (!picked.length) return;
    const room = max - rows.length;
    if (room <= 0) {
      setError(`Hero gallery is full (${max}/${max}). Delete an image to add another.`);
      return;
    }
    setBusy(true);
    setError("");
    try {
      const urls = await uploadLocalProductImages(picked.slice(0, room), slug);
      onChange([...rows, ...urls].slice(0, max));
      setStatus(
        urls.length > 1
          ? `${urls.length} images uploaded to the hero gallery`
          : "Image uploaded to the hero gallery"
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const replaceFile = async (idx: number, file: File | undefined) => {
    if (!file || file.size === 0) return;
    setReplacing(idx);
    setError("");
    try {
      const [url] = await uploadLocalProductImages([file], slug);
      onChange(rows.map((row, i) => (i === idx ? url : row)));
      setStatus(`Hero image at position ${idx + 1} replaced`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed. Please try again.");
    } finally {
      setReplacing(null);
    }
  };

  const handleDrop = (idx: number) => {
    if (dragIdx !== null && dragIdx !== idx) move(dragIdx, idx);
    setDragIdx(null);
    setDragOverIdx(null);
  };

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <span className="text-sm font-semibold text-ink">Hero Images</span>
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-bold tabular-nums ${
            full ? "bg-brand text-white" : "bg-slate-100 text-slate-600"
          }`}
        >
          {rows.length} / {max} images
        </span>
      </div>

      <button
        type="button"
        onClick={() => addRef.current?.click()}
        disabled={busy || full}
        className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-brand px-4 py-4 text-sm font-bold text-brand transition hover:bg-brand/5 disabled:cursor-not-allowed disabled:border-slate-300 disabled:text-slate-400"
      >
        {busy ? "Uploading…" : "+ Add Images"}
      </button>
      <input
        ref={addRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/avif"
        multiple
        className="hidden"
        aria-label="Add hero images"
        onChange={(e) => {
          void addFiles(e.target.files);
          e.target.value = "";
        }}
      />
      <p className="mt-1.5 text-xs text-slate-500">
        Select multiple local images at once. Position 1 is the main hero image — drag cards to reorder.
      </p>

      {rows.length > 0 ? (
        <ol className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((url, idx) => (
            <li
              key={`${url}-${idx}`}
              draggable
              onDragStart={() => setDragIdx(idx)}
              onDragOver={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setDragOverIdx(idx);
              }}
              onDrop={() => handleDrop(idx)}
              onDragEnd={() => {
                setDragIdx(null);
                setDragOverIdx(null);
              }}
              className={`relative overflow-hidden rounded-xl border-2 bg-white transition ${
                dragIdx === idx
                  ? "border-brand ring-2 ring-brand/20"
                  : dragOverIdx === idx
                    ? "border-brand bg-brand/5"
                    : "border-slate-200"
              }`}
            >
              <div className="relative aspect-[4/3] w-full bg-slate-100">
                {url ? (
                  <Image
                    src={url}
                    alt={`Hero image ${idx + 1}`}
                    fill
                    sizes="320px"
                    loader={isCloudinaryUrl(url) ? cloudinaryImageLoader : undefined}
                    className="object-cover"
                  />
                ) : null}
                <span
                  className={`absolute left-2 top-2 rounded-md px-2 py-0.5 text-[11px] font-bold tabular-nums ${
                    idx === 0 ? "bg-brand text-white" : "bg-ink/85 text-white"
                  }`}
                >
                  {idx === 0 ? "★ Primary" : `Position ${idx + 1}`}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-1.5 p-2.5">
                {idx !== 0 && (
                  <button
                    type="button"
                    onClick={() => setPrimary(idx)}
                    className="rounded-md bg-brand/10 px-2.5 py-1.5 text-xs font-bold text-brand transition hover:bg-brand hover:text-white"
                  >
                    Set as primary
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => move(idx, idx - 1)}
                  disabled={idx === 0}
                  aria-label={`Move image ${idx + 1} earlier`}
                  className="rounded-md border border-slate-300 bg-white px-2 py-1.5 text-xs font-bold text-slate-600 transition hover:border-brand hover:text-brand disabled:opacity-30"
                >
                  ←
                </button>
                <button
                  type="button"
                  onClick={() => move(idx, idx + 1)}
                  disabled={idx === rows.length - 1}
                  aria-label={`Move image ${idx + 1} later`}
                  className="rounded-md border border-slate-300 bg-white px-2 py-1.5 text-xs font-bold text-slate-600 transition hover:border-brand hover:text-brand disabled:opacity-30"
                >
                  →
                </button>
                <label className="cursor-pointer rounded-md bg-white px-2.5 py-1.5 text-xs font-semibold text-brand ring-1 ring-slate-300 transition hover:bg-brand hover:text-white">
                  {replacing === idx ? "Uploading…" : "Replace"}
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/avif"
                    className="sr-only"
                    aria-label={`Replace hero image ${idx + 1}`}
                    onChange={(e) => {
                      void replaceFile(idx, e.target.files?.[0]);
                      e.target.value = "";
                    }}
                  />
                </label>
                <button
                  type="button"
                  onClick={() => remove(idx)}
                  aria-label={`Delete hero image ${idx + 1}`}
                  className="rounded-md bg-red-50 px-2.5 py-1.5 text-xs font-semibold text-red-700 transition hover:bg-red-100"
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ol>
      ) : (
        <p className="mt-4 rounded-lg border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-500">
          No hero images yet. Add up to {max} — the public hero falls back to the main image until then.
        </p>
      )}

      <p role="status" aria-live="polite" className="mt-2 text-xs font-medium text-brand">
        {status}
      </p>
      {error ? <p className="mt-1 text-xs font-medium text-red-600">{error}</p> : null}
    </div>
  );
}

/**
 * Editor for an ordered list of plain-text rows (e.g. manufacturing process
 * steps) with add, inline edit, delete and reorder. Row order is the display
 * order — the public page numbers steps from this sequence.
 */
export function OrderedListEditor({
  label,
  value,
  onChange,
  addLabel = "Add step",
  emptyText = "No steps yet.",
  noun = "step",
  placeholder = "Describe this step",
  rows: textareaRows = 2,
}: {
  label: string;
  value: string[];
  onChange: (next: string[]) => void;
  addLabel?: string;
  emptyText?: string;
  noun?: string;
  placeholder?: string;
  rows?: number;
}) {
  const rows = value ?? [];

  const update = (idx: number, text: string) =>
    onChange(rows.map((row, i) => (i === idx ? text : row)));

  const remove = (idx: number) => onChange(rows.filter((_, i) => i !== idx));

  const move = (idx: number, to: number) => onChange(moveItem(rows, idx, to));

  return (
    <div>
      <div className="mb-1 flex items-center justify-between gap-3">
        <span className="text-sm font-medium text-slate-700">{label}</span>
        <span className="text-xs font-semibold tabular-nums text-slate-400">
          {rows.length} {rows.length === 1 ? noun : `${noun}s`}
        </span>
      </div>

      <ol className="space-y-2">
        {rows.map((row, idx) => (
          <li
            key={idx}
            className="flex flex-wrap items-start gap-2 rounded-lg border border-slate-200 bg-slate-50 p-2"
          >
            <ReorderButtons
              index={idx}
              count={rows.length}
              onMove={(to) => move(idx, to)}
              noun={noun}
            />
            <span
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ink font-mono text-xs font-bold text-white"
              aria-hidden="true"
            >
              {String(idx + 1).padStart(2, "0")}
            </span>
            <textarea
              value={row}
              onChange={(e) => update(idx, e.target.value)}
              placeholder={placeholder}
              aria-label={`${label} — ${noun} ${idx + 1}`}
              rows={textareaRows}
              className={`${inputCls} min-w-[200px] flex-1`}
            />
            <button
              type="button"
              onClick={() => remove(idx)}
              aria-label={`Delete ${noun} ${idx + 1}`}
              className="shrink-0 rounded bg-red-50 px-2.5 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100"
            >
              Delete
            </button>
          </li>
        ))}

        {!rows.length && (
          <p className="rounded-lg border border-dashed border-slate-300 bg-white p-3 text-xs text-slate-500">
            {emptyText}
          </p>
        )}
      </ol>

      <button
        type="button"
        onClick={() => onChange([...rows, ""])}
        className="mt-2 rounded-md border border-dashed border-brand px-3 py-1.5 text-xs font-semibold text-brand hover:bg-brand/5"
      >
        + {addLabel}
      </button>
    </div>
  );
}
