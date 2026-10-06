import fs from "node:fs";
import { chromium } from "@playwright/test";

const TOKEN = fs.readFileSync("C:/Users/AIS/AppData/Local/Temp/opencode/token.txt", "utf8").trim();
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1500, height: 1000 } });
await ctx.addCookies([{ name: "msnss_admin", value: TOKEN, domain: "localhost", path: "/", httpOnly: true }]);
const page = await ctx.newPage();
await page.goto("http://localhost:3111/admin/products", { waitUntil: "networkidle" });
await page.waitForSelector("tbody tr");

await page.locator("tbody tr").first().getByRole("button", { name: "Hero Gallery" }).click();
await page.waitForSelector('[role="dialog"]');

// count upload/replace by visible text
const replaceBtns = page.locator('[role="tabpanel"] button', { hasText: "Replace image" });
const uploadBtns = page.locator('[role="tabpanel"] button', { hasText: "Upload image" });
console.log(`"Replace image" buttons: ${await replaceBtns.count()}`);
console.log(`"Upload image" buttons: ${await uploadBtns.count()}`);

// every alert in the DOM
console.log(`total [role=alert] in dom: ${await page.locator('[role="alert"]').count()}`);

// validation path
await page.getByRole("tab", { name: /Product Details/ }).click();
const nameInput = page.locator('[role="tabpanel"] input').first();
console.log(`first details input has value: "${(await nameInput.inputValue()).slice(0, 40)}"`);
await nameInput.fill("");
await page.getByRole("tab", { name: /Hero Gallery/ }).click();
await page.getByRole("button", { name: "Save product" }).click();
await page.waitForTimeout(600);

console.log(`total [role=alert] after save click: ${await page.locator('[role="alert"]').count()}`);
for (const t of await page.locator('[role="alert"]').all()) {
  console.log(`  alert: "${(await t.innerText()).trim()}" visible=${await t.isVisible()}`);
}
console.log(`selected tab after save: ${(await page.locator('[role="tab"][aria-selected="true"]').innerText()).replace(/\s+/g, " ").trim()}`);

// clear the alert by fixing the field
await page.locator('[role="tabpanel"] input').first().fill("Verification Product");
console.log(`alert cleared after edit: ${(await page.locator('[role="alert"]').count()) === 0}`);
await browser.close();
