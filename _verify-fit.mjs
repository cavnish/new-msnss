import { chromium } from "@playwright/test";

const BASE = "http://localhost:3000";
const browser = await chromium.launch();

const VIEWPORTS = [
  { width: 1920, height: 1200 },
  { width: 1920, height: 1080 },
  { width: 1500, height: 1000 },
  { width: 1366, height: 768 },
  { width: 1280, height: 720 },
  { width: 1024, height: 640 },
];

const PAGES = [
  { url: "/products", sel: "section.surface-soft", label: "listing" },
  { url: "/products/ms-rectangular-duct", sel: "main > section", label: "detail" },
  { url: "/products/fire-rated-duct", sel: "main > section", label: "detail-fire" },
  { url: "/products/cisbond-fr-802-coating", sel: "main > section", label: "detail-cisbond" },
];

for (const p of PAGES) {
  for (const vp of VIEWPORTS) {
    const page = await browser.newPage({ viewport: vp });
    await page.goto(BASE + p.url, { waitUntil: "networkidle", timeout: 120000 });
    await page
      .waitForFunction(() => getComputedStyle(document.documentElement).getPropertyValue("--nav-h").trim(), null, { timeout: 15000 })
      .catch(() => {});
    await page.waitForTimeout(500);

    const m = await page.evaluate((sel) => {
      const hero = document.querySelector(sel);
      if (!hero) return { missing: true };
      const hb = hero.getBoundingClientRect();
      const header = document.querySelector("header");
      const navH = header ? header.getBoundingClientRect().height : 0;
      // left gallery column: content must stay inside the hero box
      const left = hero.querySelector("[class*='col-span-7']");
      let galleryOver = null;
      if (left) {
        const lb = left.getBoundingClientRect();
        let worst = -Infinity;
        for (const el of left.querySelectorAll("figure, [class*='aspect'], ol")) {
          worst = Math.max(worst, el.getBoundingClientRect().bottom);
        }
        galleryOver = Math.round(worst - lb.bottom);
      }
      // right info column: internal scroll amount + CTA visibility
      const right = hero.querySelector("[class*='col-span-5']");
      let infoOverflow = null;
      let ctaVisible = null;
      if (right) {
        infoOverflow = right.scrollHeight - right.clientHeight;
        const cta = right.querySelector('a[href*="source=product"]');
        if (cta) {
          const rb = right.getBoundingClientRect();
          const cb = cta.getBoundingClientRect();
          const clipped = Math.max(0, cb.bottom - Math.min(cb.bottom, rb.bottom));
          ctaVisible = Math.round(cb.height - clipped);
        }
      }
      return {
        fit:
          Math.abs(hb.bottom - window.innerHeight) <= 2 &&
          Math.abs(hb.top - navH) <= 2,
        galleryOver,
        infoOverflow,
        ctaVisible,
        hScroll: document.documentElement.scrollWidth > window.innerWidth,
      };
    }, p.sel);

    const status = m.missing
      ? "MISSING"
      : `${m.fit ? "one-screen OK " : "FIT FAIL "} | gallery over: ${m.galleryOver}px | info scroll: ${m.infoOverflow}px | CTA visible: ${m.ctaVisible}px | h-scroll: ${m.hScroll}`;
    console.log(`${p.label} ${vp.width}x${vp.height}: ${status}`);
    if (m.missing) console.log("   ", JSON.stringify(m));
    await page.close();
  }
}

await browser.close();
console.log("done");
