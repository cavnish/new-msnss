import { drizzle } from "drizzle-orm/node-postgres";
import { Pool, type QueryResult, type QueryResultRow } from "pg";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required");
}

const globalForDb = globalThis as typeof globalThis & {
  __arenaNextJsPostgresqlPool?: Pool;
  __msnssWriteHookInstalled?: boolean;
};

export const pool =
  globalForDb.__arenaNextJsPostgresqlPool ??
  new Pool({
    connectionString: databaseUrl,
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

type AnyQuery = (...args: unknown[]) => Promise<QueryResult<QueryResultRow>>;

function installWriteHook() {
  if (globalForDb.__msnssWriteHookInstalled) return;
  globalForDb.__msnssWriteHookInstalled = true;

  const original = pool.query.bind(pool) as unknown as AnyQuery;

  (pool as unknown as { query: AnyQuery }).query = (async (...args: unknown[]) => {
    const result = await original(...args);
    const text = args[0];
    const sqlText = typeof text === "string" ? text : (text as { text?: string } | undefined)?.text;

    if (isWriteQuery(sqlText)) {
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
