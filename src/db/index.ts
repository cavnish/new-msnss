import { drizzle } from "drizzle-orm/node-postgres";
import { Pool, type QueryResult, type QueryResultRow } from "pg";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required");
}

/**
 * pg-connection-string (pg v8.20+) emits a process warning whenever the
 * connection string uses `sslmode=prefer|require|verify-ca`, because those
 * modes are currently *aliases for verify-full* and will change meaning in
 * pg v9. The warning is surfaced by Next as a console error in dev.
 *
 * Rewriting them to `verify-full` is a no-op security-wise — it is exactly
 * what `require` already did — it only makes the intent explicit and silences
 * the warning. Anything else in the URL (user, password, host, channel_binding,
 * sslrootcert, ...) is left untouched.
 */
function normalizeSslMode(url: string): string {
  if (!/^[a-z][a-z0-9+.-]*:\/\//i.test(url)) return url;
  return url.replace(
    /([?&]sslmode=)(prefer|require|verify-ca)(?=&|#|$)/gi,
    "$1verify-full"
  );
}

const globalForDb = globalThis as typeof globalThis & {
  __arenaNextJsPostgresqlPool?: Pool;
  __msnssWriteHookInstalled?: boolean;
};

export const pool =
  globalForDb.__arenaNextJsPostgresqlPool ??
  new Pool({
    connectionString: normalizeSslMode(databaseUrl),
    max: Number(process.env.PG_POOL_MAX ?? 10),
    connectionTimeoutMillis: 5_000,
    idleTimeoutMillis: 30_000,
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb.__arenaNextJsPostgresqlPool = pool;
}

export const db = drizzle(pool);

/* ─────────────────────────────────────────────────────────────────────────────
 * Write-through publishing hook
 * ─────────────────────────────────────────────────────────────────────────────
 * Every admin mutation funnels through this pool, so wrapping `query` once gives
 * us automatic republishing for *all* current and future CMS CRUD without
 * touching a single route handler:

 *   Admin CRUD → Database → (hook) → Validate → Generate Static Content
 *              → Publish New Version → Activate Version
 *
 * The returned promise does not resolve until the publish settles, so the admin
 * request reports publishing success or failure directly.
 * ─────────────────────────────────────────────────────────────────────────────
 */

const WRITE_RE = /^\s*(insert|update|delete|truncate|merge)\b/i;

function isWriteQuery(text: unknown): boolean {
  return typeof text === "string" && WRITE_RE.test(text);
}

/**
 * Only these tables end up in the published snapshot, so only writes to them
 * can change what the public website renders. Writes to lead/inquiry tables
 * (contact forms, catalogue leads, notes) must not trigger a republish: they
 * would otherwise re-render — and invalidate the cache of — every public page
 * for each form submission.
 */
export const PUBLISHED_TABLES = new Set([
  "admin_users",
  "hero_slides",
  "products",
  "product_images",
  "projects",
  "project_images",
  "clients",
  "services",
  "testimonials",
  "catalogues",
  "media_assets",
  "site_settings",
  "section_media",
]);

const TABLE_RE =
  /\b(?:insert\s+into|update|delete\s+from|truncate\s+(?:table\s+)?|merge\s+into)\s+(?:"([A-Za-z_][A-Za-z0-9_]*)"|([A-Za-z_][A-Za-z0-9_]*))/i;

/**
 * `true` when a write may have changed published content.
 *
 * When the target table cannot be determined the answer is `true` — being
 * conservative here can only cost an extra publish, never a stale page.
 */
function mayAffectPublishedContent(sqlText: unknown): boolean {
  if (typeof sqlText !== "string") return true;
  const match = TABLE_RE.exec(sqlText);
  if (!match) return true;
  if (!PUBLISHED_TABLES.has((match[1] ?? match[2]).toLowerCase())) return false;
  return !isCounterOnlyUpdate(sqlText);
}

/** `update <table> set "download_count" = ... where ...` — no rendered content changes. */
const COUNTER_ONLY_UPDATE_RE =
  /^\s*update\s+(?:"[A-Za-z_][A-Za-z0-9_]*"|[A-Za-z_][A-Za-z0-9_]*)\s+set\s+([\s\S]*?)\s+where\b/i;

const ASSIGNMENT_RE = /(?:"([A-Za-z_][A-Za-z0-9_]*)"|([A-Za-z_][A-Za-z0-9_]*))\s*=/g;

/** Statistics bumps (download counters) live only in the admin UI, which reads the DB. */
function isCounterOnlyUpdate(sqlText: string): boolean {
  const match = COUNTER_ONLY_UPDATE_RE.exec(sqlText);
  if (!match) return false;
  const columns = [...match[1].matchAll(ASSIGNMENT_RE)].map((a) =>
    (a[1] ?? a[2]).toLowerCase()
  );
  return columns.length > 0 && columns.every((c) => c === "download_count");
}

type AnyQuery = (...args: unknown[]) => Promise<QueryResult<QueryResultRow>>;

function installWriteHook() {
  if (globalForDb.__msnssWriteHookInstalled) return;
  globalForDb.__msnssWriteHookInstalled = true;

  const original = pool.query.bind(pool) as unknown as AnyQuery;

  (pool as unknown as { query: AnyQuery }).query = (async (...args: unknown[]) => {
    const result = await original(...args);
    const text = args[0];
    const sqlText = typeof text === "string" ? text : (text as { text?: string } | undefined)?.text;

    if (isWriteQuery(sqlText) && mayAffectPublishedContent(sqlText)) {
      // Publish after the mutation commits. The await is deliberate: the admin
      // request only succeeds once the new version is live.
      const { enqueuePublish, buildSnapshotFromDatabase } = await import(
        "@/lib/content-store"
      );
      const publish = await enqueuePublish(buildSnapshotFromDatabase, {
        reason: "cms-write",
      });
      if (!publish.ok) {
        throw new Error(
          `Content was saved but publishing failed: ${publish.error ?? "unknown error"}`
        );
      }
    }
    return result;
  }) as AnyQuery;
}

installWriteHook();
