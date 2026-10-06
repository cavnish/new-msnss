import { z } from "zod";

export const specRowInput = z.object({ label: z.string().trim().min(1).max(120), value: z.string().trim().min(1).max(500) });
export const faqRowInput = z.object({ question: z.string().trim().min(2).max(255), answer: z.string().trim().min(2).max(3000) });

/** Image or video entry for the per-product "Fabrication & Project Installations" showcase. */
export const showcaseItemInput = z.object({
  type: z.enum(["image", "video"]).default("image"),
  url: z.string().trim().min(1).max(900),
  label: z.string().trim().max(160).optional().default(""),
});

export const productInput = z.object({
  name: z.string().trim().min(2).max(255),
  slug: z.string().optional(),
  category: z.string().trim().min(1).max(120),
  shortDescription: z.string().trim().min(3).max(1000),
  fullDescription: z.string().trim().min(3).max(10000),
  longDescription: z.string().trim().max(10000).optional().nullable().default(""),
  material: z.string().trim().max(1000).optional().nullable().default(""),
  imageUrl: z.string().trim().min(1),
  applications: z.array(z.string().max(255)).default([]),
  specifications: z.array(z.string().max(500)).default([]),
  features: z.array(z.string().max(255)).default([]),
  benefits: z.array(z.string().max(255)).default([]),
  technicalSpecifications: z.array(specRowInput).default([]),
  manufacturingProcess: z.array(z.string().max(255)).default([]),
  installationInformation: z.array(z.string().max(255)).default([]),
  maintenanceInformation: z.array(z.string().max(255)).default([]),
  industries: z.array(z.string().max(160)).default([]),
  // Hero/gallery slots. The public product page renders at most six, so the cap
  // is enforced on write instead of letting extra images pile up unedited.
  gallery: z
    .array(z.string().trim().min(1).max(600))
    .max(6, "A product can have up to 6 hero/gallery images.")
    .default([]),
  videoUrl: z.string().max(600).optional().nullable(),
  relatedProductIds: z.array(z.coerce.number().int().positive()).default([]),
  featured: z.boolean().default(false),
  seoTitle: z.string().trim().max(255).optional().nullable().default(""),
  seoDescription: z.string().trim().max(1000).optional().nullable().default(""),
  seoKeywords: z.string().trim().max(1000).optional().nullable().default(""),
  sortOrder: z.coerce.number().int().default(0),
  active: z.boolean().default(true),
  // Home-page card placement + per-product media showcase
  showOnHome: z.boolean().default(true),
  homeOrder: z.coerce.number().int().default(0),
  showcaseItems: z.array(showcaseItemInput).default([]),
});

export const serviceInput = z.object({
  name: z.string().trim().min(2).max(255),
  slug: z.string().optional(),
  icon: z.string().max(20).default(""),
  shortDescription: z.string().trim().min(3).max(1000),
  fullDescription: z.string().trim().min(3).max(10000),
  imageUrl: z.string().max(600).optional().nullable(),
  gallery: z.array(z.string().max(600)).default([]),
  videoUrl: z.string().max(600).optional().nullable(),
  highlights: z.array(z.string().max(255)).default([]),
  capabilities: z.array(z.string().max(255)).default([]),
  benefits: z.array(z.string().max(255)).default([]),
  process: z.array(z.string().max(255)).default([]),
  equipment: z.array(z.string().max(255)).default([]),
  applications: z.array(z.string().max(255)).default([]),
  faqs: z.array(faqRowInput).default([]),
  featured: z.boolean().default(false),
  seoTitle: z.string().trim().max(255).optional().nullable().default(""),
  seoDescription: z.string().trim().max(1000).optional().nullable().default(""),
  seoKeywords: z.string().trim().max(1000).optional().nullable().default(""),
  sortOrder: z.coerce.number().int().default(0),
  active: z.boolean().default(true),
  // Home-page card placement
  showOnHome: z.boolean().default(true),
  homeOrder: z.coerce.number().int().default(0),
});

export const heroInput = z.object({title:z.string().trim().min(2).max(500),subtitle:z.string().trim().min(3).max(1500),supportingLine:z.string().max(1000).optional().nullable(),imageUrl:z.string().trim().min(1),videoUrl:z.string().max(600).optional().nullable(),primaryCtaLabel:z.string().max(120).optional().nullable(),primaryCtaLink:z.string().max(255).optional().nullable(),secondaryCtaLabel:z.string().max(120).optional().nullable(),secondaryCtaLink:z.string().max(255).optional().nullable(),sortOrder:z.coerce.number().int().default(0),active:z.boolean().default(true)});
export const catalogueInput=z.object({title:z.string().trim().min(2).max(255),description:z.string().max(5000).optional().nullable(),fileUrl:z.string().trim().min(1),fileName:z.string().trim().min(1).max(255),active:z.boolean().default(false)});
export const projectImageInput=z.object({projectId:z.coerce.number().int().positive().optional(),imageUrl:z.string().trim().min(1),title:z.string().max(255).optional().nullable(),altText:z.string().trim().min(2).max(500),description:z.string().max(3000).optional().nullable(),sortOrder:z.coerce.number().int().default(0)});

export const mediaAssetInput = z.object({
  publicId: z.string().trim().min(2).max(512).optional(),
  secureUrl: z.string().trim().min(1),
  resourceType: z.string().trim().max(40).optional().default("image"),
  format: z.string().trim().max(16).optional().default(""),
  width: z.coerce.number().int().positive().optional().nullable(),
  height: z.coerce.number().int().positive().optional().nullable(),
  bytes: z.coerce.number().int().positive().optional().nullable(),
  folder: z.string().trim().max(255).optional().default("msnss/uploads"),
  altText: z.string().trim().max(500).optional().default(""),
  caption: z.string().trim().max(2000).optional().default(""),
  fileName: z.string().trim().max(255).optional().nullable(),
  sortOrder: z.coerce.number().int().default(0),
});

export const mediaAssetPatchInput = z.object({
  altText: z.string().trim().max(500).optional(),
  caption: z.string().trim().max(2000).optional(),
  folder: z.string().trim().max(255).optional(),
  fileName: z.string().trim().max(255).optional().nullable(),
  sortOrder: z.coerce.number().int().optional(),
});