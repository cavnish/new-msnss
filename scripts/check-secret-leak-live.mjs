/**
 * Live leak check: crawls the running site as an anonymous visitor and scans
 * every byte the browser actually receives (HTML, JS chunks, JSON, RSC payloads)
 * for the server-only secrets from .env.local.
 */
import { chromium } from "@playwright/test";
import { readFileSync } from "node:fs";
import path from "node:path";

const BASE = process.env.BASE || "http://localhost:3000";
const env = readFileSync(path.join(process.cwd(), ".env.local"), "utf8");

const secrets = [];
for (const line of env.split(/\r?\n/)) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.+?)\s*$/);
  if (!m) continue;
  const [, key, raw] = m;
  if (key.startsWith("NEXT_PUBLIC_")) continue;
  const value = raw.replace(/^['"]|['"]$/g, "").trim();
  if (value.length >= 12) secrets.push({ key, value });
}
const url = secrets.find((s) => s.key === "DATABASE_URL")?.value ?? "";
const needles = [
  ["neon host", url ? new URL(url).hostname : ""],
  ["neon password", url ? decodeURIComponent(new URL(url).password) : ""],
  ["DATABASE_URL", url],
  ["AUTH_SECRET", secrets.find((s) => s.key === "AUTH_SECRET")?.value ?? ""],
].filter(([, v]) => v);

console.log(`watching for: ${needles.map(([k]) => k).join(", ")}\n`);

const ROUTES = ["/", "/about", "/products", "/products/ms-round-duct", "/projects", "/solutions", "/contact", "/catalogue", "/plant-and-machinery", "/admin/login"];
const browser = await chromium.launch();
const ctx = await browser.newContext();
const page = await ctx.newPage();

const leaks = new Map();
let responses = 0;

const inspect = (kind, needle, where) => {
  const key = `${kind} :: ${where}`;
  if (!leaks.has(key)) leaks.set(key, 0);
  leaks.set(key, leaks.get(key) + 1);
};

page.on("response", async (res) => {
  responses++;
  const type = res.headers()["content-type"] || "";
  if (!/text|javascript|json|html/i.test(type)) return;
  let body = "";
  try {
    body = await res.text();
  } catch {
    return;
  }
  for (const [kind, needle] of needles) {
    if (body.includes(needle)) inspect(kind, needle, `${res.status()} ${res.url().replace(BASE, "")} [${type.split(";")[0]}]`);
  }
});

for (const route of ROUTES) {
  await page.goto(BASE + route, { waitUntil: "networkidle" });
}

await browser.close();

console.log(`inspected ${responses} response(s) across ${ROUTES.length} route(s)`);
if (leaks.size === 0) {
  console.log("CLEAN: no server-only secret was delivered to the browser");
} else {
  for (const [key, n] of leaks) console.log(`LEAK (${n}x) ${key}`);
  process.exitCode = 1;
}
