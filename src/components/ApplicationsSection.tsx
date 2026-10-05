import SmartImage from "@/components/SmartImage";
import { getSectionMedia } from "@/lib/queries";

/**
 * Ducting Solutions Across Critical Applications — shared image grid.
 *
 * Every tile is CMS-managed (`applications` section key): the admin controls the
 * label, image and ordering. The built-in defaults keep the grid full before any
 * upload happens, and every tile uses real MSNSS photography.
 */

const DEFAULT_APPLICATIONS: { label: string; img: string }[] = [
  { label: "Commercial", img: "/images/apps-commercial.jpg" },
  { label: "Hotels & Hospitality", img: "/images/hero-2.jpg" },
  { label: "Healthcare", img: "/images/apps-healthcare.jpg" },
  { label: "Commercial Kitchens", img: "/images/apps-kitchen.jpg" },
  { label: "Industrial", img: "/images/factory.jpg" },
  { label: "Aviation", img: "/images/hero-1.jpg" },
  { label: "Corporate & Banking", img: "/images/about.jpg" },
  { label: "Infrastructure", img: "/images/hero-3.jpg" },
];

type Tile = { label: string; img: string; alt: string };

export async function ApplicationsSection() {
  const rows = await getSectionMedia("applications");

  const tiles: Tile[] = rows.length
    ? rows.map((r) => ({
        label: String(r.title || ""),
        img: String(r.imageUrl || ""),
        alt: String(r.altText || r.title || "MSNSS HVAC ducting application"),
      }))
    : DEFAULT_APPLICATIONS.map((a) => ({
        ...a,
        alt: `${a.label} HVAC ducting projects fabricated by MSNSS`,
      }));

  return (
    <section className="cv-auto bg-white py-12 sm:py-14">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <h2 className="text-center text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">
          Ducting Solutions Across Critical Applications
        </h2>

        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {tiles.map((tile) => (
            <div
              key={tile.label + tile.img}
              className="lift group relative flex aspect-[4/3] flex-col justify-end overflow-hidden rounded-xl border border-slate-200 shadow-sm hover:border-brand hover:shadow-lg"
            >
              <SmartImage
                src={tile.img}
                alt={tile.alt}
                fill
                sizes="(min-width: 1024px) 290px, (min-width: 640px) 25vw, 50vw"
                loading="lazy"
                className="object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div
                aria-hidden="true"
                className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-transparent transition group-hover:from-brand/90 group-hover:via-brand/40"
              />
              <div className="relative p-4">
                <div className="text-sm font-bold text-white drop-shadow">
                  {tile.label}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
