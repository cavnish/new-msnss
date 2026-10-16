import { Client } from "pg";

function redact(u) { return u.replace(/:\/\/[^@]+@/, "://***:***@"); }

const baseHost = "ep-fragrant-violet-b4ljt7u1-pooler.c-6.us-east-2.aws.neon.tech";

async function tryClient(label, cfg) {
  const s = Date.now();
  const c = new Client({ connectionTimeoutMillis: 30000, ...cfg });
  c.on("error", () => {});
  try {
    await c.connect();
    const r = await c.query("select current_user u");
    console.log(`${label}: OK ${Date.now() - s}ms user=${r.rows[0].u}`);
  } catch (e) {
    console.log(`${label}: FAIL ${Date.now() - s}ms => ${e.message} [code=${e.code}]`);
  } finally { try { await c.end(); } catch {} }
}

// Use a dummy but valid-looking connection attempt to specific IPs of the neon host,
// with sslmode=require. We only care whether we get past the handshake.
const user = process.env.PGUSER || "neondb_owner";
const password = process.env.PGPASSWORD || "x";

const ips = ["52.95.251.153", "52.14.39.200", "77.112.100.143"];
for (const ip of ips) {
  await tryClient(`ip ${ip}`, {
    host: ip,
    port: 5432,
    user,
    password,
    database: "neondb",
    ssl: { servername: baseHost },
  });
}
