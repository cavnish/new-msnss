import type { StaticImageData } from "next/image";

/**
 * Client-safe Cloudinary URL helpers.
 *
 * This module MUST NOT import the `cloudinary` SDK (server-only). It only
 * manipulates URL strings so it can be used safely inside Client Components,
 * where the secret-based SDK would otherwise be bundled to the browser.
 */

export const CLOUDINARY_BASE = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
  ? `https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}`
  : "";

const CLOUDINARY_URL_RE = /^https?:\/\/res\.cloudinary\.com\/[^/]+\/(image|video)\/upload\//;

/** True when `src` is a res.cloudinary.com URL. Works client-side. */
export function isCloudinaryUrl(src: string): boolean {
  return CLOUDINARY_URL_RE.test(src);
}

/** True when `src` is a Cloudinary public id such as "msnss/products/duct". */
export function isCloudinaryPublicId(src: string): boolean {
  return /^[a-z0-9-]+(?:\/[a-z0-9-_]+)+\/?$/.test(src) && src.toLowerCase().startsWith("msnss/");
}

/**
 * Insert `f_auto,q_auto,w_…` auto-optimization into a Cloudinary delivery URL.
 * Non-Cloudinary sources are returned unchanged so local/static images keep
 * working while a project is still being migrated.
 */
export function optimizeCloudinaryUrl(
  src: string,
  opts: { width?: number; height?: number; format?: "auto" | "webp" | "avif"; quality?: number } = {}
): string {
  if (!src) return src;
  if (isCloudinaryUrl(src)) {
    const { width, height, format = "auto", quality = "auto" } = opts;
    const transforms = [
      format === "auto" ? "f_auto" : `f_${format}`,
      quality === "auto" ? "q_auto" : `q_${quality}`,
      width ? `w_${Math.round(width)}` : "",
      height ? `h_${Math.round(height)}` : "",
      width || height ? "c_fill" : "",
    ]
      .filter(Boolean)
      .join(",");
    return src.replace(CLOUDINARY_URL_RE, (m) => `${m}${transforms}/`);
  }
  return src;
}

/** Build a full Cloudinary delivery URL from a public id (client-safe). */
export function cloudinaryDeliverUrl(publicId: string, opts: { width?: number; format?: string } = {}): string {
  const base = CLOUDINARY_BASE;
  if (!base) return publicId;
  const transformations = [
    opts.format === "auto" || !opts.format ? "f_auto" : `f_${opts.format}`,
    "q_auto",
    opts.width ? `w_${Math.round(opts.width)}` : "",
    opts.width ? "c_fill" : "",
  ]
    .filter(Boolean)
    .join(",");
  const clean = publicId.replace(/^\/+|\/+$/g, "").replace(/\.(jpe?g|png|webp|avif|gif)$/i, "");
  return `${base}/image/upload/${transformations}/${clean}`;
}

/**
 * Resolve any stored image reference (Cloudinary URL, Cloudinary public id,
 * local path or remote URL) into the best src for the requested size.
 */
export function resolveImageSrc(src: string | null | undefined, width = 800): string {
  if (!src) return "";
  if (isCloudinaryUrl(src)) return optimizeCloudinaryUrl(src, { width });
  if (isCloudinaryPublicId(src)) return cloudinaryDeliverUrl(src, { width });
  return src;
}

/** Extract the public id from a Cloudinary URL (client-safe). */
export function extractPublicId(url: string): string {
  const match = url.match(/\/upload\/(?:v\d+\/)?(.+)$/);
  if (!match) return url;
  return match[1].replace(/\.(jpe?g|png|webp|avif|gif)$/i, "");
}

/** Placeholder metadata used to keep layouts stable before images load. */
export const IMAGE_PLACEHOLDER: { blurDataURL: string } | undefined = undefined;

export const CLOUDINARY_STATIC_HELPERS = {
  isCloudinaryUrl,
  isCloudinaryPublicId,
  optimizeCloudinaryUrl,
  resolveImageSrc,
  extractPublicId,
} as const satisfies Record<string, unknown>;

export type OptimizedImageProps = {
  src: string | StaticImageData;
  width?: number;
  height?: number;
};