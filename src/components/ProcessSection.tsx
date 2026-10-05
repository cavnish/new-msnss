/**
 * Our Process — compact shared step strip.
 *
 * Six short title + description pairs in a single dense row on desktop,
 * wrapping to a tight single column on mobile. No step numbers, no eyebrow
 * label, no oversized decoration.
 */

export const PROCESS_STEPS: [string, string][] = [
  ["Understand", "Drawings, specs and application needs."],
  ["Plan", "Production planning and material coordination."],
  ["Manufacture", "Precision cutting, forming and joining."],
  ["Inspect", "Dimensional and visual quality checks."],
  ["Finish", "Painting, coating and insulation."],
  ["Deliver & Install", "Safe dispatch and site installation."],
];

export function ProcessSection({
  title = "How We Execute Your Ducting Requirement",
}: {
  title?: string;
}) {
  return (
    <section className="bg-white py-10 sm:py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h2 className="text-center text-xl font-extrabold tracking-tight text-ink sm:text-2xl">
          {title}
        </h2>

        <div className="stagger mt-7 grid grid-cols-1 gap-x-5 gap-y-4 sm:grid-cols-2 lg:grid-cols-6">
          {PROCESS_STEPS.map(([t, d]) => (
            <div
              key={t}
              className="rounded-lg border border-slate-200 bg-slate-50/70 px-4 py-3.5 transition hover:border-brand/30 hover:bg-white"
            >
              <h3 className="text-[13px] font-bold leading-snug text-ink">
                {t}
              </h3>
              <p className="mt-1 text-xs leading-relaxed text-slate-500">{d}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
