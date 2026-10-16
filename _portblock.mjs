import net from "node:net";

function probe(host, port, timeout = 6000) {
  return new Promise((resolve) => {
    const s = net.connect({ host, port });
    const t0 = Date.now();
    let done = false;
    const finish = (r) => { if (!done) { done = true; s.destroy(); resolve(r); } };
    s.on("connect", () => finish({ ok: true, ms: Date.now() - t0, remote: s.remoteAddress }));
    s.on("error", (e) => finish({ ok: false, ms: Date.now() - t0, err: e.code }));
    s.setTimeout(timeout, () => finish({ ok: false, ms: Date.now() - t0, err: "timeout" }));
  });
}

const targets = [
  ["1.1.1.1 (no pg)", 5432],
  ["8.8.8.8 (no pg)", 5432],
  ["142.250.0.1 (no pg)", 5432],
  ["neon pooler", 5432],
  ["google 5432", 5432],
  ["1.1.1.1:443", 443],
];

for (const [name, port] of targets) {
  let host = name;
  if (name.includes("(")) host = name.split(" ")[0];
  if (name === "neon pooler") host = "ep-fragrant-violet-b4ljt7u1-pooler.c-6.us-east-2.aws.neon.tech";
  if (name === "google 5432") host = "www.google.com";
  console.log(name, "=>", JSON.stringify(await probe(host, port)));
}
