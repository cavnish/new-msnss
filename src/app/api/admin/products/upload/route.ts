import { requireAuth } from "@/lib/admin-api";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import crypto from "crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10 MB
const MAX_FILES = 6;

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
 * Simple local product-image upload.
 *
 * Files are stored on local disk — never on Cloudinary — so the hero gallery
 * and other product imagery keep working with zero external dependencies:
 *
 *   public/uploads/products/[product-slug]/<uuid>-<name>.<ext>
 *   → served by Next.js as /uploads/products/[product-slug]/<file>
 *
 * When no slug is supplied the file lands directly in
 * `public/uploads/products/` (legacy behaviour, still supported).
 *
 * Accepted request shapes (auth required):
 *   1. multipart FormData: `files` (one or many) or `file` (single) + optional `slug`
 *      → { success: true, urls: [...], url: <first> }
 *   2. legacy raw binary body with an image Content-Type + optional ?slug=
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

function safeBase(name: string): string {
  return (
    name
      .replace(/\.[^.]+$/, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
      .slice(0, 60) || "image"
  );
}

function extFor(file: { type?: string; name?: string }): string | null {
  if (file.type && ALLOWED_IMAGES.has(file.type)) {
    return ALLOWED_IMAGES.get(file.type)!;
  }
  const fromName = String(file.name ?? "")
    .split(".")
    .pop()
    ?.toLowerCase();
  if (fromName === "jpg" || fromName === "jpeg") return "jpg";
  if (fromName === "png" || fromName === "webp" || fromName === "avif" || fromName === "gif" || fromName === "bmp" || fromName === "tiff" || fromName === "ico" || fromName === "svg") return fromName;
  return null;
}

export async function POST(req: Request) {
  try {
    const auth = await requireAuth();
    if (auth) return auth;

    const contentType = req.headers.get("content-type")?.toLowerCase() || "";

    // ── 1. multipart FormData (multi-file product upload) ────────────────
    if (contentType.includes("multipart/form-data")) {
      const form = await req.formData();
      const slug = slugDir(form.get("slug"));
      const collected: File[] = [];
      for (const key of ["files", "file"]) {
        for (const entry of form.getAll(key)) {
          if (entry instanceof File && entry.size > 0) collected.push(entry);
        }
      }
      if (!collected.length) {
        return Response.json(
          { success: false, error: "No files received. Attach one or more images." },
          { status: 400 }
        );
      }
      if (collected.length > MAX_FILES) {
        return Response.json(
          { success: false, error: `Upload up to ${MAX_FILES} images at a time.` },
          { status: 400 }
        );
      }

      const uploadDir = slug
        ? path.join(process.cwd(), "public", "uploads", "products", slug)
        : path.join(process.cwd(), "public", "uploads", "products");
      const urlBase = slug ? `/uploads/products/${slug}` : "/uploads/products";

      const urls: string[] = [];
      const files: { url: string; filename: string; size: number }[] = [];
      for (const file of collected) {
        const ext = extFor({ type: file.type, name: file.name });
        if (!ext) {
          return Response.json(
            { success: false, error: `Unsupported file type: ${file.name || "unknown"}. Allowed: JPG, PNG, WebP, AVIF, GIF, BMP, TIFF, ICO, SVG.` },
            { status: 400 }
          );
        }
        const buffer = Buffer.from(await file.arrayBuffer());
        if (!buffer.length || buffer.length > MAX_IMAGE_SIZE) {
          return Response.json(
            { success: false, error: `${file.name || "Image"} is empty or exceeds 10MB.` },
            { status: 400 }
          );
        }
        await mkdir(uploadDir, { recursive: true });
        const filename = `${crypto.randomUUID()}-${safeBase(file.name)}.${ext}`;
        await writeFile(path.join(uploadDir, filename), buffer);
        const url = `${urlBase}/${filename}`;
        urls.push(url);
        files.push({ url, filename, size: buffer.length });
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
            { success: false, error: "Invalid file type. Allowed: JPG, JPEG, PNG, WebP, AVIF, GIF, BMP, TIFF, ICO, SVG." },
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
    const slug = slugDir(new URL(req.url).searchParams.get("slug"));
    const uploadDir = slug
      ? path.join(process.cwd(), "public", "uploads", "products", slug)
      : path.join(process.cwd(), "public", "uploads", "products");
    await mkdir(uploadDir, { recursive: true });
    const filename = `${crypto.randomUUID()}.${extension}`;
    await writeFile(path.join(uploadDir, filename), buffer);
    const url = slug ? `/uploads/products/${slug}/${filename}` : `/uploads/products/${filename}`;

    return Response.json({ success: true, url, filename, size: buffer.length }, { status: 200 });
  } catch (error) {
    console.error("[Product Upload Error]", error);
    return Response.json(
      { success: false, error: "Unable to upload file. Please try again." },
      { status: 500 }
    );
  }
}
