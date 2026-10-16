const base = "http://localhost:3000";

async function call(label, path, opts = {}) {
  const t0 = Date.now();
  try {
    const r = await fetch(base + path, { redirect: "manual", ...opts });
    const text = await r.text();
    console.log(
      `${label}: ${r.status} ${Date.now() - t0}ms location=${r.headers.get("location") ?? "-"} body=${text.slice(0, 200)}`
    );
  } catch (e) {
    console.log(`${label}: ERROR ${Date.now() - t0}ms => ${e.message}`);
  }
}

const json = (b) => ({ method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(b) });

await call("health", "/api/health");
await call("login wrong-password", "/api/auth/login", json({ email: "admin@msnss.com", password: "definitely-wrong" }));
await call("login unknown-user", "/api/auth/login", json({ email: "nope@example.com", password: "x" }));
await call("login invalid-body", "/api/auth/login", json({ email: "not-an-email" }));
await call("login malformed-json", "/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{not json" });
await call("admin no-cookie", "/admin");
await call("admin-login page", "/admin/login");
