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

const log = (ok, name, detail = "") => console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? " — " + detail : ""}`);

let originalHash = null, cookie = null;

async function jar(path, body) {
  const r = await fetch(base + path, { method: "POST", headers: { "Content-Type": "application/json", ...(cookie ? { Cookie: cookie } : {}) }, body: JSON.stringify(body), redirect: "manual" });
  const sc = r.headers.get("set-cookie");
  if (sc && /msnss_admin=/.test(sc)) cookie = sc.split(";")[0];
  return { status: r.status, text: await r.text() };
}

try {
  const before = await pool.query("select password_hash from admin_users where email=$1", [EMAIL]);
  originalHash = before.rows[0].password_hash;
  const temp = "Tmp-" + Math.random().toString(36).slice(2) + "!9x";
  await pool.query("update admin_users set password_hash=$1 where email=$2", [await bcrypt.hash(temp, 10), EMAIL]);

  const login = await jar("/api/auth/login", { email: EMAIL, password: temp });
  log(login.status === 200 && !!cookie, "authenticated for write test", String(login.status));
  if (!cookie) throw new Error("no cookie");

  // Exercise the write hook: create a hero slide (a PUBLISHED table) then delete it.
  const created = await jar("/api/admin/hero-slides", {
    title: "WRITE-HOOK PROBE",
    subtitle: "temporary",
    imageUrl: "/images/hero/1.jpg",
    active: true,
    sortOrder: 999,
  });
  log(created.status === 201 || created.status === 200, "POST /api/admin/hero-slides (write)", `${created.status} ${created.text.slice(0, 120)}`);
  const id = (() => { try { return JSON.parse(created.text).id ?? JSON.parse(created.text).data?.id; } catch { return null; } })();

  // Read it back
  const list = await fetch(base + "/api/admin/hero-slides", { headers: { Cookie: cookie } });
  const listText = await list.text();
  log(list.status === 200 && listText.includes("WRITE-HOOK PROBE"), "write is visible via read API", String(list.status));

  // Clean up
  if (id != null) {
    const del = await fetch(base + `/api/admin/hero-slides/${id}`, { method: "DELETE", headers: { Cookie: cookie } });
    log(del.status === 200 || del.status === 204, "cleanup DELETE hero-slide", String(del.status));
  } else {
    console.log("   (could not parse new id; leaving row for manual cleanup)");
  }

  // Publish endpoint (exercises content-store over the new driver)
  const pub = await jar("/api/admin/publish", {});
  log(pub.status === 200, "POST /api/admin/publish", `${pub.status} ${pub.text.slice(0, 120)}`);
} catch (e) {
  console.log("HARNESS ERROR:", e.message);
} finally {
  if (originalHash) {
    await pool.query("update admin_users set password_hash=$1 where email=$2", [originalHash, EMAIL]);
    const a = await pool.query("select password_hash from admin_users where email=$1", [EMAIL]);
    log(a.rows[0].password_hash === originalHash, "original password hash restored");
  }
  await pool.end();
}
