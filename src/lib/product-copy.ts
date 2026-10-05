/**
 * Product copy normalisation.
 *
 * CMS editors paste from documents, so descriptions routinely arrive carrying
 * Markdown (`**bold**`, `### headings`, `[links](url)`) that renders as literal
 * asterisks on the page. Separately, `short_description` is supposed to be a
 * one-line value proposition but is often a whole paragraph (or an empty stub),
 * which breaks the product hero's typographic rhythm.
 *
 * Both are handled at render time so bad content degrades gracefully instead of
 * wrecking the layout, and the same helpers are reused by the data-normalisation
 * script so the stored rows get cleaned too.
 */

/** Converts Markdown to plain text, preserving sentence boundaries. */
export function stripMarkdown(input: string | null | undefined): string {
  if (!input) return "";
  return input
    // headings: "### Precision Sheet Metal Cutting" — keep the text but fence it
    // as its own block so it never merges into the following paragraph
    .replace(/^\s{0,3}#{1,6}\s+/gm, "\n\n")
    // bold / italic / strikethrough
    .replace(/(\*\*|__)(.*?)\1/g, "$2")
    .replace(/(\*|_)(.*?)\1/g, "$2")
    .replace(/~~(.*?)~~/g, "$1")
    // inline code
    .replace(/`([^`]*)`/g, "$1")
    // links: keep the label
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    // images
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    // blockquote / list bullets
    .replace(/^\s{0,3}>\s?/gm, "")
    .replace(/^\s{0,3}[-*+]\s+/gm, "")
    .replace(/^\s{0,3}\d+\.\s+/gm, "")
    // horizontal rules
    .replace(/^\s{0,3}([-*_])\s*(\1\s*){2,}$/gm, "")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** Splits prose into sentences without breaking on common abbreviations. */
function sentences(text: string): string[] {
  return text
    .replace(/\s+/g, " ")
    .split(/(?<=[.!?])\s+(?=[A-Z0-9("'₹])/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * The first block of prose worth using as a sentence.
 *
 * CMS bodies often open with a short title-ish line ("Precision MS Round Duct
 * Manufacturing") before the real paragraph. A leading fragment — short and
 * without terminal punctuation — is a heading, not a sentence, so it is
 * skipped in favour of the block that follows.
 */
function firstProseBlock(text: string): string {
  const blocks = stripMarkdown(text)
    .split(/\n\s*\n/)
    .map((b) => b.replace(/\s+/g, " ").trim())
    .filter(Boolean);

  for (let i = 0; i < blocks.length; i++) {
    const b = blocks[i];
    const looksLikeFragment = b.length < 90 && !/[.!?]$/.test(b);
    if (!looksLikeFragment) return b;
  }
  return blocks[0] ?? "";
}

export const ONE_LINER_MAX = 165;

/** Clause boundaries that make a natural stop when a sentence is too long. */
const CLAUSE_BREAK = /[,;:—–]\s*|\s+(?:and|with|for|that|which|to)\s+$/i;

/**
 * A single-line value proposition: the first real sentence of `text`, trimmed
 * to `max` characters. When that sentence overruns, it is cut at the last
 * clause boundary (falling back to a word boundary) so the line reads as
 * finished prose rather than a word sliced in half.
 */
export function oneLiner(text: string | null | undefined, max = ONE_LINER_MAX): string {
  const source = firstProseBlock(text ?? "");
  if (!source) return "";

  const first = sentences(source)[0] ?? source;
  if (first.length <= max) return first;

  const head = first.slice(0, max);

  // Prefer ending on a clause boundary, but only if it keeps most of the line.
  const clause = [...head.matchAll(new RegExp(CLAUSE_BREAK, "gi"))]
    .map((m) => m.index)
    .filter((i) => i !== undefined)
    .pop();
  if (clause !== undefined && clause >= max * 0.55) {
    return `${head.slice(0, clause).replace(/[.,;:]$/, "")}…`;
  }

  const lastSpace = head.lastIndexOf(" ");
  const trimmed = lastSpace > max * 0.6 ? head.slice(0, lastSpace) : head;
  return `${trimmed.replace(/[.,;:]$/, "")}…`;
}

/**
 * Full body copy with Markdown removed and paragraphs preserved. Caps runaway
 * single-paragraph values so a mis-pasted field cannot dominate the page.
 */
export function bodyCopy(text: string | null | undefined, max = 900): string {
  const clean = stripMarkdown(text).replace(/\n{3,}/g, "\n\n").trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max);
  const lastBreak = Math.max(cut.lastIndexOf(" "), cut.lastIndexOf("\n"));
  return `${cut.slice(0, lastBreak > max * 0.6 ? lastBreak : max).replace(/[.,;:]$/, "")}…`;
}
