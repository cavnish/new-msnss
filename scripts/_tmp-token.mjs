// TEMP helper — generates an admin session JWT for local API testing.
// Deleted immediately after use. Not part of the project.
import { SignJWT } from "jose";
import fs from "fs";
import path from "path";

const env = fs.readFileSync(".env.local", "utf8");
const m = env.match(/^AUTH_SECRET=(.*)$/m);
const secret = (m ? m[1] : "").trim().replace(/^["']|["']$/g, "");

const tok = await new SignJWT({
  userId: 1,
  email: "admin@msnss.com",
  name: "MSNSS Admin",
})
  .setProtectedHeader({ alg: "HS256" })
  .setIssuedAt()
  .setExpirationTime("7d")
  .sign(new TextEncoder().encode(secret));

const out = path.join(process.env.TEMP || ".", "opencode", "msnss-token.txt");
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, tok);
console.log("TOKEN_LEN", tok.length, "SECRET_LEN", secret.length, "->", out);
