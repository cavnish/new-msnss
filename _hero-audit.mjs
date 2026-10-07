import { chromium } from "@playwright/test";

const BASE = process.env.BASE || "http://localhost:3000";
const OUT = "C:/Users/AIS/AppData/Local/Temp/opencode";
const VIEWPORTS = [
  { name: "mobile", width: 360, height: 800 },
  { name: "mobile-sm", width: 320, height: 720 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "desktop", width: 1440, height: 900 },
];

const browser = await chromium.launch();
const msgs = [];

for (const vp of VIEWPORTS) {
  const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
  const page = await ctx.newPage();
  page.on("console", (m) => {
    if (m.type() === "error" || m.type() === "warning")
      msgs.push(`[${vp.name}][${m.type()}] ${m.text()}`);
  });
  page.on("pageerror", (e) => msgs.push(`[${vp.name}][pageerror] ${e.message}`));

  await page.goto(`${BASE}/`, { waitUntil: "networkidle", timeout: 60000 });
  await page.waitForTimeout(1200);

  const section = page.locator('section[aria-label="MSNSS hero"]');
  const secBox = await section.boundingBox();
  const dots = await section.locator('button[aria-label^="Go to slide"]').count();
  const arrows = await section.locator('button[aria-label="Next slide"], button[aria-label="Previous slide"]').count();

  const slides = await section.locator("h1").count();
  const total = await page.evaluate(() => {
    const s = document.querySelector('section[aria-label="MSNSS hero"]');
    return { scrollH: s.scrollHeight, clientH: s.clientHeight, docScrollW: document.documentElement.scrollWidth, docClientW: document.documentElement.clientWidth };
  });

  // per-slide measurements
  const n = Math.max(1, await section.locator('button[aria-label="Next slide"]').count() ? await section.locator('button[aria-label="Go to slide"]').count().catch(() => 0) : 0);
  const count = await page.evaluate(() => document.querySelectorAll('section[aria-label="MSNSS hero"] h1').length);

  const slideReports = [];
  for (let i = 0; i < 3; i++) {
    const data = await page.evaluate(() => {
      const s = document.querySelector('section[aria-label="MSNSS hero"]');
      const content = s.querySelector(".relative.z-10");
      const h1 = s.querySelector("h1");
      const ctas = [...s.querySelectorAll("a")].slice(0, 2).map((a) => {
        const r = a.getBoundingClientRect();
        return { text: a.innerText.trim().replace(/\s+/g, " "), x: Math.round(r.x), w: Math.round(r.width), h: Math.round(r.height), y: Math.round(r.y) };
      });
      const stats = [...s.querySelectorAll(".grid > div")].map((d) => {
        const r = d.getBoundingClientRect();
        return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) };
      });
      const cr = content.getBoundingClientRect();
      const sr = s.getBoundingClientRect();
      return {
        title: h1 ? h1.innerText.replace(/\n/g, " | ") : "",
        sectionH: Math.round(sr.height),
        contentTop: Math.round(cr.top - sr.top),
        contentBottom: Math.round(cr.bottom - sr.top),
        contentScrollH: content.scrollHeight,
        contentClientH: content.clientHeight,
        ctas,
        stats,
        overflowX: document.documentElement.scrollWidth > document.documentElement.clientWidth,
      };
    });
    slideReports.push(data);
    await page.screenshot({ path: `${OUT}/hero-${vp.name}-slide${i + 1}.png`, clip: { x: 0, y: 0, width: vp.width, height: Math.min(vp.height, Math.round(secBox.height)) } });
    const next = section.locator('button[aria-label="Next slide"]');
    if (await next.count()) { await next.click(); await page.waitForTimeout(1400); }
  }

  console.log(`\n=== ${vp.name} (${vp.width}x${vp.height}) ===`);
  console.log("section box:", JSON.stringify(secBox));
  console.log("dots:", dots, "arrows:", arrows, "h1 count:", slides, "doc:", JSON.stringify(total));
  slideReports.forEach((r, i) => console.log(` slide${i + 1}:`, JSON.stringify(r)));
  await ctx.close();
}

console.log("\n=== console messages ===");
console.log(msgs.length ? [...new Set(msgs)].join("\n") : "none");
await browser.close();
