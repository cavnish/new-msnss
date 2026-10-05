"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AdminPage, EmptyState, TableSkeleton, inputCls } from "@/components/admin/AdminUI";
import type { MediaAsset } from "@/db/schema";

const FOLDER_OPTIONS = [
  "msnss/uploads",
  "msnss/clients",
  "msnss/projects",
  "msnss/products",
  "msnss/services",
  "msnss/solutions",
  "msnss/gallery",
  "msnss/logo",
  "msnss/homepage",
  "msnss/about",
  "msnss/machinery",
];

function formatBytes(n?: number | null) {
  if (!n) return "—";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

export default function MediaAdmin() {
  const [items, setItems] = useState<MediaAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState("");
  const [drag, setDrag] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [folder, setFolder] = useState("all");
  const inputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(folder === "all" ? "/api/admin/media" : `/api/admin/media?folder=${encodeURIComponent(folder)}`);
    const data = await res.json();
    setItems(Array.isArray(data) ? data : data.items ?? []);
    setLoading(false);
  }, [folder]);

  useEffect(() => {
    Promise.resolve().then(load);
  }, [load]);

  async function onFiles(files: FileList | null) {
    if (!files?.length) return;
    setUploading(true);
    let ok = 0;
    for (const file of Array.from(files)) {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("category", "uploads");
      const res = await fetch("/api/admin/media", { method: "POST", body: fd });
      if (res.ok) ok++;
      else {
        try {
          const j = await res.json();
          setNotice(j.error || `Failed to upload ${file.name}`);
        } catch {
          setNotice(`Failed to upload ${file.name}`);
        }
      }
    }
    setUploading(false);
    if (ok) setNotice(`${ok} file${ok === 1 ? "" : "s"} uploaded to Cloudinary.`);
    load();
  }

  async function patch(id: number, data: Record<string, unknown>) {
    const res = await fetch(`/api/admin/media/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
    if (!res.ok) setNotice("Unable to update asset metadata.");
    else {
      setItems((list) => list.map((m) => (m.id === id ? { ...m, ...data } : m)));
      setNotice("Asset metadata updated.");
    }
  }

  async function remove(m: MediaAsset) {
    if (!confirm(`Delete "${m.fileName || m.publicId}" from Cloudinary and the media library?`)) return;
    const res = await fetch(`/api/admin/media/${m.id}`, { method: "DELETE" });
    if (!res.ok) { setNotice("Unable to delete asset."); return; }
    setItems((list) => list.filter((x) => x.id !== m.id));
    setNotice("Asset deleted from Cloudinary.");
  }

  async function copyUrl(url: string) {
    try {
      await navigator.clipboard.writeText(url);
      setNotice("URL copied to clipboard.");
    } catch {
      setNotice(url);
    }
  }

  return (
    <AdminPage
      title="Media Library"
      action={
        <button
          onClick={() => inputRef.current?.click()}
          className="rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark"
        >
          + Upload Media
        </button>
      }
    >
      {notice && <button onClick={() => setNotice("")} className="mb-4 w-full rounded-lg bg-blue-50 p-3 text-left text-sm text-blue-800">{notice} ×</button>}

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
        className={`mb-5 rounded-xl border-2 border-dashed p-6 text-center transition ${
          drag ? "border-brand bg-brand/5" : "border-slate-300 bg-white hover:border-brand/60"
        }`}
      >
        {uploading ? (
          <span className="text-sm font-semibold text-ink">Uploading to Cloudinary…</span>
        ) : (
          <>
            <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mx-auto text-slate-400">
              <path d="M12 16V4m0 0 4 4m-4-4L8 8" />
              <path d="M4 15v4a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-4" />
            </svg>
            <p className="mt-2 text-sm font-medium text-slate-700">Drag & drop images here, or click to browse</p>
            <p className="mt-1 text-xs text-slate-400">Uploaded straight to Cloudinary — metadata is indexed for reuse across the site.</p>
          </>
        )}
      </div>

      <div className="mb-5 flex flex-wrap items-center gap-3">
        <label className="text-sm font-medium text-slate-700">Folder:</label>
        <select className={`${inputCls} max-w-xs`} value={folder} onChange={(e) => setFolder(e.target.value)}>
          <option value="all">All folders</option>
          {FOLDER_OPTIONS.map((f) => <option key={f} value={f}>{f}</option>)}
        </select>
        <span className="text-xs text-slate-400">{loading ? "…" : `${items.length} asset${items.length === 1 ? "" : "s"}`}</span>
      </div>

      <input ref={inputRef} type="file" accept="image/png,image/jpeg,image/webp,image/avif" multiple className="hidden" onChange={(e) => { onFiles(e.target.files); e.target.value = ""; }} />

      {loading ? (
        <TableSkeleton />
      ) : items.length === 0 ? (
        <EmptyState icon="🖼️" title="No media yet" text="Upload your first image, or change the folder filter." />
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {items.map((m) => (
            <div key={m.id} className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="relative aspect-square bg-slate-100">
                <img src={m.secureUrl} alt={m.altText || m.fileName || m.publicId} className="h-full w-full object-cover" />
                <span className="absolute left-2 top-2 rounded bg-slate-950/70 px-2 py-0.5 text-[10px] font-medium text-white">
                  {m.width || "—"}×{m.height || "—"} · {formatBytes(m.bytes)}
                </span>
              </div>
              <div className="space-y-2 p-3">
                <input
                  className={`${inputCls} !py-1.5 text-xs`}
                  placeholder="Alt text"
                  defaultValue={m.altText}
                  onBlur={(e) => { if (e.target.value !== m.altText) patch(m.id, { altText: e.target.value }); }}
                />
                <input
                  className={`${inputCls} !py-1.5 text-xs`}
                  placeholder="Caption"
                  defaultValue={m.caption}
                  onBlur={(e) => { if (e.target.value !== m.caption) patch(m.id, { caption: e.target.value }); }}
                />
                <select
                  className={`${inputCls} !py-1.5 text-xs`}
                  value={m.folder}
                  onChange={(e) => patch(m.id, { folder: e.target.value })}
                >
                  {FOLDER_OPTIONS.map((f) => <option key={f} value={f}>{f.replace("msnss/", "")}</option>)}
                </select>
                <div className="flex items-center justify-between gap-2 pt-1">
                  <span className="truncate text-[10px] text-slate-400">{(m.fileName || m.publicId).split("/").pop()}</span>
                  <div className="flex shrink-0 gap-1">
                    <button onClick={() => copyUrl(m.secureUrl)} title="Copy URL" className="rounded bg-slate-100 px-2 py-1 text-[10px] font-semibold hover:bg-slate-200">Copy</button>
                    <button onClick={() => remove(m)} title="Delete asset" className="rounded bg-red-50 px-2 py-1 text-[10px] font-semibold text-red-600 hover:bg-red-100">Delete</button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </AdminPage>
  );
}