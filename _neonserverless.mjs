import { Pool, neonConfig } from "@neondatabase/serverless";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const env = Object.fromEntries(
  fs.readFileSync(path.join(root, ".env.local"), "utf8").split(/\r?\n/)
    .filter((l) => /^\s*[A-Za-z_]+\s*=/.test(l))
    .map((l) => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, "")]; })
);

// Node 24 has a global WebSocket; the driver picks it up automatically.
if (typeof globalThis.WebSocket === "undefined") {
  const ws = await import("ws");
  neonConfig.webSocketConstructor = ws.default;
}
console.log("global WebSocket present:", typeof globalThis.WebSocket);

const t0 = Date.now();
const pool = new Pool({ connectionString: env.DATABASE_URL, max: 5 });
pool.on("error", (e) => console.log("POOL ERROR", e.message));
try {
  const r = await pool.query("select id, email, name, length(password_hash) as hlen from admin_users limit 5");
  console.log(`serverless Pool query OK in ${Date.now() - t0}ms; rows=${r.rowCount}`);
  for (const row of r.rows) console.log("  ", row.id, row.email, row.name, "hashLen=" + row.hlen);
  const t1 = Date.now();
  const r2 = await pool.query("select count(*)::int as n from products");
  console.log(`2nd query (pooled) ${Date.now() - t1}ms, products=${r2.rows[0].n}`);
} catch (e) {
  console.log(`FAIL in ${Date.now() - t0}ms => ${e.message}`);
} finally {
  await pool.end().catch(() => {});
}
