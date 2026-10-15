import { chromium, devices } from "@playwright/test";

const BASE = process.env.BASE_URL || "http://localhost:3111";
const OUT = "scripts/_shots";
import { mkdirSync } from "node:fs";
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();

for (const vp of [
  { name: "desktop", opts: { viewport: { width: 1440, height: 900 } } },
  { name: "mobile", opts: { ...devices["iPhone 13"] } },
]) {
  const ctx = await browser.newContext(vp.opts);
  const page = await ctx.newPage();

  await page.goto(BASE + "/", { waitUntil: "networkidle" });
  await page.locator("#cta-band").scrollIntoViewIfNeeded();
  await page.waitForTimeout(1200);
  await page.locator("#cta-band").screenshot({ path: `${OUT}/cta-${vp.name}.png` });

  await page.locator("#brief").scrollIntoViewIfNeeded();
  await page.waitForTimeout(800);
  await page.locator("#brief").screenshot({ path: `${OUT}/brief-${vp.name}.png` });

  await page.goto(BASE + "/contact", { waitUntil: "networkidle" });
  await page.waitForTimeout(800);
  await page.locator("section.relative.isolate").first().screenshot({ path: `${OUT}/contact-${vp.name}.png` });

  await ctx.close();
}

await browser.close();
console.log("shots saved");
