async function probe(method, path) {
  const r = await fetch("http://localhost:3000" + path, { method, redirect: "manual" });
  const t = await r.text();
  console.log(`${method} ${path.padEnd(48)} -> ${r.status} ${t.startsWith("<!DOCTYPE") ? "[HTML page]" : t.slice(0, 120)}`);
}
// products/[id] likely exports GET -> 401 if the dynamic route is registered
await probe("GET", "/api/admin/products/999999");
await probe("GET", "/api/admin/services/999999");
// hero-slides/[id] has only PUT+DELETE -> Next should answer 405 if registered
await probe("GET", "/api/admin/hero-slides/999999");
await probe("POST", "/api/admin/hero-slides/999999");
