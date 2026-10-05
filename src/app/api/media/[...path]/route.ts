import { createHash } from "crypto";
import { mkdir, readFile, stat, writeFile } from "fs/promises";
import path from "path";
import { UPLOAD_ROOT } from "@/lib/storage";

export const dynamic = "force-dynamic";

/**
 * CMS media delivery — independent of the database, aggressively cached.
 *
 * Files live on disk under `uploads/`, so they keep working even when Postgres
 * or the CMS is unavailable. Image requests may ask for a specific width and
 * format; the derivative is generated once with `sharp`, written next to the
 * source and then served straight from the cache on every later request.
 *
 *   /api/media/projects/shot.jpg?w=640&fm=webp&q=72
 */

const CONTENT_TYPES: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".mov": "video/quicktime",
  ".pdf": "application/pdf",
};

const IMAGE_EXTS = new Set([".png", ".jpg", ".jpeg", ".webp", ".avif", ".gif"]);
const DERIVED_DIR = ".derived";
const ALLOWED_WIDTHS = [64, 96, 128, 160, 180, 256, 320, 384, 480, 640, 750, 828, 1080, 1200];
const FORMATS = new Set(["avif", "webp", "jpg", "png"]);

function safeSegments(segments: string[]): string[] | null {
  if (!segments || !segments.length) return null;
  if (segments.some((s) => s.includes("..") || s.includes("/") || s.includes("\\"))) return null;
  return segments;
}

function etagFor(buffer: Buffer) {
  return `"${createHash("sha1").update(buffer).digest("hex").slice(0, 24)}"`;
}

async function optimize(
  source: Buffer,
  ext: string,
  width: number | null,
  format: string | null,
  quality: number
): Promise<{ buffer: Buffer; type: string }> {
  // Lazy import keeps `sharp` off the critical path for non-image requests.
  const sharp = (await import("sharp")).default;

  const targetFormat = format ?? (ext === ".png" ? "png" : "webp");
  let pipeline = sharp(source, { failOn: "none" }).rotate();

  if (width) {
    pipeline = pipeline.resize({ width, withoutEnlargement: true, fit: "inside" });
  }

  if (targetFormat === "avif") pipeline = pipeline.avif({ quality, effort: 4 });
  else if (targetFormat === "webp") pipeline = pipeline.webp({ quality, effort: 4 });
  else if (targetFormat === "png") pipeline = pipeline.png({ compressionLevel: 9 });
  else pipeline = pipeline.jpeg({ quality, mozjpeg: true });

  const buffer = await pipeline.toBuffer();
  const type =
    targetFormat === "avif"
      ? "image/avif"
      : targetFormat === "webp"
        ? "image/webp"
        : targetFormat === "png"
          ? "image/png"
          : "image/jpeg";

  return { buffer, type };
}

export async function GET(req: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const segments = safeSegments((await params).path);
  if (!segments) return new Response("Not found", { status: 404 });

  const filePath = path.join(UPLOAD_ROOT, ...segments);
  if (!filePath.startsWith(UPLOAD_ROOT)) return new Response("Not found", { status: 404 });

  let source: Buffer;
  let mtimeMs = 0;
  try {
    source = await readFile(filePath);
    mtimeMs = (await stat(filePath)).mtimeMs;
  } catch {
    return new Response("Not found", { status: 404 });
  }

  const ext = path.extname(filePath).toLowerCase();
  const url = new URL(req.url);
  const wantsTransform =
    IMAGE_EXTS.has(ext) &&
    ext !== ".svg" &&
    (url.searchParams.has("w") || url.searchParams.has("fm") || url.searchParams.has("q"));

  if (!wantsTransform) {
    return new Response(new Uint8Array(source), {
      headers: {
        "Content-Type": CONTENT_TYPES[ext] || "application/octet-stream",
        // Upload filenames embed a timestamp + random suffix, so immutable.
        "Cache-Control": "public, max-age=31536000, immutable",
        ETag: etagFor(source),
        "X-Content-Type-Options": "nosniff",
      },
    });
  }

  const requestedWidth = Number(url.searchParams.get("w") || 0);
  const width =
    requestedWidth > 0
      ? ALLOWED_WIDTHS.reduce((best, candidate) =>
          Math.abs(candidate - requestedWidth) < Math.abs(best - requestedWidth) ? candidate : best
        )
      : null;

  const requestedFormat = (url.searchParams.get("fm") || "").toLowerCase();
  const format = FORMATS.has(requestedFormat) ? requestedFormat : null;

  const requestedQuality = Number(url.searchParams.get("q") || 0);
  const quality = Math.min(85, Math.max(35, requestedQuality > 0 ? requestedQuality : 72));

  // Cache key includes source mtime so a replaced upload is never served stale.
  const key = `${path.basename(filePath)}-${width ?? "orig"}-${format ?? "auto"}-q${quality}-${Math.round(mtimeMs)}`;
  const derivedDir = path.join(path.dirname(filePath), DERIVED_DIR);
  const derivedPath = path.join(derivedDir, `${createHash("sha1").update(key).digest("hex")}`);

  try {
    const cached = await readFile(derivedPath);
    return new Response(new Uint8Array(cached), {
      headers: {
        "Content-Type": CONTENT_TYPES[ext] === "image/png" ? "image/png" : CONTENT_TYPES[ext] || "image/webp",
        "Cache-Control": "public, max-age=31536000, immutable",
        ETag: etagFor(cached),
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    /* not derived yet */
  }

  try {
    const { buffer, type } = await optimize(source, ext, width, format, quality);
    await mkdir(derivedDir, { recursive: true }).catch(() => undefined);
    await writeFile(derivedPath, buffer).catch(() => undefined);
    return new Response(new Uint8Array(buffer), {
      headers: {
        "Content-Type": type,
        "Cache-Control": "public, max-age=31536000, immutable",
        ETag: etagFor(buffer),
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    // Optimisation failed — serve the original rather than break the page.
    return new Response(new Uint8Array(source), {
      headers: {
        "Content-Type": CONTENT_TYPES[ext] || "application/octet-stream",
        "Cache-Control": "public, max-age=86400",
        ETag: etagFor(source),
      },
    });
  }
}
