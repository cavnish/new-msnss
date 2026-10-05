import type { AppDetail, FaqRow, SpecRow } from "@/db/schema";

/**
 * Long-form product content in the MSNSS editorial format.
 *
 * Every product follows the same structure so the range reads as one coherent
 * set rather than a mix of thin and rich pages:
 *
 *   H1 → intro → manufacturing narrative → technical specifications table
 *   → key features → applications (heading + paragraph) → design & fabrication
 *   → supply across India → why choose → FAQs → closing CTA
 *
 * Technical claims are kept deliberately conservative: where a specification
 * genuinely varies by project we say so rather than inventing a number.
 */
export interface ProductContent {
  slug: string;
  name: string;
  h1: string;
  category: string;
  primaryKeyword: string;
  secondaryKeywords: string[];
  seoTags: string[];
  seoTitle: string;
  seoDescription: string;
  seoKeywords: string;
  /** Introductory paragraphs (rendered as the page lede). */
  shortDescription: string;
  /** "Precision … Manufacturing" narrative. */
  manufacturingNarrative: string;
  material: string;
  technicalSpecifications: SpecRow[];
  features: string[];
  benefits: string[];
  applicationDetails: AppDetail[];
  designFabrication: string;
  supplyAcrossIndia: string;
  faqs: FaqRow[];
  manufacturingProcess: string[];
  installationInformation: string[];
  maintenanceInformation: string[];
  industries: string[];
}
