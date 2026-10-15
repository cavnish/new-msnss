// TEMP — one-off reconciliation of client logo records.
// Points each client's logoUrl at its dedicated wordmark asset so the admin
// dashboard and the public "Trusted By" strip read the same real value.
// Idempotent. Deleted immediately after use.
const BASE = "http://localhost:3000";
const fs = await import("node:fs");
const token = fs
  .readFileSync(process.env.TEMP + "/opencode/msnss-token.txt", "utf8")
  .trim();

const DEDICATED = {
  "idfc-bank": "/images/clients/idfc-bank.svg",
  "oberoi-realty": "/images/clients/oberoi-realty.svg",
  "four-seasons": "/images/clients/four-seasons.svg",
  bikanervala: "/images/clients/bikanervala.svg",
  "jupiter-hospital": "/images/clients/jupiter-hospital.svg",
  "aviation-terminal": "/images/clients/aviation-terminal.svg",
};

const headers = { Cookie: `msnss_admin=${token}`, "Content-Type": "application/json" };

const list = await (await fetch(`${BASE}/api/admin/clients`, { headers })).json();
if (!Array.isArray(list)) throw new Error("Unexpected list: " + JSON.stringify(list));

let changed = 0;
for (const client of list) {
  const target = DEDICATED[client.slug];
  if (!target) {
    console.log(`SKIP  ${client.slug} (no dedicated asset)`);
    continue;
  }
  if (client.logoUrl === target) {
    console.log(`OK    ${client.slug} -> ${target}`);
    continue;
  }
  const res = await fetch(`${BASE}/api/admin/clients/${client.id}`, {
    method: "PUT",
    headers,
    body: JSON.stringify({ ...client, logoUrl: target }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    console.log(`FAIL  ${client.slug}: ${res.status} ${JSON.stringify(body)}`);
    continue;
  }
  changed++;
  console.log(`SET   ${client.slug}: ${client.logoUrl} -> ${body.logoUrl}`);
}
console.log(`\nUpdated ${changed} record(s).`);
