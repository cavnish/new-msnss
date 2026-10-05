import { config as loadEnv } from "dotenv";

/**
 * Environment bootstrap for scripts and CLI tools.
 *
 * `.env.local` is the authoritative, gitignored server configuration and must
 * win even when a host or sandbox rewrites `.env` — hence `override: true`.
 * Next.js loads `.env.local` with the same precedence automatically; this
 * module exists for `tsx`/`drizzle-kit` processes that run outside Next.
 *
 * Import this FIRST in any script that touches the database:
 *   import "./env";
 *   import { db } from "./index";
 */
loadEnv({ path: ".env.local", override: true });
loadEnv();

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required — set it in .env.local");
}
