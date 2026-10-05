export function Logo({
  className = "",
  light = false,
}: {
  className?: string;
  light?: boolean;
}) {
  const gray = light ? "#e2e8f0" : "#9aa3ad";
  return (
    <div className={`flex items-center gap-2 sm:gap-2.5 ${className}`}>
      {/* Circular gasket / flange icon */}
      <svg
        viewBox="0 0 64 64"
        className="h-9 w-9 flex-shrink-0 sm:h-10 sm:w-10"
        aria-hidden="true"
      >
        <circle cx="32" cy="32" r="30" fill="none" stroke="#0e7cc4" strokeWidth="5" />
        <circle cx="32" cy="32" r="17" fill="none" stroke="#0e7cc4" strokeWidth="4" />
        <rect x="24" y="24" width="16" height="16" rx="2" fill="none" stroke="#0e7cc4" strokeWidth="3" />
        {[...Array(8)].map((_, i) => {
          const a = (i / 8) * Math.PI * 2;
          const x = 32 + Math.cos(a) * 24;
          const y = 32 + Math.sin(a) * 24;
          return <circle key={i} cx={x} cy={y} r="2.6" fill="#0e7cc4" />;
        })}
      </svg>
      <div className="min-w-0 leading-none">
        <div className="flex items-center text-xl font-extrabold tracking-tight sm:text-2xl">
          <span style={{ color: gray }}>MS</span>
          <span className="text-brand">N</span>
          <span style={{ color: gray }}>SS</span>
        </div>
        {/* The tagline is the widest part of the lockup, so it steps down on
            narrow screens — this is what keeps the header row (logo + menu
            button) from colliding at 320px. */}
        <div className="mt-0.5 whitespace-nowrap text-[7px] font-semibold tracking-[0.1em] text-brand sm:text-[8px] sm:tracking-[0.12em]">
          DUCTING / FABRICATION / INSTALLATION
        </div>
      </div>
    </div>
  );
}
