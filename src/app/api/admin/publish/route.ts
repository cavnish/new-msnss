import { requireAuth } from "@/lib/admin-api";
import {
  buildSnapshotFromDatabase,
  enqueuePublish,
  getPublishStatus,
} from "@/lib/content-store";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";

/** Publishing status for the admin dashboard. */
export async function GET() {
  const unauth = await requireAuth();
  if (unauth) return unauth;
  return Response.json(await getPublishStatus());
}

/**
 * Manually publish a new immutable version from the current database state and
 * invalidate the Next.js render cache so fresh HTML is generated immediately.
 */
export async function POST() {
  const unauth = await requireAuth();
  if (unauth) return unauth;

  const result = await enqueuePublish(buildSnapshotFromDatabase, {
    reason: "manual-publish",
  });

  if (result.ok) {
    // New admin content must never be masked by a cached page.
    for (const route of ["/", "/products", "/solutions", "/projects", "/catalogue"]) {
      try {
        revalidatePath(route);
      } catch {
        /* revalidate is best-effort outside a request scope */
      }
    }
    try {
      revalidatePath("/", "layout");
    } catch {
      /* ignore */
    }
  }

  return Response.json(result, { status: result.ok ? 200 : 500 });
}
