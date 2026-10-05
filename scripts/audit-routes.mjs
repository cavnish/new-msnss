import { chromium } from "@playwright/test";

const BASE = process.env.BASE || "http://localhost:3000";

const ROUTES = [
  "/", "/about", "/catalogue", "/contact", "/privacy-policy", "/terms-and-conditions",
  "/plant-and-machinery", "/products", "/projects", "/solutions",
  "/products/ms-round-duct", "/products/ms-rectangular-duct", "/products/ss-rectangular-duct",
  "/products/ss-round-duct", "/products/flanged-duct", "/products/angle-frame-duct",
  "/products/fire-rated-duct", "/products/kitchen-exhaust-duct", "/products/duct-flange",
  "/products/access-door", "/products/volume-control-damper", "/products/cisbond-fr-802-coating",
  "/plant-and-machinery/plasma-cutting-machine", "/plant-and-machinery/bending-punching-machine",
  "/projects/idfc-bank", "/projects/oberoi-sky-city", "/projects/bikanervala-restaurant",
  "/projects/four-seasons-hotel", "/projects/jupiter-hospital",
  "/projects/general-aviation-terminal", "/projects/oberoi-commerce-iii",
  "/solutions/duct-manufacturing", "/solutions/fabrication", "/solutions/installation",
  "/solutions/insulation-pasting", "/solutions/fire-rated-coating", "/solutions/surface-treatment",
  "/clients/idfc-bank", "/clients/oberoi-realty", "/clients/four-seasons", "/clients/bikanervala",
  "/clients/jupiter-hospital", "/clients/aviation-terminal",
  "/admin/login", "/robots.txt", "/sitemap.xml", "/this-page-does-not-exist",
];

const IGNORE = [/favicon/i, /Download the React DevTools/i];

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
let total = 0;

for (const route of ROUTES) {
  const page = await ctx.newPage();
  const errs = [];
  const bad = [];
  const failed = [];

  page.on("console", (m) => {
    const t = m.text();
    if ((m.type() === "error" || m.type() === "warning") && !IGNORE.some((r) => r.test(t)))
      errs.push(`${m.type()} ${t.slice(0, 200)}`);
  });
  page.on("pageerror", (e) => errs.push(`UNCAUGHT ${e.message}`.slice(0, 200)));
  page.on("response", (r) => {
    if (r.status() >= 400 && !/favicon/i.test(r.url())) bad.push(`${r.status()} ${r.url().replace(BASE, "")}`);
  });
  page.on("requestfailed", (r) => {
    if (!/favicon/i.test(r.url())) failed.push(`${r.failure()?.errorText} ${r.url().replace(BASE, "")}`);
  });

  let status = "?";
  try {
    const resp = await page.goto(BASE + route, { waitUntil: "networkidle", timeout: 60000 });
    status = resp?.status();
    await page.waitForTimeout(300);
    const broken = await page.evaluate(() =>
      Array.from(document.images).filter((i) => i.complete && i.naturalWidth === 0).map((i) => i.currentSrc || i.src)
    );
    if (broken.length) bad.push(`BROKEN_IMG ${JSON.stringify(broken.slice(0, 5))}`);
  } catch (e) {
    bad.push(`NAV ${e.message.split("\n")[0]}`);
  }

  const uniq = [...new Set([...bad, ...failed, ...errs])];
  if (uniq.length) total += uniq.length;
  console.log(`${route.padEnd(44)} [${status}] ${uniq.length ? `${uniq.length} issue(s)` : "clean"}`);
  for (const u of uniq) console.log(`     ${u}`);
  await page.close();
}

console.log(`\n=== total distinct issues: ${total} ===`);
await browser.close();
