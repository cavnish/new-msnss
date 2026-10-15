import { chromium } from "@playwright/test";

const OUT = "C:/Users/AIS/AppData/Local/Temp/opencode";
const BASE = "http://localhost:3000";

const browser = await chromium.launch();

async function open(url, viewport) {
  const page = await browser.newPage({ viewport });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(url, { waitUntil: "networkidle", timeout: 120000 });
  // wait for the Navbar to publish --nav-h (hydration) and layout to settle
  await page
    .waitForFunction(
      () => {
        const v = getComputedStyle(document.documentElement).getPropertyValue("--nav-h").trim();
        return v && v !== "";
      },
      null,
      { timeout: 15000 }
    )
    .catch(() => {});
  await page.waitForTimeout(800);
  return { page, errors };
}

async function checkHero(url, label, selector, viewport) {
  const { page, errors } = await open(url, viewport);
  const metrics = await page.evaluate((sel) => {
    const header = document.querySelector("header");
    const navH = header ? header.getBoundingClientRect().height : 0;
    const varNav = getComputedStyle(document.documentElement)
      .getPropertyValue("--nav-h")
      .trim();
    const hero = document.querySelector(sel);
    if (!hero) return { navH, varNav, missing: true };
    const b = hero.getBoundingClientRect();
    const cta = hero.querySelector('a[href*="source=product"]');
    const ctaBox = cta ? cta.getBoundingClientRect() : null;
    const thumbs = hero.querySelector("ol");
    const thumbsBox = thumbs ? thumbs.getBoundingClientRect() : null;
    return {
      navH,
      varNav,
      heroTop: Math.round(b.top),
      heroBottom: Math.round(b.bottom),
      heroHeight: Math.round(b.height),
      viewportH: window.innerHeight,
      ctaBottom: ctaBox ? Math.round(ctaBox.bottom) : null,
      thumbsBottom: thumbsBox ? Math.round(thumbsBox.bottom) : null,
      hScroll: document.documentElement.scrollWidth > window.innerWidth,
    };
  }, selector);

  console.log(`\n[${label}] ${url}`);
  console.log(JSON.stringify(metrics));
  if (!metrics.missing) {
    const topOk = Math.abs(metrics.heroTop - metrics.navH) <= 2;
    const bottomOk = Math.abs(metrics.heroBottom - metrics.viewportH) <= 2;
    console.log(
      `  top==nav: ${topOk ? "OK" : "FAIL(" + (metrics.heroTop - metrics.navH) + "px)"} | bottom==viewport: ${bottomOk ? "OK" : "FAIL(" + (metrics.heroBottom - metrics.viewportH) + "px)"} | h-scroll: ${metrics.hScroll ? "FAIL" : "ok"}`
    );
    if (metrics.ctaBottom !== null) {
      console.log(
        `  CTA bottom ${metrics.ctaBottom} vs viewport ${metrics.viewportH}: ${metrics.ctaBottom <= metrics.viewportH ? "above fold OK" : "BELOW FOLD FAIL"}`
      );
    }
    if (metrics.thumbsBottom !== null) {
      console.log(
        `  gallery rail bottom ${metrics.thumbsBottom} vs hero bottom ${metrics.heroBottom}: ${metrics.thumbsBottom <= metrics.heroBottom + 2 ? "inside OK" : "OVERFLOW FAIL"}`
      );
    }
  } else {
    console.log("  HERO SELECTOR MISSING");
  }
  if (errors.length) console.log(`  pageerrors: ${errors.join("; ")}`);
  await page.screenshot({ path: `${OUT}/shot-${label}.png` });
  await page.close();
  return metrics;
}

async function checkText(url, label, needles) {
  const { page } = await open(url, { width: 1500, height: 1000 });
  const html = await page.content();
  const missing = needles.filter((n) => !html.includes(n));
  console.log(
    `[copy:${label}] ${missing.length ? "MISSING: " + missing.join(" | ") : "all descriptions present"}`
  );
  await page.close();
}

const LAPTOP = { width: 1366, height: 768 };
const DESKTOP = { width: 1500, height: 1000 };

await checkHero(`${BASE}/products`, "listing-hero", "section.surface-soft", DESKTOP);
await checkHero(`${BASE}/products/ms-rectangular-duct`, "detail-hero", "main > section", DESKTOP);
await checkHero(`${BASE}/products`, "listing-hero-1366", "section.surface-soft", LAPTOP);
await checkHero(`${BASE}/products/ms-rectangular-duct`, "detail-hero-1366", "main > section", LAPTOP);

await checkText(`${BASE}/`, "home", [
  "Manufacturing is where quality begins",
  "Share your drawings, specifications and production requirements",
  "Every product is fabricated to SMACNA",
  "From fabrication and finishing to installation",
  "measured by what we",
  "HVAC ducting engineered around your load requirements",
  "Our approach combines technical expertise",
  "from engineering and",
]);
await checkText(`${BASE}/products`, "products", [
  "Browse active products managed by the MSNSS team",
]);
await checkText(`${BASE}/solutions`, "solutions", [
  "Browse the work currently offered by MSNSS",
]);

await browser.close();
console.log("\ndone");
