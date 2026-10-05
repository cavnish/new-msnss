import { pgTable, serial, text, varchar, timestamp, integer, boolean, jsonb, index } from "drizzle-orm/pg-core";

export type SpecRow = { label: string; value: string };
/** One application block: a heading plus its explanatory paragraph. */
export type AppDetail = { title: string; description: string };
export type FaqRow = { question: string; answer: string };
/** A gallery entry that is either a still image or a video clip. */
export type ShowcaseItem = {
  type: "image" | "video";
  url: string;
  label?: string;
};

export const adminUsers = pgTable("admin_users", {
  id: serial("id").primaryKey(), email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(), name: varchar("name", { length: 255 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const heroSlides = pgTable("hero_slides", {
  id: serial("id").primaryKey(), title: text("title").notNull(), subtitle: text("subtitle").notNull(),
  supportingLine: text("supporting_line"), imageUrl: text("image_url").notNull(), videoUrl: text("video_url"),
  primaryCtaLabel: varchar("primary_cta_label", { length: 120 }), primaryCtaLink: varchar("primary_cta_link", { length: 255 }),
  secondaryCtaLabel: varchar("secondary_cta_label", { length: 120 }), secondaryCtaLink: varchar("secondary_cta_link", { length: 255 }),
  sortOrder: integer("sort_order").default(0).notNull(), active: boolean("active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const products = pgTable(
  "products",
  {
    id: serial("id").primaryKey(), slug: varchar("slug", { length: 255 }).notNull().unique(), name: varchar("name", { length: 255 }).notNull(),
    category: varchar("category", { length: 120 }).notNull(), shortDescription: text("short_description").notNull(),
    fullDescription: text("full_description").notNull(), imageUrl: text("image_url").notNull(),
    applications: jsonb("applications").$type<string[]>().default([]).notNull(), specifications: jsonb("specifications").$type<string[]>().default([]).notNull(),
    features: jsonb("features").$type<string[]>().default([]).notNull(), sortOrder: integer("sort_order").default(0).notNull(),
    gallery: jsonb("gallery").$type<string[]>().default([]).notNull(), videoUrl: text("video_url"),
    active: boolean("active").default(true).notNull(), createdAt: timestamp("created_at").defaultNow().notNull(),
    // Phase 8 extended product profile (additive columns — see drizzle migration)
    longDescription: text("long_description").default("").notNull(),
    material: text("material").default("").notNull(),
    benefits: jsonb("benefits").$type<string[]>().default([]).notNull(),
    technicalSpecifications: jsonb("technical_specifications").$type<SpecRow[]>().default([]).notNull(),
    manufacturingProcess: jsonb("manufacturing_process").$type<string[]>().default([]).notNull(),
    installationInformation: jsonb("installation_information").$type<string[]>().default([]).notNull(),
    maintenanceInformation: jsonb("maintenance_information").$type<string[]>().default([]).notNull(),
    industries: jsonb("industries").$type<string[]>().default([]).notNull(),
    featured: boolean("featured").default(false).notNull(),
    relatedProductIds: jsonb("related_product_ids").$type<number[]>().default([]).notNull(),
    seoTitle: text("seo_title").default("").notNull(),
    seoDescription: text("seo_description").default("").notNull(),
    seoKeywords: text("seo_keywords").default("").notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
    // Home-page card placement — which products appear in the home grid and in what order.
    showOnHome: boolean("show_on_home").default(true).notNull(),
    homeOrder: integer("home_order").default(0).notNull(),
    // "Fabrication & Project Installations" — per-product image/video showcase.
    showcaseItems: jsonb("showcase_items").$type<ShowcaseItem[]>().default([]).notNull(),

    // ── Long-form product content ─────────────────────────────────────────
    // Every product is written to the same editorial depth: an H1, an intro,
    // a manufacturing narrative, structured applications, a design/fabrication
    // section, a supply section and a set of FAQs.
    h1: text("h1").default("").notNull(),
    primaryKeyword: text("primary_keyword").default("").notNull(),
    secondaryKeywords: jsonb("secondary_keywords").$type<string[]>().default([]).notNull(),
    seoTags: jsonb("seo_tags").$type<string[]>().default([]).notNull(),
    faqs: jsonb("faqs").$type<FaqRow[]>().default([]).notNull(),
    applicationDetails: jsonb("application_details").$type<AppDetail[]>().default([]).notNull(),
    manufacturingNarrative: text("manufacturing_narrative").default("").notNull(),
    designFabrication: text("design_fabrication").default("").notNull(),
    supplyAcrossIndia: text("supply_across_india").default("").notNull(),
  },
  (table) => [index("products_category_idx").on(table.category), index("products_featured_idx").on(table.featured, table.active)]
);

export const clients = pgTable("clients", {
  id: serial("id").primaryKey(), slug: varchar("slug", { length: 255 }).notNull().unique(), name: varchar("name", { length: 255 }).notNull(),
  logoUrl: text("logo_url").notNull(), logoAlt: text("logo_alt"), websiteUrl: text("website_url"),
  industry: varchar("industry", { length: 160 }), location: varchar("location", { length: 255 }),
  row: integer("row").default(1).notNull(), workSummary: text("work_summary").notNull(),
  description: text("description"), servicesProvided: jsonb("services_provided").$type<string[]>().default([]).notNull(),
  projectDetails: text("project_details").notNull(), sortOrder: integer("sort_order").default(0).notNull(),
  featured: boolean("featured").default(false).notNull(), active: boolean("active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(), updatedAt: timestamp("updated_at").defaultNow().notNull(),
  // Logo strip placement — controls the home-page client logo row.
  showInLogoRow: boolean("show_in_logo_row").default(true).notNull(),
  logoRowOrder: integer("logo_row_order").default(0).notNull(),
});

export const projects = pgTable("projects", {
  id: serial("id").primaryKey(), clientId: integer("client_id").references(() => clients.id, { onDelete: "set null" }),
  slug: varchar("slug", { length: 255 }).notNull().unique(), name: varchar("name", { length: 255 }).notNull(),
  location: varchar("location", { length: 255 }).notNull(), region: varchar("region", { length: 80 }),
  category: varchar("category", { length: 120 }).notNull(), industry: varchar("industry", { length: 160 }),
  year: integer("year"), status: varchar("status", { length: 40 }).notNull(),
  shortDescription: text("short_description"), scopeOfWork: text("scope_of_work").notNull(), description: text("description").notNull(),
  imageUrl: text("image_url").notNull(), videoUrl: text("video_url"), servicesUsed: jsonb("services_used").$type<string[]>().default([]).notNull(),
  sortOrder: integer("sort_order").default(0).notNull(), featured: boolean("featured").default(false).notNull(),
  active: boolean("active").default(true).notNull(), createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  // Home-page card placement — which projects appear in "Projects That Speak for Our Work".
  showOnHome: boolean("show_on_home").default(true).notNull(),
  homeOrder: integer("home_order").default(0).notNull(),
});

export const projectImages = pgTable("project_images", {
  id: serial("id").primaryKey(), projectId: integer("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  imageUrl: text("image_url").notNull(), title: varchar("title", { length: 255 }), altText: text("alt_text").notNull(),
  description: text("description"), sortOrder: integer("sort_order").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const services = pgTable(
  "services",
  {
    id: serial("id").primaryKey(), slug: varchar("slug", { length: 255 }).notNull().unique(), name: varchar("name", { length: 255 }).notNull(),
    icon: varchar("icon", { length: 20 }).default("").notNull(), shortDescription: text("short_description").notNull(),
    fullDescription: text("full_description").notNull(), sortOrder: integer("sort_order").default(0).notNull(),
    imageUrl: text("image_url"), gallery: jsonb("gallery").$type<string[]>().default([]).notNull(),
    videoUrl: text("video_url"), highlights: jsonb("highlights").$type<string[]>().default([]).notNull(),
    active: boolean("active").default(true).notNull(), createdAt: timestamp("created_at").defaultNow().notNull(),
    // Phase 10 extended service profile (additive columns)
    capabilities: jsonb("capabilities").$type<string[]>().default([]).notNull(),
    benefits: jsonb("benefits").$type<string[]>().default([]).notNull(),
    process: jsonb("process").$type<string[]>().default([]).notNull(),
    equipment: jsonb("equipment").$type<string[]>().default([]).notNull(),
    applications: jsonb("applications").$type<string[]>().default([]).notNull(),
    faqs: jsonb("faqs").$type<FaqRow[]>().default([]).notNull(),
    featured: boolean("featured").default(false).notNull(),
    seoTitle: text("seo_title").default("").notNull(),
    seoDescription: text("seo_description").default("").notNull(),
    seoKeywords: text("seo_keywords").default("").notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
    // Home-page card placement — which solutions appear in the home grid and in what order.
    showOnHome: boolean("show_on_home").default(true).notNull(),
    homeOrder: integer("home_order").default(0).notNull(),
  },
  (table) => [index("services_slug_active_idx").on(table.slug, table.active)]
);

export const inquiries = pgTable("inquiries", {
  id: serial("id").primaryKey(), name: varchar("name", { length: 255 }).notNull(), email: varchar("email", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 60 }).notNull(), company: varchar("company", { length: 255 }), city: varchar("city", { length: 160 }),
  subject: varchar("subject", { length: 255 }), productInterest: varchar("product_interest", { length: 255 }),
  solutionInterest: varchar("solution_interest", { length: 255 }), projectType: varchar("project_type", { length: 160 }),
  projectLocation: varchar("project_location", { length: 255 }), quantity: varchar("quantity", { length: 160 }), message: text("message").notNull(),
  consent: boolean("consent").default(false).notNull(), status: varchar("status", { length: 40 }).default("new").notNull(),
  priority: varchar("priority", { length: 20 }).default("normal").notNull(), assignedTo: varchar("assigned_to", { length: 255 }),
  internalNotes: text("internal_notes"), source: varchar("source", { length: 80 }).default("website").notNull(),
  archived: boolean("archived").default(false).notNull(), createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const inquiryNotes = pgTable("inquiry_notes", {
  id: serial("id").primaryKey(), inquiryId: integer("inquiry_id").notNull().references(() => inquiries.id, { onDelete: "cascade" }),
  note: text("note").notNull(), createdBy: integer("created_by").references(() => adminUsers.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const catalogues = pgTable("catalogues", {
  id: serial("id").primaryKey(), title: varchar("title", { length: 255 }).notNull(), description: text("description"),
  fileUrl: text("file_url").notNull(), fileName: varchar("file_name", { length: 255 }).notNull(),
  active: boolean("active").default(false).notNull(), downloadCount: integer("download_count").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(), updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const catalogueLeads = pgTable("catalogue_leads", {
  id: serial("id").primaryKey(), catalogueId: integer("catalogue_id").references(() => catalogues.id, { onDelete: "set null" }),
  name: varchar("name", { length: 255 }).notNull(), company: varchar("company", { length: 255 }),
  email: varchar("email", { length: 255 }).notNull(), phone: varchar("phone", { length: 60 }).notNull(),
  source: varchar("source", { length: 80 }).default("catalogue").notNull(), createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const testimonials = pgTable("testimonials", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  role: varchar("role", { length: 160 }),
  company: varchar("company", { length: 255 }),
  content: text("content").notNull(),
  rating: integer("rating").default(5).notNull(),
  accentColor: varchar("accent_color", { length: 20 }).default("#0e7cc4").notNull(),
  timeAgo: varchar("time_ago", { length: 80 }),
  verified: boolean("verified").default(true).notNull(),
  sortOrder: integer("sort_order").default(0).notNull(),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const siteSettings = pgTable("site_settings", { key: varchar("key", { length: 120 }).primaryKey(), value: text("value").notNull() });

/**
 * Cloudinary media library — central database metadata for every image
 * managed through the admin media manager. Large binaries are NEVER stored
 * here; only Cloudinary delivery metadata.
 */
export const mediaAssets = pgTable(
  "media_assets",
  {
    id: serial("id").primaryKey(),
    publicId: varchar("public_id", { length: 512 }).notNull().unique(),
    secureUrl: text("secure_url").notNull(),
    resourceType: varchar("resource_type", { length: 40 }).default("image").notNull(),
    format: varchar("format", { length: 16 }).default("").notNull(),
    width: integer("width"),
    height: integer("height"),
    bytes: integer("bytes"),
    folder: varchar("folder", { length: 255 }).default("msnss/uploads").notNull(),
    altText: text("alt_text").default("").notNull(),
    caption: text("caption").default("").notNull(),
    fileName: varchar("file_name", { length: 255 }),
    sortOrder: integer("sort_order").default(0).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [index("media_assets_folder_idx").on(table.folder), index("media_assets_sort_idx").on(table.sortOrder)]
);

/**
 * Admin-managed imagery for the fixed marketing sections that have no other
 * CMS surface: the "Why Industry Leaders Choose MSNSS" tiles/map and the
 * "Ducting Solutions Across Critical Applications" grid.
 *
 * `sectionKey` values: "why-choose", "applications".
 */
export const sectionMedia = pgTable(
  "section_media",
  {
    id: serial("id").primaryKey(),
    sectionKey: varchar("section_key", { length: 60 }).notNull(),
    title: varchar("title", { length: 255 }).default("").notNull(),
    imageUrl: text("image_url").notNull(),
    altText: text("alt_text").default("").notNull(),
    caption: text("caption").default("").notNull(),
    sortOrder: integer("sort_order").default(0).notNull(),
    active: boolean("active").default(true).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [index("section_media_key_idx").on(table.sectionKey, table.active, table.sortOrder)]
);

export type MediaAsset = typeof mediaAssets.$inferSelect;
export type SectionMedia = typeof sectionMedia.$inferSelect;

export type Product = typeof products.$inferSelect;
export type Project = typeof projects.$inferSelect;
export type ProjectImage = typeof projectImages.$inferSelect;
export type Client = typeof clients.$inferSelect;
export type Service = typeof services.$inferSelect;
export type HeroSlide = typeof heroSlides.$inferSelect;
export type Inquiry = typeof inquiries.$inferSelect;
export type InquiryNote = typeof inquiryNotes.$inferSelect;
export type Catalogue = typeof catalogues.$inferSelect;
export type CatalogueLead = typeof catalogueLeads.$inferSelect;
export type Testimonial = typeof testimonials.$inferSelect;
export type AdminUser = typeof adminUsers.$inferSelect;
