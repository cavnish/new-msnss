import fs from "node:fs";
import { chromium } from "@playwright/test";

const TOKEN = fs.readFileSync("C:/Users/AIS/AppData/Local/Temp/opencode/token.txt", "utf8").trim();
const OUT = "C:/Users/AIS/AppData/Local/Temp/opencode";
const BASE = "http://localhost:3111";

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1500, height: 1000 } });
await ctx.addCookies([
  { name: "msnss_admin", value: TOKEN, domain: "localhost", path: "/", httpOnly: true },
]);
const page = await ctx.newPage();

const errors = [];
page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));

// ── products list ────────────────────────────────────────────────────────
await page.goto(`${BASE}/admin/products`, { waitUntil: "networkidle" });
await page.waitForSelector("table", { timeout: 20000 });

const rows = await page.locator("tbody tr").count();
console.log(`products table rows: ${rows}`);

const galleryCol = await page.locator("tbody tr").first().locator("td").nth(2).innerText();
console.log(`hero image badge on first row: ${galleryCol.trim()}`);

// ── open the dedicated Hero Gallery tab via the row shortcut ─────────────
await page.locator("tbody tr").first().getByRole("button", { name: "Hero Gallery" }).click();
await page.waitForSelector('[role="dialog"]', { timeout: 20000 });

const heading = await page.locator('[role="dialog"] h3').first().innerText();
console.log(`panel heading: ${heading}`);

const tabs = await page.locator('[role="tab"]').allInnerTexts();
console.log(`tabs: ${tabs.map((t) => t.replace(/\s+/g, " ").trim()).join(" | ")}`);

const selected = await page.locator('[role="tab"][aria-selected="true"]').innerText();
console.log(`selected tab: ${selected.replace(/\s+/g, " ").trim()}`);

// ── preview strip: must show all 6 positions ─────────────────────────────
const previewItems = page.locator('[role="tabpanel"] ol li');
const previewCount = await previewItems.count();
console.log(`preview positions rendered: ${previewCount}`);
const captions = await previewItems.locator("p").allInnerTexts();
console.log(`preview captions: ${captions.map((c) => c.trim()).join(", ")}`);

const previewThumbs = await previewItems.locator("img").count();
console.log(`preview thumbnails: ${previewThumbs}`);

// ── per-slot CRUD controls ───────────────────────────────────────────────
const rowsList = page.locator('[role="tabpanel"] > section input[aria-label^="Position"]');
console.log(`per-slot URL inputs: ${await rowsList.count()}`);
console.log(`upload/replace buttons: ${await page.getByRole("button", { name: /Replace image|Upload image/ }).count()}`);
console.log(`delete buttons: ${await page.locator('[role="tabpanel"] button[aria-label^="Delete image at position"]').count()}`);
console.log(`move-up buttons: ${await page.locator('[role="tabpanel"] button[aria-label*="up to position"]').count()}`);
console.log(`move-down buttons: ${await page.locator('[role="tabpanel"] button[aria-label*="down to position"]').count()}`);

await page.screenshot({ path: `${OUT}/hero-gallery-tab.png`, fullPage: false });

// ── reorder position 1 down, confirm preview + status update ──────────────
const before = await page.locator('[role="tabpanel"] ol li img').first().getAttribute("srcset").catch(() => null);
const firstSrc = await page.locator('[role="tabpanel"] ol li').first().locator("img").getAttribute("src");
const secondSrc = await page.locator('[role="tabpanel"] ol li').nth(1).locator("img").getAttribute("src");
await page.locator('[role="tabpanel"] button[aria-label="Move image 1 down to position 2"]').click();
await page.waitForTimeout(400);
const newFirstSrc = await page.locator('[role="tabpanel"] ol li').first().locator("img").getAttribute("src");
const newSecondSrc = await page.locator('[role="tabpanel"] ol li').nth(1).locator("img").getAttribute("src");
console.log(`reorder swapped preview slots: ${newFirstSrc === secondSrc && newSecondSrc === firstSrc}`);
const status = await page.locator('[role="status"]').first().innerText().catch(() => "");
console.log(`aria-live status: "${status.trim()}"`);

// ── first slot's move-up should now be enabled; last slot's down disabled ─
console.log(`slot 1 move-up disabled: ${await page.locator('[role="tabpanel"] button[aria-label="Move image 1 up to position 0"]').isDisabled()}`);
console.log(`slot 6 move-down disabled: ${await page.locator('[role="tabpanel"] button[aria-label="Move image 6 down to position 7"]').isDisabled()}`);

// ── add up to the max, then confirm the cap ───────────────────────────────
const addBtn = page.getByRole("button", { name: "+ Add image" });
console.log(`"Add image" disabled at max: ${await addBtn.isDisabled()}`);
const capNote = await page.getByText(/Maximum of 6 images reached/).innerText().catch(() => "MISSING");
console.log(`cap message: "${capNote.trim()}"`);

// ── delete a slot, then confirm the list shrinks and Add re-enables ───────
await page.locator('[role="tabpanel"] button[aria-label="Delete image at position 6"]').click();
await page.waitForTimeout(300);
console.log(`slots after delete: ${await rowsList.count()}`);
console.log(`"Add image" re-enabled after delete: ${!(await addBtn.isDisabled())}`);
await page.getByRole("button", { name: "+ Add image" }).click();
await page.waitForTimeout(200);
console.log(`slots after re-add: ${await rowsList.count()}`);

// ── restore original order so nothing is left mutated ─────────────────────
await page.locator('[role="tabpanel"] button[aria-label="Move image 2 up to position 1"]').click();
await page.waitForTimeout(200);

// ── other tabs reachable ──────────────────────────────────────────────────
for (const name of ["Product Details", "Content & SEO", "Settings"]) {
  await page.getByRole("tab", { name: new RegExp(name) }).click();
  await page.waitForTimeout(250);
  const panelId = await page.locator('[role="tabpanel"]').first().getAttribute("id");
  console.log(`tab "${name}" -> panel ${panelId}`);
  if (name === "Product Details") await page.screenshot({ path: `${OUT}/details-tab.png` });
}
await page.getByRole("tab", { name: /Hero Gallery/ }).click();
await page.waitForTimeout(300);
await page.screenshot({ path: `${OUT}/hero-gallery-final.png` });

// ── validation jump: clear the name, save from the hero tab ───────────────
await page.getByRole("tab", { name: /Product Details/ }).click();
await page.locator('[role="tabpanel"] input').first().fill("");
await page.getByRole("tab", { name: /Hero Gallery/ }).click();
await page.getByRole("button", { name: "Save product" }).click();
await page.waitForTimeout(500);
const alert = await page.locator('[role="alert"]').innerText().catch(() => "MISSING");
const tabAfterSave = await page.locator('[role="tab"][aria-selected="true"]').innerText();
console.log(`validation alert: "${alert.trim()}"`);
console.log(`jumped to tab: ${tabAfterSave.replace(/\s+/g, " ").trim()}`);
console.log(`dialog still open (no save fired): ${await page.locator('[role="dialog"]').isVisible()}`);

console.log(`\nconsole errors: ${errors.length ? errors.join(" | ") : "none"}`);
await browser.close();
