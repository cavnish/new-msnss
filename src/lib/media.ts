/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Media helpers (product galleries & marketing-section galleries)
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * A gallery stores images *and* videos in one ordered relationship
 * (`product_images`, `section_media`). A "video" can be a directly playable file
 * (MP4/WebM under `/uploads`, or a Cloudinary video) or an external embed
 * (YouTube / Vimeo). These helpers normalise that difference for both the admin
 * editor and the public gallery so neither has to hard-code provider sniffing.
 *
 * Everything here is dependency-free and never throws — a malformed URL simply
 * degrades to a plain file URL.
 */

export type VideoKind = "youtube" | "vimeo" | "file";

export interface VideoSource {
  kind: VideoKind;
  /** Directly playable URL for a `<video>` element. Empty for embeds. */
  fileUrl: string;
  /** Iframe-safe embed URL for YouTube/Vimeo. Empty for plain files. */
  embedUrl: string;
  /** Thumbnail we can derive from the provider (YouTube only); "" otherwise. */
  derivedPoster: string;
}

const YOUTUBE_RE =
  /(?:youtube\.com\/(?:watch\?(?:[^#]*&)?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([A-Za-z0-9_-]{6,})/i;
const VIMEO_RE = /vimeo\.com\/(?:video\/)?(\d{6,})/i;

const VIDEO_FILE_RE = /\.(mp4|m4v|webm|ogv|ogg|mov)(\?|#|$)/i;
const CLOUDINARY_VIDEO_RE = /\/video\/upload\//i;

/** True when a URL should be treated as a video rather than an image. */
export function isVideoUrl(url: string): boolean {
  const value = (url ?? "").trim();
  if (!value) return false;
  return (
    YOUTUBE_RE.test(value) ||
    VIMEO_RE.test(value) ||
    VIDEO_FILE_RE.test(value) ||
    CLOUDINARY_VIDEO_RE.test(value)
  );
}

/** Normalise an admin-supplied video URL into something we can render. */
export function parseVideoSource(raw: string): VideoSource {
  const url = (raw ?? "").trim();

  const yt = YOUTUBE_RE.exec(url);
  if (yt) {
    const id = yt[1];
    return {
      kind: "youtube",
      fileUrl: "",
      embedUrl: `https://www.youtube.com/embed/${id}?rel=0&modestbranding=1&playsinline=1`,
      derivedPoster: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
    };
  }

  const vimeo = VIMEO_RE.exec(url);
  if (vimeo) {
    return {
      kind: "vimeo",
      fileUrl: "",
      embedUrl: `https://player.vimeo.com/video/${vimeo[1]}?byline=0&portrait=0`,
      derivedPoster: "",
    };
  }

  return { kind: "file", fileUrl: url, embedUrl: "", derivedPoster: "" };
}

/** A gallery item as consumed by `MediaMosaicGallery` (structural twin). */
export interface GalleryMediaItem {
  url: string;
  mediaType: "image" | "video";
  alt: string;
  caption: string;
  posterUrl: string;
}

/** A raw `section_media` row — from the published snapshot, so keys are unknown. */
export interface SectionMediaRow {
  imageUrl?: unknown;
  mediaType?: unknown;
  altText?: unknown;
  title?: unknown;
  caption?: unknown;
  posterUrl?: unknown;
}

/**
 * Normalise ordered `section_media` rows into public gallery items.
 *
 * Rows written before the media columns existed carry no `mediaType`; those
 * fall back to sniffing the URL (`isVideoUrl`) so an old `.mp4` row still
 * renders as a video rather than a broken image.
 */
export function sectionMediaItems(rows: SectionMediaRow[] | undefined): GalleryMediaItem[] {
  const items: GalleryMediaItem[] = [];
  for (const row of rows ?? []) {
    const url = String(row?.imageUrl ?? "").trim();
    if (!url) continue;
    const declared = String(row?.mediaType ?? "").trim().toLowerCase();
    const mediaType: "image" | "video" =
      declared === "video" || (!declared && isVideoUrl(url)) ? "video" : "image";
    items.push({
      url,
      mediaType,
      alt: String(row?.altText ?? "").trim() || String(row?.title ?? "").trim(),
      caption: String(row?.caption ?? "").trim(),
      posterUrl: String(row?.posterUrl ?? "").trim(),
    });
  }
  return items;
}

/**
 * A short, human label for a gallery role — used on public image chips.
 * Only roles a visitor can meaningfully distinguish get a label; the lead and
 * standard gallery shots are deliberately unlabelled.
 */
export function mediaRoleLabel(type: string): string {
  switch (type) {
    case "CAD":
      return "CAD Drawing";
    case "onsite":
      return "On-Site";
    default:
      return "";
  }
}
