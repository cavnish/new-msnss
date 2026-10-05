import { chromium } from "@playwright/test";

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();

for (const slug of ["plasma-cutting-machine", "ms-rectangular-duct"]) {
  await page.goto(`http://localhost:3000/products/${slug}`, { waitUntil: "networkidle" });
  await page.waitForTimeout(700);

  const m = await page.evaluate(() => {
    const h1 = document.querySelector("h1");
    const col = h1?.closest("div[class*='col-span']");
    const kids = col ? Array.from(col.querySelectorAll(":scope > * > *")) : [];
    return {
      colHeight: col ? Math.round(col.getBoundingClientRect().height) : 0,
      colTop: col ? Math.round(col.getBoundingClientRect().top) : 0,
      parts: kids.map((k) => ({
        tag: k.tagName.toLowerCase(),
        cls: String(k.className).slice(0, 40),
        h: Math.round(k.getBoundingClientRect().height),
        lines: (() => {
          let n = 0;
          k.childNodes.forEach((cn) => {
            if (cn.nodeType === 3 && cn.textContent.trim()) {
              const r = document.createRange();
              r.selectNode(cn);
              n += r.getClientRects().length;
            }
          });
          return n;
        })(),
        text: (k.textContent || "").trim().replace(/\s+/g, " ").slice(0, 58),
      })),
    };
  });

  console.log(`\n=== ${slug} === right column: top ${m.colTop}, height ${m.colHeight}, bottom ${m.colTop + m.colHeight}`);
  for (const p of m.parts) {
    console.log(`  ${String(p.h).padStart(4)}px lines=${p.lines}  <${p.tag}> ${p.text}`);
  }
}
await browser.close();
