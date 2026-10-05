"use client";

import Image, { type ImageProps } from "next/image";
import { useState } from "react";
import { SITE } from "@/lib/site";
import { cloudinaryImageLoader } from "@/lib/cloudinary-loader";
import { isCloudinaryUrl } from "@/lib/cloudinary-url";

const BRAND_MONOGRAM = "M";

/**
 * Tiny blurred placeholder so images fade in over a soft tone instead of
 * popping in as an empty box. Keeps layout stable and looks premium.
 */
export const IMAGE_BLUR =
  "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPjxyZWN0IHdpZHRoPSI4IiBoZWlnaHQ9IjgiIGZpbGw9IiNlMmU4ZjAiLz48L3N2Zz4=";

/**
 * Branded fallback used when an image fails to load (e.g. missing Cloudinary
 * asset or unpublished file). Replaces the default broken-image icon so the
 * site never shows a broken image glyph.
 */
export function BrandedImageFallback({
  className = "",
  label = SITE.shortName,
  showLabel = true,
}: {
  className?: string;
  label?: string;
  showLabel?: boolean;
}) {
  return (
    <div
      className={`relative flex items-center justify-center overflow-hidden ${className}`}
      role="img"
      aria-label={label}
      style={{
        background: "linear-gradient(145deg,#0f172a 0%,#1e293b 55%,#334155 100%)",
      }}
    >
      <div
        className="absolute inset-0 opacity-[0.08]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 30% 20%, #ffffff88 0, transparent 45%), radial-gradient(circle at 75% 70%, #38bdf8aa 0, transparent 40%)",
        }}
      />
      <div className="relative flex flex-col items-center gap-1.5 px-4 text-center">
        <span className="flex h-10 w-10 items-center justify-center rounded-full border border-white/25 font-serif text-lg font-semibold text-white/90">
          {BRAND_MONOGRAM}
        </span>
        {showLabel ? (
          <span className="text-[11px] font-medium uppercase tracking-[0.22em] text-white/60">
            {label}
          </span>
        ) : null}
      </div>
    </div>
  );
}

interface SmartImageProps extends Omit<ImageProps, "onError" | "src" | "alt"> {
  src: string;
  alt: string;
  fallbackLabel?: string;
  fallbackClassName?: string;
  showFallbackLabel?: boolean;
}

/**
 * <Image> wrapper that:
 *  - routes Cloudinary URLs through the responsive `cloudinaryImageLoader`
 *  - applies a sensible default quality so originals are never shipped oversized
 *  - fades in from a blurred placeholder to avoid layout shift / pop-in
 *  - falls back to a branded placeholder when the asset can't be loaded
 */
export default function SmartImage({
  src,
  alt,
  fallbackLabel,
  fallbackClassName,
  showFallbackLabel = true,
  quality = 75,
  placeholder = "blur",
  blurDataURL = IMAGE_BLUR,
  ...props
}: SmartImageProps) {
  const [errored, setErrored] = useState(false);

  if (errored) {
    return (
      <BrandedImageFallback
        className={fallbackClassName || props.className || "h-full w-full"}
        label={fallbackLabel || alt || SITE.shortName}
        showLabel={showFallbackLabel}
      />
    );
  }

  // Cloudinary URLs get the responsive f_auto/q_auto/w_… loader. Local
  // (public/, /uploads/, /api/media) and other remote sources use Next's
  // default optimizer instead, so they are resized + converted instead of
  // being delivered at full original size.
  const loader = isCloudinaryUrl(src) ? cloudinaryImageLoader : undefined;
  // Next.js cannot blur SVG sources — render them directly instead.
  const isSvg = typeof src === "string" && /\.svg(\?|$)/i.test(src);

  return (
    <Image
      {...props}
      src={src}
      alt={alt}
      quality={isSvg ? undefined : quality}
      placeholder={isSvg ? "empty" : placeholder}
      blurDataURL={isSvg ? undefined : blurDataURL}
      loader={loader}
      onError={() => setErrored(true)}
    />
  );
}
