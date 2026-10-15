import { db } from "@/db";
import { siteSettings } from "@/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { requireAuth } from "@/lib/admin-api";

export const dynamic = "force-dynamic";

/**
 * Tiny key/value editor for `site_settings` — used by the admin for page copy
 * that has no dedicated table (currently `home.about.description`).
 *
 * `site_settings` is a published table, so a write here republishes the site
 * automatically through the standard content-store write hook.
 */
const settingInput = z.object({
  key: z
    .string()
    .trim()
    .regex(/^[a-z0-9][a-z0-9._-]{1,119}$/i, "Invalid setting key"),
  value: z.string().max(4000).default(""),
});

export async function GET(req: Request) {
  const unauth = await requireAuth();
  if (unauth) return unauth;
  const key = new URL(req.url).searchParams.get("key");
  if (!key) return Response.json({ error: "key is required" }, { status: 400 });
  const [row] = await db.select().from(siteSettings).where(eq(siteSettings.key, key));
  return Response.json({ key, value: row?.value ?? "" });
}

export async function PUT(req: Request) {
  const unauth = await requireAuth();
  if (unauth) return unauth;
  try {
    const parsed = settingInput.safeParse(await req.json());
    if (!parsed.success)
      return Response.json(
        { error: parsed.error.issues[0]?.message || "Invalid setting" },
        { status: 400 }
      );
    const key = parsed.data.key;
    const value = parsed.data.value.trim();

    if (value) {
      await db
        .insert(siteSettings)
        .values({ key, value })
        .onConflictDoUpdate({ target: siteSettings.key, set: { value } });
    } else {
      // Empty copy reverts the section to its built-in default — keep the table clean.
      await db.delete(siteSettings).where(eq(siteSettings.key, key));
    }
    return Response.json({ key, value });
  } catch (e) {
    console.error("[admin/site-settings] save error", e);
    return Response.json({ error: "Unable to save the setting." }, { status: 500 });
  }
}
