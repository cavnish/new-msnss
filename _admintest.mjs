import { SignJWT } from "jose";
import fs from "node:fs";
import path from "node:path";

const base = "http://localhost:3000";
const env = Object.fromEntries(
  fs.readFileSync(path.join(process.cwd(), ".env.local"), "utf8").split(/\r?\n/)
    .filter((l) => /^\s*[A-Za-z_]+\s*=/.test(l))
    .map((l) => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, "")]; })
);
const secret = new TextEncoder().encode(env.AUTH_SECRET);
const token = await new SignJWT({ userId: 1, email: "admin@msnss.com", name: "MSNSS Admin" })
  .setProtectedHeader({ alg: "HS256" }).setIssuedAt().setExpirationTime("7d").sign(secret);
const cookie = `msnss_admin=${token}`;
const H = { Cookie: cookie, "Content-Type": "application/json" };

async function req(method, path, body) {
  const r = await fetch(base + path, { method, headers: H, body: body ? JSON.stringify(body) : undefined, redirect: "manual" });
  return { status: r.status, text: await r.text(), location: r.headers.get("location") };
}
const log = (ok, name, d) => console.log(`${ok ? "PASS" : "FAIL"}  ${name}${d ? " — " + d : ""}`);

// minted-session sanity
const auth = await req("GET", "/api/admin/hero-slides");
log(auth.status === 200, "minted session accepted by /api/admin/hero-slides", String(auth.status));

// DELETE a nonexistent id -> route returns 200 {ok:true}
const delMissing = await req("DELETE", "/api/admin/hero-slides/999999");
log(delMissing.status === 200, "DELETE nonexistent id", `${delMissing.status} ${delMissing.text.slice(0, 100)}`);

// full create/delete cycle
const created = await req("POST", "/api/admin/hero-slides", {
  title: "PROBE2", subtitle: "x", imageUrl: "/images/hero/1.jpg", active: true, sortOrder: 998,
});
log(created.status === 201, "POST create", `${created.status}`);
let id = null; try { id = JSON.parse(created.text).id; } catch {}
if (id) {
  const del = await req("DELETE", `/api/admin/hero-slides/${id}`);
  log(del.status === 200, "DELETE created id", `${del.status} ${del.text.slice(0, 120)}`);
  const list = await req("GET", "/api/admin/hero-slides");
  log(!list.text.includes("PROBE2"), "row removed after DELETE", list.status === 200 ? "absent" : "read failed");
} else {
  console.log("could not parse id:", created.text.slice(0, 200));
}
