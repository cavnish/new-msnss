import { chromium } from "@playwright/test";

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
const page = await ctx.newPage();
await page.goto("http://localhost:3000/products/ms-rectangular-duct", { waitUntil: "networkidle" });
await page.waitForTimeout(700);

const culprits = await page.evaluate(() => {
  const vw = window.innerWidth;
  const out = [];
  document.querySelectorAll("body *").forEach((el) => {
    const r = el.getBoundingClientRect();
    if (r.width > vw + 1) {
      out.push({
        tag: el.tagName.toLowerCase(),
        cls: String(el.className || "").slice(0, 90),
        w: Math.round(r.width),
        left: Math.round(r.left),
        depth: (() => { let d = 0, n = el; while ((n = n.parentElement)) d++; return d; })(),
      });
    }
  });
  return { vw, out: out.slice(0, 25) };
});

console.log("viewport width:", culprits.vw);
console.log("elements wider than the viewport:");
for (const c of culprits.out) {
  console.log(`  d${String(c.depth).padStart(2)} ${c.w}px  <${c.tag}> ${c.cls}`);
}
await browser.close();
