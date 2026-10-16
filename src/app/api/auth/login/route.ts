import { db } from "@/db";
import { adminUsers } from "@/db/schema";
import { eq } from "drizzle-orm";
import {
  verifyPassword,
  createSession,
  setSessionCookie,
  isSecureRequest,
} from "@/lib/auth";
import { z } from "zod";

export const dynamic = "force-dynamic";

const MAX_ATTEMPTS = 10;
const ATTEMPT_WINDOW_MS = 15 * 60 * 1000;
const loginAttempts = new Map<string, { count: number; resetAt: number }>();

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

/** Count only *failed* credential attempts so a database outage can't lock users out. */
function recordFailure(ip: string) {
  const now = Date.now();
  const previous = loginAttempts.get(ip);
  loginAttempts.set(ip, {
    count: previous && previous.resetAt > now ? previous.count + 1 : 1,
    resetAt: now + ATTEMPT_WINDOW_MS,
  });
}

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  const now = Date.now();
  const previous = loginAttempts.get(ip);
  if (previous && previous.resetAt > now && previous.count >= MAX_ATTEMPTS) {
    return Response.json(
      { error: "Too many login attempts. Please try again later." },
      { status: 429 }
    );
  }

  // Malformed JSON is a client error, not a server failure.
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Invalid email or password" }, { status: 400 });
  }
  const { email, password } = parsed.data;

  // Look the account up. A failure here is a *database/transport* problem, not a
  // bad credential — surface it as 503 so the client can distinguish the two and
  // never shows a misleading "invalid password".
  let user: typeof adminUsers.$inferSelect | undefined;
  try {
    [user] = await db
      .select()
      .from(adminUsers)
      .where(eq(adminUsers.email, email.toLowerCase()));
  } catch (err) {
    console.error("[LOGIN] database lookup failed:", err);
    return Response.json(
      { error: "Authentication service is temporarily unavailable. Please try again." },
      { status: 503 }
    );
  }

  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    recordFailure(ip);
    return Response.json(
      { error: "Invalid email or password" },
      { status: 401 }
    );
  }

  try {
    const token = await createSession({
      userId: user.id,
      email: user.email,
      name: user.name,
    });
    await setSessionCookie(token, isSecureRequest(req));
  } catch (err) {
    console.error("[LOGIN] could not establish session:", err);
    return Response.json(
      { error: "Could not start your session. Please try again." },
      { status: 500 }
    );
  }

  loginAttempts.delete(ip);
  return Response.json({ ok: true, redirect: "/admin" });
}
