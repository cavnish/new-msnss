import { requireAuth } from "@/lib/admin-api";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import crypto from "crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10 MB
const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100 MB

const ALLOWED_IMAGES = new Map<string, string>([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
  ["image/avif", "avif"],
]);

const ALLOWED_VIDEOS = new Map<string, string>([
  ["video/mp4", "mp4"],
  ["video/webm", "webm"],
]);

/**
 * GET
 *
 * Simple route test.
 *
 * Open:
 * http://localhost:3000/api/admin/upload
 *
 * Expected:
 * {
 *   "ok": true,
 *   "route": "admin-upload"
 * }
 */
export async function GET() {
  return Response.json({
    ok: true,
    route: "admin-upload",
    message: "Hero upload API is working",
  });
}

/**
 * POST
 *
 * Receives the actual file as a binary request body.
 *
 * IMPORTANT:
 * Do NOT send FormData from the frontend.
 */
export async function POST(req: Request) {
  try {
    // --------------------------------------------------
    // AUTHENTICATION
    // --------------------------------------------------

    const auth = await requireAuth();

    if (auth) {
      return auth;
    }

    // --------------------------------------------------
    // CONTENT TYPE
    // --------------------------------------------------

    const contentType =
      req.headers.get("content-type")?.toLowerCase() || "";

    const fileType = contentType.split(";")[0].trim();

    // --------------------------------------------------
    // CHECK FILE TYPE
    // --------------------------------------------------

    const isImage = ALLOWED_IMAGES.has(fileType);
    const isVideo = ALLOWED_VIDEOS.has(fileType);

    if (!isImage && !isVideo) {
      return Response.json(
        {
          success: false,
          error:
            "Invalid file type. Allowed: JPG, PNG, WebP, AVIF, MP4 and WebM.",
        },
        { status: 400 }
      );
    }

    // --------------------------------------------------
    // MAXIMUM FILE SIZE
    // --------------------------------------------------

    const maxSize = isImage
      ? MAX_IMAGE_SIZE
      : MAX_VIDEO_SIZE;

    // --------------------------------------------------
    // CONTENT LENGTH CHECK
    // --------------------------------------------------

    const contentLength = req.headers.get("content-length");

    if (contentLength) {
      const declaredSize = Number(contentLength);

      if (
        Number.isFinite(declaredSize) &&
        declaredSize > maxSize
      ) {
        return Response.json(
          {
            success: false,
            error: isImage
              ? "Image is too large. Maximum size is 10MB."
              : "Video is too large. Maximum size is 100MB.",
          },
          { status: 400 }
        );
      }
    }

    // --------------------------------------------------
    // READ BINARY BODY
    // --------------------------------------------------

    const arrayBuffer = await req.arrayBuffer();

    if (!arrayBuffer || arrayBuffer.byteLength === 0) {
      return Response.json(
        {
          success: false,
          error: "The uploaded file is empty.",
        },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(arrayBuffer);

    // --------------------------------------------------
    // ACTUAL FILE SIZE CHECK
    // --------------------------------------------------

    if (buffer.length > maxSize) {
      return Response.json(
        {
          success: false,
          error: isImage
            ? "Image is too large. Maximum size is 10MB."
            : "Video is too large. Maximum size is 100MB.",
        },
        { status: 400 }
      );
    }

    // --------------------------------------------------
    // FILE EXTENSION
    // --------------------------------------------------

    const extension = isImage
      ? ALLOWED_IMAGES.get(fileType)
      : ALLOWED_VIDEOS.get(fileType);

    if (!extension) {
      return Response.json(
        {
          success: false,
          error: "Unable to determine file extension.",
        },
        { status: 400 }
      );
    }

    // --------------------------------------------------
    // UNIQUE FILE NAME
    // --------------------------------------------------

    const filename =
      `${crypto.randomUUID()}.${extension}`;

    // --------------------------------------------------
    // UPLOAD DIRECTORY
    // --------------------------------------------------

    const uploadDir = path.join(
      process.cwd(),
      "public",
      "uploads",
      "hero"
    );

    // Create directory if it doesn't exist
    await mkdir(uploadDir, {
      recursive: true,
    });

    // --------------------------------------------------
    // FINAL FILE PATH
    // --------------------------------------------------

    const filepath = path.join(
      uploadDir,
      filename
    );

    // --------------------------------------------------
    // WRITE FILE
    // --------------------------------------------------

    await writeFile(
      filepath,
      buffer
    );

    // --------------------------------------------------
    // PUBLIC URL
    // --------------------------------------------------

    const url =
      `/uploads/hero/${filename}`;

    // --------------------------------------------------
    // SERVER LOGS
    // --------------------------------------------------

    console.log(
      "[Hero Upload] File saved:"
    );

    console.log(
      filepath
    );

    console.log(
      "[Hero Upload] Public URL:"
    );

    console.log(
      url
    );

    // --------------------------------------------------
    // SUCCESS RESPONSE
    // --------------------------------------------------

    return Response.json(
      {
        success: true,
        message: "File uploaded successfully.",
        url,
        type: isImage
          ? "image"
          : "video",
        filename,
        size: buffer.length,
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    // --------------------------------------------------
    // ERROR
    // --------------------------------------------------

    console.error(
      "[Hero Upload Error]",
      error
    );

    return Response.json(
      {
        success: false,
        error:
          "Unable to upload file. Please try again.",
      },
      {
        status: 500,
      }
    );
  }
}