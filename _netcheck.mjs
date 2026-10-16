import tls from "node:tls";
import https from "node:https";

function tlsProbe(label, host, port, servername) {
  return new Promise((resolve) => {
    const s = tls.connect({ host, port, servername: servername || host, rejectUnauthorized: false, timeout: 7000 }, () => {
      const cert = s.getPeerCertificate();
      console.log(`${label}: OK remote=${s.remoteAddress} CN=${cert.subject?.CN}`);
      s.end(); resolve(true);
    });
    s.on("timeout", () => { console.log(`${label}: TIMEOUT`); s.destroy(); resolve(false); });
    s.on("error", (e) => { console.log(`${label}: ERROR ${e.message}`); s.destroy(); resolve(false); });
  });
}

await tlsProbe("google:443", "www.google.com", 443);
await tlsProbe("neon:5432", "ep-fragrant-violet-b4ljt7u1-pooler.c-6.us-east-2.aws.neon.tech", 5432);
await tlsProbe("supabase:443", "oamglnejmhrurgqdkvlw.supabase.co", 443);

console.log("--- env proxies ---");
for (const k of ["HTTP_PROXY", "HTTPS_PROXY", "ALL_PROXY", "NO_PROXY", "http_proxy", "https_proxy"]) {
  if (process.env[k]) console.log(k, "=", process.env[k]);
}
console.log("(none printed = no proxy env vars)");
