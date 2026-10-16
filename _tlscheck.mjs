import tls from "node:tls";

const host = "ep-fragrant-violet-b4ljt7u1-pooler.c-6.us-east-2.aws.neon.tech";

const s = tls.connect({ host, port: 5432, servername: host, rejectUnauthorized: false, timeout: 8000 }, () => {
  const cert = s.getPeerCertificate();
  console.log("TLS OK");
  console.log("  remoteAddress:", s.remoteAddress);
  console.log("  subject CN:", cert.subject?.CN);
  console.log("  issuer CN:", cert.issuer?.CN);
  console.log("  valid_to:", cert.valid_to);
  console.log("  san:", JSON.stringify(cert.subjectaltname)?.slice(0, 200));
  s.end();
});
s.on("timeout", () => { console.log("TLS timeout"); s.destroy(); });
s.on("error", (e) => console.log("TLS error:", e.message, e.code));
