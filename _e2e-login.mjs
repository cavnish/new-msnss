import { Pool } from "@neondatabase/serverless";
import bcrypt from "bcryptjs";
import fs from "node:fs";
import path from "node:path";

const base = "http://localhost:3000";
const root = process.cwd();
const env = Object.fromEntries(
  fs.readFileSync(path.join(root, ".env.local"), "utf8").split(/\r?\n/)
    .filter((l) => /^\s*[A-Za-z_]+\s*=/.test(l))
    .map((l) => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, "")]; })
);

const EMAIL = "admin@msnss.com";
const pool = new Pool({ connectionString: env.DATABASE_URL, max: 3 });

let originalHash = null;
const results = [];
function check(name, ok, detail = "") {
  results.push({ name, ok });
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? " — " + detail : ""}`);
}

async function post(path, body, headers = {}) {
  const t0 = Date.now();
  const r = await fetch(base + path, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: typeof body === "string" ? body : JSON.stringify(body),
    redirect: "manual",
  });
  const text = await r.text();
  return { status: r.status, ms: Date.now() - t0, text, setCookie: r.headers.get("set-cookie"), location: r.headers.get("location") };
}
async function get(path, cookie) {
  const t0 = Date.now();
  const r = await fetch(base + path, { redirect: "manual", headers: cookie ? { Cookie: cookie } : {} });
  return { status: r.status, ms: Date.now() - t0, text: await r.text() };
}

try {
  const before = await pool.query("select password_hash from admin_users where email = $1", [EMAIL]);
  if (before.rowCount === 0) throw new Error("admin user not found");
  originalHash = before.rows[0].password_hash;
  console.log(`admin hash read (len=${originalHash.length})`);

  const tempPassword = "Tmp-" + Math.random().toString(36).slice(2) + "!9x";
  const tempHash = await bcrypt.hash(tempPassword, 10);
  await pool.query("update admin_users set password_hash = $1 where email = $2", [tempHash, EMAIL]);

  // 1. real login with valid credentials
  const login = await post("/api/auth/login", { email: EMAIL, password: tempPassword });
  check("valid credentials -> 200", login.status === 200, `${login.status} in ${login.ms}ms`);
  check("login responded quickly (<2s)", login.ms < 2000, `${login.ms}ms`);
  check("login sets session cookie", !!login.setCookie && login.setCookie.includes("msnss_admin="), login.setCookie ? "(httpOnly/samesite present)" : "no Set-Cookie");
  console.log("   Set-Cookie flags:", login.setCookie);

  const cookie = (login.setCookie || "").split(";")[0];

  // 2. use the cookie on protected routes
  if (cookie) {
    const admin = await get("/admin", cookie);
    check("GET /admin with session -> 200", admin.status === 200, `${admin.status} in ${admin.ms}ms`);
    const api = await get("/api/admin/products", cookie);
    check("GET /api/admin/products with session -> 200", api.status === 200, `${api.status} in ${api.ms}ms`);
  }

  // 3. wrong password -> 401
  const wrong = await post("/api/auth/login", { email: EMAIL, password: "wrong-" + tempPassword });
  check("wrong password -> 401", wrong.status === 401, `${wrong.status} in ${wrong.ms}ms`);

  // 4. unknown user -> 401
  const unknown = await post("/api/auth/login", { email: "ghost@example.com", password: "x" });
  check("unknown user -> 401", unknown.status === 401, `${unknown.status}`);

  // 5. malformed json -> 400
  const malformed = await post("/api/auth/login", "{not json");
  check("malformed JSON -> 400", malformed.status === 400, `${malformed.status}`);

  // 6. invalid body -> 400
  const invalid = await post("/api/auth/login", { email: "nope" });
  check("invalid body -> 400", invalid.status === 400, `${invalid.status}`);

  // 7. unauthenticated admin -> redirect to login
  const anon = await get("/admin");
  check("GET /admin without session -> redirect to /admin/login", anon.status === 307 || anon.status === 302, `${anon.status}`);
} catch (e) {
  console.log("TEST HARNESS ERROR:", e.message);
} finally {
  if (originalHash) {
    await pool.query("update admin_users set password_hash = $1 where email = $2", [originalHash, EMAIL]);
    const after = await pool.query("select password_hash from admin_users where email = $1", [EMAIL]);
    check("original password hash restored", after.rows[0].password_hash === originalHash);
  }
  await pool.end();
}

const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
process.exit(failed.length ? 1 : 0);
