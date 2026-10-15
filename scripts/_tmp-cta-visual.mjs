/**
 * Temporary verification: CTA + contact background-image design system.
 * Checks desktop & mobile on /, /contact, and CTA-bearing pages:
 *  - background <img> present and actually loaded (naturalWidth > 0)
 *  - overlay layers present (aria-hidden)
 *  - heading/button text visible with non-zero bounding box
 *  - no horizontal overflow (layout shift / responsive sanity)
 *  - no failed image requests
 */
import { chromium, devices } from "@playwright/test";

const BASE = process.env.BASE_URL || "http://localhost:3111";
const PAGES = ["/", "/contact", "/catalogue", "/projects", "/projects/idfc-bank", "/clients/idfc-bank"];

const results = [];
let failures = 0;

function ok(page, name, pass, detail = "") {
  results.push({ page, name, pass, detail });
  if (!pass) failures++;
}

const browser = await chromium.launch();

for (const vp of [
  { label: "desktop", width: 1440, height: 900 },
  { label: "mobile", ...devices["iPhone 13"] },
]) {
  const ctx = await browser.newContext(
    vp.label === "mobile"
      ? { ...devices["iPhone 13"] }
      : { viewport: { width: vp.width, height: vp.height } }
  );
  const page = await ctx.newPage();

  const failedReq = [];
  page.on("requestfailed", (r) => {
    if (/\.(png|jpe?g|webp|avif|svg|gif)(\?|$)/i.test(r.url())) failedReq.push(r.url());
  });
  const bad4xx = [];
  page.on("response", (r) => {
    if (r.status() >= 400 && /\.(png|jpe?g|webp|avif|svg|gif)(\?|$)/i.test(r.url()))
      bad4xx.push(`${r.status()} ${r.url()}`);
  });

  for (const path of PAGES) {
    failedReq.length = 0;
    bad4xx.length = 0;
    await page.goto(BASE + path, { waitUntil: "networkidle", timeout: 60000 });
    const tag = `${vp.label} ${path}`;

    // CTA band (present on all listed pages except /contact, the CTA target,
    // and client pages, which carry their own closing band)
    const hasCta = path !== "/contact" && !path.startsWith("/clients/");
    const cta = page.locator("#cta-band");
    if (hasCta && (await cta.count()) > 0) {
      const bgImg = cta.locator('img[aria-hidden="true"]').first();
      await cta.scrollIntoViewIfNeeded().catch(() => {});
      await bgImg.waitFor({ state: "attached", timeout: 10000 }).catch(() => {});
      const imgOk = await bgImg
        .evaluate(async (el) => {
          if (el.complete && el.naturalWidth > 0) return true;
          await new Promise((res) => {
            el.addEventListener("load", res, { once: true });
            el.addEventListener("error", res, { once: true });
            setTimeout(res, 8000);
          });
          return el.complete && el.naturalWidth > 0;
        })
        .catch(() => false);
      ok(tag, "CTA bg image loaded", imgOk);

      const overlays = await cta.locator('div[aria-hidden="true"]').count();
      ok(tag, "CTA overlay layers >= 3", overlays >= 3, `found ${overlays}`);

      const heading = cta.locator("#cta-band-heading");
      const hbox = await heading.boundingBox();
      ok(tag, "CTA heading visible", !!hbox && hbox.height > 10, JSON.stringify(hbox));

      const btn = cta.locator('a[href="/contact"]').first();
      const bbox = await btn.boundingBox();
      ok(tag, "CTA CTA-button visible", !!bbox && bbox.height > 20, JSON.stringify(bbox));
    } else if (hasCta) {
      ok(tag, "CTA band present", false, "missing #cta-band");
    }

    // Contact section background
    if (path === "/contact") {
      const secImgs = page.locator("section.relative.isolate img");
      const n = await secImgs.count();
      ok(tag, "contact bg image present", n > 0, `found ${n}`);
      if (n > 0) {
        const cOk = await secImgs.first().evaluate((el) => el.complete && el.naturalWidth > 0).catch(() => false);
        ok(tag, "contact bg image loaded", cOk);
      }
      const form = page.locator("form").first();
      const fb = await form.boundingBox().catch(() => null);
      ok(tag, "contact form visible", !!fb && fb.height > 50, JSON.stringify(fb));
      // Inquiry heading readable
      const h = page.getByRole("heading", { name: /Send an Inquiry/i });
      ok(tag, "inquiry heading visible", await h.isVisible().catch(() => false));
    }

    // Homepage brief panel
    if (path === "/") {
      const brief = page.locator("#brief");
      const nb = await brief.count();
      ok(tag, "brief section present", nb > 0);
      if (nb > 0) {
        const bimg = brief.locator('img[aria-hidden="true"]').first();
        await brief.scrollIntoViewIfNeeded().catch(() => {});
        const bOk = await bimg
          .evaluate(async (el) => {
            if (el.complete && el.naturalWidth > 0) return true;
            await new Promise((res) => {
              el.addEventListener("load", res, { once: true });
              el.addEventListener("error", res, { once: true });
              setTimeout(res, 8000);
            });
            return el.complete && el.naturalWidth > 0;
          })
          .catch(() => false);
        ok(tag, "brief bg loaded", bOk);
        const bh = brief.getByRole("heading", { name: /Have a project in mind/i });
        ok(tag, "brief heading visible", await bh.isVisible().catch(() => false));
        const tels = await brief.locator('a[href^="tel:"]').count();
        ok(tag, "brief contact links present", tels > 0, `${tels} tel links`);
      }
    }

    // Client page closing band ("Have a Similar Project?")
    if (path === "/clients/idfc-bank") {
      const band = page.locator("#client-cta");
      const nb = await band.count();
      ok(tag, "client CTA band present", nb > 0);
      if (nb > 0) {
        await band.scrollIntoViewIfNeeded().catch(() => {});
        const cimg = band.locator('img[aria-hidden="true"]').first();
        await cimg.waitFor({ state: "attached", timeout: 10000 }).catch(() => {});
        const cOk = await cimg
          .evaluate(async (el) => {
            if (el.complete && el.naturalWidth > 0) return true;
            await new Promise((res) => {
              el.addEventListener("load", res, { once: true });
              el.addEventListener("error", res, { once: true });
              setTimeout(res, 8000);
            });
            return el.complete && el.naturalWidth > 0;
          })
          .catch(() => false);
        ok(tag, "client band bg loaded", cOk);
        const overlays = await band.locator('div[aria-hidden="true"]').count();
        ok(tag, "client band overlay layers >= 3", overlays >= 3, `found ${overlays}`);
        const ch = band.getByRole("heading", { name: /Have a Similar Project/i });
        ok(tag, "client band heading visible", await ch.isVisible().catch(() => false));
        const ib = band.locator('a[href*="source=client"]').first();
        const ibb = await ib.boundingBox().catch(() => null);
        ok(tag, "client band inquiry link visible", !!ibb && ibb.height > 20, JSON.stringify(ibb));
      }
    }

    // No horizontal overflow
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth
    );
    ok(tag, "no horizontal overflow", overflow <= 2, `overflow ${overflow}px`);

    ok(tag, "no failed/4xx image requests", failedReq.length === 0 && bad4xx.length === 0,
      [...failedReq, ...bad4xx].join(", "));
  }

  await ctx.close();
}

await browser.close();

for (const r of results) {
  console.log(`${r.pass ? "PASS" : "FAIL"} | ${r.page} | ${r.name}${r.detail ? " | " + r.detail : ""}`);
}
console.log(`\n${results.filter((r) => r.pass).length}/${results.length} passed, ${failures} failures`);
process.exit(failures ? 1 : 0);
