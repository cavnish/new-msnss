import { Client } from "pg";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const lines = fs.readFileSync(path.join(root, ".env.local"), "utf8").split(/\r?\n/);
const env = {};
for (const l of lines) {
  const m = /^\s*([A-Za-z_]+)\s*=\s*(.*)$/.exec(l);
  if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
}
const base = env.DATABASE_URL;

async function attempt(label, connStr, extra = {}) {
  const s = Date.now();
  const c = new Client({ connectionString: connStr, connectionTimeoutMillis: 8000, ...extra });
  c.on("error", () => {});
  try {
    await c.connect();
    const r = await c.query("select current_user as u, version() as v");
    console.log(`${label}: OK ${Date.now() - s}ms user=${r.rows[0].u}`);
    console.log("   version:", r.rows[0].v.slice(0, 60));
  } catch (e) {
    console.log(`${label}: FAIL ${Date.now() - s}ms => ${e.message} [code=${e.code}]`);
  } finally {
    try { await c.end(); } catch {}
  }
}

console.log("original URL (secrets redacted):", base.replace(/:\/\/[^@]+@/, "://***:***@"));
await attempt("as-is", base);
await attempt("sslmode=verify-full", base.replace(/sslmode=\w+/, "sslmode=verify-full"));
await attempt("sslmode=no-verify", base.replace(/sslmode=\w+/, "sslmode=no-verify"));
await attempt("sslmode=disable", base.replace(/sslmode=\w+/, "sslmode=disable"));
const noCb = base.replace(/&?channel_binding=\w+/, "");
await attempt("no channel_binding", noCb);
await attempt("direct (no -pooler)", base.replace("-pooler", ""));
await attempt("no pooler + no channel_binding", noCb.replace("-pooler", ""));
