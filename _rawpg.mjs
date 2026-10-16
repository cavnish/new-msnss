import net from "node:net";

const host = "ep-fragrant-violet-b4ljt7u1-pooler.c-6.us-east-2.aws.neon.tech";

// PostgreSQL SSLRequest: length=8, code=80877103
const sslRequest = Buffer.alloc(8);
sslRequest.writeInt32BE(8, 0);
sslRequest.writeInt32BE(80877103, 4);

const s = net.connect({ host, port: 5432 }, () => {
  console.log(`[${ts()}] TCP connected -> sending SSLRequest`);
  s.write(sslRequest);
});
s.on("data", (d) => {
  console.log(`[${ts()}] DATA ${d.length} bytes:`, d.toString("hex"), JSON.stringify(d.toString("utf8")));
});
s.on("error", (e) => console.log(`[${ts()}] ERROR ${e.message} code=${e.code}`));
s.on("close", (h) => console.log(`[${ts()}] CLOSE hadError=${h}`));
s.on("end", () => console.log(`[${ts()}] END`));
setTimeout(() => { console.log(`[${ts()}] no response after 25s, destroying`); s.destroy(); }, 25000);

function ts() { return ((Date.now() - t0) / 1000).toFixed(2) + "s"; }
const t0 = Date.now();
