"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import SmartImage from "@/components/SmartImage";
import { Tilt, TiltLayer } from "@/components/Tilt";
import type { Project } from "@/db/schema";

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * "Projects That Speak for Our Work" — bento mosaic
 * ─────────────────────────────────────────────────────────────────────────────
 * One tall hero tile beside two rows of paired tiles. Every tile is full-bleed
 * photography with a sector label top-left and a title + summary bottom-left,
 * and every tile is a live 3D surface: it tips toward the pointer, its label
 * and copy float at their own depth, and a specular highlight travels across
 * the face.
 *
 * The mosaic is driven entirely by CMS project data (category, name, summary,
 * image) so admins control both the content and the ordering via `homeOrder`.
 * ─────────────────────────────────────────────────────────────────────────────
 */

type BentoProject = {
  id: number;
  slug: string;
  name: string;
  category: string;
  summary: string;
  imageUrl: string;
  status: string;
};

function toBento(p: Project): BentoProject {
  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    category: p.category || "Project",
    summary:
      p.shortDescription ||
      [p.location, p.industry].filter(Boolean).join(" · ") ||
      p.scopeOfWork,
    imageUrl: p.imageUrl || "/images/factory.jpg",
    status: p.status,
  };
}

function BentoTile({ project, index }: { project: BentoProject; index: number }) {
  const reduce = useReducedMotion();

  return (
    <motion.div
      initial={reduce ? { opacity: 0 } : { opacity: 0, y: 26, scale: 0.985 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, amount: 0.18 }}
      transition={{
        duration: reduce ? 0.15 : 0.62,
        delay: reduce ? 0 : Math.min(index * 0.085, 0.42),
        ease: [0.22, 1, 0.36, 1],
      }}
      className="min-h-[280px] lg:min-h-0"
    >
      <Tilt max={index === 0 ? 5 : 7} perspective={1100} className="h-full">
        <Link
          href={`/projects/${project.slug}`}
          aria-label={`View project: ${project.name}`}
          className="group relative block h-full w-full overflow-hidden rounded-2xl border border-white/10 bg-slate-900 shadow-premium-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
        >
          {/* Photographic surface */}
          <TiltLayer z={-18} className="absolute inset-0">
            <SmartImage
              src={project.imageUrl}
              alt={`${project.name} — ${project.category} project by MSNSS`}
              fill
              sizes={
                index === 0
                  ? "(min-width: 1024px) 42vw, 100vw"
                  : "(min-width: 1024px) 30vw, (min-width: 640px) 50vw, 100vw"
              }
              loading={index === 0 ? "eager" : "lazy"}
              priority={index === 0}
              className="object-cover transition-transform duration-[900ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.09]"
            />
          </TiltLayer>

          {/* Cinematic grade: deep at the foot, open at the head */}
          <div
            aria-hidden="true"
            className="absolute inset-0 z-[1]"
            style={{
              background:
                "linear-gradient(to top, rgba(3,8,18,0.94) 0%, rgba(3,8,18,0.72) 22%, rgba(3,8,18,0.22) 52%, rgba(3,8,18,0.08) 100%)",
            }}
          />
          {/* Brand bloom that wakes up on hover */}
          <div
            aria-hidden="true"
            className="absolute inset-0 z-[1] opacity-0 transition-opacity duration-500 group-hover:opacity-100"
            style={{
              background:
                "radial-gradient(120% 90% at 12% 100%, rgba(14,124,196,0.34) 0%, transparent 62%)",
            }}
          />

          {/* Sector label — floats toward the viewer */}
          <TiltLayer z={34} className="absolute left-5 top-5 right-5 z-[2]">
            <span className="inline-flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.22em] text-white/85">
              <span className="h-[3px] w-6 rounded-full bg-brand" aria-hidden="true" />
              {project.category}
            </span>
          </TiltLayer>

          {/* Title + summary — deepest layer for real parallax */}
          <TiltLayer z={22} className="absolute inset-x-5 bottom-5 z-[2]">
            <h3
              className={`text-balance font-extrabold leading-tight tracking-[-0.018em] text-white ${
                index === 0 ? "text-2xl sm:text-[28px]" : "text-lg sm:text-xl"
              }`}
            >
              {project.name}
            </h3>
            <p
              className={`mt-2 text-pretty leading-relaxed text-white/75 ${
                index === 0
                  ? "line-clamp-3 max-w-[36ch] text-sm sm:text-[15px]"
                  : "line-clamp-2 text-xs sm:text-[13px]"
              }`}
            >
              {project.summary}
            </p>
            <span className="mt-3 inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-white/60 transition-colors duration-300 group-hover:text-white">
              View Project
              <svg
                viewBox="0 0 24 24"
                className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1"
                fill="none"
                stroke="currentColor"
                strokeWidth={2.4}
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </span>
          </TiltLayer>
        </Link>
      </Tilt>
    </motion.div>
  );
}

export function ProjectBento({ projects }: { projects: Project[] }) {
  const items = projects.slice(0, 5).map(toBento);
  if (!items.length) return null;

  return (
    <div className="bento">
      {items.map((p, i) => (
        <BentoTile key={p.id} project={p} index={i} />
      ))}
    </div>
  );
}
