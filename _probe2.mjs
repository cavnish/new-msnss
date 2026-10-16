async function probe(method, path, body) {
  const r = await fetch("http://localhost:3000" + path, {
    method, redirect: "manual",
    headers: body ? { "Content-Type": "application/json" } : {},
    body: body ? JSON.stringify(body) : undefined,
  });
  const t = await r.text();
  const html = t.startsWith("<!DOCTYPE");
  console.log(`${method} ${path.padEnd(46)} -> ${r.status} ${html ? "[HTML]" : t.slice(0, 100)}`);
}
// All these call requireAuth() first, so a LOADED route yields 401, an unloaded one 404.
await probe("DELETE", "/api/admin/products/999999");
await probe("DELETE", "/api/admin/services/999999");
await probe("DELETE", "/api/admin/hero-slides/999999");
await probe("PUT", "/api/admin/hero-slides/999999", { title: "x" });
await probe("PUT", "/api/admin/products/999999", { name: "x" });
// list routes (should be 401)
await probe("GET", "/api/admin/hero-slides");
await probe("GET", "/api/admin/products");
