import { Pool } from "pg";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const lines = fs.readFileSync(path.join(root, ".env.local"), "utf8").split(/\r?\n/);
const env = {};
for (const l of lines) {
  const m = /^\s*([A-Za-z_]+)\s*=\s*(.*)$/.exec(l);
  if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
}

function normalizeSslMode(url) {
  if (!/^[a-z][a-z0-9+.-]*:\/\//i.test(url)) return url;
  return url.replace(
    /([?&]sslmode=)(prefer|require|verify-ca)(?=&|#|$)/gi,
    "$1verify-full"
  );
}

console.log("DATABASE_URL host:", (() => {
  try { return new URL(env.DATABASE_URL).host; } catch { return "unparseable"; }
})());

const t0 = Date.now();
const pool = new Pool({
  connectionString: normalizeSslMode(env.DATABASE_URL),
  max: 10,
  connectionTimeoutMillis: 5000,
  idleTimeoutMillis: 30000,
});

pool.on("error", (e) => console.log("POOL ERROR:", e.message, e.code));

async function timed(label, fn) {
  const s = Date.now();
  try {
    const r = await fn();
    console.log(`${label}: OK ${Date.now() - s}ms`, r);
    return r;
  } catch (e) {
    console.log(`${label}: FAIL ${Date.now() - s}ms => ${e.message} [code=${e.code} addr=${e.address}:${e.port}]`);
    return null;
  }
}

await timed("connect", () => pool.query("select 1 as ok"));
const r = await timed("admin_users", () =>
  pool.query("select id, email, name, password_hash from admin_users limit 5")
);
if (r) {
  for (const row of r.rows) {
    console.log("  user id=%s email=%s hashLen=%s hashPrefix=%s", row.id, row.email, row.password_hash?.length, row.password_hash?.slice(0, 7));
  }
}
console.log("TOTAL", Date.now() - t0, "ms");
await pool.end();
