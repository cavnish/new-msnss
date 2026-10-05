import "./src/db/env";
import { db, pool } from "./src/db";
import { sql } from "drizzle-orm";

async function main() {
  const r = await db.execute(sql`
    select slug, left(regexp_replace("long_description", '\\s+', ' ', 'g'), 95) as head
    from products order by id
  `);
  for (const x of (r as unknown as { rows: { slug: string; head: string }[] }).rows) {
    console.log(`${x.slug.padEnd(26)} ${x.head}`);
  }
}
main().catch((e) => console.error("FAILED:", e.message)).finally(() => pool.end());
