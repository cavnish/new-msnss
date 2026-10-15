// TEMP verification — exercises the client CRUD API end to end and confirms
// admin writes propagate to the published public site. Deleted after use.
const BASE = "http://localhost:3000";
const fs = await import("node:fs");
const token = fs.readFileSync(process.env.TEMP + "/opencode/msnss-token.txt", "utf8").trim();
const H = { Cookie: `msnss_admin=${token}`, "Content-Type": "application/json" };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const results = [];
const ok = (label, cond, extra = "") => {
  results.push(`${cond ? "PASS" : "FAIL"}  ${label}${extra ? "  " + extra : ""}`);
  return cond;
};

const list = async () => (await fetch(`${BASE}/api/admin/clients`, { headers: H })).json();

const before = await list();
ok("baseline client count is 6", Array.isArray(before) && before.length === 6, `got ${before.length}`);

const payload = {
  name: "ZZ Verify Client",
  slug: "zz-verify-client",
  logoUrl: "/images/clients/jupiter-hospital.svg",
  logoAlt: "Verification logo",
  websiteUrl: "https://example.com",
  industry: "QA",
  location: "Test",
  row: 1,
  workSummary: "Temporary record created by an automated CRUD check.",
  description: "Temporary.",
  servicesProvided: ["Testing"],
  projectDetails: "",
  sortOrder: 999,
  featured: false,
  active: true,
  showInLogoRow: true,
  logoRowOrder: 0,
};

const created = await fetch(`${BASE}/api/admin/clients`, { method: "POST", headers: H, body: JSON.stringify(payload) });
const createdBody = await created.json();
ok("POST create returns 201", created.status === 201, `status ${created.status}`);
const id = createdBody.id;

const afterCreate = await list();
ok("count is 7 after create", afterCreate.length === 7, `got ${afterCreate.length}`);

await sleep(1300); // let the published-snapshot pointer probe pick up the new version
const pub = await fetch(`${BASE}/clients/zz-verify-client`);
ok("public client page renders after create", pub.status === 200, `status ${pub.status}`);
const pubHtml = await pub.text();
ok("public page shows the uploaded logo", pubHtml.includes("/images/clients/jupiter-hospital.svg"));

const updated = await fetch(`${BASE}/api/admin/clients/${id}`, {
  method: "PUT",
  headers: H,
  body: JSON.stringify({ ...payload, name: "ZZ Verify Client Renamed" }),
});
ok("PUT update returns 200", updated.status === 200, `status ${updated.status}`);
const updatedBody = await updated.json();
ok("update persisted the new name", updatedBody.name === "ZZ Verify Client Renamed", updatedBody.name);

const deleted = await fetch(`${BASE}/api/admin/clients/${id}`, { method: "DELETE", headers: H });
ok("DELETE returns 200", deleted.status === 200, `status ${deleted.status}`);

const afterDelete = await list();
ok("count back to 6 after delete", afterDelete.length === 6, `got ${afterDelete.length}`);

await sleep(1300);
const gone = await fetch(`${BASE}/clients/zz-verify-client`);
ok("public client page 404s after delete", gone.status === 404, `status ${gone.status}`);

console.log(results.join("\n"));
console.log(results.every((r) => r.startsWith("PASS")) ? "\nALL CRUD CHECKS PASSED" : "\nSOME CHECKS FAILED");
