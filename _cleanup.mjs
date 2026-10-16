import { Pool } from "@neondatabase/serverless";
import fs from "node:fs";
import path from "node:path";
const env = Object.fromEntries(
  fs.readFileSync(path.join(process.cwd(), ".env.local"), "utf8").split(/\r?\n/)
    .filter((l) => /^\s*[A-Za-z_]+\s*=/.test(l))
    .map((l) => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, "")]; })
);
const pool = new Pool({ connectionString: env.DATABASE_URL, max: 2 });
const rows = await pool.query("select id, title from hero_slides where title = 'WRITE-HOOK PROBE'");
console.log("probe rows:", JSON.stringify(rows.rows));
const all = await pool.query("select id, title from hero_slides order by id");
console.log("all hero_slides:", JSON.stringify(all.rows));
if (rows.rowCount) {
  await pool.query("delete from hero_slides where title = 'WRITE-HOOK PROBE'");
  console.log("deleted probe rows");
}
const after = await pool.query("select count(*)::int n from hero_slides where title='WRITE-HOOK PROBE'");
console.log("remaining probe rows:", after.rows[0].n);
await pool.end();
