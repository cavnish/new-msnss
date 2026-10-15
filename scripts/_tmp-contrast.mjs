/**
 * Temporary: WCAG contrast verification for CTA / brief / contact sections.
 * Screenshots the container element, then analyzes the sub-region behind the
 * text (container-relative coords, scaled by device pixel ratio), excluding
 * near-white glyph pixels to get the true background luminance, and computes
 * the WCAG contrast ratio. Threshold >= 4.5:1.
 */
import { chromium, devices } from "@playwright/test";

const BASE = process.env.BASE_URL || "http://localhost:3111";
const browser = await chromium.launch();

async function contrast(page, container, textEl, label) {
  await container.scrollIntoViewIfNeeded().catch(() => {});
  await page.waitForTimeout(400);
  const cb = await container.boundingBox();
  const tb = await textEl.boundingBox();
  if (!cb || !tb) return { label, ratio: 0, err: "no box" };

  const buf = await container.screenshot(); // device-pixel image of container
  const dpr = await page.evaluate(() => window.devicePixelRatio || 1);

  // Real glyph colour — the metric works for white-on-dark AND dark-on-light.
  const color = await textEl
    .evaluate((el) => getComputedStyle(el).color)
    .catch(() => "");
  const cm = color.match(/rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)(?:,\s*([\d.]+))?\)/);
  const lum = (r, g, b) => {
    const f = (v) => {
      v /= 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    };
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
  };
  const lTextBase = cm ? lum(+cm[1], +cm[2], +cm[3]) : 1;
  const textAlpha = cm && cm[4] !== undefined ? +cm[4] : 1;

  const stats = await page.evaluate(
    async ({ b64, rx, ry, rw, rh, dpr, lText }) => {
      const img = new Image();
      img.src = "data:image/png;base64," + b64;
      await img.decode();
      const c = document.createElement("canvas");
      c.width = img.width;
      c.height = img.height;
      const g = c.getContext("2d");
      g.drawImage(img, 0, 0);
      const x = Math.max(0, Math.round(rx * dpr)),
        y = Math.max(0, Math.round(ry * dpr));
      const w = Math.min(Math.round(rw * dpr), c.width - x),
        h = Math.min(Math.round(rh * dpr), c.height - y);
      if (w <= 0 || h <= 0) return null;
      const d = g.getImageData(x, y, w, h).data;
      const lum = (r, g, b) => {
        const f = (v) => {
          v /= 255;
          return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
        };
        return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
      };
      // Median luminance of every NON-glyph pixel: robust against
      // antialiasing tails in either direction, and against photos.
      const bg = [];
      for (let i = 0; i < d.length; i += 4) {
        const L = lum(d[i], d[i + 1], d[i + 2]);
        if (Math.abs(L - lText) >= 0.18) bg.push(L);
      }
      if (!bg.length) return null;
      bg.sort((a, b) => a - b);
      return { meanBg: bg[bg.length >> 1] };
    },
    {
      b64: buf.toString("base64"),
      rx: tb.x - cb.x,
      ry: tb.y - cb.y,
      rw: tb.width,
      rh: tb.height,
      dpr,
      lText: lTextBase,
    }
  );
  if (!stats || stats.meanBg === null || stats.meanBg === undefined)
    return { label, ratio: 0, err: "no region" };
  // Blend translucent text over the measured background.
  const lText =
    textAlpha < 1 ? textAlpha * lTextBase + (1 - textAlpha) * stats.meanBg : lTextBase;
  const hi = Math.max(lText, stats.meanBg);
  const lo = Math.min(lText, stats.meanBg);
  const ratio = (hi + 0.05) / (lo + 0.05);
  return { label, ratio: +ratio.toFixed(2), meanBg: +stats.meanBg.toFixed(4) };
}

let failures = 0;
const report = (r) => {
  const pass = r.ratio >= 4.5 && !r.err;
  if (!pass) failures++;
  console.log(
    `${pass ? "PASS" : "FAIL"} | ${r.label} | contrast ${r.ratio}:1 (bg L=${r.meanBg}${r.err ? " ERR:" + r.err : ""})`
  );
};

for (const vp of [
  { name: "desktop", opts: { viewport: { width: 1440, height: 900 } } },
  { name: "mobile", opts: { ...devices["iPhone 13"] } },
]) {
  const ctx = await browser.newContext(vp.opts);
  const page = await ctx.newPage();

  await page.goto(BASE + "/", { waitUntil: "networkidle" });
  const cta = page.locator("#cta-band");
  await cta.scrollIntoViewIfNeeded();
  await page.waitForTimeout(1200);

  report(await contrast(page, cta, cta.locator("#cta-band-heading"), `${vp.name} / CTA heading`));
  report(await contrast(page, cta, cta.locator("p").first(), `${vp.name} / CTA subtext`));

  const brief = page.locator("#brief");
  await brief.scrollIntoViewIfNeeded();
  await page.waitForTimeout(800);
  const briefPanel = brief.locator("div.relative.isolate").first();
  const bh = briefPanel.getByRole("heading", { name: /Have a project in mind/i });
  report(await contrast(page, briefPanel, bh, `${vp.name} / brief heading`));
  report(await contrast(page, briefPanel, briefPanel.locator("p").first(), `${vp.name} / brief subtext`));

  await page.goto(BASE + "/contact", { waitUntil: "networkidle" });
  await page.waitForTimeout(800);
  const csec = page.locator("section.relative.isolate").first();
  const gth = csec.getByRole("heading", { name: /Get in Touch/i });
  report(await contrast(page, csec, gth, `${vp.name} / contact "Get in Touch" heading on dark`));
  const fcard = page.locator("div.rounded-2xl.border").first();
  const ih = page.getByRole("heading", { name: /Send an Inquiry/i });
  report(await contrast(page, fcard, ih, `${vp.name} / contact inquiry heading`));
  const form = page.locator("form").first();
  const fvis = await form.isVisible();
  if (!fvis) failures++;
  console.log(`${fvis ? "PASS" : "FAIL"} | ${vp.name} / contact form visible`);

  await page.goto(BASE + "/clients/idfc-bank", { waitUntil: "networkidle" });
  const band = page.locator("#client-cta");
  await band.scrollIntoViewIfNeeded();
  await page.waitForTimeout(800);
  const ch = band.getByRole("heading", { name: /Have a Similar Project/i });
  report(await contrast(page, band, ch, `${vp.name} / client band heading on dark`));
  report(await contrast(page, band, band.locator("p").first(), `${vp.name} / client band subtext`));

  await ctx.close();
}

await browser.close();
console.log(failures ? `\n${failures} failures` : "\nAll contrast checks passed (>= 4.5:1)");
process.exit(failures ? 1 : 0);
