import { config as loadEnv } from "dotenv";
// .env.local first: it is the authoritative, gitignored server configuration
// and must win even if a host rewrites .env.
loadEnv({ path: ".env.local", override: true });
loadEnv();
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema.ts",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "",
  },
  out: "./drizzle",
});