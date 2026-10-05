import { v2 as cloudinary } from "cloudinary";
import type { UploadApiOptions, UploadApiResponse } from "cloudinary";
import { extractPublicId, isCloudinaryUrl, optimizeCloudinaryUrl } from "@/lib/cloudinary-url";

/**
 * Server-side Cloudinary integration.
 *
 * The signed API secret is ONLY used here, never exposed to the browser.
 * Every helper fails gracefully — when Cloudinary is not configured the
 * functions throw a clear, catchable error instead of crashing the app.
 */

export type CloudinaryAsset = {
  publicId: string;
  secureUrl: string;
  resourceType: string;
  format: string;
  width: number;
  height: number;
  bytes: number;
  folder: string;
  createdAt?: string;
};

export const CLOUDINARY_ROOT = "msnss";

export const CLOUDINARY_FOLDERS = {
  logo: `${CLOUDINARY_ROOT}/logo`,
  homepage: `${CLOUDINARY_ROOT}/homepage`,
  about: `${CLOUDINARY_ROOT}/about`,
  products: `${CLOUDINARY_ROOT}/products`,
  services: `${CLOUDINARY_ROOT}/services`,
  solutions: `${CLOUDINARY_ROOT}/solutions`,
  projects: `${CLOUDINARY_ROOT}/projects`,
  machinery: `${CLOUDINARY_ROOT}/machinery`,
  clients: `${CLOUDINARY_ROOT}/clients`,
  gallery: `${CLOUDINARY_ROOT}/gallery`,
  uploads: `${CLOUDINARY_ROOT}/uploads`,
} as const;

/** Folder shorthand accepted by admin uploads. */
export const CLOUDINARY_FOLDER_ALIASES: Record<string, string> = {
  logo: CLOUDINARY_FOLDERS.logo,
  homepage: CLOUDINARY_FOLDERS.homepage,
  about: CLOUDINARY_FOLDERS.about,
  product: CLOUDINARY_FOLDERS.products,
  products: CLOUDINARY_FOLDERS.products,
  service: CLOUDINARY_FOLDERS.services,
  services: CLOUDINARY_FOLDERS.services,
  solution: CLOUDINARY_FOLDERS.solutions,
  solutions: CLOUDINARY_FOLDERS.solutions,
  project: CLOUDINARY_FOLDERS.projects,
  projects: CLOUDINARY_FOLDERS.projects,
  machinery: CLOUDINARY_FOLDERS.machinery,
  client: CLOUDINARY_FOLDERS.clients,
  clients: CLOUDINARY_FOLDERS.clients,
  gallery: CLOUDINARY_FOLDERS.gallery,
  uploads: CLOUDINARY_FOLDERS.uploads,
};

export function isCloudinaryConfigured(): boolean {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
  );
}

/** Resolve the configured SDK client, or throw a helpful error. */
export function getCloudinary(): typeof cloudinary {
  if (!isCloudinaryConfigured()) {
    throw new Error(
      "Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET in your environment."
    );
  }
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
  return cloudinary;
}

export function resolveCloudinaryFolder(folder?: string | null): string {
  const key = (folder || "").replace(/^msnss\//, "").toLowerCase();
  if (CLOUDINARY_FOLDER_ALIASES[key]) return CLOUDINARY_FOLDER_ALIASES[key];
  if (folder && folder.startsWith(CLOUDINARY_ROOT)) return folder;
  return CLOUDINARY_FOLDERS.uploads;
}

export function sanitizePublicId(seed: string): string {
  return seed
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 120);
}

function uploadBuffer(buffer: Buffer, options: UploadApiOptions): Promise<UploadApiResponse> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(options, (error, result) => {
      if (error) reject(error);
      else if (result) resolve(result);
      else reject(new Error("Cloudinary returned an empty upload result."));
    });
    stream.on("error", reject);
    stream.end(buffer);
  });
}

/**
 * Upload an image buffer to Cloudinary. The public id is derived from the
 * requested seed (falling back to a unique id) inside the given folder.
 */
export async function uploadCloudinaryImage(options: {
  buffer: Buffer;
  folder?: string;
  publicIdSeed?: string;
  fileName?: string;
}): Promise<CloudinaryAsset> {
  const c = getCloudinary();
  const folder = resolveCloudinaryFolder(options.folder);
  const seed = sanitizePublicId(options.publicIdSeed || options.fileName || "");
  const uploadOptions: UploadApiOptions = {
    folder,
    resource_type: "image",
    overwrite: true,
    unique_filename: true,
    tags: [CLOUDINARY_ROOT],
    use_filename: false,
    ...(seed ? { public_id: seed } : {}),
  };
  const response = await uploadBuffer(options.buffer, uploadOptions);
  return {
    publicId: response.public_id,
    secureUrl: response.secure_url,
    resourceType: response.resource_type,
    format: response.format,
    width: response.width,
    height: response.height,
    bytes: response.bytes,
    folder: response.folder || folder,
  };
}

/** Delete an asset by public id or full Cloudinary URL. */
export async function deleteCloudinaryImage(publicIdOrUrl: string): Promise<{ ok: boolean; publicId: string }> {
  const c = getCloudinary();
  const publicId = isCloudinaryUrl(publicIdOrUrl) ? extractPublicId(publicIdOrUrl) : publicIdOrUrl.replace(/^\/+|\/+$/g, "");
  if (!publicId) return { ok: false, publicId };
  await c.uploader.destroy(publicId, { resource_type: "image" });
  return { ok: true, publicId };
}

/**
 * Replace an existing asset by overwriting the same public id. Falls back to
 * a fresh upload when the previous id could not be determined.
 */
export async function replaceCloudinaryImage(options: {
  buffer: Buffer;
  existingUrl?: string | null;
  publicId?: string | null;
  folder?: string;
  fileName?: string;
}): Promise<CloudinaryAsset> {
  const targetPublicId = options.publicId || (options.existingUrl && isCloudinaryUrl(options.existingUrl)
    ? extractPublicId(options.existingUrl)
    : undefined);
  if (targetPublicId) {
    const c = getCloudinary();
    const response = await uploadBuffer(options.buffer, {
      public_id: targetPublicId,
      overwrite: true,
      resource_type: "image",
      tags: [CLOUDINARY_ROOT],
    });
    return {
      publicId: response.public_id,
      secureUrl: response.secure_url,
      resourceType: response.resource_type,
      format: response.format,
      width: response.width,
      height: response.height,
      bytes: response.bytes,
      folder: response.folder || options.folder || CLOUDINARY_FOLDERS.uploads,
    };
  }
  return uploadCloudinaryImage({
    buffer: options.buffer,
    folder: options.folder,
    fileName: options.fileName,
  });
}

/**
 * Try to delete a Cloudinary asset; resolves gracefully when Cloudinary is
 * not configured so callers can keep their own local/Supabase cleanup.
 */
export async function safeDeleteImage(publicIdOrUrl: string): Promise<boolean> {
  if (!isCloudinaryConfigured()) return false;
  try {
    await deleteCloudinaryImage(publicIdOrUrl);
    return true;
  } catch {
    return false;
  }
}

export { optimizeCloudinaryUrl };