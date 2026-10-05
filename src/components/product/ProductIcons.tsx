import type { SVGProps } from "react";

const baseProps: SVGProps<SVGSVGElement> = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round",
  strokeLinejoin: "round",
};

export function ChevronLeftIcon({ className = "h-5 w-5", ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg {...baseProps} className={className} {...props}>
      <path d="m15 18-6-6 6-6" />
    </svg>
  );
}

export function ChevronRightIcon({ className = "h-5 w-5", ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg {...baseProps} className={className} {...props}>
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

export function ArrowRightIcon({ className = "h-4 w-4", ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg {...baseProps} className={className} {...props}>
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </svg>
  );
}

export function HeadsetIcon({ className = "h-4 w-4", ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg {...baseProps} className={className} {...props}>
      <path d="M3 14h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a9 9 0 0 1 18 0v7a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3" />
    </svg>
  );
}

export function ExpandIcon({ className = "h-4 w-4", ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg {...baseProps} className={className} {...props}>
      <path d="m15 15 6 6m0-6v6h-6M9 9 3 3m0 6V3h6m6 0h6v6M3 15v6h6" />
    </svg>
  );
}

export function CloseIcon({ className = "h-5 w-5", ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg {...baseProps} className={className} {...props}>
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}

export function PackageIcon({ className = "h-4 w-4", ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg {...baseProps} className={className} {...props}>
      <path d="M16.5 9.4 7.55 4.24a1.78 1.78 0 0 0-2.5 1.55v12.42a1.78 1.78 0 0 0 2.5 1.55l8.95-5.16a1.78 1.78 0 0 0 0-3.1Z" />
      <path d="m21 16-4-2.3" />
      <path d="m3.29 7 8.71 5 8.71-5" />
      <path d="M12 22V12" />
    </svg>
  );
}

export function LayersIcon({ className = "h-5 w-5", ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg {...baseProps} className={className} {...props}>
      <path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z" />
      <path d="m22 12.5-9.41 4.28a2 2 0 0 1-1.66 0L2 12.5" />
      <path d="m22 17.5-9.41 4.28a2 2 0 0 1-1.66 0L2 17.5" />
    </svg>
  );
}

export function ShieldCheckIcon({ className = "h-5 w-5", ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg {...baseProps} className={className} {...props}>
      <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

export function GaugeIcon({ className = "h-5 w-5", ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg {...baseProps} className={className} {...props}>
      <path d="m12 14 4-4" />
      <path d="M3.34 19a10 10 0 1 1 17.32 0" />
    </svg>
  );
}

export function RulerIcon({ className = "h-5 w-5", ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg {...baseProps} className={className} {...props}>
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
    </svg>
  );
}

export function WrenchIcon({ className = "h-5 w-5", ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg {...baseProps} className={className} {...props}>
      <path d="M14.7 6.3a4 4 0 0 1-5.4 5.4L4 17l3 3 5.3-5.3a4 4 0 0 1 5.4-5.4l-2.5 2.5-2-2 2.5-2.5Z" />
    </svg>
  );
}

export function WindIcon({ className = "h-5 w-5", ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg {...baseProps} className={className} {...props}>
      <path d="M17.7 7.7a2.5 2.5 0 1 1 1.8 4.3H2" />
      <path d="M9.6 4.6A2 2 0 1 1 11 8H2" />
      <path d="M12.6 19.4A2 2 0 1 0 14 16H2" />
    </svg>
  );
}

export function BoxIcon({ className = "h-5 w-5", ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg {...baseProps} className={className} {...props}>
      <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
      <path d="m3.3 7 8.7 5 8.7-5" />
      <path d="M12 22V12" />
    </svg>
  );
}

export function SparklesIcon({ className = "h-5 w-5", ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg {...baseProps} className={className} {...props}>
      <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z" />
    </svg>
  );
}

export function CheckCircleIcon({ className = "h-5 w-5", ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg {...baseProps} className={className} {...props}>
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <path d="m9 11 3 3L22 4" />
    </svg>
  );
}

export function DraftingCompassIcon({ className = "h-5 w-5", ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg {...baseProps} className={className} {...props}>
      <circle cx="12" cy="5" r="2" />
      <path d="m3.5 21 8-14" />
      <path d="m20.5 21-8-14" />
      <path d="M6 16.5a9 9 0 0 1 12 0" />
      <path d="M12 5v2" />
    </svg>
  );
}

export function PhoneIcon({ className = "h-4 w-4", ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg {...baseProps} className={className} {...props}>
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  );
}
