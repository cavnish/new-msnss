import { execSync } from "node:child_process";
import fs from "node:fs";

function sh(cmd) {
  try { return execSync(cmd, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim(); }
  catch (e) { return (e.stdout || "") + (e.stderr || ""); }
}

console.log("=== TCP 1.1.1.1:5432 ===");
console.log(sh('powershell -NoProfile -Command "(Test-NetConnection 1.1.1.1 -Port 5432).TcpTestSucceeded"'));
console.log("=== TCP 1.1.1.1:80 ===");
console.log(sh('powershell -NoProfile -Command "(Test-NetConnection 1.1.1.1 -Port 80).TcpTestSucceeded"'));
console.log("=== TCP 1.1.1.1:9999 (random closed) ===");
console.log(sh('powershell -NoProfile -Command "(Test-NetConnection 1.1.1.1 -Port 9999).TcpTestSucceeded"'));

console.log("\n=== WinHTTP proxy ===");
console.log(sh('netsh winhttp show proxy'));

console.log("\n=== IE/system proxy ===");
console.log(sh('powershell -NoProfile -Command "Get-ItemProperty \'HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings\' | Select-Object ProxyEnable,ProxyServer,AutoConfigURL | Format-List"'));

console.log("\n=== netstat listening 5432 ===");
console.log(sh('powershell -NoProfile -Command "netstat -ano | findstr :5432"'));

try {
  const h = fs.readFileSync("C:/Windows/System32/drivers/etc/hosts", "utf8");
  console.log("\n=== hosts file (non-comment) ===");
  console.log(h.split(/\r?\n/).filter(l => l.trim() && !l.trim().startsWith("#")).join("\n") || "(none)");
} catch (e) { console.log("hosts read err", e.message); }
