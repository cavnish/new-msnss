/**
 * Client logo resolution.
 *
 * The CMS stores a `logoUrl` per client, but seeded/imported records can carry
 * the generic `/images/clients/client.svg` placeholder (or an empty value) while
 * a dedicated wordmark already exists in `public/images/clients/`. Rendering the
 * placeholder makes the "Trusted By" strip show the same generic badge for every
 * client, so reads resolve the dedicated asset when the stored value is missing
 * or is the placeholder. An explicitly uploaded logo always wins.
 */

const PLACEHOLDER = "/images/clients/client.svg";
const LOGO_DIR = "/images/clients";

/** Client slug -> dedicated wordmark shipped in `public/images/clients`. */
const DEDICATED_LOGOS: Record<string, string> = {
  "idfc-bank": `${LOGO_DIR}/idfc-bank.svg`,
  "oberoi-realty": `${LOGO_DIR}/oberoi-realty.svg`,
  "four-seasons": `${LOGO_DIR}/four-seasons.svg`,
  bikanervala: `${LOGO_DIR}/bikanervala.svg`,
  "jupiter-hospital": `${LOGO_DIR}/jupiter-hospital.svg`,
  "aviation-terminal": `${LOGO_DIR}/aviation-terminal.svg`,
};

const isUsable = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

const normalise = (value: string) => {
  const trimmed = value.trim();
  // Compare on the decoded path so `/images/clients/client.svg` and
  // `/images/clients/client%2Esvg` are both treated as the placeholder.
  let decoded = trimmed;
  try {
    decoded = decodeURIComponent(trimmed);
  } catch {
    /* malformed escape — fall back to the raw value */
  }
  return { path: decoded, lower: decoded.toLowerCase() };
};

/**
 * Returns the logo a client should actually render, or `null` when no asset is
 * known (the caller then falls back to its own branded placeholder).
 */
export function resolveClientLogo(client: {
  logoUrl?: string | null;
  slug?: string | null;
}): string | null {
  const stored = isUsable(client.logoUrl) ? normalise(client.logoUrl) : null;
  const slug = isUsable(client.slug) ? client.slug.trim().toLowerCase() : "";

  const isPlaceholder =
    !stored ||
    stored.lower === PLACEHOLDER ||
    stored.lower.endsWith("/client.svg") ||
    stored.lower.endsWith("/client.png") ||
    stored.lower.endsWith("/placeholder.svg");

  if (!isPlaceholder) return stored!.path;

  return DEDICATED_LOGOS[slug] ?? stored?.path ?? null;
}
