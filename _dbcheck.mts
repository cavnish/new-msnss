import { Client } from "pg";
import fs from "node:fs";

const env = Object.fromEntries(
  fs
    .readFileSync(".env.local", "utf8")
    .split(/\r?\n/)
    .filter((l) => /^\s*[A-Za-z_]+\s*=/.test(l))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, "")];
    })
);

const c = new Client({ connectionString: env.DATABASE_URL });
await c.connect();

const r = await c.query(
  "select max(updated_at) as upd, count(*) as n from products"
).catch(async () =>
  c.query("select max(\"updatedAt\") as upd, count(*) as n from products")
);
console.log("products:", JSON.stringify(r.rows[0]));

const g = await c.query(
  `select count(*) as total,
          count(*) filter (where jsonb_array_length(gallery::jsonb) = 6) as six,
          count(*) filter (where jsonb_array_length(gallery::jsonb) = 0) as zero
     from products`
).catch(() => null);
if (g) console.log("gallery:", JSON.stringify(g.rows[0]));

const w = await c.query(
  `select id, name, "updatedAt" from products order by "updatedAt" desc limit 5`
);
console.log("most recently updated products:");
for (const row of w.rows) console.log(`  ${row.updatedAt}  #${row.id} ${row.name}`);

await c.end();
