import Link from "next/link";
import SmartImage from "@/components/SmartImage";
import { getSectionMedia } from "@/lib/queries";

/**
 * Fire-Rated Solutions — shared editorial split panel.
 * Used on the home page and product detail pages.
 *
 * The photo is CMS-managed (`home-fire-rated` — first visible row wins);
 * until the admin uploads anything, the built-in default is used.
 */

const DEFAULT_IMAGE = "/images/fire-rated.jpg";

const USES = [
  "Smoke Exhaust",
  "Kitchen Exhaust",
  "Car Park Ventilation",
  "Pressurization",
  "Industrial Exhaust",
];

export async function FireRatedSection() {
  const rows = await getSectionMedia("home-fire-rated").catch(() => []);
  const row = rows[0] as { imageUrl?: string; altText?: string } | undefined;
  const image = (row?.imageUrl && String(row.imageUrl).trim()) || DEFAULT_IMAGE;
  const alt = (row?.altText && String(row.altText).trim()) || "MSNSS fire-rated ducting solutions";
  return (
    <section id="fire-rated" className="bg-slate-50 py-12 sm:py-14">
      <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 sm:px-6 lg:grid-cols-2 lg:gap-12">
        <div className="group overflow-hidden rounded-2xl border border-slate-200 shadow-lg">
          <SmartImage
            src={image}
            alt={alt}
            width={1024}
            height={768}
            className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
          />
        </div>
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">
            Fire Protection for Critical Ducting Applications
          </h2>
          <p className="mt-4 text-slate-600">
            For areas that need extra fire and heat resistance, MSNSS provides
            fire-rated ducting using suitable coating systems.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            {USES.map((a) => (
              <span
                key={a}
                className="rounded-full border border-slate-200 bg-white px-4 py-1.5 text-sm text-slate-700"
              >
                {a}
              </span>
            ))}
          </div>
          <Link
            href="/products/fire-rated-duct"
            className="mt-7 inline-flex items-center gap-2 rounded-lg bg-brand px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-dark"
          >
            View Fire-Rated Duct →
          </Link>
        </div>
      </div>
    </section>
  );
}
