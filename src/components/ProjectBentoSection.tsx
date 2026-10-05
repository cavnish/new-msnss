import Link from "next/link";
import { Reveal } from "@/components/motion/Motion";
import { ProjectBento } from "@/components/ProjectBento";
import { getHomeProjects } from "@/lib/queries";

/**
 * "Projects That Speak for Our Work" — full section.
 *
 * Rendered by the shared layout on every route (home and the bespoke pages
 * render their own placement, so the layout skips those — one instance per
 * page, never duplicated).
 */
export async function ProjectBentoSection() {
  const projects = await getHomeProjects(5);
  if (!projects.length) return null;

  return (
    <section
      aria-labelledby="projects-that-speak-heading"
      className="surface-ink grain relative overflow-hidden py-16 sm:py-20 lg:py-24"
    >
      {/* Ambient depth */}
      <div
        aria-hidden="true"
        className="animate-aurora pointer-events-none absolute -left-32 top-10 h-[420px] w-[420px] rounded-full bg-brand/25 blur-[130px]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-24 bottom-0 h-[380px] w-[380px] rounded-full bg-sky-400/10 blur-[130px]"
      />
      <div aria-hidden="true" className="eng-grid-dark pointer-events-none absolute inset-0 opacity-30" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal className="mb-10 flex flex-col gap-6 lg:mb-12 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <span className="eyebrow text-cyan-300">Our Work</span>
            <h2
              id="projects-that-speak-heading"
              className="mt-4 text-balance text-[1.85rem] font-extrabold leading-[1.1] tracking-[-0.024em] text-white sm:text-4xl lg:text-[2.9rem]"
            >
              Projects That Speak for Our Work
            </h2>
            <p className="mt-4 max-w-xl text-pretty text-base leading-7 text-slate-300 sm:text-lg sm:leading-8">
              Ducting engineered, fabricated and installed across commercial,
              hospitality, healthcare and industrial sites — measured by what we
              delivered, not what we promised.
            </p>
          </div>

          <Link
            href="/projects"
            className="btn-ghost inline-flex shrink-0 items-center gap-2 self-start rounded-xl border border-white/25 bg-white/10 px-6 py-3.5 text-sm font-bold text-white backdrop-blur hover:bg-white hover:text-[#0a3470] lg:self-auto"
          >
            View All Projects
            <svg
              viewBox="0 0 24 24"
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.3}
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </Link>
        </Reveal>

        <ProjectBento projects={projects} />
      </div>
    </section>
  );
}
