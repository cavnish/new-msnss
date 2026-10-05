import { createHash } from "crypto";
import {
  mkdir,
  readFile,
  readdir,
  rename,
  rm,
  writeFile,
  open,
} from "fs/promises";
import path from "path";

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * MSNSS versioned content store — "static after admin updates"
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * The database stays the source of truth for the CMS, but the *public* website
 * renders from an immutable, versioned snapshot published to disk.
 *
 *   Admin CRUD → Database → Validate → Optimize Assets
 *              → Generate Static Content → Publish New Version → Activate
 *
 * Publication is atomic:
 *   1. the new snapshot is written into a staging directory and fsync'ed
 *   2. the staging directory is renamed to `versions/<n>` (atomic on POSIX)
 *   3. the `current.json` pointer is swapped by rename (atomic on POSIX)
 *
 * A failure at any point leaves `current.json` untouched, so the previously
 * published version keeps serving. Public rendering therefore never depends on
 * a live database connection: if Postgres, the API or storage is unavailable,
 * the latest successfully published version is served instead.
 *
 * Layout on disk (inside `.cms-published/`):
 *   current.json                 → { version, publishedAt, checksum, ... }
 *   versions/<n>/snapshot.json   → full content payload
 *   versions/<n>/manifest.json   → counts, checksum, validation report
 *   .staging-<rand>/             → transient, removed after each publish
 * ─────────────────────────────────────────────────────────────────────────────
 */

export const SNAPSHOT_ROOT = path.join(process.cwd(), ".cms-published");
const VERSIONS_DIR = path.join(SNAPSHOT_ROOT, "versions");
const CURRENT_POINTER = path.join(SNAPSHOT_ROOT, "current.json");
const KEEP_VERSIONS = 5;

/** Loose row shapes — mirrored from `src/db/schema.ts` so this module stays dependency-free. */
export type SnapshotRow = Record<string, unknown>;

export interface SiteSnapshot {
  meta: SnapshotMeta;
  adminUsers: SnapshotRow[];
  heroSlides: SnapshotRow[];
  products: SnapshotRow[];
  projects: SnapshotRow[];
  projectImages: SnapshotRow[];
  clients: SnapshotRow[];
  services: SnapshotRow[];
  testimonials: SnapshotRow[];
  catalogues: SnapshotRow[];
  mediaAssets: SnapshotRow[];
  siteSettings: SnapshotRow[];
  sectionMedia: SnapshotRow[];
}

export interface SnapshotMeta {
  version: number;
  publishedAt: string;
  checksum: string;
  counts: Record<string, number>;
  validation: { ok: boolean; warnings: string[] };
}

export interface PublishResult {
  ok: boolean;
  version: number | null;
  publishedAt: string | null;
  checksum: string | null;
  durationMs: number;
  validation: { ok: boolean; warnings: string[] };
  error?: string;
}



/* ────────────────────────────── memory cache ─────────────────────────────── */

const globalStore = globalThis as typeof globalThis & {
  __msnssSnapshot?: SiteSnapshot | null;
  __msnssPublishChain?: Promise<unknown>;
};

function memo(snapshot: SiteSnapshot | null): SiteSnapshot | null {
  globalStore.__msnssSnapshot = snapshot;
  return snapshot;
}

/** Drop the in-memory snapshot so the next read picks up a fresh version. */
export function invalidateSnapshotCache(): void {
  globalStore.__msnssSnapshot = undefined;
}

/* ─────────────────────────────── checksums ───────────────────────────────── */

function checksumOf(body: Omit<SiteSnapshot, "meta">): string {
  return createHash("sha256").update(JSON.stringify(body)).digest("hex").slice(0, 32);
}

/**
 * Local asset URLs get a version token so a replaced upload is never served
 * from a stale browser/CDN cache. Remote (Cloudinary) URLs are left untouched —
 * their loader rewrites the path and a query string would corrupt it.
 */
export function versionAssetUrl(url: unknown, stamp: string | number | null | undefined): string {
  if (typeof url !== "string" || !url) return "";
  if (!url.startsWith("/")) return url;
  if (!stamp) return url;
  const token = String(stamp).replace(/[^a-zA-Z0-9]/g, "").slice(0, 24);
  if (!token) return url;
  return url.includes("?") ? `${url}&v=${token}` : `${url}?v=${token}`;
}

/* ─────────────────────────────── validation ──────────────────────────────── */

export function validateSnapshot(body: Omit<SiteSnapshot, "meta">): {
  ok: boolean;
  warnings: string[];
} {
  const warnings: string[] = [];
  const requireSlug = (rows: SnapshotRow[], label: string) => {
    const bad = rows.filter((r) => !r.slug || !r.name).length;
    if (bad) warnings.push(`${label}: ${bad} row(s) missing a slug or name`);
  };
  requireSlug(body.products, "products");
  requireSlug(body.projects, "projects");
  requireSlug(body.clients, "clients");
  requireSlug(body.services, "services");

  for (const row of body.products) {
    if (!row.imageUrl) warnings.push(`product "${String(row.name)}" has no image`);
    if (!row.shortDescription) warnings.push(`product "${String(row.name)}" has no short description`);
  }
  for (const row of body.heroSlides) {
    if (!row.title || !row.imageUrl) warnings.push("a hero slide is missing a title or image");
  }
  for (const row of body.clients) {
    if (!row.logoUrl) warnings.push(`client "${String(row.name)}" has no logo`);
  }

  // Warnings are advisory — a publish is still valid, but the operator is told.
  return { ok: true, warnings };
}

/**
 * Bust the Next.js render cache so a fresh publish is reflected immediately
 * rather than after the ISR window. Public routes are cached aggressively, so
 * this is what guarantees "never show stale content after a successful publish".
 */
const PUBLIC_ROUTES = [
  "/",
  "/about",
  "/catalogue",
  "/products",
  "/solutions",
  "/projects",
  "/plant-and-machinery",
  "/contact",
];

export async function revalidatePublicSite(): Promise<void> {
  try {
    const { revalidatePath } = await import("next/cache");
    for (const route of PUBLIC_ROUTES) revalidatePath(route);
    revalidatePath("/", "layout");
  } catch {
    // Outside a request scope (e.g. `next build`, seed script) there is no
    // static generation store to invalidate — harmless.
  }
}

/* ────────────────────────────── disk primitives ──────────────────────────── */

async function fsyncDir(dir: string) {
  try {
    const handle = await open(dir, "r");
    await handle.sync().catch(() => undefined);
    await handle.close();
  } catch {
    /* directory fsync is unsupported on some filesystems — safe to ignore */
  }
}

async function readJson<T>(file: string): Promise<T | null> {
  try {
    return JSON.parse(await readFile(file, "utf8")) as T;
  } catch {
    return null;
  }
}

async function writeJsonAtomic(file: string, value: unknown) {
  const tmp = `${file}.tmp-${process.pid}-${Date.now()}`;
  const handle = await open(tmp, "w");
  try {
    await handle.writeFile(JSON.stringify(value), "utf8");
    await handle.sync();
  } finally {
    await handle.close();
  }
  await rename(tmp, file);
}

/* ──────────────────────────────── publishing ─────────────────────────────── */

/**
 * Build the snapshot payload from the live database. Only used by the publish
 * pipeline — public rendering never calls this.
 */
export async function buildSnapshotFromDatabase(): Promise<Omit<SiteSnapshot, "meta">> {
  // Imported lazily so that reading a published snapshot never touches Drizzle.
  const { db } = await import("@/db");
  const schema = await import("@/db/schema");

  const [
    adminUsers,
    heroSlides,
    products,
    projects,
    projectImages,
    clients,
    services,
    testimonials,
    catalogues,
    mediaAssets,
    siteSettings,
    sectionMedia,
  ] = await Promise.all([
    db.select().from(schema.adminUsers),
    db.select().from(schema.heroSlides),
    db.select().from(schema.products),
    db.select().from(schema.projects),
    db.select().from(schema.projectImages),
    db.select().from(schema.clients),
    db.select().from(schema.services),
    db.select().from(schema.testimonials),
    db.select().from(schema.catalogues),
    db.select().from(schema.mediaAssets),
    db.select().from(schema.siteSettings),
    db.select().from(schema.sectionMedia),
  ]);

  return {
    adminUsers,
    heroSlides,
    products,
    projects,
    projectImages,
    clients,
    services,
    testimonials,
    catalogues,
    mediaAssets,
    siteSettings,
    sectionMedia,
  };
}

async function nextVersion(): Promise<number> {
  const pointer = await readJson<{ version: number }>(CURRENT_POINTER);
  if (pointer?.version) return pointer.version + 1;
  let highest = 0;
  try {
    for (const entry of await readdir(VERSIONS_DIR)) {
      const n = Number(entry);
      if (Number.isFinite(n)) highest = Math.max(highest, n);
    }
  } catch {
    /* versions dir may not exist yet */
  }
  return highest + 1;
}

async function pruneOldVersions(keep = KEEP_VERSIONS) {
  try {
    const entries = (await readdir(VERSIONS_DIR))
      .map((e) => Number(e))
      .filter((n) => Number.isFinite(n))
      .sort((a, b) => a - b);
    for (const entry of entries.slice(0, Math.max(0, entries.length - keep))) {
      await rm(path.join(VERSIONS_DIR, String(entry)), { recursive: true, force: true });
    }
  } catch {
    /* pruning is best-effort */
  }
}

/**
 * Publish a brand new immutable version and activate it.
 * Atomic: the pointer only moves once the new version is fully on disk.
 */
export async function publishSnapshot(
  body: Omit<SiteSnapshot, "meta">,
  options: { reason?: string } = {}
): Promise<PublishResult> {
  const startedAt = Date.now();
  const validation = validateSnapshot(body);
  const checksum = checksumOf(body);
  const version = await nextVersion();
  const publishedAt = new Date().toISOString();

  const staging = path.join(SNAPSHOT_ROOT, `.staging-${version}-${process.pid}-${Date.now()}`);
  const target = path.join(VERSIONS_DIR, String(version));

  try {
    await mkdir(VERSIONS_DIR, { recursive: true });
    await mkdir(staging, { recursive: true });

    const meta: SnapshotMeta = {
      version,
      publishedAt,
      checksum,
      counts: Object.fromEntries(
        Object.entries(body).map(([key, rows]) => [key, Array.isArray(rows) ? rows.length : 0])
      ),
      validation,
    };

    const snapshot: SiteSnapshot = { meta, ...body };

    // 1. stage + fsync
    await writeJsonAtomic(path.join(staging, "snapshot.json"), snapshot);
    await writeJsonAtomic(path.join(staging, "manifest.json"), {
      ...meta,
      reason: options.reason ?? "content-update",
    });
    await fsyncDir(staging);

    // 2. promote staging directory to a permanent version
    await rename(staging, target);
    await fsyncDir(VERSIONS_DIR);

    // 3. activate — last step, and the only one readers observe
    await writeJsonAtomic(CURRENT_POINTER, {
      version,
      publishedAt,
      checksum,
      reason: options.reason ?? "content-update",
    });

    await pruneOldVersions();
    invalidateSnapshotCache();
    await revalidatePublicSite();

    return {
      ok: true,
      version,
      publishedAt,
      checksum,
      durationMs: Date.now() - startedAt,
      validation,
    };
  } catch (error) {
    // Roll back the half-written staging directory. The active pointer has not
    // moved, so the previous version keeps serving — publish is all-or-nothing.
    await rm(staging, { recursive: true, force: true }).catch(() => undefined);
    return {
      ok: false,
      version: null,
      publishedAt: null,
      checksum: null,
      durationMs: Date.now() - startedAt,
      validation,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Queue a publish.
 *
 * Writes are coalesced: any number of admin mutations that land while a publish
 * is in flight resolve to the *next* run, which re-reads the database and so
 * always captures the final state. Every caller awaits the run that covers its
 * own change, so a failed publish is reported straight back to the admin.
 */
type Waiter = { resolve: (r: PublishResult) => void; reject: (e: unknown) => void };

const queueState = globalStore as typeof globalStore & {
  __msnssPublishWaiters?: Waiter[];
  __msnssPublishRunning?: boolean;
  __msnssPublishSuppressed?: number;
};

export function enqueuePublish(
  builder: () => Promise<Omit<SiteSnapshot, "meta">>,
  options: { reason?: string } = {}
): Promise<PublishResult> {
  // Explicit opt-out for bulk jobs such as seeding.
  if ((queueState.__msnssPublishSuppressed ?? 0) > 0) {
    return Promise.resolve({
      ok: true,
      version: null,
      publishedAt: null,
      checksum: null,
      durationMs: 0,
      validation: { ok: true, warnings: ["publish suppressed"] },
    });
  }

  return new Promise<PublishResult>((resolve, reject) => {
    queueState.__msnssPublishWaiters = queueState.__msnssPublishWaiters ?? [];
    queueState.__msnssPublishWaiters.push({ resolve, reject });
    void pumpPublishes(builder, options);
  });
}

async function pumpPublishes(
  builder: () => Promise<Omit<SiteSnapshot, "meta">>,
  options: { reason?: string }
) {
  if (queueState.__msnssPublishRunning) return;
  queueState.__msnssPublishRunning = true;
  try {
    let waiters = queueState.__msnssPublishWaiters ?? [];
    while (waiters.length) {
      queueState.__msnssPublishWaiters = [];
      let result: PublishResult;
      try {
        result = await publishSnapshot(await builder(), options);
      } catch (error) {
        result = {
          ok: false,
          version: null,
          publishedAt: null,
          checksum: null,
          durationMs: 0,
          validation: { ok: false, warnings: [] },
          error: error instanceof Error ? error.message : String(error),
        };
      }
      for (const waiter of waiters) waiter.resolve(result);
      waiters = queueState.__msnssPublishWaiters ?? [];
    }
  } finally {
    queueState.__msnssPublishRunning = false;
  }
}

/** Bulk import helper: suppress the per-write publish, then publish once. */
export async function withPublishSuppressed<T>(run: () => Promise<T>): Promise<T> {
  queueState.__msnssPublishSuppressed = (queueState.__msnssPublishSuppressed ?? 0) + 1;
  try {
    return await run();
  } finally {
    queueState.__msnssPublishSuppressed = Math.max(
      0,
      (queueState.__msnssPublishSuppressed ?? 1) - 1
    );
  }
}

/* ───────────────────────────────── reading ───────────────────────────────── */

async function loadVersion(version: number): Promise<SiteSnapshot | null> {
  return readJson<SiteSnapshot>(path.join(VERSIONS_DIR, String(version), "snapshot.json"));
}

/**
 * Serve the published content. Order:
 *   1. in-memory cache (no I/O at all)
 *   2. `current.json` pointer → its version
 *   3. highest readable version on disk  (survives a corrupted pointer)
 *   4. `null` — caller may fall back to the database
 *
 * Never throws and never queries the database.
 */
export async function readPublishedSnapshot(): Promise<SiteSnapshot | null> {
  const cached = globalStore.__msnssSnapshot;
  if (cached) return cached;

  const pointer = await readJson<{ version: number }>(CURRENT_POINTER);
  if (pointer?.version) {
    const snapshot = await loadVersion(pointer.version);
    if (snapshot) return memo(snapshot);
  }

  // Pointer missing/corrupt — fall back to the newest readable version.
  try {
    const entries = (await readdir(VERSIONS_DIR))
      .map((e) => Number(e))
      .filter((n) => Number.isFinite(n))
      .sort((a, b) => b - a);
    for (const version of entries) {
      const snapshot = await loadVersion(version);
      if (snapshot) return memo(snapshot);
    }
  } catch {
    /* no versions published yet */
  }

  return null;
}

/** Status for the admin health panel — never exposes secrets. */
export async function getPublishStatus() {
  const pointer = await readJson<{ version: number; publishedAt: string; checksum: string }>(
    CURRENT_POINTER
  );
  const snapshot = await readPublishedSnapshot();
  return {
    published: Boolean(pointer),
    version: pointer?.version ?? snapshot?.meta.version ?? null,
    publishedAt: pointer?.publishedAt ?? snapshot?.meta.publishedAt ?? null,
    checksum: pointer?.checksum ?? snapshot?.meta.checksum ?? null,
    counts: snapshot?.meta.counts ?? {},
    validation: snapshot?.meta.validation ?? { ok: false, warnings: [] },
    root: SNAPSHOT_ROOT,
  };
}

/** Used by the health endpoint to prove the static layer can serve alone. */
export function emptySnapshotBody(): Omit<SiteSnapshot, "meta"> {
  return {
    adminUsers: [],
    heroSlides: [],
    products: [],
    projects: [],
    projectImages: [],
    clients: [],
    services: [],
    testimonials: [],
    catalogues: [],
    mediaAssets: [],
    siteSettings: [],
    sectionMedia: [],
  };
}
