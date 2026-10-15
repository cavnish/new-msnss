import { requireAuth } from "@/lib/admin-api";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import crypto from "crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10 MB
const MAX_VIDEO_SIZE = 60 * 1024 * 1024; // 60 MB
// Advanced gallery bulk-entry: allow a whole product gallery in one drop.
const MAX_FILES = 30;

const ALLOWED_IMAGES = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
  ["image/avif", "avif"],
  ["image/gif", "gif"],
  ["image/bmp", "bmp"],
  ["image/tiff", "tiff"],
  ["image/x-icon", "ico"],
  ["image/svg+xml", "svg"],
]);

/**
 * Video containers browsers can play back natively. Anything else (embeds such
 * as YouTube/Vimeo) is added by URL in the admin, not uploaded.
 */
const ALLOWED_VIDEOS = new Map([
  ["video/mp4", "mp4"],
  ["video/webm", "webm"],
  ["video/ogg", "ogv"],
  ["video/quicktime", "mov"],
]);

/**
 * Simple local media upload — used by the product gallery and the homepage
 * section galleries.
 *
 * Files are stored on local disk — never on Cloudinary — so every gallery keeps
 * working with zero external dependencies:
 *
 *   public/uploads/<folder>/[slug]/<uuid>-<name>.<ext>
 *   → served by Next.js as /uploads/<folder>/[slug]/<file>
 *
 * `folder` defaults to "products"; the section galleries pass "sections".
 * When no slug is supplied the file lands directly in
 * `public/uploads/<folder>/` (legacy behaviour, still supported).
 *
 * Accepts images (≤ 10MB) and videos (≤ 60MB). Accepted request shapes
 * (auth required):
 *   1. multipart FormData: `files` (one or many) or `file` (single)
 *      + optional `slug` and `folder`
 *      → { success: true, urls: [...], url: <first> }
 *   2. legacy raw binary body with an image Content-Type + optional ?slug=&folder=
 *      → { success: true, url, filename, size }
 */

function slugDir(raw: unknown): string {
  const clean = String(raw ?? "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 80);
  return clean || "";
}

function safeBase(name: string, fallback = "media"): string {
  return (
    name
      .replace(/\.[^.]+$/, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
      .slice(0, 60) || fallback
  );
}

const IMAGE_EXTENSIONS = new Set(["jpg", "jpeg", "png", "webp", "avif", "gif", "bmp", "tiff", "ico", "svg"]);
const VIDEO_EXTENSIONS = new Set(["mp4", "m4v", "webm", "ogv", "ogg", "mov"]);

type MediaKind = "image" | "video";

/** Resolve a file to its extension + kind, or null when unsupported. */
function classify(file: { type?: string; name?: string }): { ext: string; kind: MediaKind } | null {
  const type = (file.type ?? "").toLowerCase();
  if (ALLOWED_IMAGES.has(type)) return { ext: ALLOWED_IMAGES.get(type)!, kind: "image" };
  if (ALLOWED_VIDEOS.has(type)) return { ext: ALLOWED_VIDEOS.get(type)!, kind: "video" };

  const fromName = String(file.name ?? "")
    .split(".")
    .pop()
    ?.toLowerCase();
  if (!fromName) return null;
  if (IMAGE_EXTENSIONS.has(fromName)) return { ext: fromName === "jpeg" ? "jpg" : fromName, kind: "image" };
  if (VIDEO_EXTENSIONS.has(fromName)) return { ext: fromName === "ogg" ? "ogv" : fromName, kind: "video" };
  return null;
}

const ALLOWED_LABEL = "JPG, PNG, WebP, AVIF, GIF, BMP, TIFF, ICO, SVG, MP4, WebM, OGV, MOV";

export async function POST(req: Request) {
  try {
    const auth = await requireAuth();
    if (auth) return auth;

    const contentType = req.headers.get("content-type")?.toLowerCase() || "";

    // ── 1. multipart FormData (multi-file product upload) ────────────────
    if (contentType.includes("multipart/form-data")) {
      const form = await req.formData();
      const slug = slugDir(form.get("slug"));
      const folder = slugDir(form.get("folder")) || "products";
      const collected: File[] = [];
      for (const key of ["files", "file"]) {
        for (const entry of form.getAll(key)) {
          if (entry instanceof File && entry.size > 0) collected.push(entry);
        }
      }
      if (!collected.length) {
        return Response.json(
          { success: false, error: "No files received. Attach one or more images or videos." },
          { status: 400 }
        );
      }
      if (collected.length > MAX_FILES) {
        return Response.json(
          { success: false, error: `Upload up to ${MAX_FILES} files at a time.` },
          { status: 400 }
        );
      }

      const uploadDir = slug
        ? path.join(process.cwd(), "public", "uploads", folder, slug)
        : path.join(process.cwd(), "public", "uploads", folder);
      const urlBase = slug ? `/uploads/${folder}/${slug}` : `/uploads/${folder}`;

      const urls: string[] = [];
      const files: { url: string; filename: string; size: number; kind: MediaKind }[] = [];
      for (const file of collected) {
        const found = classify({ type: file.type, name: file.name });
        if (!found) {
          return Response.json(
            { success: false, error: `Unsupported file type: ${file.name || "unknown"}. Allowed: ${ALLOWED_LABEL}.` },
            { status: 400 }
          );
        }
        const maxSize = found.kind === "video" ? MAX_VIDEO_SIZE : MAX_IMAGE_SIZE;
        const buffer = Buffer.from(await file.arrayBuffer());
        if (!buffer.length || buffer.length > maxSize) {
          const limit = found.kind === "video" ? "60MB" : "10MB";
          return Response.json(
            { success: false, error: `${file.name || "File"} is empty or exceeds ${limit}.` },
            { status: 400 }
          );
        }
        await mkdir(uploadDir, { recursive: true });
        const filename = `${crypto.randomUUID()}-${safeBase(file.name)}.${found.ext}`;
        await writeFile(path.join(uploadDir, filename), buffer);
        const url = `${urlBase}/${filename}`;
        urls.push(url);
        files.push({ url, filename, size: buffer.length, kind: found.kind });
      }

      return Response.json(
        { success: true, urls, url: urls[0], files, count: urls.length },
        { status: 200 }
      );
    }

    // ── 2. legacy raw binary body (single image) ────────────────────────
    const fileType = contentType.split(";")[0].trim();
    if (!ALLOWED_IMAGES.has(fileType)) {
      return Response.json(
        { success: false, error: `Invalid file type. Allowed: ${ALLOWED_LABEL}.` },
        { status: 400 }
      );
    }

    const arrayBuffer = await req.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    if (!buffer.length || buffer.length > MAX_IMAGE_SIZE) {
      return Response.json(
        { success: false, error: "Image is too large. Maximum size is 10MB." },
        { status: 400 }
      );
    }

    const extension = ALLOWED_IMAGES.get(fileType)!;
    const params = new URL(req.url).searchParams;
    const slug = slugDir(params.get("slug"));
    const folder = slugDir(params.get("folder")) || "products";
    const uploadDir = slug
      ? path.join(process.cwd(), "public", "uploads", folder, slug)
      : path.join(process.cwd(), "public", "uploads", folder);
    await mkdir(uploadDir, { recursive: true });
    const filename = `${crypto.randomUUID()}.${extension}`;
    await writeFile(path.join(uploadDir, filename), buffer);
    const url = slug
      ? `/uploads/${folder}/${slug}/${filename}`
      : `/uploads/${folder}/${filename}`;

    return Response.json({ success: true, url, filename, size: buffer.length }, { status: 200 });
  } catch (error) {
    console.error("[Product Upload Error]", error);
    return Response.json(
      { success: false, error: "Unable to upload file. Please try again." },
      { status: 500 }
    );
  }
}
