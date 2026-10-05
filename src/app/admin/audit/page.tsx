"use client";

import { useEffect, useState } from "react";
import { AdminPage, TableSkeleton } from "@/components/admin/AdminUI";

/**
 * Live CMS audit report. Every row is produced by probing the real database and
 * configured code paths via /api/admin/audit — nothing here is hard-coded.
 */

type Status = "working" | "partial" | "issue";

interface Check {
  label: string;
  ok: boolean;
  detail?: string;
}

interface ModuleReport {
  key: string;
  title: string;
  adminPath: string;
  status: Status;
  records: number | null;
  summary: string;
  checks: Check[];
}

interface Report {
  generatedAt: string;
  totals: { working: number; partial: number; issue: number };
  modules: ModuleReport[];
}

const STATUS_STYLES: Record<Status, { label: string; chip: string; dot: string }> = {
  working: {
    label: "Working",
    chip: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    dot: "bg-emerald-500",
  },
  partial: {
    label: "Partial",
    chip: "bg-amber-50 text-amber-700 ring-amber-200",
    dot: "bg-amber-500",
  },
  issue: {
    label: "Blocked",
    chip: "bg-rose-50 text-rose-700 ring-rose-200",
    dot: "bg-rose-500",
  },
};

function StatusChip({ status }: { status: Status }) {
  const s = STATUS_STYLES[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ring-1 ${s.chip}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  );
}

export default function AuditPage() {
  const [report, setReport] = useState<Report | null>(null);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  async function load(isRefresh = false) {
    if (isRefresh) setRefreshing(true);
    try {
      const res = await fetch("/api/admin/audit");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Unable to generate the audit");
      setReport(data);
      setError("");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      if (isRefresh) setRefreshing(false);
    }
  }

  useEffect(() => {
    void Promise.resolve().then(() => load());
  }, []);

  return (
    <AdminPage
      title="CMS Audit Report"
      action={
        <button
          onClick={() => load(true)}
          disabled={refreshing}
          className="rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:opacity-60"
        >
          {refreshing ? "Re-running…" : "Re-run Audit"}
        </button>
      }
    >
      <p className="mb-6 rounded-xl border bg-white p-4 text-sm text-slate-600">
        This report is generated live from the connected database and the registered admin routes.
        Each module is marked <b>Working</b>, <b>Partial</b> or <b>Blocked</b> based on measured
        checks — not assumptions.
      </p>

      {error && (
        <div className="mb-6 rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          {error}
        </div>
      )}

      {!report ? (
        <TableSkeleton />
      ) : (
        <>
          {/* Summary tiles */}
          <div className="grid gap-4 sm:grid-cols-3">
            {(
              [
                ["working", report.totals.working, "Modules fully working"],
                ["partial", report.totals.partial, "Modules needing attention"],
                ["issue", report.totals.issue, "Modules blocked"],
              ] as [Status, number, string][]
            ).map(([status, value, label]) => (
              <div key={status} className="card-premium p-5">
                <div className="flex items-center gap-3">
                  <span
                    className={`flex h-11 w-11 items-center justify-center rounded-xl text-lg font-extrabold ring-1 ${STATUS_STYLES[status].chip}`}
                  >
                    {value}
                  </span>
                  <div>
                    <p className="text-sm font-bold text-ink">{label}</p>
                    <p className="text-xs text-slate-500">
                      {report.modules.length} module{report.modules.length === 1 ? "" : "s"} audited
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Module detail */}
          <div className="mt-8 space-y-4">
            {report.modules.map((m) => (
              <section key={m.key} className="card-premium overflow-hidden">
                <header className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 p-5">
                  <div>
                    <h2 className="text-base font-bold text-ink">{m.title}</h2>
                    <p className="mt-1 text-sm text-slate-600">{m.summary}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    {m.records !== null && (
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                        {m.records} record{m.records === 1 ? "" : "s"}
                      </span>
                    )}
                    <StatusChip status={m.status} />
                  </div>
                </header>

                <div className="grid gap-x-6 gap-y-3 p-5 sm:grid-cols-2">
                  {m.checks.map((c) => (
                    <div key={c.label} className="flex items-start gap-2.5">
                      <span
                        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
                          c.ok ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
                        }`}
                        aria-hidden="true"
                      >
                        {c.ok ? "✓" : "!"}
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-ink">{c.label}</p>
                        {c.detail && (
                          <p className="text-xs leading-5 text-slate-500">{c.detail}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <footer className="flex items-center justify-between border-t border-slate-100 bg-slate-50/60 px-5 py-3">
                  <code className="text-xs text-slate-500">{m.adminPath}</code>
                  <a
                    href={m.adminPath}
                    className="text-xs font-semibold text-brand hover:underline"
                  >
                    Open admin →
                  </a>
                </footer>
              </section>
            ))}
          </div>

          <p className="mt-8 text-xs text-slate-500">
            Audit generated {new Date(report.generatedAt).toLocaleString()} · database checked live ·
            secrets are never displayed.
          </p>
        </>
      )}
    </AdminPage>
  );
}
