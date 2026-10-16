import { execSync } from "node:child_process";
const out = execSync('powershell -NoProfile -Command "Get-NetTCPConnection -LocalPort 3000 -State Listen | Select-Object -First 1 -ExpandProperty OwningProcess"', { encoding: "utf8" }).trim();
console.log("PID:", out);
if (out) {
  const cl = execSync(`powershell -NoProfile -Command "(Get-CimInstance Win32_Process -Filter 'ProcessId=${out}').CommandLine"`, { encoding: "utf8" }).trim();
  console.log("CommandLine:", cl);
}
