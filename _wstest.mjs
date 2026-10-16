// Verify Neon's WebSocket proxy (wss over 443) is reachable from this network.
const host = "ep-fragrant-violet-b4ljt7u1-pooler.c-6.us-east-2.aws.neon.tech";
const url = `wss://${host}/v2`;

console.log("connecting", url);
const t0 = Date.now();
const ws = new WebSocket(url, ["binary"]);
ws.binaryType = "arraybuffer";

ws.addEventListener("open", () => {
  console.log(`WS OPEN in ${Date.now() - t0}ms — 443 WebSocket transport WORKS`);
  ws.close();
});
ws.addEventListener("error", (e) => {
  console.log(`WS ERROR in ${Date.now() - t0}ms`, e?.message || e);
});
ws.addEventListener("close", (e) => {
  console.log(`WS CLOSE code=${e.code} reason=${e.reason}`);
  process.exit(0);
});
setTimeout(() => { console.log("WS timeout"); process.exit(1); }, 15000);
