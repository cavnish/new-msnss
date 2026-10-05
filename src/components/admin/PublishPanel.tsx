"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type PublishResult = {
  ok: boolean;
  version: number | null;
  publishedAt: string | null;
  checksum: string | null;
  durationMs: number;
  validation: { ok: boolean; warnings: string[] };
  error?: string;
};

/**
 * Admin control surface for the versioned publish pipeline. Shows which
 * version is live and lets the operator publish a new one on demand, with an
 * unambiguous success / failure result.
 */
export function PublishPanel({
  version,
  publishedAt,
  checksum,
  counts,
  warnings,
}: {
  version: number | null;
  publishedAt: string | null;
  checksum: string | null;
  counts: Record<string, number>;
  warnings: string[];
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<PublishResult | null>(null);

  async function publish() {
    setBusy(true);
    setResult(null);
    try {
      const res = await fetch("/api/admin/publish", { method: "POST" });
      const data = (await res.json()) as PublishResult;
      setResult(data);
      if (data.ok) router.refresh();
    } catch (error) {
      setResult({
        ok: false,
        version: null,
        publishedAt: null,
        checksum: null,
        durationMs: 0,
        validation: { ok: false, warnings: [] },
        error: error instanceof Error ? error.message : "Publish request failed",
      });
    } finally {
      setBusy(false);
    }
  }

  const totalRows = Object.values(counts).reduce((a, b) => a + b, 0);

  return (
    <section className="mt-8 rounded-xl border bg-white p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold">Published Content Version</h2>
          <p className="mt-1 text-sm text-slate-500">
            The public website serves this version with no live database
            dependency. Every CMS change publishes a new one automatically.
          </p>
        </div>
        <button
          onClick={publish}
          disabled={busy}
          className="rounded-md bg-brand px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:cursor-wait disabled:opacity-60"
        >
          {busy ? "Publishing…" : "Publish New Version"}
        </button>
      </div>

      <dl className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-lg border bg-slate-50 p-4">
          <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Version</dt>
          <dd className="mt-1 text-2xl font-extrabold text-ink">{version ?? "—"}</dd>
        </div>
        <div className="rounded-lg border bg-slate-50 p-4">
          <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Published</dt>
          <dd className="mt-1 text-sm font-semibold text-ink">
            {publishedAt ? new Date(publishedAt).toLocaleString() : "—"}
          </dd>
        </div>
        <div className="rounded-lg border bg-slate-50 p-4">
          <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Records</dt>
          <dd className="mt-1 text-2xl font-extrabold text-ink">{totalRows}</dd>
        </div>
        <div className="rounded-lg border bg-slate-50 p-4">
          <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Checksum</dt>
          <dd className="mt-1 truncate font-mono text-xs text-slate-600">{checksum ?? "—"}</dd>
        </div>
      </dl>

      {Object.keys(counts).length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {Object.entries(counts).map(([key, value]) => (
            <span
              key={key}
              className="rounded-full border bg-slate-50 px-3 py-1 text-xs text-slate-600"
            >
              {key}: <b className="text-ink">{value}</b>
            </span>
          ))}
        </div>
      )}

      {warnings.length > 0 && (
        <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm font-semibold text-amber-800">Validation notes</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-amber-700">
            {warnings.slice(0, 8).map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ul>
        </div>
      )}

      {result && (
        <div
          role="status"
          className={`mt-4 rounded-lg border p-4 text-sm ${
            result.ok
              ? "border-green-200 bg-green-50 text-green-800"
              : "border-red-200 bg-red-50 text-red-800"
          }`}
        >
          {result.ok ? (
            <>
              <b>Published version {result.version}</b> in {result.durationMs}ms — the public
              website is now serving this content.
            </>
          ) : (
            <>
              <b>Publishing failed.</b> The previously published version remains live.{" "}
              {result.error}
            </>
          )}
        </div>
      )}
    </section>
  );
}
