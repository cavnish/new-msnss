import { cache } from "react";
import type {
  Client,
  MediaAsset,
  Product,
  Project,
  ProjectImage,
  Service,
  HeroSlide,
  Testimonial,
} from "@/db/schema";
import {
  buildSnapshotFromDatabase,
  enqueuePublish,
  emptySnapshotBody,
  readPublishedSnapshot,
  type SiteSnapshot,
} from "@/lib/content-store";
import { resolveClientLogo } from "@/lib/client-logos";

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Public content reads — the ONLY data path used by the website.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Every lookup below resolves from the latest *published snapshot* held in
 * memory (and mirrored on disk). Normal page rendering therefore performs zero
 * database queries: if Postgres, the API or storage goes down, the site keeps
 * serving the most recent successfully published version.
 *
 * The database is touched in exactly one situation — the very first boot, when
 * no snapshot exists yet. That bootstrap also publishes a version so subsequent
 * renders are DB-free.
 * ─────────────────────────────────────────────────────────────────────────────
 */

type Body = Omit<SiteSnapshot, "meta">;

let bootstrap: Promise<SiteSnapshot> | null = null;

/** Load published content, bootstrapping from the database once if needed. */
async function content(): Promise<SiteSnapshot> {
  const published = await readPublishedSnapshot();
  if (published) return published;

  // No published version yet (first boot / wiped volume): seed one from the DB.
  if (!bootstrap) {
    bootstrap = (async () => {
      try {
        const body = await buildSnapshotFromDatabase();
        await enqueuePublish(async () => body, { reason: "bootstrap" });
      } catch (error) {
        console.error("[content] bootstrap publish failed", error);
      }
      return (await readPublishedSnapshot()) ?? { meta: fallbackMeta(), ...emptySnapshotBody() };
    })().finally(() => {
      bootstrap = null;
    });
  }
  return bootstrap;
}

function fallbackMeta() {
  return {
    version: 0,
    publishedAt: new Date(0).toISOString(),
    checksum: "none",
    counts: {},
    validation: { ok: false, warnings: ["no published content available"] },
  };
}

const rows = (snapshot: SiteSnapshot, key: keyof Body) =>
  (snapshot[key] ?? []) as unknown[];

function sorted<T extends Record<string, unknown>>(list: T[], ...keys: (keyof T)[]): T[] {
  return [...list].sort((a, b) => {
    for (const key of keys) {
      const av = a[key] as number | string | null | undefined;
      const bv = b[key] as number | string | null | undefined;
      if (av === bv) continue;
      if (av === null || av === undefined) return 1;
      if (bv === null || bv === undefined) return -1;
      if (av < bv) return -1;
      if (av > bv) return 1;
    }
    return 0;
  });
}

const activeOnly = <T extends Record<string, unknown>>(list: T[]) =>
  list.filter((row) => row.active !== false);

/**
 * Swap the generic CMS logo placeholder for the client's dedicated wordmark so
 * the logo strip never renders six identical badges. See lib/client-logos.ts.
 */
function withResolvedLogo<T extends { logoUrl?: unknown; slug?: unknown }>(client: T): T {
  const logo = resolveClientLogo({
    logoUrl: client.logoUrl as string | null | undefined,
    slug: client.slug as string | null | undefined,
  });
  if (logo === (client.logoUrl as string | null | undefined)) return client;
  return { ...client, logoUrl: logo };
}

/* ─────────────────────────────── public reads ────────────────────────────── */

export const getHeroSlides = cache(async (): Promise<HeroSlide[]> =>
  sorted(activeOnly(rows(await content(), "heroSlides") as Record<string, unknown>[]) as Record<string, unknown>[], "sortOrder") as unknown as HeroSlide[]
);

export const getProducts = cache(async (category?: string): Promise<Product[]> => {
  const all = activeOnly(rows(await content(), "products") as Record<string, unknown>[]);
  const filtered = category ? all.filter((p) => p.category === category) : all;
  return sorted(filtered, "sortOrder") as unknown as Product[];
});

export const getProductBySlug = cache(async (slug: string): Promise<Product | null> => {
  const found = (rows(await content(), "products") as Record<string, unknown>[]).find(
    (p) => p.slug === slug && p.active !== false
  );
  return (found as unknown as Product) ?? null;
});

export const getProjects = cache(async (status?: string): Promise<Project[]> => {
  const all = activeOnly(rows(await content(), "projects") as Record<string, unknown>[]);
  const filtered = status ? all.filter((p) => p.status === status) : all;
  return sorted(filtered, "sortOrder") as unknown as Project[];
});

export const getProjectBySlug = cache(async (slug: string): Promise<Project | null> => {
  const found = (rows(await content(), "projects") as Record<string, unknown>[]).find(
    (p) => p.slug === slug && p.active !== false
  );
  return (found as unknown as Project) ?? null;
});

export const getProjectPortfolio = cache(async (slug: string) => {
  const project = await getProjectBySlug(slug);
  if (!project) return null;
  const snapshot = await content();

  const clientRow = project.clientId
    ? (rows(snapshot, "clients") as Record<string, unknown>[]).find(
        (c) => c.id === project.clientId
      )
    : undefined;
  const client = clientRow ? (withResolvedLogo(clientRow) as unknown as Client) : null;

  const gallery = sorted(
    (rows(snapshot, "projectImages") as Record<string, unknown>[]).filter(
      (img) => img.projectId === project.id
    ),
    "sortOrder"
  ) as unknown as ProjectImage[];

  const related = sorted(
    activeOnly(rows(snapshot, "projects") as Record<string, unknown>[])
      .filter((p) => p.id !== project.id)
      .filter(
        (p) =>
          p.category === project.category ||
          (project.clientId !== null && p.clientId === project.clientId)
      ),
    "sortOrder"
  ).slice(0, 3) as unknown as Project[];

  return { project, client, gallery, related };
});

export const getClients = cache(async (): Promise<Client[]> =>
  sorted(
    activeOnly(rows(await content(), "clients") as Record<string, unknown>[]).map(withResolvedLogo),
    "row",
    "sortOrder"
  ) as unknown as Client[]
);

export const getClientBySlug = cache(async (slug: string): Promise<Client | null> => {
  const found = (rows(await content(), "clients") as Record<string, unknown>[]).find(
    (c) => c.slug === slug && c.active !== false
  );
  return found ? (withResolvedLogo(found) as unknown as Client) : null;
});

export const getClientPortfolio = cache(async (slug: string) => {
  const client = await getClientBySlug(slug);
  if (!client) return null;
  const snapshot = await content();

  const clientProjects = sorted(
    activeOnly(rows(snapshot, "projects") as Record<string, unknown>[]).filter(
      (p) => p.clientId === client.id
    ),
    "sortOrder"
  ) as unknown as Project[];

  const others = sorted(
    activeOnly(rows(snapshot, "clients") as Record<string, unknown>[]).filter(
      (c) => c.id !== client.id
    ),
    "sortOrder"
  ).slice(0, 4) as unknown as Client[];

  const projectIds = new Set(clientProjects.map((p) => p.id));
  const gallery = sorted(
    (rows(snapshot, "projectImages") as Record<string, unknown>[]).filter((img) =>
      projectIds.has(img.projectId as number)
    ),
    "sortOrder"
  ) as unknown as ProjectImage[];

  return { client, projects: clientProjects, gallery, others };
});

export const getTestimonials = cache(async (): Promise<Testimonial[]> =>
  sorted(activeOnly(rows(await content(), "testimonials") as Record<string, unknown>[]), "sortOrder", "id") as unknown as Testimonial[]
);

export const getServices = cache(async (): Promise<Service[]> =>
  sorted(activeOnly(rows(await content(), "services") as Record<string, unknown>[]), "sortOrder") as unknown as Service[]
);

export const getServiceBySlug = cache(async (slug: string): Promise<Service | null> => {
  const found = (rows(await content(), "services") as Record<string, unknown>[]).find(
    (s) => s.slug === slug && s.active !== false
  );
  return (found as unknown as Service) ?? null;
});

export const getProductsByIds = cache(async (ids: number[]): Promise<Product[]> => {
  if (!ids.length) return [];
  const unique = [...new Set(ids)];
  const all = rows(await content(), "products") as Record<string, unknown>[];
  const byId = new Map(all.map((p) => [p.id, p]));
  const picked: Record<string, unknown>[] = [];
  for (const id of unique) {
    const row = byId.get(id);
    if (row && row.active !== false) picked.push(row);
  }
  return picked as unknown as Product[];
});

export const getMediaAssets = cache(async (folder?: string): Promise<MediaAsset[]> => {
  const all = rows(await content(), "mediaAssets") as Record<string, unknown>[];
  const filtered = folder ? all.filter((m) => m.folder === folder) : all;
  return sorted(filtered, "sortOrder", "id") as unknown as MediaAsset[];
});

/** Active catalogue for the public download flow (DB-free). */
export const getActiveCatalogue = cache(async () => {
  const all = activeOnly(rows(await content(), "catalogues") as Record<string, unknown>[]);
  return (sorted(all, "id").at(-1) as unknown as Record<string, unknown>) ?? null;
});

/** Metadata about the currently served version — used by the health endpoint. */
export async function getServedVersion() {
  const snapshot = await content();
  return snapshot.meta;
}

/* ─────────────────── home-page card placement (admin controlled) ─────────── */

/**
 * Products featured in the home-page grid. The admin chooses which cards appear
 * and in what order via `showOnHome` / `homeOrder`.
 */
export const getHomeProducts = cache(async (limit = 9): Promise<Product[]> => {
  const all = activeOnly(rows(await content(), "products") as Record<string, unknown>[]).filter(
    (p) => p.showOnHome !== false
  );
  return sorted(all, "homeOrder", "sortOrder").slice(0, limit) as unknown as Product[];
});

/** Solutions featured in the home-page services grid. */
export const getHomeServices = cache(async (limit = 6): Promise<Service[]> => {
  const all = activeOnly(rows(await content(), "services") as Record<string, unknown>[]).filter(
    (s) => s.showOnHome !== false
  );
  return sorted(all, "homeOrder", "sortOrder").slice(0, limit) as unknown as Service[];
});

/** Projects featured in "Projects That Speak for Our Work". */
export const getHomeProjects = cache(async (limit = 6): Promise<Project[]> => {
  const all = activeOnly(rows(await content(), "projects") as Record<string, unknown>[]).filter(
    (p) => p.showOnHome !== false
  );
  return sorted(all, "homeOrder", "sortOrder").slice(0, limit) as unknown as Project[];
});

/** Clients shown in the home-page logo strip. */
export const getLogoRowClients = cache(async (): Promise<Client[]> =>
  sorted(
    activeOnly(rows(await content(), "clients") as Record<string, unknown>[])
      .filter((c) => c.showInLogoRow !== false)
      .map(withResolvedLogo),
    "logoRowOrder",
    "row",
    "sortOrder"
  ) as unknown as Client[]
);

/* ───────────────────── admin-managed section imagery ─────────────────────── */

export const SECTION_KEYS = [
  "why-choose",
  "why-choose-map",
  "applications",
  // Single-image home slots — first active row wins, built-in default otherwise.
  "home-facility",
  "home-brief-bg",
  "home-about-main",
  "home-about-overlay",
  "home-fire-rated",
  "home-cta-bg",
] as const;
export type SectionKey = (typeof SECTION_KEYS)[number];

/**
 * Imagery for the fixed marketing sections (Why Choose / Applications),
 * ordered for display. Falls back to nothing so the component can use its
 * built-in defaults when the admin has not uploaded anything yet.
 */
export const getSectionMedia = cache(
  async (sectionKey: string): Promise<Record<string, unknown>[]> =>
    sorted(
      rows(await content(), "sectionMedia") as Record<string, unknown>[],
      "sortOrder",
      "id"
    ).filter((m) => m.sectionKey === sectionKey && m.active !== false)
);
