import { existsSync } from "node:fs";
const cookie = process.argv[2];
async function probe(method, path) {
  const r = await fetch("http://localhost:3000" + path, { method, headers: cookie ? { Cookie: cookie } : {}, redirect: "manual" });
  const t = await r.text();
  const isHtml = t.startsWith("<!DOCTYPE html");
  console.log(`${method} ${path} -> ${r.status} ${isHtml ? "[HTML 404/500 page]" : "[json] " + t.slice(0, 140)}`);
}
console.log("cloudinary installed:", existsSync("node_modules/cloudinary"));
console.log("ws installed:", existsSync("node_modules/ws"));
console.log("@neondatabase/serverless installed:", existsSync("node_modules/@neondatabase/serverless"));
await probe("GET", "/api/admin/hero-slides/1");   // route has only PUT+DELETE -> expect 405 if loaded, 404 if not
await probe("DELETE", "/api/admin/hero-slides/999999");
await probe("PUT", "/api/admin/hero-slides/999999");
