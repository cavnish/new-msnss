import { execSync } from "node:child_process";
function sh(cmd) {
  try { return execSync(cmd, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim(); }
  catch (e) { return ((e.stdout || "") + (e.stderr || "")).trim(); }
}

console.log("=== Security-related processes ===");
console.log(sh(`powershell -NoProfile -Command "Get-Process | Where-Object { $_.Name -match 'mc|norton|kaspersky|avast|avg|quickheal|sophos|bitdefender|zscaler|netskope|forti|panda|trend|webroot|eset|sentinel|crowdstrike|cylance|sophos' } | Select-Object Name,Id -Unique | Format-Table -AutoSize"`));

console.log("\n=== Security-related services ===");
console.log(sh(`powershell -NoProfile -Command "Get-Service | Where-Object { $_.DisplayName -match 'McAfee|Norton|Kaspersky|Avast|AVG|Quick Heal|Sophos|Bitdefender|Zscaler|Netskope|Fortinet|ESET|Webroot|Trend Micro|CrowdStrike|Firewall' } | Select-Object Status,Name,DisplayName | Format-Table -AutoSize"`));

console.log("\n=== WFP block filters count / provider names (summary) ===");
console.log(sh(`powershell -NoProfile -Command "netsh wfp show state file=$env:TEMP\\wfp.xml; (Select-String -Path $env:TEMP\\wfp.xml -Pattern 'providerName=\"([^\"]+)\"' -AllMatches).Matches.Value | Sort-Object -Unique"`));

console.log("\n=== Route table (default routes) ===");
console.log(sh(`powershell -NoProfile -Command "Get-NetRoute -DestinationPrefix '0.0.0.0/0' | Select-Object ifIndex,NextHop,RouteMetric,InterfaceAlias | Format-Table -AutoSize"`));

console.log("\n=== Adapters ===");
console.log(sh(`powershell -NoProfile -Command "Get-NetAdapter | Select-Object Name,InterfaceDescription,Status,LinkSpeed | Format-Table -AutoSize"`));
