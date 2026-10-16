import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const env = Object.fromEntries(
  fs.readFileSync(path.join(root, ".env.local"), "utf8").split(/\r?\n/)
    .filter((l) => /^\s*[A-Za-z_]+\s*=/.test(l))
    .map((l) => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, "")]; })
);

const conn = env.DATABASE_URL;
const u = new URL(conn);
const host = u.hostname;
const httpHost = host; // Neon serverless accepts the same host over https

async function hit(url, opts) {
  const s = Date.now();
  try {
    const r = await fetch(url, opts);
    const text = await r.text();
    console.log(`HTTP ${r.status} ${Date.now() - s}ms url=${url}\n   body: ${text.slice(0, 300)}`);
  } catch (e) {
    console.log(`HTTP FAIL ${Date.now() - s}ms url=${url} => ${e.message}`);
  }
}

console.log("endpoint host:", httpHost);

// Neon SQL-over-HTTP endpoint (used by @neondatabase/serverless)
await hit(`https://${httpHost}/sql`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Neon-Connection-String": conn,
  },
  body: JSON.stringify({ query: "select 1 as ok", params: [] }),
});
