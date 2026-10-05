/**
 * "From Plan to Installation" — dark six-step delivery timeline.
 *
 * A single horizontal rail of icon medallions joined by a dashed connector,
 * each carrying a numbered marker, a title and a short description. Collapses
 * to a compact two-column, then single-column stack on smaller screens while
 * keeping the medallion rail legible.
 */

const STEPS = [
  {
    n: "01",
    title: "Requirement Assessment",
    desc: "We discuss your space, air loads, layouts and handling method to understand exactly what you need.",
    icon: "clipboard",
  },
  {
    n: "02",
    title: "Duct Planning",
    desc: "We prepare a section-by-section plan that fits your building, airflow and budget.",
    icon: "layout",
  },
  {
    n: "03",
    title: "Engineering & Design",
    desc: "Airflow calculations and drawings confirm sizes, bracing and fixings before we start building.",
    icon: "compass",
  },
  {
    n: "04",
    title: "Manufacturing",
    desc: "Parts are made from the approved design with careful bending, welding and finishing.",
    icon: "gear",
  },
  {
    n: "05",
    title: "Installation",
    desc: "Our team sets up, aligns and levels the ducting on site to match the agreed layout.",
    icon: "wrench",
  },
  {
    n: "06",
    title: "Final Handover",
    desc: "We check every run, walk you through the finished installation and hand over the documents.",
    icon: "ruler",
  },
] as const;

function Icon({ name, className = "" }: { name: string; className?: string }) {
  const p = {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.7,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  const paths: Record<string, React.ReactNode> = {
    clipboard: (
      <>
        <rect x="6" y="4" width="12" height="17" rx="2" {...p} />
        <path d="M9 4V3h6v1M9 10h6M9 14h4" {...p} />
      </>
    ),
    layout: (
      <>
        <rect x="3" y="4" width="18" height="16" rx="2" {...p} />
        <path d="M3 9h18M9 9v11" {...p} />
      </>
    ),
    compass: (
      <>
        <circle cx="12" cy="12" r="9" {...p} />
        <path d="M15.5 8.5l-2 5-5 2 2-5z" {...p} />
      </>
    ),
    gear: (
      <>
        <circle cx="12" cy="12" r="3.2" {...p} />
        <path
          d="M12 2.6v2.2M12 19.2v2.2M21.4 12h-2.2M4.8 12H2.6M18.6 5.4l-1.6 1.6M7 17l-1.6 1.6M18.6 18.6L17 17M7 7L5.4 5.4"
          {...p}
        />
      </>
    ),
    wrench: (
      <>
        <path d="M15.2 6.3a4.2 4.2 0 0 0-5.6 5.6L4 17.5 6.5 20l5.6-5.6a4.2 4.2 0 0 0 5.6-5.6l-2.6 2.6-2.1-2.1z" {...p} />
      </>
    ),
    ruler: (
      <>
        <rect x="2.5" y="8.5" width="19" height="7" rx="1.6" {...p} />
        <path d="M6.5 8.5v2.6M10 8.5v3.4M13.5 8.5v2.6M17 8.5v3.4" {...p} />
      </>
    ),
  };
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      {paths[name]}
    </svg>
  );
}

export function PlanToInstallation() {
  return (
    <section
      aria-labelledby="plan-to-installation-heading"
      className="relative overflow-hidden bg-[#0a0c11] py-14 sm:py-16"
    >
      {/* Blueprint grid texture */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.35] eng-grid-dark"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-0 h-[320px] w-[720px] -translate-x-1/2 rounded-full bg-brand/10 blur-[120px]"
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <h2
            id="plan-to-installation-heading"
            className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl"
          >
            From Plan to Installation
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-slate-400 sm:text-base sm:leading-7">
            We take your ducting system from the first conversation to a
            finished, handed-over installation.
          </p>
        </div>

        {/* Timeline rail */}
        <div className="relative mt-12 sm:mt-14">
          {/* Dashed connector — only spans the medallion row on wide screens */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute left-[8%] right-[8%] top-7 hidden border-t border-dashed border-white/15 lg:block"
          />

          <ol className="grid grid-cols-1 gap-y-8 sm:grid-cols-2 sm:gap-x-8 lg:grid-cols-6 lg:gap-x-5">
            {STEPS.map((step) => (
              <li
                key={step.n}
                className="group relative flex flex-col items-center text-center"
              >
                <span className="relative z-10 flex h-14 w-14 items-center justify-center rounded-full border border-white/15 bg-[#12151c] text-slate-200 transition-colors duration-300 group-hover:border-brand/60 group-hover:text-brand">
                  <Icon name={step.icon} className="h-6 w-6" />
                </span>

                <span className="mt-3 text-[11px] font-semibold tracking-[0.18em] text-slate-500">
                  {step.n}
                </span>

                <h3 className="mt-2 text-sm font-bold leading-snug text-white sm:text-[15px]">
                  {step.title}
                </h3>

                <p className="mt-2 max-w-[220px] text-xs leading-relaxed text-slate-400 sm:text-[13px] sm:leading-6">
                  {step.desc}
                </p>
              </li>
            ))}
          </ol>
        </div>

        <p className="mt-12 text-center text-xs text-slate-500 sm:text-[13px]">
          Timelines are a guide and confirmed in your project proposal.
        </p>
      </div>
    </section>
  );
}
