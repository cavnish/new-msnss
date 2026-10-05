import { chromium } from "@playwright/test";

const BASE = "http://localhost:3000";
const SLUGS = ["ms-rectangular-duct", "volume-control-damper", "plasma-cutting-machine"];
const browser = await chromium.launch();

for (const [label, viewport] of [
  ["desktop", { width: 1440, height: 900 }],
  ["mobile", { width: 390, height: 844 }],
]) {
  const ctx = await browser.newContext({ viewport });
  const page = await ctx.newPage();

  for (const slug of SLUGS) {
    const errors = [];
    page.removeAllListeners("pageerror");
    page.removeAllListeners("console");
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("console", (m) => m.type() === "error" && errors.push(m.text()));

    await page.goto(`${BASE}/products/${slug}`, { waitUntil: "networkidle" });
    await page.waitForTimeout(900);

    const info = await page.evaluate(() => {
      const h1 = document.querySelector("h1");
      const hero = h1?.closest("section");
      // Scope CTAs to the hero only — the floating mobile action bar also has one.
      const heroCta = Array.from(hero?.querySelectorAll("a") ?? []).find((a) =>
        /get a quote/i.test(a.textContent || "")
      );
      const engCta = Array.from(hero?.querySelectorAll("a") ?? []).find((a) =>
        /engineering team/i.test(a.textContent || "")
      );
      const tabs = document.querySelectorAll('[role="tablist"] [role="tab"]');
      const counterEl = Array.from(hero?.querySelectorAll("div") ?? []).find(
        (d) => /^\d+ \/ \d+$/.test((d.textContent || "").trim()) && d.children.length === 0
      );
      const stage = document.querySelector('[role="tablist"]')?.previousElementSibling;
      const cs = heroCta ? getComputedStyle(heroCta) : null;
      const r = (el) => (el ? el.getBoundingClientRect() : null);

      /* A CTA label that wraps shows more than one client rect for its text. */
      const textLineCount = (el) => {
        if (!el) return 0;
        const range = document.createRange();
        range.selectNodeContents(el);
        return range.getClientRects().length;
      };

      return {
        h1: h1?.textContent?.trim().slice(0, 60),
        h1Px: h1 ? Math.round(parseFloat(getComputedStyle(h1).fontSize)) : 0,
        heroTop: r(hero)?.top !== undefined ? Math.round(r(hero).top) : null,
        ctaLabel: heroCta?.textContent?.trim(),
        ctaTop: Math.round(r(heroCta)?.top ?? -1),
        ctaBottom: Math.round(r(heroCta)?.bottom ?? -1),
        ctaHeight: Math.round(r(heroCta)?.height ?? 0),
        ctaWidth: Math.round(r(heroCta)?.width ?? 0),
        ctaFontPx: cs ? Math.round(parseFloat(cs.fontSize)) : 0,
        ctaTextLines: textLineCount(heroCta),
        engCtaLines: textLineCount(engCta),
        engCtaTop: Math.round(r(engCta)?.top ?? -1),
        engCtaLabel: engCta?.textContent?.trim().slice(0, 40),
        thumbs: tabs.length,
        counter: counterEl?.textContent?.trim(),
        stage: stage
          ? (() => {
              const b = stage.getBoundingClientRect();
              return { w: Math.round(b.width), h: Math.round(b.height), ratio: +(b.width / b.height).toFixed(2) };
            })()
          : null,
        hOverflow: document.documentElement.scrollWidth > window.innerWidth + 1,
        docW: document.documentElement.scrollWidth,
        winW: window.innerWidth,
        highlights: hero ? hero.querySelectorAll("li").length : 0,
      };
    });

    const st = info.stage;
    console.log(`\n=== ${label} / ${slug} ===`);
    console.log(`  H1 ${info.h1Px}px "${info.h1}"`);
    console.log(`  gallery stage ${st ? `${st.w}x${st.h} ratio=${st.ratio}` : "n/a"} (viewport ${viewport.width})`);
    console.log(`  stage fits viewport: ${st ? (st.w <= viewport.width ? "YES" : `NO — ${st.w} > ${viewport.width}`) : "?"}`);
    console.log(`  thumbnails ${info.thumbs} | counter "${info.counter}"`);
    console.log(`  hero highlights ${info.highlights}`);
    console.log(`  CTA "${info.ctaLabel}" top ${info.ctaTop} bottom ${info.ctaBottom} textLines=${info.ctaTextLines}`);
    console.log(`  CTA single-line: ${info.ctaTextLines <= 1 ? "yes" : `NO (${info.ctaTextLines} lines)`}`);
    console.log(`  CTA in first viewport: ${info.ctaTop >= 0 && info.ctaTop < viewport.height ? "YES" : "NO"}`);
    console.log(`  CTA2 "${info.engCtaLabel}" textLines=${info.engCtaLines} top ${info.engCtaTop}`);
    console.log(`  h-overflow ${info.hOverflow ? `YES ${info.docW}>${info.winW}` : "no"} | js errors ${errors.length || "none"}`);
  }

  await ctx.close();
}

await browser.close();
