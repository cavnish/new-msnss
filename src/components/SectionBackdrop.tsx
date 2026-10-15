import SmartImage from "@/components/SmartImage";
import { getSectionMedia } from "@/lib/queries";

/**
 * Shared cinematic grade for CTA / inquiry bands: deep navy, open in the
 * centre, closed at both edges — so white copy keeps WCAG AA contrast over
 * any photography the admin uploads.
 */
const NAVY_GRADE =
  "linear-gradient(110deg, rgba(4,20,44,0.98) 0%, rgba(6,30,66,0.96) 28%, rgba(8,42,88,0.85) 55%, rgba(5,24,52,0.96) 100%)";

/** Subtle sky-blue lift from the top edge — the MSNSS accent, kept quiet. */
const BLUE_ACCENT =
  "radial-gradient(120% 90% at 50% 0%, rgba(56,189,248,0.12) 0%, rgba(15,23,42,0.0) 70%)";

type SectionBackdropProps = {
  /** `section_media` slot holding the admin-managed image. */
  sectionKey: string;
  /**
   * Pre-resolved image URL (e.g. already fetched by the page). When set, the
   * CMS lookup is skipped entirely.
   */
  src?: string;
  /** Built-in default shown until the admin uploads a replacement. */
  fallback: string;
  /** `sizes` for the responsive image — pass the section's real footprint. */
  sizes?: string;
  /** Only for above-the-fold bands; CTA/inquiry bands are below the fold. */
  priority?: boolean;
  /** Extra classes for the photographic layer (opacity, object-position…). */
  imageClassName?: string;
  /** Extra classes for the absolutely-positioned root. */
  className?: string;
};

/**
 * Premium photographic backdrop for CTA and inquiry sections — the one
 * design system used by the closing CTA band, the "Have a project in mind?"
 * brief panel, the contact inquiry section, and client-page closing bands.
 *
 * Renders (all decorative, `aria-hidden`, never interactive):
 *   photo → navy grade → sky accent → engineering grid → accent rule.
 *
 * The image is CMS-managed through the `section_media` slot (`src` or
 * `sectionKey`), so admins upload/replace it without code changes; `fallback`
 * keeps the section intact before the first upload.
 *
 * The root sits at `-z-10` inside an `isolate` parent: it paints above the
 * parent's flat brand colour but behind every piece of content, so existing
 * markup needs no `relative` juggling.
 */
export async function SectionBackdrop({
  sectionKey,
  src,
  fallback,
  sizes = "100vw",
  priority = false,
  imageClassName = "",
  className = "",
}: SectionBackdropProps) {
  let resolved = (src || "").trim();
  if (!resolved) {
    const rows = await getSectionMedia(sectionKey).catch(() => []);
    resolved = rows.length && rows[0].imageUrl ? String(rows[0].imageUrl).trim() : "";
  }
  const bg = resolved || fallback;

  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 -z-10 overflow-hidden ${className}`}
    >
      <SmartImage
        src={bg}
        alt=""
        aria-hidden="true"
        fill
        priority={priority}
        loading={priority ? undefined : "lazy"}
        decoding="async"
        sizes={sizes}
        className={`object-cover object-center opacity-40 ${imageClassName}`.trim()}
      />
      <div className="absolute inset-0" aria-hidden="true" style={{ background: NAVY_GRADE }} />
      <div className="absolute inset-0" aria-hidden="true" style={{ background: BLUE_ACCENT }} />
      <div className="eng-grid-dark absolute inset-0 opacity-15" aria-hidden="true" />
      {/* Accent rule that lifts the left edge, shared by every band */}
      <div
        aria-hidden="true"
        className="absolute bottom-0 left-0 h-1 w-40 bg-gradient-to-r from-brand via-sky-400 to-cyan-400/40 sm:w-64"
      />
    </div>
  );
}
