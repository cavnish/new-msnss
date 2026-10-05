/**
 * Per-product image sets for the MSNSS product detail page.
 *
 * Every product ships six distinct frames (4:3) so the redesigned hero gallery
 * has real thumbnails and the "Application & Range Showcase" never repeats one
 * image six times. Output: public/images/products/<slug>-1..6.jpg
 *
 * Each product is assigned a `family` that drives its geometry and palette, and
 * each of the six variants is a different composition (hero / detail / set /
 * section / context / inspection) so no two frames read the same.
 */
import sharp from "sharp";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const OUT = path.join(process.cwd(), "public", "images", "products");

/* ── family definitions ──────────────────────────────────────────────────── */

const FAMILIES = {
  rectangular: {
    // Mild-steel rectangular ducting: warm galvanised grey on cool blue.
    a: "#0d1f33", b: "#16324f", accent: "#7fb3d8", glow: "#0e7cc4",
    sheet: "#c3d6e6", edge: "#7ba3c4",
  },
  stainless: {
    // SS 304/316: colder, brighter, higher specular contrast.
    a: "#0a1622", b: "#13293c", accent: "#9fc6dd", glow: "#2b7fb8",
    sheet: "#dbe7f0", edge: "#89a8bf",
  },
  round: {
    // Spiral round duct: deep teal-blue, cylindrical shading.
    a: "#081a26", b: "#10344a", accent: "#84c2e0", glow: "#0e7cc4",
    sheet: "#c9dfee", edge: "#7aa3bd",
  },
  angleframe: {
    // Angle-frame structural duct: graphite + amber machine light.
    a: "#12161c", b: "#1e2833", accent: "#9db2c4", glow: "#0e7cc4",
    sheet: "#c4cdd6", edge: "#8496a6",
  },
  fire: {
    // Fire-rated coating: graphite ground, ember accent.
    a: "#1a0f0a", b: "#33170d", accent: "#f0b070", glow: "#ea580c",
    sheet: "#e8d5c4", edge: "#b08a6a",
  },
  accessory: {
    // Fittings, flanges, dampers: bright showroom grey.
    a: "#0d1520", b: "#1a2634", accent: "#a8c4d8", glow: "#0e7cc4",
    sheet: "#d4e2ec", edge: "#8aa4b8",
  },
  machinery: {
    // Plant & machinery: steel blue with warning-amber machine light.
    a: "#0b141f", b: "#152b40", accent: "#8fb6cf", glow: "#0e7cc4",
    sheet: "#c6d5e0", edge: "#8299ab",
  },
};

/** slug -> family. Mirrors the product categories held in the CMS. */
const PRODUCTS = {
  "ms-rectangular-duct": "rectangular",
  "ss-rectangular-duct": "stainless",
  "ms-round-duct": "round",
  "ss-round-duct": "round",
  "flanged-duct": "round",
  "angle-frame-duct": "angleframe",
  "kitchen-exhaust-duct": "rectangular",
  "fire-rated-duct": "fire",
  "cisbond-fr-802-coating": "fire",
  "volume-control-damper": "accessory",
  "duct-flange": "accessory",
  "access-door": "accessory",
  "plasma-cutting-machine": "machinery",
  "bending-punching-machine": "machinery",
};

const W = 1600;
const H = 1200;

/* ── svg helpers ─────────────────────────────────────────────────────────── */

const defs = (f) => `
  <filter id="gr"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="3" stitchTiles="stitch"/></filter>
  <filter id="soft" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="42"/></filter>
  <filter id="drop" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="16"/></filter>
  <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0%" stop-color="${f.a}"/><stop offset="55%" stop-color="${f.b}"/><stop offset="100%" stop-color="#050b14"/>
  </linearGradient>
  <radialGradient id="key" cx="50%" cy="38%" r="62%">
    <stop offset="0%" stop-color="${f.glow}" stop-opacity="0.42"/>
    <stop offset="100%" stop-color="${f.glow}" stop-opacity="0"/>
  </radialGradient>
  <linearGradient id="sheet" x1="0.1" y1="0" x2="0.75" y2="1">
    <stop offset="0%" stop-color="${f.sheet}" stop-opacity="0.95"/>
    <stop offset="30%" stop-color="${f.sheet}" stop-opacity="0.55"/>
    <stop offset="62%" stop-color="#0a1220" stop-opacity="0.42"/>
    <stop offset="100%" stop-color="#03080f" stop-opacity="0.62"/>
  </linearGradient>
  <linearGradient id="edge" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stop-color="${f.accent}" stop-opacity="0.85"/>
    <stop offset="100%" stop-color="${f.edge}" stop-opacity="0.35"/>
  </linearGradient>
  <linearGradient id="bar" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stop-color="#ffffff" stop-opacity="0.72"/>
    <stop offset="26%" stop-color="${f.sheet}" stop-opacity="0.6"/>
    <stop offset="70%" stop-color="#060d18" stop-opacity="0.55"/>
    <stop offset="100%" stop-color="#000000" stop-opacity="0.4"/>
  </linearGradient>
  <radialGradient id="vg" cx="50%" cy="44%" r="76%">
    <stop offset="42%" stop-color="#000" stop-opacity="0"/>
    <stop offset="100%" stop-color="#000" stop-opacity="0.6"/>
  </radialGradient>
  <pattern id="eng" width="46" height="46" patternUnits="userSpaceOnUse">
    <path d="M 46 0 L 0 0 0 46" fill="none" stroke="${f.accent}" stroke-opacity="0.10" stroke-width="1"/>
  </pattern>`;

const wrap = (f, body) => `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
<defs>${defs(f)}</defs>
<rect width="${W}" height="${H}" fill="url(#bg)"/>
<rect width="${W}" height="${H}" fill="url(#eng)"/>
<rect width="${W}" height="${H}" fill="url(#key)"/>
${body}
<rect width="${W}" height="${H}" fill="url(#vg)"/>
<rect width="${W}" height="${H}" filter="url(#gr)" opacity="0.14" style="mix-blend-mode:overlay"/>
</svg>`;

/** Floor shadow so objects sit in space rather than float. */
const floor = (cx, cy, rx, ry = rx * 0.16) =>
  `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="#000" fill-opacity="0.5" filter="url(#drop)"/>`;

/** Rectangular duct panel with flange lip and rivet line. */
function panel(x, y, w, h, f, { rivets = true, inset = 0.05 } = {}) {
  let s = `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="10" fill="url(#sheet)" stroke="url(#edge)" stroke-width="3"/>`;
  s += `<rect x="${x + w * inset}" y="${y + h * 0.09}" width="${w * (1 - inset * 2)}" height="${h * 0.82}" rx="5" fill="none" stroke="${f.accent}" stroke-opacity="0.35" stroke-width="1.6"/>`;
  if (rivets) {
    const n = Math.max(6, Math.round(w / 105));
    for (let i = 0; i < n; i++) {
      const rx = x + w * 0.09 + (i * w * 0.82) / (n - 1);
      s += `<circle cx="${rx}" cy="${y + 13}" r="4.5" fill="${f.edge}" fill-opacity="0.6"/>`;
      s += `<circle cx="${rx}" cy="${y + h - 13}" r="4.5" fill="${f.edge}" fill-opacity="0.6"/>`;
    }
  }
  return s;
}

/** Round duct barrel with spiral seam and flange rings. */
function barrel(x, y, len, r, f, { rings = 5, seam = true } = {}) {
  let s = `<rect x="${x}" y="${y - r}" width="${len}" height="${r * 2}" rx="${r * 0.5}" fill="url(#bar)" stroke="${f.accent}" stroke-opacity="0.4" stroke-width="2.5"/>`;
  if (seam) {
    for (let i = 0; i < 14; i++) {
      const sx = x + (len / 14) * i + len / 28;
      s += `<line x1="${sx}" y1="${y - r}" x2="${sx - r * 0.34}" y2="${y + r}" stroke="${f.accent}" stroke-opacity="0.13" stroke-width="2"/>`;
    }
  }
  for (let i = 1; i < rings; i++) {
    const fx = x + (len / rings) * i;
    s += `<ellipse cx="${fx}" cy="${y}" rx="${r * 0.13}" ry="${r}" fill="none" stroke="#ffffff" stroke-opacity="0.4" stroke-width="${r * 0.08}"/>`;
    s += `<ellipse cx="${fx}" cy="${y}" rx="${r * 0.3}" ry="${r}" fill="none" stroke="#050b14" stroke-opacity="0.3" stroke-width="2"/>`;
  }
  return s;
}

/** Concentric ring motif — spiral duct cross-section. */
function rings(cx, cy, count, r0, dr, color, width) {
  let s = "";
  for (let i = 0; i < count; i++) {
    const r = r0 + i * dr;
    s += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${color}" stroke-opacity="${0.55 - i * 0.05}" stroke-width="${Math.max(1, width - i * 1.6)}"/>`;
  }
  return s;
}

/** Angle-frame bracing profile. */
function angleFrame(x, y, w, h, f) {
  let s = `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="none" stroke="url(#sheet)" stroke-width="26" stroke-linejoin="round"/>`;
  s += `<rect x="${x + 60}" y="${y + 60}" width="${w - 120}" height="${h - 120}" fill="none" stroke="url(#edge)" stroke-width="18"/>`;
  for (let i = 1; i < 4; i++) {
    s += `<line x1="${x + (w / 4) * i}" y1="${y}" x2="${x + (w / 4) * i}" y2="${y + h}" stroke="url(#sheet)" stroke-width="16"/>`;
  }
  s += `<rect x="${x + 34}" y="${y + 34}" width="${w - 68}" height="${h - 68}" fill="none" stroke="${f.accent}" stroke-opacity="0.3" stroke-width="2"/>`;
  return s;
}

/** Volume-control damper blade assembly. */
function damper(cx, cy, w, h, f) {
  let s = `<rect x="${cx - w / 2}" y="${cy - h / 2}" width="${w}" height="${h}" rx="8" fill="url(#sheet)" stroke="url(#edge)" stroke-width="3"/>`;
  s += `<rect x="${cx - w / 2 + 34}" y="${cy - h / 2 + 26}" width="${w - 68}" height="${h - 52}" rx="4" fill="#0a1420" fill-opacity="0.5" stroke="${f.accent}" stroke-opacity="0.3" stroke-width="2"/>`;
  for (let i = 0; i < 5; i++) {
    const bx = cx - w / 2 + 60 + i * ((w - 120) / 4);
    s += `<path d="M ${bx} ${cy + h / 2 - 34} L ${bx + 26} ${cy - h / 2 + 34} L ${bx + 52} ${cy - h / 2 + 34} L ${bx + 26} ${cy + h / 2 - 34} Z" fill="${f.accent}" fill-opacity="0.5" stroke="${f.accent}" stroke-opacity="0.75" stroke-width="2"/>`;
  }
  s += `<rect x="${cx + w / 2 - 6}" y="${cy - 16}" width="86" height="32" rx="10" fill="${f.edge}" fill-opacity="0.7"/>`;
  return s;
}

/** Bolted flange ring seen in perspective. */
function flange(cx, cy, rx, ry, f) {
  let s = `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="url(#sheet)" stroke="${f.accent}" stroke-opacity="0.7" stroke-width="3"/>`;
  s += `<ellipse cx="${cx}" cy="${cy}" rx="${rx * 0.66}" ry="${ry * 0.66}" fill="#08131f" fill-opacity="0.75" stroke="${f.edge}" stroke-opacity="0.6" stroke-width="2.5"/>`;
  const n = 14;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    s += `<circle cx="${cx + Math.cos(a) * rx * 0.83}" cy="${cy + Math.sin(a) * ry * 0.83}" r="7" fill="${f.edge}" fill-opacity="0.7"/>`;
  }
  return s;
}

/** Access door with hinges, handle and latches. */
function accessDoor(cx, cy, w, h, f) {
  const x = cx - w / 2;
  const y = cy - h / 2;
  let s = `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="10" fill="url(#sheet)" stroke="url(#edge)" stroke-width="3"/>`;
  s += `<rect x="${x + 28}" y="${y + 28}" width="${w - 56}" height="${h - 56}" rx="6" fill="none" stroke="${f.accent}" stroke-opacity="0.35" stroke-width="2"/>`;
  s += `<circle cx="${cx}" cy="${cy}" r="${Math.min(w, h) * 0.16}" fill="none" stroke="${f.edge}" stroke-opacity="0.75" stroke-width="6"/>`;
  s += `<rect x="${cx - 20}" y="${cy - 14}" width="40" height="28" rx="6" fill="${f.edge}" fill-opacity="0.65"/>`;
  for (const hy of [y + h * 0.22, y + h * 0.78]) {
    s += `<rect x="${x - 12}" y="${hy - 26}" width="34" height="52" rx="7" fill="${f.edge}" fill-opacity="0.55"/>`;
  }
  for (const lx of [x + 22, x + w - 22]) {
    s += `<rect x="${lx - 11}" y="${cy - 26}" width="22" height="52" rx="7" fill="${f.accent}" fill-opacity="0.6"/>`;
  }
  return s;
}

/** Machine bed with gantry and tooling. */
function machine(cx, cy, w, h, f) {
  let s = `<rect x="${cx - w / 2}" y="${cy + h * 0.18}" width="${w}" height="${h * 0.62}" rx="10" fill="url(#sheet)" stroke="url(#edge)" stroke-width="3"/>`;
  s += `<rect x="${cx - w / 2 + 30}" y="${cy + h * 0.28}" width="${w - 60}" height="${h * 0.3}" rx="6" fill="#0a1420" fill-opacity="0.55" stroke="${f.accent}" stroke-opacity="0.32" stroke-width="2"/>`;
  for (let i = 0; i < 7; i++) {
    s += `<rect x="${cx - w / 2 + 54 + i * ((w - 108) / 7)}" y="${cy + h * 0.33}" width="26" height="${h * 0.2}" rx="3" fill="#050b14" fill-opacity="0.8"/>`;
  }
  s += `<rect x="${cx - w / 2 - 14}" y="${cy - h * 0.44}" width="${w + 28}" height="26" rx="6" fill="${f.accent}" fill-opacity="0.45"/>`;
  s += `<rect x="${cx - 54}" y="${cy - h * 0.2}" width="108" height="${h * 0.4}" rx="8" fill="url(#sheet)" stroke="${f.accent}" stroke-opacity="0.55" stroke-width="2.5"/>`;
  s += `<circle cx="${cx - 76}" cy="${cy + h * 0.72}" r="26" fill="none" stroke="${f.accent}" stroke-opacity="0.55" stroke-width="6"/>`;
  s += `<circle cx="${cx + 76}" cy="${cy + h * 0.72}" r="26" fill="none" stroke="${f.accent}" stroke-opacity="0.55" stroke-width="6"/>`;
  return s;
}

/** Coating/ember texture overlay for the fire family. */
function embers(f, n = 34) {
  let s = "";
  for (let i = 0; i < n; i++) {
    const x = ((i * 313) % W) + ((i * 17) % 40);
    const y = ((i * 197) % H) + ((i * 23) % 30);
    const r = 2 + (i % 4) * 2.6;
    s += `<circle cx="${x}" cy="${y}" r="${r}" fill="#fff7ed" fill-opacity="${0.05 + (i % 5) * 0.035}"/>`;
  }
  s += `<ellipse cx="${W * 0.5}" cy="${H * 1.02}" rx="${W * 0.5}" ry="${H * 0.34}" fill="#f97316" fill-opacity="0.34" filter="url(#soft)"/>`;
  return s;
}

/* ── the six variants ────────────────────────────────────────────────────── */

const VARIANTS = {
  /* 1 — hero: single dominant object, generous headroom */
  1: (f) => {
    if (f === FAMILIES.round || f === FAMILIES.stainless) {
      return `${floor(800, 900, 480)}
        ${barrel(150, 600, 1300, 230, f, { rings: 5 })}`;
    }
    if (f === FAMILIES.fire) {
      return `${embers(f, 46)}${floor(800, 900, 500)}
        <g>${panel(180, 430, 1240, 400, f)}</g>
        <rect x="180" y="430" width="1240" height="400" rx="10" fill="#f97316" fill-opacity="0.16"/>`;
    }
    if (f === FAMILIES.machinery) return `${floor(800, 930, 480)}${machine(800, 620, 900, 460, f)}`;
    if (f === FAMILIES.accessory) return `${floor(800, 900, 460)}${damper(800, 610, 900, 420, f)}`;
    if (f === FAMILIES.angleframe) return `${floor(800, 900, 470)}${angleFrame(230, 400, 1140, 470, f)}`;
    return `${floor(800, 900, 480)}${panel(160, 420, 1280, 420, f)}`;
  },

  /* 2 — detail macro: a joint / flange read close up */
  2: (f) => {
    if (f === FAMILIES.accessory) return `${floor(800, 880, 430)}${flange(800, 600, 400, 155, f)}`;
    if (f === FAMILIES.machinery) {
      return `${floor(800, 940, 460)}
        ${machine(800, 660, 980, 380, f)}
        <g opacity="0.9">${flange(1180, 800, 150, 58, f)}</g>`;
    }
    if (f === FAMILIES.round || f === FAMILIES.stainless) {
      return `${floor(800, 900, 440)}
        <g transform="translate(-260 0)">${barrel(0, 620, 1180, 260, f, { rings: 4 })}</g>
        <g transform="translate(760 0)">${barrel(0, 620, 1100, 210, f, { rings: 3 })}</g>`;
    }
    if (f === FAMILIES.fire) {
      return `${embers(f, 40)}${floor(800, 880, 420)}
        <g transform="rotate(-6 800 600)">${panel(240, 460, 1120, 300, f)}</g>
        <rect x="240" y="460" width="1120" height="300" rx="10" fill="#f97316" fill-opacity="0.2"/>`;
    }
    return `${floor(800, 880, 430)}
      <g transform="rotate(-3 800 600)">${panel(210, 440, 1180, 340, f)}</g>
      <g opacity="0.95">${flange(1210, 620, 165, 62, f)}</g>`;
  },

  /* 3 — set: three pieces of varying size, engineered arrangement */
  3: (f) => {
    if (f === FAMILIES.round || f === FAMILIES.stainless) {
      return `${floor(800, 940, 520)}
        <g transform="translate(90 300)">${barrel(0, 330, 720, 150, f, { rings: 3 })}</g>
        <g transform="translate(560 600)">${barrel(0, 0, 700, 128, f, { rings: 3 })}</g>
        <g transform="translate(120 830)">${barrel(0, 0, 560, 96, f, { rings: 2 })}</g>`;
    }
    if (f === FAMILIES.machinery) {
      return `${floor(800, 950, 500)}
        ${machine(560, 700, 620, 340, f)}
        <g transform="translate(1080 0)">${machine(0, 760, 520, 300, f)}</g>
        ${flange(1300, 430, 175, 68, f)}`;
    }
    if (f === FAMILIES.accessory) {
      return `${floor(800, 930, 500)}
        ${flange(420, 460, 250, 98, f)}
        ${damper(1080, 480, 480, 240, f)}
        ${accessDoor(700, 830, 420, 300, f)}`;
    }
    if (f === FAMILIES.fire) {
      return `${embers(f, 44)}${floor(800, 940, 510)}
        <g transform="rotate(-4 560 480)">${panel(180, 380, 700, 210, f, { rivets: true })}</g>
        <g transform="rotate(3 1080 470)">${panel(860, 370, 560, 190, f, { rivets: true })}</g>
        <g transform="translate(360 0)">${panel(200, 700, 1000, 180, f, { rivets: false })}</g>
        <rect x="180" y="380" width="700" height="210" rx="10" fill="#f97316" fill-opacity="0.16"/>
        <rect x="200" y="700" width="1000" height="180" rx="10" fill="#f97316" fill-opacity="0.16"/>`;
    }
    if (f === FAMILIES.angleframe) {
      return `${floor(800, 940, 500)}
        ${angleFrame(150, 360, 620, 250, f)}
        <g transform="translate(880 120)">${angleFrame(0, 0, 540, 220, f)}</g>
        <g transform="translate(330 120)">${angleFrame(0, 0, 540, 200, f)}</g>`;
    }
    return `${floor(800, 940, 510)}
      <g transform="rotate(-2 560 460)">${panel(150, 360, 760, 200, f)}</g>
      <g transform="rotate(2 1120 470)">${panel(880, 370, 540, 180, f)}</g>
      <g transform="translate(320 0)">${panel(220, 700, 1080, 190, f, { rivets: false })}</g>`;
  },

  /* 4 — section / cross-section: technical cut with dimension marks */
  4: (f) => {
    const marks = `<g stroke="${f.accent}" stroke-opacity="0.45" fill="none" stroke-width="1.6">
      <path d="M 150 980 L 1450 980 M 150 962 L 150 998 M 1450 962 L 1450 998"/>
      <path d="M 110 300 L 110 900 M 92 300 L 128 300 M 92 900 L 128 900"/></g>
      <g fill="${f.accent}" fill-opacity="0.4">
        ${Array.from({ length: 26 }, (_, i) => `<rect x="${150 + i * 50}" y="972" width="25" height="4"/>`).join("")}
        ${Array.from({ length: 12 }, (_, i) => `<rect x="102" y="${300 + i * 50}" width="4" height="25"/>`).join("")}
      </g>`;
    if (f === FAMILIES.round || f === FAMILIES.stainless) {
      return `${floor(800, 900, 430)}
        ${rings(800, 600, 9, 60, 46, f.accent, 26)}
        ${flange(800, 600, 460, 178, f)}${marks}`;
    }
    if (f === FAMILIES.accessory) {
      return `${floor(800, 900, 420)}${damper(800, 600, 820, 380, f)}${marks}`;
    }
    if (f === FAMILIES.machinery) {
      return `${floor(800, 900, 440)}${machine(800, 620, 900, 400, f)}${marks}`;
    }
    if (f === FAMILIES.fire) {
      return `${embers(f, 34)}${floor(800, 900, 430)}
        <g>${panel(200, 420, 1200, 340, f)}</g>
        <rect x="200" y="420" width="1200" height="340" rx="10" fill="#f97316" fill-opacity="0.2"/>${marks}`;
    }
    if (f === FAMILIES.angleframe) {
      return `${floor(800, 900, 430)}${angleFrame(230, 380, 1140, 430, f)}${marks}`;
    }
    return `${floor(800, 900, 430)}${panel(180, 420, 1240, 340, f)}${marks}`;
  },

  /* 5 — context: duct run installed in a building / plant space */
  5: (f) => {
    const ribs = Array.from({ length: 9 }, (_, i) =>
      `<rect x="${i * 190}" y="0" width="14" height="${H}" fill="#000" fill-opacity="0.16"/>`
    ).join("");
    let run;
    if (f === FAMILIES.round || f === FAMILIES.stainless) {
      run = `<g transform="translate(0 40)">${barrel(-160, 600, 1920, 210, f, { rings: 8 })}</g>`;
    } else if (f === FAMILIES.fire) {
      run = `<g>${panel(-100, 470, 1800, 320, f, { rivets: true })}</g>
             <rect x="-100" y="470" width="1800" height="320" fill="#f97316" fill-opacity="0.14"/>`;
    } else if (f === FAMILIES.machinery) {
      run = `${machine(430, 640, 700, 380, f)}${machine(1150, 660, 560, 340, f)}`;
    } else if (f === FAMILIES.accessory) {
      run = `${flange(400, 600, 300, 118, f)}${damper(1120, 600, 520, 300, f)}`;
    } else {
      run = `<g>${panel(-80, 460, 1760, 330, f, { rivets: true })}</g>`;
    }
    return `<g opacity="0.9">${ribs}</g>
      <g opacity="0.28">${Array.from({ length: 5 }, (_, i) => `<rect x="${i * 340}" y="840" width="200" height="300" fill="${f.accent}" fill-opacity="0.1"/>`).join("")}</g>
      ${run}
      <g stroke="${f.accent}" stroke-opacity="0.5" stroke-width="7" fill="none">
        <path d="M 60 130 L 1540 130"/><path d="M 60 130 L 60 40 M 1540 130 L 1540 40"/>
      </g>
      <g fill="${f.accent}" fill-opacity="0.22">
        ${Array.from({ length: 24 }, (_, i) => `<rect x="${i * 63}" y="124" width="32" height="12"/>`).join("")}
      </g>
      ${f === FAMILIES.fire ? embers(f, 30) : ""}`;
  },

  /* 6 — inspection: gauge / QC read with a precision instrument motif */
  6: (f) => {
    const dial = (cx, cy, r) => `
      <circle cx="${cx}" cy="${cy}" r="${r}" fill="#08131f" fill-opacity="0.82" stroke="${f.accent}" stroke-opacity="0.7" stroke-width="4"/>
      <circle cx="${cx}" cy="${cy}" r="${r * 0.78}" fill="none" stroke="${f.accent}" stroke-opacity="0.28" stroke-width="2"/>
      ${Array.from({ length: 24 }, (_, i) => {
        const a = (i / 24) * Math.PI * 2 - Math.PI / 2;
        const inner = i % 6 === 0 ? r * 0.6 : r * 0.7;
        return `<line x1="${cx + Math.cos(a) * inner}" y1="${cy + Math.sin(a) * inner}" x2="${cx + Math.cos(a) * r * 0.82}" y2="${cy + Math.sin(a) * r * 0.82}" stroke="${f.accent}" stroke-opacity="0.55" stroke-width="${i % 6 === 0 ? 4 : 2}"/>`;
      }).join("")}
      <line x1="${cx}" y1="${cy}" x2="${cx + r * 0.52}" y2="${cy - r * 0.42}" stroke="#ffffff" stroke-opacity="0.9" stroke-width="4" stroke-linecap="round"/>
      <circle cx="${cx}" cy="${cy}" r="7" fill="${f.accent}"/>`;
    const caliper = `<g stroke="${f.accent}" stroke-opacity="0.8" stroke-width="5" fill="none" stroke-linecap="round">
        <path d="M 300 900 L 300 1030 L 1180 1030 L 1180 900"/>
      </g>
      <g stroke="${f.accent}" stroke-opacity="0.45" stroke-width="2" fill="none">
        ${Array.from({ length: 19 }, (_, i) => `<line x1="${300 + i * 46.6}" y1="1030" x2="${300 + i * 46.6}" y2="${i % 5 === 0 ? 1000 : 1014}"/>`).join("")}
      </g>`;
    let subject;
    if (f === FAMILIES.round || f === FAMILIES.stainless) {
      subject = `${floor(800, 900, 430)}<g transform="translate(0 -60)">${barrel(160, 640, 1280, 215, f, { rings: 5 })}</g>`;
    } else if (f === FAMILIES.fire) {
      subject = `${embers(f, 40)}${floor(800, 900, 430)}
        <g transform="rotate(-2 800 560)">${panel(200, 400, 1200, 320, f)}</g>
        <rect x="200" y="400" width="1200" height="320" rx="10" fill="#f97316" fill-opacity="0.2"/>`;
    } else if (f === FAMILIES.machinery) {
      subject = `${floor(800, 900, 440)}${machine(800, 580, 900, 400, f)}`;
    } else if (f === FAMILIES.accessory) {
      subject = `${floor(800, 900, 420)}${damper(760, 560, 700, 330, f)}`;
    } else {
      subject = `${floor(800, 900, 430)}${panel(190, 400, 1220, 320, f)}`;
    }
    return `${subject}${dial(1330, 300, 150)}${dial(1180, 830, 84)}${caliper}`;
  },
};

/* ── run ──────────────────────────────────────────────────────────────────── */

await mkdir(OUT, { recursive: true });

/** slugs we must keep visually distinct from the families (shared image URLs). */
let count = 0;
let bytes = 0;
for (const [slug, family] of Object.entries(PRODUCTS)) {
  const f = FAMILIES[family];
  for (const n of [1, 2, 3, 4, 5, 6]) {
    const file = path.join(OUT, `${slug}-${n}.jpg`);
    const buf = await sharp(Buffer.from(wrap(f, VARIANTS[n](f))), { density: 96 })
      .jpeg({ quality: 82, progressive: true, mozjpeg: true, chromaSubsampling: "4:4:4" })
      .toBuffer();
    await writeFile(file, buf);
    bytes += buf.length;
    count++;
  }
  console.log(`  ${slug.padEnd(28)} 6 frames (${family})`);
}

const index = Object.fromEntries(
  Object.keys(PRODUCTS).map((slug) => [
    slug,
    [1, 2, 3, 4, 5, 6].map((n) => `/images/products/${slug}-${n}.jpg`),
  ])
);
await writeFile(path.join(OUT, "index.json"), JSON.stringify(index, null, 2));

console.log(`\n${count} product images, ${(bytes / 1024 / 1024).toFixed(1)} MB total`);
console.log("index written to public/images/products/index.json");
