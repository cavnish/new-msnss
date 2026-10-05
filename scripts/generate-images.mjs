/**
 * Generates the brand image set referenced by the site (public/images/**).
 * Every frame is authored as SVG and rasterised with sharp, so the delivered
 * files are real optimised JPEGs/PNG at the exact paths the CMS stores.
 */
import sharp from "sharp";
import { mkdir } from "node:fs/promises";
import path from "node:path";

const OUT = path.join(process.cwd(), "public", "images");
const PRODUCT_OUT = path.join(OUT, "products");

const BRAND = "#0e7cc4";
const BRAND_DARK = "#0a5f97";
const CYAN = "#38bdf8";
const INK = "#0f172a";

/* ── shared defs ──────────────────────────────────────────────────────────── */

const grain = (id, freq = 0.9, op = 0.16) => `
  <filter id="${id}" x="0" y="0" width="100%" height="100%">
    <feTurbulence type="fractalNoise" baseFrequency="${freq}" numOctaves="3" stitchTiles="stitch" result="n"/>
    <feColorMatrix type="saturate" values="0" in="n" result="g"/>
  </filter>`;

const blurF = (id, dev = 60) => `<filter id="${id}" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="${dev}"/></filter>`;

const grid = (w, h, step, color, op, offX = 0, offY = 0) => `
  <g opacity="${op}" stroke="${color}" stroke-width="1">
    ${Array.from({ length: Math.ceil(w / step) + 1 }, (_, i) => `<line x1="${i * step + offX}" y1="0" x2="${i * step + offX}" y2="${h}"/>`).join("")}
    ${Array.from({ length: Math.ceil(h / step) + 1 }, (_, i) => `<line x1="0" y1="${i * step + offY}" x2="${w}" y2="${i * step + offY}"/>`).join("")}
  </g>`;

const vignette = (w, h, op = 0.55) => `
  <radialGradient id="vg" cx="50%" cy="46%" r="78%">
    <stop offset="45%" stop-color="#000" stop-opacity="0"/>
    <stop offset="100%" stop-color="#000" stop-opacity="${op}"/>
  </radialGradient>`;

/** Soft ambient light bloom. */
const bloom = (cx, cy, r, color, op) => `
  <radialGradient id="bl" cx="${cx}" cy="${cy}" r="${r}">
    <stop offset="0%" stop-color="${color}" stop-opacity="${op}"/>
    <stop offset="100%" stop-color="${color}" stop-opacity="0"/>
  </radialGradient>`;

/** Diagonal metal sheen used on every duct face. */
const metal = (id, a = "#ffffff", b = "#0b1220") => `
  <linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0%" stop-color="${a}" stop-opacity="0.55"/>
    <stop offset="26%" stop-color="${a}" stop-opacity="0.12"/>
    <stop offset="52%" stop-color="${b}" stop-opacity="0.18"/>
    <stop offset="74%" stop-color="${a}" stop-opacity="0.20"/>
    <stop offset="100%" stop-color="${b}" stop-opacity="0.42"/>
  </linearGradient>`;

const wrap = ({ w, h, body, defs = "" }) => `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
<defs>${defs}</defs>
${body}
<rect width="${w}" height="${h}" fill="url(#vg)"/>
<rect width="${w}" height="${h}" filter="url(#gr)" opacity="0.16" style="mix-blend-mode:overlay"/>
</svg>`;

const darkBg = (w, h, a = "#0b1a2e", b = "#132a45", c = "#071120") => `
  <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0%" stop-color="${a}"/>
    <stop offset="52%" stop-color="${b}"/>
    <stop offset="100%" stop-color="${c}"/>
  </linearGradient>`;

const lightBg = (w, h) => `
  <linearGradient id="bg" x1="0.1" y1="0" x2="0.9" y2="1">
    <stop offset="0%" stop-color="#ffffff"/>
    <stop offset="45%" stop-color="#eef5fb"/>
    <stop offset="100%" stop-color="#dbe8f4"/>
  </linearGradient>`;

const commonDefs = (w, h, { light = false, sheen = "ms" } = {}) => `
  ${grain("gr")}
  ${blurF("sf")}
  ${vignette(w, h, light ? 0.22 : 0.5)}
  ${light ? lightBg(w, h) : darkBg(w, h)}
  ${metal(sheen)}
  <filter id="soft"><feGaussianBlur stdDeviation="26"/></filter>`;

/* ── scene primitives ─────────────────────────────────────────────────────── */

/** A rectangular duct run in perspective, receding to a vanishing point. */
function ductRun(w, h, { vpX = 0.62, vpY = 0.5, color = "#cfe4f5" } = {}) {
  const seg = (t, spread, thick, op) => {
    const k = 1 - t;
    const sw = w * spread;
    const sh = h * spread * 0.42;
    const x = vpX * w + (w * 0.5 - vpX * w) * k;
    const y = vpY * h + (h * 0.5 - vpY * h) * k;
    return `<rect x="${x - sw / 2}" y="${y - sh / 2}" width="${sw}" height="${sh}" rx="${sh * 0.06}" fill="url(#ms)" stroke="${color}" stroke-opacity="0.5" stroke-width="${Math.max(0.6, thick)}" opacity="${op}"/>`;
  };
  let out = "";
  for (let i = 0; i < 9; i++) {
    const t = i / 9;
    out += seg(t, 0.1 + t * 0.95, 2.4 * (1 - t) + 0.6, 0.16 + (1 - t) * 0.62);
  }
  return out;
}

/** Concentric spiral-duct rings — the signature product geometry. */
function spiralRings(cx, cy, rings, r0, dr, color) {
  let out = "";
  for (let i = 0; i < rings; i++) {
    const r = r0 + i * dr;
    out += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${color}" stroke-opacity="${0.62 - i * 0.035}" stroke-width="${Math.max(1, 26 - i * 1.9)}"/>`;
  }
  return out;
}

/** Round duct barrel with flange rings, drawn horizontally. */
function roundBarrel(x, y, len, r, hue = "#dbeafe") {
  let out = `<defs><linearGradient id="bar" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.72"/>
      <stop offset="30%" stop-color="${hue}" stop-opacity="0.55"/>
      <stop offset="72%" stop-color="#0b1220" stop-opacity="0.5"/>
      <stop offset="100%" stop-color="#000000" stop-opacity="0.35"/>
    </linearGradient></defs>
  <rect x="${x}" y="${y - r}" width="${len}" height="${r * 2}" rx="${r * 0.5}" fill="url(#bar)" stroke="#ffffff" stroke-opacity="0.4" stroke-width="2"/>`;
  for (let i = 1; i < 6; i++) {
    const fx = x + (len / 6) * i;
    out += `<ellipse cx="${fx}" cy="${y}" rx="${r * 0.14}" ry="${r}" fill="none" stroke="#ffffff" stroke-opacity="0.42" stroke-width="${r * 0.09}"/>`;
    out += `<ellipse cx="${fx}" cy="${y}" rx="${r * 0.3}" ry="${r}" fill="none" stroke="#0b1220" stroke-opacity="0.22" stroke-width="1.4"/>`;
  }
  return out;
}

/** Rectangular duct panel with a raised flange and rivet line. */
function rectPanel(x, y, w, h, { light = true } = {}) {
  const stroke = light ? "#0a5f97" : "#9fd4f5";
  return `<defs>
      <linearGradient id="pn" x1="0" y1="0" x2="0.4" y2="1">
        <stop offset="0%" stop-color="#ffffff" stop-opacity="${light ? 0.95 : 0.5}"/>
        <stop offset="45%" stop-color="#c9dced" stop-opacity="${light ? 0.7 : 0.35}"/>
        <stop offset="100%" stop-color="#7ba3c4" stop-opacity="${light ? 0.6 : 0.3}"/>
      </linearGradient></defs>
  <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="14" fill="url(#pn)" stroke="${stroke}" stroke-opacity="0.75" stroke-width="3"/>
  <rect x="${x + w * 0.045}" y="${y + h * 0.06}" width="${w * 0.91}" height="${h * 0.88}" rx="8" fill="none" stroke="${stroke}" stroke-opacity="0.4" stroke-width="1.6"/>
  ${Array.from({ length: 9 }, (_, i) => {
    const rx = x + w * 0.1 + (i * w * 0.8) / 8;
    return `<circle cx="${rx}" cy="${y + h * 0.06 + 6}" r="4" fill="${stroke}" fill-opacity="0.55"/><circle cx="${rx}" cy="${y + h * 0.94 - 6}" r="4" fill="${stroke}" fill-opacity="0.55"/>`;
  }).join("")}`;
}

/** Isometric elbow fitting. */
function elbow(cx, cy, s, color = "#cfe4f5") {
  return `<g opacity="0.9">
    <path d="M ${cx - s} ${cy + s} L ${cx - s} ${cy - s * 0.15} Q ${cx - s} ${cy - s * 0.6} ${cx - s * 0.55} ${cy - s * 0.6} L ${cx + s} ${cy - s * 0.6}"
      fill="none" stroke="url(#ms)" stroke-width="${s * 0.62}" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M ${cx - s} ${cy + s} L ${cx - s} ${cy - s * 0.15} Q ${cx - s} ${cy - s * 0.6} ${cx - s * 0.55} ${cy - s * 0.6} L ${cx + s} ${cy - s * 0.6}"
      fill="none" stroke="${color}" stroke-opacity="0.45" stroke-width="2.4"/>
  </g>`;
}

/** Simplified but recognisable India silhouette for the network map. */
const INDIA_PATH =
  "M 38 8 L 46 12 L 52 20 L 60 24 L 68 24 L 78 22 L 88 30 L 82 37 L 76 41 L 74 48 " +
  "L 70 54 L 68 60 L 63 66 L 58 74 L 52 84 L 45 96 L 40 88 L 34 78 L 29 68 L 24 58 " +
  "L 17 54 L 10 45 L 20 41 L 25 33 L 22 24 L 27 16 Z";

function indiaMap(w, h) {
  const s = Math.min(w / 100, h / 100) * 0.94;
  const ox = (w - 100 * s) / 2;
  const oy = (h - 100 * s) / 2;
  const pt = (x, y) => `${(ox + x * s).toFixed(1)} ${(oy + y * s).toFixed(1)}`;
  const nodes = [[38, 14], [30, 26], [26, 36], [22, 48], [30, 58], [36, 70], [44, 90], [52, 74], [60, 62], [66, 52], [72, 44], [80, 32]];
  let out = `<g transform="translate(${ox} ${oy}) scale(${s})">
    <path d="${INDIA_PATH}" fill="url(#mapfill)" stroke="${CYAN}" stroke-opacity="0.85" stroke-width="0.7" stroke-linejoin="round"/>
    <path d="${INDIA_PATH}" fill="url(#mapsheen)" opacity="0.5"/>`;
  out += nodes
    .map(([x, y], i) => {
      const r = 1.5 + (i % 3) * 0.5;
      return `<circle cx="${x}" cy="${y}" r="${r + 2.4}" fill="${CYAN}" fill-opacity="0.16"/>
  <circle cx="${x}" cy="${y}" r="${r}" fill="#ffffff" fill-opacity="0.95"/>`;
    })
    .join("");
  for (let i = 0; i < nodes.length - 1; i++) {
    out += `<line x1="${nodes[i][0]}" y1="${nodes[i][1]}" x2="${nodes[i + 1][0]}" y2="${nodes[i + 1][1]}" stroke="${CYAN}" stroke-opacity="0.5" stroke-width="0.5" stroke-dasharray="2 1.4"/>`;
  }
  out += "</g>";
  return out;
}

/** City skyline silhouette. */
function skyline(w, h, base, scale, color, op = 1) {
  const rnd = (() => {
    let s = 20260322;
    return () => ((s = (s * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
  })();
  let out = "";
  let x = -20;
  while (x < w + 20) {
    const bw = 40 + rnd() * 90;
    const bh = (60 + rnd() * 260) * scale;
    out += `<rect x="${x}" y="${base - bh}" width="${bw}" height="${bh}" fill="${color}" fill-opacity="${op}"/>`;
    const rows = Math.floor(bh / 22);
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < Math.floor(bw / 18); c++) {
        if (rnd() > 0.55)
          out += `<rect x="${x + 8 + c * 18}" y="${base - bh + 10 + r * 22}" width="8" height="10" fill="#ffffff" fill-opacity="${0.05 + rnd() * 0.16 * op}"/>`;
      }
    }
    x += bw + 8 + rnd() * 22;
  }
  return out;
}

/* ── image recipes ────────────────────────────────────────────────────────── */

const IMAGES = [
  /* ── hero 1 · precision ducting ───────────────────────────────────────── */
  {
    file: "hero-1.jpg",
    w: 1920,
    h: 1080,
    svg: () => {
      const w = 1920, h = 1080;
      return wrap({
        w, h,
        defs: commonDefs(w, h),
        body: `<rect width="${w}" height="${h}" fill="url(#bg)"/>
        <rect width="${w}" height="${h}" fill="url(#bl)" />
        ${grid(w, h, 48, CYAN, 0.07)}
        <g opacity="0.95">${ductRun(w, h, { vpX: 0.66, vpY: 0.48 })}</g>
        ${spiralRings(470, 300, 7, 60, 46, "#bfe0f7")}
        <g filter="url(#soft)" opacity="0.55"><ellipse cx="660" cy="330" rx="320" ry="230" fill="${BRAND}"/></g>
        <rect x="0" y="${h - 200}" width="${w}" height="200" fill="#020a14" fill-opacity="0.45"/>
        <rect x="0" y="0" width="18" height="${h}" fill="url(#ms)" opacity="0.5"/>`,
      });
    },
  },

  /* ── hero 2 · manufacturer · fabricator · installer ───────────────────── */
  {
    file: "hero-2.jpg",
    w: 1920,
    h: 1080,
    svg: () => {
      const w = 1920, h = 1080;
      return wrap({
        w, h,
        defs: `${commonDefs(w, h, { sheen: "ms2" })}${metal("ms2", "#e0f2fe", "#06121f")}`,
        body: `<rect width="${w}" height="${h}" fill="url(#bg)"/>
        <rect width="${w}" height="${h}" fill="url(#bl2)"/>
        ${grid(w, h, 60, "#ffffff", 0.05)}
        <g opacity="0.55">${skyline(w, h, h * 0.86, 1.0, "#0a1b2e", 0.9)}</g>
        ${[0, 1, 2, 3].map((i) => `<g transform="translate(${180 + i * 480} ${760})">${rectPanel(0, 0, 400, 190, { light: false })}</g>`).join("")}
        ${[0, 1, 2].map((i) => `<g opacity="0.9">${elbow(300 + i * 660, 250, 150)}</g>`).join("")}
        <rect x="0" y="${h - 150}" width="${w}" height="150" fill="#020a14" fill-opacity="0.5"/>`,
      });
    },
  },

  /* ── hero 3 · 25+ years of experience ──────────────────────────────────── */
  {
    file: "hero-3.jpg",
    w: 1920,
    h: 1080,
    svg: () => {
      const w = 1920, h = 1080;
      return wrap({
        w, h,
        defs: commonDefs(w, h),
        body: `<rect width="${w}" height="${h}" fill="url(#bg)"/>
        <rect width="${w}" height="${h}" fill="url(#bl)"/>
        ${grid(w, h, 40, CYAN, 0.08)}
        <g transform="translate(1250 210)">${roundBarrel(0, 190, 900, 190)}</g>
        <g opacity="0.75" transform="translate(60 470)">${elbow(360, 200, 190)}</g>
        <g opacity="0.5" transform="translate(760 300)">${elbow(300, 160, 130)}</g>
        <g filter="url(#soft)" opacity="0.45"><ellipse cx="300" cy="900" rx="520" ry="240" fill="${BRAND_DARK}"/></g>
        <rect x="0" y="${h - 170}" width="${w}" height="170" fill="#020a14" fill-opacity="0.45"/>`,
      });
    },
  },

  /* ── factory floor ─────────────────────────────────────────────────────── */
  {
    file: "factory.jpg",
    w: 1600,
    h: 1000,
    svg: () => {
      const w = 1600, h = 1000;
      return wrap({
        w, h,
        defs: commonDefs(w, h, { sheen: "ms" }),
        body: `<rect width="${w}" height="${h}" fill="url(#bg)"/>
        ${grid(w, h, 50, CYAN, 0.08)}
        <g opacity="0.35">${skyline(w, h * 0.55, h * 0.55, 0.5, "#0d2438", 1)}</g>
        <!-- gantry crane -->
        <g opacity="0.8" stroke="${CYAN}" stroke-opacity="0.45" fill="none" stroke-width="6">
          <path d="M 120 150 L 120 300 M 1480 150 L 1480 300 M 120 200 L 1480 200 M 120 240 L 1480 240"/>
          <path d="M 120 300 L 1480 300" stroke-width="3" stroke-dasharray="14 10"/>
        </g>
        <!-- machines -->
        ${[0, 1, 2]
          .map((i) => {
            const x = 190 + i * 430;
            return `<g>
              <rect x="${x}" y="600" width="330" height="230" rx="12" fill="#0f2437" stroke="${BRAND}" stroke-opacity="0.5" stroke-width="2.5"/>
              <rect x="${x + 26}" y="632" width="278" height="120" rx="8" fill="${BRAND}" fill-opacity="0.16" stroke="${CYAN}" stroke-opacity="0.35"/>
              ${Array.from({ length: 5 }, (_, k) => `<rect x="${x + 44 + k * 52}" y="656" width="30" height="72" rx="3" fill="#0a1a2a" fill-opacity="0.75"/>`).join("")}
              <rect x="${x + 26}" y="776" width="120" height="12" rx="6" fill="${CYAN}" fill-opacity="0.35"/>
              <rect x="${x + 168}" y="776" width="136" height="12" rx="6" fill="${CYAN}" fill-opacity="0.2"/>
            </g>`;
          })
          .join("")}
        <!-- duct stock on the floor -->
        ${[0, 1, 2, 3, 4].map((i) => `<g transform="translate(${90 + i * 300} ${880}) scale(0.62)">${roundBarrel(0, 0, 420, 120)}</g>`).join("")}
        <!-- plasma sparks -->
        <g filter="url(#soft)" opacity="0.85">
          <ellipse cx="470" cy="712" rx="150" ry="70" fill="#7dd3fc"/>
          <ellipse cx="1290" cy="712" rx="130" ry="60" fill="#fbbf24" fill-opacity="0.7"/>
        </g>
        ${Array.from({ length: 26 }, (_, i) => {
          const a = (i / 26) * Math.PI * 2;
          return `<circle cx="${470 + Math.cos(a) * (40 + (i % 5) * 26)}" cy="${712 + Math.sin(a) * (24 + (i % 4) * 18)}" r="${2 + (i % 3)}" fill="#e0f2fe" fill-opacity="0.8"/>`;
        }).join("")}
        <rect x="0" y="${h - 96}" width="${w}" height="96" fill="#020a14" fill-opacity="0.55"/>`,
      });
    },
  },

  /* ── about · engineering blueprint ─────────────────────────────────────── */
  {
    file: "about.jpg",
    w: 1200,
    h: 900,
    svg: () => {
      const w = 1200, h = 900;
      return wrap({
        w, h,
        defs: `${commonDefs(w, h, { sheen: "ms" })}
        <pattern id="fine" width="12" height="12" patternUnits="userSpaceOnUse">
          <path d="M 12 0 L 0 0 0 12" fill="none" stroke="${CYAN}" stroke-opacity="0.18" stroke-width="0.6"/>
        </pattern>`,
        body: `<rect width="${w}" height="${h}" fill="url(#bg)"/>
        <rect width="${w}" height="${h}" fill="url(#fine)"/>
        <g opacity="0.9" transform="translate(150 250)">${rectPanel(0, 0, 900, 380, { light: false })}</g>
        <!-- dimension lines -->
        <g stroke="${CYAN}" stroke-opacity="0.6" fill="none" stroke-width="1.4">
          <path d="M 150 690 L 1050 690 M 150 672 L 150 708 M 1050 672 L 1050 708"/>
          <path d="M 110 250 L 110 630 M 92 250 L 128 250 M 92 630 L 128 630"/>
        </g>
        ${Array.from({ length: 24 }, (_, i) => `<rect x="${150 + i * 37.5}" y="682" width="18" height="4" fill="${CYAN}" fill-opacity="0.45"/>`).join("")}
        ${Array.from({ length: 10 }, (_, i) => `<rect x="102" y="${250 + i * 38}" width="4" height="19" fill="${CYAN}" fill-opacity="0.45"/>`).join("")}
        <g opacity="0.5" transform="translate(760 700)">${elbow(180, 90, 90)}</g>
        <circle cx="330" cy="440" r="120" fill="none" stroke="${CYAN}" stroke-opacity="0.35" stroke-width="2" stroke-dasharray="8 7"/>
        <circle cx="330" cy="440" r="10" fill="${CYAN}" fill-opacity="0.7"/>`,
      });
    },
  },

  /* ── fire-rated coating ────────────────────────────────────────────────── */
  {
    file: "fire-rated.jpg",
    w: 1200,
    h: 900,
    svg: () => {
      const w = 1200, h = 900;
      return wrap({
        w, h,
        defs: `${commonDefs(w, h, { sheen: "ms" })}
        <linearGradient id="ember" x1="0" y1="1" x2="0.3" y2="0">
          <stop offset="0%" stop-color="#7c2d12"/>
          <stop offset="45%" stop-color="#ea580c"/>
          <stop offset="100%" stop-color="#fbbf24"/>
        </linearGradient>
        <radialGradient id="hot" cx="50%" cy="100%" r="70%">
          <stop offset="0%" stop-color="#fbbf24" stop-opacity="0.85"/>
          <stop offset="100%" stop-color="#fbbf24" stop-opacity="0"/>
        </radialGradient>`,
        body: `<rect width="${w}" height="${h}" fill="url(#bg)"/>
        <rect width="${w}" height="${h}" fill="url(#hot)"/>
        ${grid(w, h, 44, "#fed7aa", 0.09)}
        <g transform="translate(120 300)">${rectPanel(0, 0, 960, 330, { light: false })}</g>
        <g transform="translate(120 300)" opacity="0.85">
          <rect x="0" y="0" width="960" height="330" rx="14" fill="url(#ember)" fill-opacity="0.32"/>
          ${Array.from({ length: 40 }, (_, i) => {
            const x = (i * 97) % 960;
            const y = (i * 53) % 330;
            return `<circle cx="${x}" cy="${y}" r="${3 + (i % 4) * 2.5}" fill="#fff7ed" fill-opacity="${0.05 + (i % 5) * 0.03}"/>`;
          }).join("")}
        </g>
        <g filter="url(#soft)" opacity="0.75"><ellipse cx="600" cy="800" rx="520" ry="200" fill="#f97316"/></g>
        <g transform="translate(700 700) scale(0.55)" opacity="0.9">${elbow(200, 120, 130, "#fed7aa")}</g>`,
      });
    },
  },

  /* ── pan-india network map ─────────────────────────────────────────────── */
  {
    file: "india-network.jpg",
    w: 1200,
    h: 900,
    svg: () => {
      const w = 1200, h = 900;
      return wrap({
        w, h,
        defs: `${commonDefs(w, h, { sheen: "ms" })}
        <linearGradient id="mapfill" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="${BRAND}" stop-opacity="0.5"/>
          <stop offset="100%" stop-color="#0a5f97" stop-opacity="0.16"/>
        </linearGradient>
        <linearGradient id="mapsheen" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#ffffff" stop-opacity="0.35"/>
          <stop offset="60%" stop-color="#ffffff" stop-opacity="0"/>
        </linearGradient>`,
        body: `<rect width="${w}" height="${h}" fill="url(#bg)"/>
        <rect width="${w}" height="${h}" fill="url(#bl)"/>
        ${grid(w, h, 50, CYAN, 0.07)}
        ${indiaMap(w, h)}
        <g stroke="${CYAN}" stroke-opacity="0.22" fill="none" stroke-width="1.6" stroke-dasharray="10 9">
          <path d="M 60 90 C 400 40 800 140 1140 80"/>
          <path d="M 40 810 C 380 860 820 760 1160 820"/>
        </g>
        <g filter="url(#soft)" opacity="0.5"><ellipse cx="600" cy="470" rx="380" ry="330" fill="${BRAND}"/></g>`,
      });
    },
  },

  /* ── generic service frame (image (9).png) ─────────────────────────────── */
  {
    file: "image (9).png",
    w: 1200,
    h: 900,
    svg: () => {
      const w = 1200, h = 900;
      return wrap({
        w, h,
        defs: commonDefs(w, h, { sheen: "ms" }),
        body: `<rect width="${w}" height="${h}" fill="url(#bg)"/>
        <rect width="${w}" height="${h}" fill="url(#bl)"/>
        ${grid(w, h, 44, CYAN, 0.08)}
        <g transform="translate(140 220)">
          ${Array.from({ length: 6 }, (_, i) => `<g transform="translate(0 ${i * 78})" opacity="${0.9 - i * 0.1}">${roundBarrel(0, 0, 920, 42, "#dbeafe")}</g>`).join("")}
        </g>
        <g filter="url(#soft)" opacity="0.5"><ellipse cx="600" cy="740" rx="480" ry="200" fill="${BRAND_DARK}"/></g>`,
      });
    },
  },

  /* ── applications · commercial ─────────────────────────────────────────── */
  {
    file: "apps-commercial.jpg",
    w: 1000,
    h: 750,
    svg: () => {
      const w = 1000, h = 750;
      return wrap({
        w, h,
        defs: `${commonDefs(w, h, { light: true, sheen: "ms" })}
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#0b1a2e"/><stop offset="100%" stop-color="#1e3a5f"/>
        </linearGradient>`,
        body: `<rect width="${w}" height="${h}" fill="url(#sky)"/>
        <circle cx="800" cy="150" r="70" fill="#fbbf24" fill-opacity="0.22"/>
        ${grid(w, h, 50, CYAN, 0.05)}
        ${skyline(w, h * 0.94, h * 0.94, 1.0, "#081522", 1)}
        <g transform="translate(0 ${h * 0.72})" opacity="0.9">${roundBarrel(60, 0, 880, 54)}</g>
        <rect width="${w}" height="${h}" fill="url(#vg)"/>`,
      });
    },
  },

  /* ── applications · healthcare ─────────────────────────────────────────── */
  {
    file: "apps-healthcare.jpg",
    w: 1000,
    h: 750,
    svg: () => {
      const w = 1000, h = 750;
      return wrap({
        w, h,
        defs: `${commonDefs(w, h, { light: true, sheen: "ms" })}`,
        body: `<rect width="${w}" height="${h}" fill="url(#bg)"/>
        <rect width="${w}" height="${h}" fill="url(#bl)"/>
        ${grid(w, h, 40, CYAN, 0.09)}
        <g opacity="0.9">
          <rect x="360" y="180" width="280" height="420" rx="26" fill="#ffffff" fill-opacity="0.9" stroke="${BRAND}" stroke-opacity="0.4" stroke-width="3"/>
          <rect x="416" y="250" width="168" height="60" rx="10" fill="${BRAND}" fill-opacity="0.9"/>
          <rect x="416" y="350" width="60" height="168" rx="10" fill="${BRAND}" fill-opacity="0.9"/>
        </g>
        <g opacity="0.6">${elbow(500, 620, 150)}</g>
        <g transform="translate(90 480)" opacity="0.55">${roundBarrel(0, 0, 300, 46)}</g>
        <circle cx="500" cy="390" r="270" fill="none" stroke="${CYAN}" stroke-opacity="0.28" stroke-width="2" stroke-dasharray="10 8"/>`,
      });
    },
  },

  /* ── applications · commercial kitchens ────────────────────────────────── */
  {
    file: "apps-kitchen.jpg",
    w: 1000,
    h: 750,
    svg: () => {
      const w = 1000, h = 750;
      return wrap({
        w, h,
        defs: `${commonDefs(w, h, { light: true, sheen: "ms" })}`,
        body: `<rect width="${w}" height="${h}" fill="url(#bg)"/>
        <rect width="${w}" height="${h}" fill="url(#bl)"/>
        ${grid(w, h, 44, CYAN, 0.08)}
        <!-- extraction canopy -->
        <g>
          <path d="M 210 260 L 790 260 L 700 150 L 300 150 Z" fill="url(#ms)" stroke="${BRAND}" stroke-opacity="0.6" stroke-width="3"/>
          <rect x="300" y="150" width="400" height="34" rx="8" fill="${BRAND}" fill-opacity="0.35"/>
          <rect x="446" y="60" width="108" height="92" rx="10" fill="url(#ms)" stroke="${CYAN}" stroke-opacity="0.5" stroke-width="2.5"/>
        </g>
        <!-- duct rising to the canopy -->
        <g transform="translate(0 250)">${roundBarrel(0, 0, 1000, 74)}</g>
        <!-- steam wisps -->
        <g stroke="#ffffff" stroke-opacity="0.4" stroke-width="6" fill="none" stroke-linecap="round" filter="url(#soft)">
          <path d="M 330 420 C 300 360 370 330 340 270"/>
          <path d="M 500 430 C 470 370 540 340 510 280"/>
          <path d="M 670 420 C 640 360 710 330 680 270"/>
        </g>
        <g opacity="0.85">${elbow(760, 560, 130)}</g>`,
      });
    },
  },

  /* ── product · MS rectangular duct ─────────────────────────────────────── */
  {
    file: "products/ms-rectangular.jpg",
    w: 1200,
    h: 900,
    svg: () => {
      const w = 1200, h = 900;
      return wrap({
        w, h,
        defs: `${commonDefs(w, h, { light: true, sheen: "ms" })}`,
        body: `<rect width="${w}" height="${h}" fill="url(#bg)"/>
        <circle cx="600" cy="430" r="330" fill="#ffffff" fill-opacity="0.7"/>
        ${grid(w, h, 40, BRAND, 0.06)}
        <g transform="translate(150 250)">${rectPanel(0, 0, 900, 380)}</g>
        <g transform="translate(230 660) scale(0.8)" opacity="0.9">${roundBarrel(0, 0, 900, 60)}</g>
        <ellipse cx="600" cy="830" rx="430" ry="46" fill="${INK}" fill-opacity="0.12"/>`,
      });
    },
  },

  /* ── product · SS (stainless) rectangular duct ─────────────────────────── */
  {
    file: "products/ss-rectangular.jpg",
    w: 1200,
    h: 900,
    svg: () => {
      const w = 1200, h = 900;
      return wrap({
        w, h,
        defs: `${commonDefs(w, h, { light: true, sheen: "ss" })}${metal("ss", "#ffffff", "#5b7a95")}`,
        body: `<rect width="${w}" height="${h}" fill="url(#bg)"/>
        <circle cx="600" cy="430" r="330" fill="#ffffff" fill-opacity="0.8"/>
        ${grid(w, h, 34, BRAND, 0.07)}
        <g transform="translate(150 200)">${rectPanel(0, 0, 900, 400)}</g>
        <g opacity="0.95" transform="translate(150 650)">
          <rect x="0" y="0" width="900" height="130" rx="10" fill="url(#ss)" stroke="#5b7a95" stroke-opacity="0.6" stroke-width="2.5"/>
          <path d="M 0 65 L 900 65" stroke="#5b7a95" stroke-opacity="0.35" stroke-width="2"/>
          ${Array.from({ length: 11 }, (_, i) => `<circle cx="${45 + i * 81}" cy="65" r="7" fill="#5b7a95" fill-opacity="0.4"/>`).join("")}
        </g>
        <ellipse cx="600" cy="820" rx="430" ry="46" fill="${INK}" fill-opacity="0.12"/>`,
      });
    },
  },

  /* ── product · round / spiral duct ─────────────────────────────────────── */
  {
    file: "products/round-duct.jpg",
    w: 1200,
    h: 900,
    svg: () => {
      const w = 1200, h = 900;
      return wrap({
        w, h,
        defs: `${commonDefs(w, h, { light: true, sheen: "ms" })}`,
        body: `<rect width="${w}" height="${h}" fill="url(#bg)"/>
        <circle cx="600" cy="420" r="320" fill="#ffffff" fill-opacity="0.7"/>
        ${grid(w, h, 40, BRAND, 0.06)}
        <g transform="translate(70 250)">${roundBarrel(0, 110, 1060, 130)}</g>
        <g transform="translate(120 560)" opacity="0.85">${roundBarrel(0, 0, 960, 88, "#c7e2f7")}</g>
        <g transform="translate(700 120)" opacity="0.6">${spiralRings(120, 120, 5, 26, 22, BRAND_DARK)}</g>
        <ellipse cx="600" cy="800" rx="450" ry="48" fill="${INK}" fill-opacity="0.12"/>`,
      });
    },
  },

  /* ── product · accessories ─────────────────────────────────────────────── */
  {
    file: "products/accessories.jpg",
    w: 1200,
    h: 900,
    svg: () => {
      const w = 1200, h = 900;
      return wrap({
        w, h,
        defs: `${commonDefs(w, h, { light: true, sheen: "ms" })}`,
        body: `<rect width="${w}" height="${h}" fill="url(#bg)"/>
        <circle cx="600" cy="440" r="340" fill="#ffffff" fill-opacity="0.72"/>
        ${grid(w, h, 36, BRAND, 0.07)}
        <!-- flange rings -->
        <g transform="translate(120 200)">
          <ellipse cx="180" cy="150" rx="150" ry="58" fill="url(#ms)" stroke="${BRAND}" stroke-opacity="0.6" stroke-width="3"/>
          <ellipse cx="180" cy="150" rx="96" ry="36" fill="#ffffff" fill-opacity="0.85" stroke="${BRAND}" stroke-opacity="0.45" stroke-width="2.5"/>
          ${Array.from({ length: 12 }, (_, i) => {
            const a = (i / 12) * Math.PI * 2;
            return `<circle cx="${180 + Math.cos(a) * 124}" cy="${150 + Math.sin(a) * 47}" r="6" fill="${BRAND_DARK}" fill-opacity="0.5"/>`;
          }).join("")}
        </g>
        <!-- volume control damper -->
        <g transform="translate(560 200)">
          <rect x="0" y="80" width="300" height="140" rx="10" fill="url(#ms)" stroke="${BRAND}" stroke-opacity="0.6" stroke-width="3"/>
          <rect x="40" y="105" width="220" height="90" rx="6" fill="#ffffff" fill-opacity="0.8" stroke="${BRAND}" stroke-opacity="0.4" stroke-width="2"/>
          <path d="M 60 200 L 150 118 L 240 200 Z" fill="${BRAND}" fill-opacity="0.35" stroke="${BRAND}" stroke-opacity="0.6" stroke-width="2"/>
          <rect x="255" y="130" width="70" height="16" rx="8" fill="${BRAND_DARK}" fill-opacity="0.55"/>
        </g>
        <!-- access door -->
        <g transform="translate(170 540)">
          <rect x="0" y="0" width="330" height="240" rx="12" fill="url(#ms)" stroke="${BRAND}" stroke-opacity="0.6" stroke-width="3"/>
          <rect x="24" y="24" width="282" height="192" rx="8" fill="none" stroke="${BRAND}" stroke-opacity="0.4" stroke-width="2"/>
          <circle cx="165" cy="120" r="26" fill="none" stroke="${BRAND_DARK}" stroke-opacity="0.6" stroke-width="4"/>
          <rect x="150" y="110" width="30" height="20" rx="4" fill="${BRAND_DARK}" fill-opacity="0.5"/>
        </g>
        <g transform="translate(580 570)" opacity="0.95">${elbow(180, 110, 110)}</g>
        <ellipse cx="600" cy="840" rx="440" ry="44" fill="${INK}" fill-opacity="0.1"/>`,
      });
    },
  },
];

/* ── run ──────────────────────────────────────────────────────────────────── */

await mkdir(PRODUCT_OUT, { recursive: true });

let bytes = 0;
for (const img of IMAGES) {
  const isPng = img.file.toLowerCase().endsWith(".png");
  const target = path.join(OUT, img.file);
  if (isPng) {
    // Palette-quantised so gradient-heavy PNGs stay a fraction of truecolour size.
    await sharp(Buffer.from(img.svg()), { density: 96 })
      .png({ palette: true, quality: 88, effort: 10, colours: 192 })
      .toFile(target);
  } else {
    await sharp(Buffer.from(img.svg()), { density: 96 })
      .jpeg({ quality: 84, progressive: true, mozjpeg: true, chromaSubsampling: "4:4:4" })
      .toFile(target);
  }
  const { size } = await import("node:fs/promises").then((fs) => fs.stat(target));
  bytes += size;
  console.log(`  ${img.file.padEnd(28)} ${img.w}x${img.h}  ${(size / 1024).toFixed(0)} KB`);
}
console.log(`\n${IMAGES.length} images, ${(bytes / 1024).toFixed(0)} KB total`);
