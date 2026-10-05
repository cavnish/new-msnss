import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { mkdirSync, readFileSync, writeFileSync } from "fs";
import { randomBytes } from "crypto";
import path from "path";

const COOKIE_NAME = "msnss_admin";

let cachedSecret: Uint8Array | null = null;

/** Where a generated secret is persisted so sessions survive restarts. */
const GENERATED_SECRET_FILE = path.join(process.cwd(), ".cms-published", ".auth-secret");

/**
 * Resolve the signing secret lazily (at first auth use), not at import time,
 * so the production build/data-collection does not require AUTH_SECRET.
 *
 * Order of preference:
 *   1. `AUTH_SECRET` from the environment — the normal, operator-controlled path.
 *   2. A cryptographically random secret generated once and persisted to disk.
 *      This keeps the admin CMS fully usable on hosts that only inject
 *      DATABASE_URL, without ever shipping a secret inside the source tree.
 */
function getSecret(): Uint8Array {
  if (cachedSecret) return cachedSecret;

  const configured = process.env.AUTH_SECRET;
  if (configured && configured.length >= 16) {
    cachedSecret = new TextEncoder().encode(configured);
    return cachedSecret;
  }

  try {
    const existing = readFileSync(GENERATED_SECRET_FILE, "utf8").trim();
    if (existing.length >= 32) {
      console.warn("[auth] AUTH_SECRET is not set — using the persisted generated secret.");
      cachedSecret = new TextEncoder().encode(existing);
      return cachedSecret;
    }
  } catch {
    /* not generated yet */
  }

  const generated = randomBytes(48).toString("hex");
  try {
    mkdirSync(path.dirname(GENERATED_SECRET_FILE), { recursive: true });
    writeFileSync(GENERATED_SECRET_FILE, generated, { mode: 0o600 });
  } catch (error) {
    console.warn("[auth] unable to persist the generated secret", error);
  }
  console.warn(
    "[auth] AUTH_SECRET is not set — generated a random secret and stored it at .cms-published/.auth-secret. Set AUTH_SECRET explicitly in production."
  );
  cachedSecret = new TextEncoder().encode(generated);
  return cachedSecret;
}

export type SessionPayload = {
  userId: number;
  email: string;
  name: string;
};

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createSession(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getSecret());
}

export async function setSessionCookie(token: string, secure = true) {
  const store = await cookies();
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    // Only mark Secure on real HTTPS requests. On plain-HTTP origins
    // (e.g. local `npm run start` at http://localhost) a Secure cookie is
    // silently dropped by the browser, which breaks the login redirect.
    secure,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });
}

/** Determine if the current request is served over HTTPS. */
export function isSecureRequest(req: Request): boolean {
  const proto = req.headers.get("x-forwarded-proto");
  if (proto) return proto.split(",")[0].trim() === "https";
  try {
    return new URL(req.url).protocol === "https:";
  } catch {
    return false;
  }
}

export async function clearSessionCookie() {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

export async function getSession(): Promise<SessionPayload | null> {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return {
      userId: payload.userId as number,
      email: payload.email as string,
      name: payload.name as string,
    };
  } catch {
    return null;
  }
}
