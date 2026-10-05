"use client";

import type { ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import type { Product } from "@/db/schema";
import {
  BoxIcon,
  CheckCircleIcon,
  GaugeIcon,
  LayersIcon,
  RulerIcon,
  ShieldCheckIcon,
  SparklesIcon,
  WindIcon,
  WrenchIcon,
} from "./ProductIcons";

interface ProductKeyFeaturesProps {
  product: Product;
}

interface FeatureItem {
  icon: ReactNode;
  title: string;
  description: string;
}

// Rich dictionary mapping known feature names to tailored engineering descriptions
const FEATURE_DESCRIPTIONS: Record<string, { title: string; desc: string }> = {
  "high strength": {
    title: "High Structural Rigidity",
    desc: "Reinforced lock seams and optimized gauge thickness withstand high static pressure without deflection or vibration.",
  },
  "air-tight joints": {
    title: "Air-Tight Flange Joints",
    desc: "Precision formed seams and flange interfaces engineered to comply with SMACNA Class A/B low-leakage standards.",
  },
  "made to drawing": {
    title: "Fabricated to Drawing",
    desc: "Custom section lengths, transitions, and offsets manufactured strictly per consultant-approved MEP shop drawings.",
  },
  "long-lasting": {
    title: "Long-Life Construction",
    desc: "Premium grade metallurgical finish ensures long-term operational integrity with minimal maintenance requirements.",
  },
  "rust-free": {
    title: "Corrosion-Proof Finish",
    desc: "High-grade SS 304 or SS 316 construction offering exceptional resistance against chemicals, moisture, and rust.",
  },
  "hygienic finish": {
    title: "Hygienic Cleanroom Surface",
    desc: "Crevice-free smooth interior surfaces that prevent dust and microbial accumulation in sensitive healthcare zones.",
  },
  "easy to clean": {
    title: "Sanitary Maintenance Profile",
    desc: "Non-porous stainless steel surface allows thorough washdowns and chemical sanitation without surface degradation.",
  },
  "durable": {
    title: "Extended Service Longevity",
    desc: "Engineered for decades of continuous operational reliability under industrial thermal, moisture, and acoustic stress.",
  },
  "smooth air flow": {
    title: "Optimized Airflow Dynamics",
    desc: "Continuous low-friction internal profile reduces static pressure drop, lowering fan energy load and system noise.",
  },
  "low leakage": {
    title: "Certified Low CFM Leakage",
    desc: "Factory-tested joints prevent air distribution losses, ensuring balanced CFM delivery to all conditioned zones.",
  },
  "grease-safe": {
    title: "Liquid-Tight Grease Containment",
    desc: "Continuous liquid-tight welded construction engineered for commercial kitchen hoods and high-temperature grease exhaust.",
  },
  "fire protection": {
    title: "Certified Fire Protection",
    desc: "Specialized fire-retardant barrier coating designed to maintain structural integrity and smoke exhaust during emergencies.",
  },
  "heat resistant": {
    title: "Thermal & Heat Resistance",
    desc: "Designed to endure extreme elevated temperatures without compromising mechanical rigidity or seam sealing.",
  },
  "safety rated": {
    title: "Certified Safety Compliance",
    desc: "Meets statutory building codes and life-safety exhaust criteria for high-occupancy commercial and industrial premises.",
  },
  "reliable": {
    title: "Mission-Critical Reliability",
    desc: "Proven performance track record in life-safety pressurization and emergency smoke management installations.",
  },
  "precise control": {
    title: "Calibrated Volume Control",
    desc: "Aerodynamically balanced blades engineered for accurate CFM zoning, manual locking, or motorized actuator pairing.",
  },
  "air-tight seal": {
    title: "Hermetic Gasket Seal",
    desc: "Heavy-duty EPDM/neoprene perimeter gasketing and cam latches ensure tight seal during high-velocity system operation.",
  },
};

// Curated library of industrial HVAC engineering features
const DEFAULT_HVAC_FEATURES: FeatureItem[] = [
  {
    icon: <ShieldCheckIcon className="h-5 w-5" />,
    title: "High Structural Rigidity",
    description:
      "Formed from heavy-gauge sheet metal engineered to withstand high static pressure without deflection or vibration.",
  },
  {
    icon: <GaugeIcon className="h-5 w-5" />,
    title: "Precision Flange & Joints",
    description:
      "Available with TDF, slip-on, or angle-iron flanges providing tight seals to virtually eliminate leakage and energy loss.",
  },
  {
    icon: <RulerIcon className="h-5 w-5" />,
    title: "Fabricated to Approved Drawings",
    description:
      "Custom section lengths, offsets, and tapers fabricated strictly per HVAC consultants' approved shop drawings.",
  },
  {
    icon: <WindIcon className="h-5 w-5" />,
    title: "Optimized Airflow Dynamics",
    description:
      "Smooth internal surfaces and aerodynamic turn vanes minimize frictional resistance and reduce fan operating load.",
  },
  {
    icon: <WrenchIcon className="h-5 w-5" />,
    title: "Rapid On-Site Assembly",
    description:
      "Pre-drilled and standardized connection profiles ensure smooth alignment and fast erection on site.",
  },
  {
    icon: <SparklesIcon className="h-5 w-5" />,
    title: "Corrosion-Resistant Finish",
    description:
      "Engineered with premium galvanized, stainless steel, or protective coatings for dependable lifespan in demanding environments.",
  },
];

export function ProductKeyFeatures({ product }: ProductKeyFeaturesProps) {
  const reduce = useReducedMotion();

  // Combine product-specific features with standard industrial qualities
  const featureList: FeatureItem[] = [];

  const rawFeatures = Array.isArray(product.features) ? product.features : [];
  const rawBenefits = Array.isArray(product.benefits) ? product.benefits : [];
  const combined = [...rawFeatures, ...rawBenefits].filter(Boolean);

  const iconsPool = [
    <ShieldCheckIcon key="1" className="h-5 w-5" />,
    <GaugeIcon key="2" className="h-5 w-5" />,
    <LayersIcon key="3" className="h-5 w-5" />,
    <WindIcon key="4" className="h-5 w-5" />,
    <WrenchIcon key="5" className="h-5 w-5" />,
    <BoxIcon key="6" className="h-5 w-5" />,
    <CheckCircleIcon key="7" className="h-5 w-5" />,
    <SparklesIcon key="8" className="h-5 w-5" />,
  ];

  if (combined.length > 0) {
    combined.forEach((item, idx) => {
      if (featureList.length >= 6) return;
      // If item contains a colon or is a sentence, parse title/description
      const parts = item.split(":");
      if (parts.length > 1) {
        featureList.push({
          icon: iconsPool[idx % iconsPool.length],
          title: parts[0].trim(),
          description: parts.slice(1).join(":").trim(),
        });
      } else {
        const key = item.toLowerCase().trim();
        const mapped = FEATURE_DESCRIPTIONS[key];
        if (mapped) {
          featureList.push({
            icon: iconsPool[idx % iconsPool.length],
            title: mapped.title,
            description: mapped.desc,
          });
        } else {
          // Find matching default description or generate a clean engineering description
          const match = DEFAULT_HVAC_FEATURES.find(
            (d) => d.title.toLowerCase().includes(key) || key.includes(d.title.toLowerCase())
          );
          featureList.push({
            icon: iconsPool[idx % iconsPool.length],
            title: item,
            description:
              match?.description ||
              `Engineered according to SMACNA and IS standards for durable and efficient ${product.name.toLowerCase()} performance.`,
          });
        }
      }
    });
  }

  // Backfill up to 6 cards from default library if needed
  DEFAULT_HVAC_FEATURES.forEach((fallback) => {
    if (featureList.length < 6 && !featureList.some((f) => f.title.toLowerCase() === fallback.title.toLowerCase())) {
      featureList.push(fallback);
    }
  });

  const cards = featureList.slice(0, 6);

  return (
    <section className="cv-auto bg-slate-50/70 border-y border-slate-200/70 py-16 sm:py-20 lg:py-24">
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8">
        {/* Stacked header — one focused message, no split header. */}
        <div className="max-w-[62ch]">
          <h2 className="text-[26px] font-extrabold leading-[1.15] tracking-[-0.022em] text-ink sm:text-3xl lg:text-[34px]">
            Key Features
          </h2>
          <p className="mt-3 text-[15px] leading-7 text-slate-600 sm:text-base">
            What {product.name} is engineered to do on site.
          </p>
        </div>

        {/* 3-Column Responsive Grid matching reference */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-6">
          {cards.map((item, idx) => (
            <motion.div
              key={item.title + idx}
              initial={reduce ? { opacity: 0 } : { opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.15 }}
              transition={{
                duration: 0.4,
                delay: reduce ? 0 : idx * 0.06,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="flex items-start gap-4 rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-sm transition-all hover:border-brand/40 hover:shadow-md"
            >
              {/* Minimal Icon in soft rounded container matching reference */}
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-light/80 text-brand border border-brand/15">
                {item.icon}
              </div>

              {/* Title & Short Description */}
              <div className="flex flex-col">
                <h3 className="text-base font-bold text-ink leading-snug">
                  {item.title}
                </h3>
                <p className="mt-1.5 text-xs sm:text-sm leading-relaxed text-slate-600">
                  {item.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
