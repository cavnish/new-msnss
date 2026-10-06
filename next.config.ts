import type { NextConfig } from "next";

// Whitelist remote image providers used by next/image. Cloudinary is the
// primary media layer; the Supabase hostname remains for any legacy rows
// still pointing at Supabase Storage until they are migrated.
const remotePatterns: NonNullable<NextConfig["images"]>["remotePatterns"] = [];
try {
  if (process.env.SUPABASE_URL) {
    const host = new URL(process.env.SUPABASE_URL).hostname;
    remotePatterns.push({ protocol: "https", hostname: host });
  }
} catch {
  // ignore malformed SUPABASE_URL — media simply won't be whitelisted
}

remotePatterns.push(
  // Cloudinary delivery (all cloud names are subdomains of res.cloudinary.com)
  { protocol: "https", hostname: "res.cloudinary.com" },
  { protocol: "https", hostname: "**.cloudinary.com" }
);

const nextConfig: NextConfig = {
  images: {
    remotePatterns,
    // Serve AVIF first, then WebP — both far smaller than the source JPEG/PNG
    // at identical perceived quality. Browsers without support fall back.
    formats: ["image/avif", "image/webp"],
    // Explicit responsive breakpoints so phones never download desktop pixels.
    deviceSizes: [360, 414, 640, 750, 828, 1080, 1200, 1920, 2048],
    imageSizes: [64, 96, 128, 160, 180, 256, 320, 384],
    // Re-encoded derivatives are content-addressed by Next, so cache hard.
    minimumCacheTTL: 31536000,
    // Must include every quality value the app actually requests, otherwise
    // the optimizer rejects the request with a 400.
    qualities: [50, 60, 70, 75, 80, 85, 90],
  },

  // Pin Turbopack to this repo as root so stray lockfiles in parent folders
  // (e.g. the Kilo worktree copy) don't shift the inferred workspace root.
  turbopack: {
    root: __dirname,
  },

  // Long-lived caching for immutable build output and static media.
  // NOTE: the /_next/static immutable header is production-only. In `next dev`
  // Turbopack recompiles chunks on every edit — an immutable Cache-Control
  // makes the browser reuse stale JS while the server serves fresh HTML,
  // which surfaces as React hydration mismatches after editing files.
  async headers() {
    const headers: NonNullable<Awaited<ReturnType<NonNullable<NextConfig["headers"]>>>> =
      [];
    if (process.env.NODE_ENV === "production") {
      headers.push({
        source: "/_next/static/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      });
    }
    headers.push(
      {
        source: "/images/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
          { key: "X-Content-Type-Options", value: "nosniff" },
        ],
      },
      {
        source: "/uploads/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      }
    );
    return headers;
  },

  // Keep the shipped client bundle lean: no source maps in production.
  productionBrowserSourceMaps: false,
};

export default nextConfig;
