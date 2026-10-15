import { requireAuth } from "@/lib/admin-api";
import {
  buildSnapshotFromDatabase,
  enqueuePublish,
  getPublishStatus,
  revalidatePublicSite,
} from "@/lib/content-store";

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
    // New admin content must never be masked by a cached page. The publish
    // pipeline already invalidates; doing it once more here guarantees the
    // invalidation runs inside this request's scope.
    await revalidatePublicSite();
  }

  return Response.json(result, { status: result.ok ? 200 : 500 });
}
