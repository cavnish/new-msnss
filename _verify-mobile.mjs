import { chromium } from "@playwright/test";

const BASE = "http://localhost:3000";
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 375, height: 812 } });

for (const url of ["/", "/products", "/products/fire-rated-duct", "/solutions"]) {
  await page.goto(BASE + url, { waitUntil: "networkidle", timeout: 120000 });
  await page.waitForTimeout(600);
  const m = await page.evaluate(() => ({
    hScroll: document.documentElement.scrollWidth - window.innerWidth,
    bodyW: document.body.scrollWidth,
  }));
  console.log(`${url}: horizontal overflow: ${m.hScroll}px`);
}

await browser.close();
console.log("done");
