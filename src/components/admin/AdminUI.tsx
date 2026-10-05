"use client";

import type { ReactNode } from "react";
import { useCallback, useRef, useState } from "react";
import Image from "next/image";
import { cloudinaryImageLoader } from "@/lib/cloudinary-loader";

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
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4">
      <div className="my-8 w-full max-w-2xl rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-200 p-5">
          <h2 className="text-lg font-bold text-ink">{title}</h2>
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
              <Image src={value} alt={label} fill sizes="96px" loader={cloudinaryImageLoader} className="object-cover" />
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
