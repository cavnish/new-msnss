import { chromium } from "@playwright/test";

const BASE = "http://localhost:3000";
const SLUGS = [
  "ms-rectangular-duct",
  "ss-rectangular-duct",
  "ms-round-duct",
  "fire-rated-duct",
  "volume-control-damper",
  "access-door",
  "duct-flange",
  "kitchen-exhaust-duct",
];

const REMOVED_COPY = [
  "Fire Protection for Critical Ducting Applications",
  "extra fire and heat resistance",
  "Car Park Ventilation",
  "Pressurization",
  "View Fire-Rated Duct",
  "Applications of",
  "Supply Across India",
  "Why Choose Our",
  "Why Industry Leaders",
  "Choose MSNSS",
];

/** The exact section order every product detail page must render. */
const EXPECTED = [
  /technical specifications & project scope/i,
  /fabrication & project installations/i,
  /explore related hvac solutions/i,
  /from plan to installation/i,
  /engineered for high-performance hvac operations/i,
  /planning your next hvac ducting project\?/i,
  /frequently asked questions/i,
];

const RELATED_SUBTITLE =
  "Complementary ducting systems, volume control dampers, and ventilation fittings manufactured by MSNSS.";

/*
 * NOTE: always read `textContent`, never `innerText`.
 * Several sections carry `cv-auto` (content-visibility: auto), which makes the
 * browser skip off-screen subtrees — `innerText` returns "" for them, so an
 * innerText-based "is this copy gone?" check silently passes. textContent
 * includes skipped subtrees and is what these assertions need.
 */
const textOf = (locator) => locator.evaluate((el) => el.textContent ?? "");

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
let failures = 0;

for (const slug of SLUGS) {
  await page.goto(`${BASE}/products/${slug}`, { waitUntil: "networkidle" });
  await page.waitForTimeout(300);

  const headings = await page.locator("main h2").evaluateAll((els) =>
    els.map((e) => e.textContent.trim().replace(/\s+/g, " ")).filter(Boolean)
  );
  const body = await textOf(page.locator("main"));

  // Exact positional match against the expected order.
  const orderOk =
    headings.length === EXPECTED.length &&
    EXPECTED.every((re, i) => re.test(headings[i]));

  const leaked = REMOVED_COPY.filter((t) => body.includes(t));
  const subtitleOk = body.includes(RELATED_SUBTITLE);
  const relatedCardCount = await page
    .locator('a[href^="/products/"]:has(h3)')
    .count();

  const ok = orderOk && leaked.length === 0 && subtitleOk && relatedCardCount > 0;
  if (!ok) failures++;

  console.log(`\n=== /products/${slug} === ${ok ? "OK" : "PROBLEM"}`);
  console.log(`  order matches expected: ${orderOk ? "yes" : "NO"}`);
  console.log(`  related section subtitle present: ${subtitleOk ? "yes" : "NO"}`);
  console.log(`  related product cards rendered: ${relatedCardCount}`);
  console.log(`  removed copy still visible: ${leaked.length ? "NO — " + leaked.join(", ") : "none"}`);
  headings.forEach((h, i) => {
    const expected = EXPECTED[i]?.test(h) ? "" : "   <-- UNEXPECTED";
    console.log(`    ${String(i + 1).padStart(2)}. ${h}${expected}`);
  });
}

/*
 * Shared-component regression guard.
 * WhyChooseSection and FireRatedSection also render on other routes, and
 * PlanToInstallation on the products index. Removing them from the product
 * detail page must not have deleted them anywhere else.
 */
const ELSEWHERE = [
  { route: "/", mustContain: "Fire Protection for Critical Ducting Applications", label: "fire-rated section on homepage" },
  { route: "/", mustContain: "Why Industry Leaders", label: "why-choose section on homepage" },
  { route: "/solutions", mustContain: "Why Industry Leaders", label: "why-choose section on /solutions" },
  { route: "/products", mustContain: "From Plan to Installation", label: "plan-to-install on products index" },
];

console.log("\n=== shared components on other routes ===");
for (const check of ELSEWHERE) {
  await page.goto(BASE + check.route, { waitUntil: "networkidle" });
  const present = await page.evaluate((t) => (document.body.textContent ?? "").includes(t), check.mustContain);
  if (!present) failures++;
  console.log(`  ${check.label}: ${present ? "still present" : "MISSING — removed by mistake"}`);
}

await browser.close();
console.log(`\n=== failures: ${failures} ===`);
process.exitCode = failures > 0 ? 1 : 0;
