import fs from "node:fs";
import { chromium } from "@playwright/test";

const TOKEN = fs.readFileSync("C:/Users/AIS/AppData/Local/Temp/opencode/token.txt", "utf8").trim();
const browser = await chromium.launch();
const ctx = await browser.newContext();
await ctx.addCookies([{ name: "msnss_admin", value: TOKEN, domain: "localhost", path: "/", httpOnly: true }]);
const page = await ctx.newPage();

page.on("console", (m) => console.log(`[console.${m.type()}] ${m.text().slice(0, 300)}`));
page.on("pageerror", (e) => console.log(`[pageerror] ${e.message.slice(0, 300)}`));
page.on("response", (r) => {
  if (r.url().includes("/api/")) console.log(`[api] ${r.status()} ${r.url()}`);
});

await page.goto("http://localhost:3111/admin/products", { waitUntil: "networkidle" });
await page.waitForTimeout(3000);
const body = await page.locator("body").innerText();
console.log("---- body text (first 900) ----");
console.log(body.slice(0, 900));
await browser.close();
