import "./src/db/env";
import { db, pool } from "./src/db";
import { products } from "./src/db/schema";
import { eq } from "drizzle-orm";
import { stripMarkdown, oneLiner, bodyCopy } from "./src/lib/product-copy";

/**
 * One-time data repair.
 *
 * An earlier Markdown strip removed the `###` markers and collapsed all
 * whitespace, which fused each leading heading into the paragraph beneath it
 * ("Precision MS Round Duct Manufacturing Our ducts are fabricated…"). This
 * restores the paragraph break by detecting the leading Title-Case run, then
 * rewrites `short_description` to a real one-line value proposition.
 */

/** True when a token looks like part of a Title-Case heading. */
const isHeadingToken = (t: string) => /^[A-Z0-9&]/.test(t);

/** Leading Title-Case run of >= 3 tokens is a heading, not a sentence. */
function restoreHeadingBlock(text: string): string {
  const flat = text.replace(/\s+/g, " ").trim();
  const words = flat.split(" ");
  if (words.length < 4) return flat;

  let run = 0;
  while (run < words.length && isHeadingToken(words[run])) run++;

  // Require a real heading, so prose like "SS round ducts are …" is untouched.
  if (run < 3 || run >= words.length) return flat;

  return `${words.slice(0, run).join(" ")}\n\n${words.slice(run).join(" ")}`;
}

const PROSE_FIELDS = [
  "longDescription",
  "fullDescription",
  "manufacturingNarrative",
  "designFabrication",
  "supplyAcrossIndia",
] as const;

async function main() {
  const all = await db.select().from(products);
  const report: string[] = [];

  for (const p of all) {
    const patch: Record<string, unknown> = {};

    for (const f of PROSE_FIELDS) {
      const before = (p as Record<string, unknown>)[f];
      if (typeof before !== "string" || !before.trim()) continue;
      const restored = restoreHeadingBlock(stripMarkdown(before));
      if (restored !== before) {
        patch[f] = restored;
        report.push(`  ${p.slug}: ${f} heading restored`);
      }
    }

    // Value proposition: first real sentence of the restored body copy.
    const source = (patch.longDescription as string | undefined) ?? p.longDescription;
    const valueLine = oneLiner(source) || oneLiner(p.fullDescription);
    if (valueLine && valueLine !== p.shortDescription) {
      patch.shortDescription = valueLine;
      report.push(`  ${p.slug}: shortDescription (${p.shortDescription.length} -> ${valueLine.length}) "${valueLine}"`);
    }

    const body = bodyCopy((patch.longDescription as string | undefined) ?? p.longDescription);
    if (body && body !== p.longDescription) {
      patch.longDescription = body;
      report.push(`  ${p.slug}: longDescription capped to ${body.length}`);
    }

    if (Object.keys(patch).length) {
      patch.updatedAt = new Date();
      await db.update(products).set(patch).where(eq(products.id, p.id));
    }
  }

  console.log(report.join("\n"));
  console.log(`\n${report.length} change(s) across ${all.length} product(s)`);
}

main()
  .catch((e) => {
    console.error("FAILED:", e.message);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
