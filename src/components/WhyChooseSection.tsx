import Link from "next/link";
import SmartImage from "@/components/SmartImage";
import { getSectionMedia } from "@/lib/queries";

/**
 * "Why Industry Leaders Choose MSNSS" — dark, premium trust panel.
 *
 * Three-zone editorial layout: statement + project tiles on the left, a
 * pan-India delivery map in the centre, and stacked proof cards + stats on the
 * right. The tiles and the map are CMS-managed (`why-choose`, `why-choose-map`);
 * until the admin uploads anything, the built-in defaults below are used so the
 * section never renders empty.
 */

const HIGHLIGHTS = [
  {
    icon: "factory",
    title: "In-House Manufacturing",
    sub: "2,000 SQM monthly duct capacity",
  },
  {
    icon: "shield",
    title: "Certified Standards",
    sub: "SMACNA, DW 144 & IS 655 aligned",
  },
  {
    icon: "ruler",
    title: "Drawing-Based Execution",
    sub: "Fabricated to approved shop drawings",
  },
  {
    icon: "bolt",
    title: "Fast Site Installation",
    sub: "Coordinated dispatch & erection",
  },
];

const STATS = [
  { value: "2,000", suffix: "+", label: "SQM Monthly Capacity" },
  { value: "25", suffix: "+", label: "Years of Experience" },
];

const DEFAULT_TILES = [
  {
    img: "/images/products/ms-rectangular.jpg",
    title: "MS DUCTING",
    sub: "Heavy-Duty Airflow",
  },
  {
    img: "/images/products/ss-rectangular.jpg",
    title: "SS DUCTING",
    sub: "Hygienic Corrosion-Free",
  },
  {
    img: "/images/fire-rated.jpg",
    title: "FIRE-RATED",
    sub: "Smoke & Heat Protection",
  },
];

const DEFAULT_MAP = {
  img: "/images/india-network.jpg",
  alt: "Pan-India HVAC ducting supply and installation network served by MSNSS",
  pill: "Pan-India Supply & Installation",
};

type Tile = { img: string; title: string; sub: string; alt: string };

function Icon({ name, className = "" }: { name: string; className?: string }) {
  const p = {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  const paths: Record<string, React.ReactNode> = {
    factory: (
      <>
        <path d="M3 21V9l6 4V9l6 4V5l6 4v12z" {...p} />
        <path d="M7 21v-4M12 21v-4M17 21v-4" {...p} />
      </>
    ),
    shield: <path d="M12 3l7 3v6c0 4-3 7-7 9-4-2-7-5-7-9V6z" {...p} />,
    ruler: (
      <>
        <rect x="2" y="8" width="20" height="8" rx="2" {...p} />
        <path d="M6 8v3M10 8v4M14 8v3M18 8v4" {...p} />
      </>
    ),
    bolt: <path d="M13 2L4 14h7l-1 8 9-12h-7z" {...p} />,
  };
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      {paths[name]}
    </svg>
  );
}

export async function WhyChooseSection() {
  const [tileRows, mapRows] = await Promise.all([
    getSectionMedia("why-choose"),
    getSectionMedia("why-choose-map"),
  ]);

  const tiles: Tile[] = tileRows.length
    ? tileRows.slice(0, 3).map((r) => ({
        img: String(r.imageUrl || ""),
        title: String(r.title || "").toUpperCase(),
        sub: String(r.caption || ""),
        alt: String(r.altText || r.title || "MSNSS ducting"),
      }))
    : DEFAULT_TILES.map((t) => ({ ...t, alt: `${t.title} fabricated and installed by MSNSS` }));

  const map = mapRows.length
    ? {
        img: String(mapRows[0].imageUrl || ""),
        alt: String(mapRows[0].altText || DEFAULT_MAP.alt),
        pill: String(mapRows[0].title || DEFAULT_MAP.pill),
      }
    : DEFAULT_MAP;

  return (
    <section
      aria-labelledby="why-msnss-heading"
      className="cv-auto relative overflow-hidden bg-[#0a0c11] py-14 sm:py-16 lg:py-20"
    >
      {/* Ambient glows */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-32 top-0 h-[420px] w-[420px] rounded-full bg-brand/20 blur-[120px]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-24 bottom-0 h-[380px] w-[380px] rounded-full bg-cyan-500/10 blur-[120px]"
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-8">
          {/* ── Left: statement + tiles ── */}
          <div className="lg:col-span-4">
            <h2
              id="why-msnss-heading"
              className="text-[26px] font-extrabold leading-[1.12] tracking-tight text-white sm:text-4xl"
            >
              Why <span className="text-brand">Industry Leaders</span>
              <br />
              Choose MSNSS
            </h2>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-slate-400 sm:text-[15px] sm:leading-7">
              MS &amp; SS HVAC ducting engineered around your load requirements,
              approved drawings and site workflow — manufactured, finished and
              installed by one accountable team.
            </p>

            <Link
              href="/products"
              className="btn-micro mt-7 inline-flex items-center gap-2 rounded-lg bg-brand px-6 py-3.5 text-xs font-bold uppercase tracking-[0.14em] text-white shadow-lg shadow-brand/25 hover:bg-brand-dark sm:text-sm"
            >
              Explore Our Solutions
              <svg
                viewBox="0 0 24 24"
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                strokeWidth={2.4}
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </Link>

            {/* CMS-managed project tiles */}
            <div className="mt-8 grid grid-cols-3 gap-3">
              {tiles.map((t) => (
                <div
                  key={t.title + t.img}
                  className="group relative aspect-[3/2] overflow-hidden rounded-lg border border-white/10"
                >
                  <SmartImage
                    src={t.img}
                    alt={t.alt}
                    fill
                    sizes="(min-width:1024px) 150px, 33vw"
                    loading="lazy"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div
                    aria-hidden="true"
                    className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/25 to-transparent"
                  />
                  <div className="absolute inset-x-0 bottom-0 p-2">
                    <div className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-white">
                      {t.title}
                    </div>
                    {t.sub ? (
                      <div className="mt-0.5 text-[9px] leading-tight text-white/60">
                        {t.sub}
                      </div>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Centre: pan-India map ── */}
          <div className="flex flex-col items-center justify-center lg:col-span-4">
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl border border-white/10">
              <SmartImage
                src={map.img}
                alt={map.alt}
                fill
                sizes="(min-width:1024px) 380px, 100vw"
                className="object-cover"
              />
              <div
                aria-hidden="true"
                className="absolute inset-0 bg-gradient-to-t from-[#0a0c11] via-transparent to-transparent"
              />
            </div>
            <div className="mt-5 rounded-full border border-white/15 bg-white/[0.04] px-5 py-2">
              <span className="text-[10px] font-extrabold uppercase tracking-[0.22em] text-slate-300">
                {map.pill}
              </span>
            </div>
          </div>

          {/* ── Right: proof cards + stats ── */}
          <div className="lg:col-span-4">
            <div className="space-y-3">
              {HIGHLIGHTS.map((h) => (
                <div
                  key={h.title}
                  className="lift flex items-center gap-3.5 rounded-xl border border-white/10 bg-white/[0.035] px-4 py-3.5 hover:border-brand/40 hover:bg-white/[0.06]"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand/15 text-brand">
                    <Icon name={h.icon} className="h-5 w-5" />
                  </span>
                  <div className="min-w-0">
                    <div className="text-sm font-bold text-white">{h.title}</div>
                    <div className="mt-0.5 truncate text-xs text-slate-400">
                      {h.sub}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-3 grid grid-cols-2 gap-3">
              {STATS.map((s) => (
                <div
                  key={s.label}
                  className="rounded-xl border border-white/10 bg-white/[0.035] px-4 py-4"
                >
                  <div className="text-2xl font-extrabold text-white">
                    {s.value}
                    <span className="text-brand">{s.suffix}</span>
                  </div>
                  <div className="mt-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                    {s.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
