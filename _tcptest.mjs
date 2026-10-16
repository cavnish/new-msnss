import net from "node:net";
import dns from "node:dns/promises";

const host = "ep-fragrant-violet-b4ljt7u1-pooler.c-6.us-east-2.aws.neon.tech";

function tryConnect(host, port, timeout = 6000) {
  return new Promise((resolve) => {
    const s = new net.Socket();
    const start = Date.now();
    s.setTimeout(timeout);
    s.once("connect", () => {
      const ms = Date.now() - start;
      s.destroy();
      resolve({ ok: true, ms, addr: s.remoteAddress });
    });
    s.once("timeout", () => {
      s.destroy();
      resolve({ ok: false, ms: Date.now() - start, err: "timeout" });
    });
    s.once("error", (e) => {
      s.destroy();
      resolve({ ok: false, ms: Date.now() - start, err: e.message + " code=" + e.code });
    });
    s.connect(port, host);
  });
}

for (const port of [5432, 443]) {
  const r = await tryConnect(host, port);
  console.log(`tcp ${host}:${port} =>`, JSON.stringify(r));
}

// Also try the direct (non-pooler) endpoint
const direct = host.replace("-pooler", "");
for (const port of [5432]) {
  const r = await tryConnect(direct, port);
  console.log(`tcp ${direct}:${port} =>`, JSON.stringify(r));
}
