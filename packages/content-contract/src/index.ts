import { z } from "zod";
export { previewSiteQuery, publishedSiteQuery } from "./queries.ts";

export const contentStatusSchema = z.enum([
  "demo",
  "pendingValidation",
  "approved",
]);
const text = (max: number) => z.string().trim().min(1).max(max);
export const httpsUrlSchema = z
  .string()
  .url()
  .refine((value) => new URL(value).protocol === "https:", "HTTPS required");
export const e164Schema = z
  .string()
  .regex(/^\+[1-9]\d{7,14}$/, "Use a confirmed E.164 number");
export const editorialSchema = z.object({
  contentStatus: contentStatusSchema,
  sourceRef: text(240),
  sourceObservedAt: z.string().datetime().optional(),
  approvedAt: z.string().datetime().optional(),
});
const editorial = editorialSchema.shape;
export const imageSchema = z.object({
  src: text(2048).refine(
    (value) =>
      (value.startsWith("/") &&
        !value.startsWith("//") &&
        !value.includes("\\")) ||
      httpsUrlSchema.safeParse(value).success,
    "Image source must be a local absolute path or HTTPS URL",
  ),
  alt: text(180),
  rightsConfirmed: z.boolean().default(false),
});
const timeSchema = z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/);
export const timeIntervalSchema = z
  .object({ opens: timeSchema, closes: timeSchema })
  .refine(
    (v) => v.opens < v.closes,
    "Closing time must follow opening time; split overnight hours",
  );
const scheduleShape = {
  closed: z.boolean(),
  intervals: z.array(timeIntervalSchema),
};
const validIntervals = (v: {
  closed: boolean;
  intervals: { opens: string; closes: string }[];
}) => {
  if (v.closed) return v.intervals.length === 0;
  const sorted = [...v.intervals].sort((a, b) =>
    a.opens.localeCompare(b.opens),
  );
  return (
    sorted.length > 0 &&
    sorted.every((entry, i) => i === 0 || sorted[i - 1]!.closes <= entry.opens)
  );
};
export const openingHoursSchema = z
  .object({ day: z.number().int().min(0).max(6), ...scheduleShape })
  .refine(
    validIntervals,
    "Hours must be non-overlapping; closed days have no intervals",
  );
export const specialHoursSchema = z
  .object({
    date: z.string().date(),
    note: text(200).optional(),
    ...scheduleShape,
  })
  .refine(validIntervals, "Invalid exceptional hours");
export const timezoneSchema = z.string().refine((value) => {
  try {
    new Intl.DateTimeFormat("en", { timeZone: value });
    return true;
  } catch {
    return false;
  }
}, "Use an IANA timezone");
export const businessSchema = z.object({
  ...editorial,
  displayName: text(80),
  legalName: text(120).optional(),
  tagline: text(120),
  description: text(800),
  businessLines: z.array(text(80)).min(1).max(6),
  logo: imageSchema.optional(),
  hero: z.object({
    eyebrow: text(80),
    title: text(160),
    text: text(500),
    image: imageSchema.optional(),
  }),
  address: z.object({
    line: text(160),
    city: text(80),
    region: text(80),
    country: z.string().length(2),
    postalCode: text(20).optional(),
  }),
  mapsUrl: httpsUrlSchema
    .refine(
      (value) =>
        ["maps.app.goo.gl", "maps.google.com", "www.google.com"].includes(
          new URL(value).hostname,
        ),
      "Unsupported map host",
    )
    .optional(),
  phones: z
    .array(z.object({ label: text(60), number: e164Schema, display: text(60) }))
    .default([]),
  socialLinks: z
    .array(
      z.object({
        network: text(40),
        url: httpsUrlSchema,
        visible: z.boolean(),
      }),
    )
    .default([]),
  timezone: timezoneSchema,
  openingHours: z
    .array(openingHoursSchema)
    .length(7)
    .refine(
      (hours) => new Set(hours.map((h) => h.day)).size === 7,
      "Each weekday appears once",
    ),
  specialHours: z
    .array(specialHoursSchema)
    .default([])
    .refine(
      (hours) => new Set(hours.map((h) => h.date)).size === hours.length,
      "Duplicate exceptional date",
    ),
  paymentMethods: z.array(text(60)).default([]),
  proofPoints: z
    .array(z.object({ title: text(80), detail: text(200) }))
    .max(3)
    .default([]),
});
export const whatsappIntentSchema = z.enum([
  "order",
  "reservation",
  "inquiry",
  "event",
]);
export const ctaPlacementSchema = z.enum([
  "hero",
  "navigation",
  "menu",
  "promotion",
  "floating",
  "footer",
]);
export const whatsappConversionSchema = z
  .object({
    ...editorial,
    enabled: z.boolean(),
    intent: whatsappIntentSchema,
    destinationE164: e164Schema.optional(),
    ctaLabel: text(60),
    prefilledMessage: text(500),
    placements: z
      .array(ctaPlacementSchema)
      .min(1)
      .max(6)
      .refine(
        (placements) => new Set(placements).size === placements.length,
        "CTA placements must be unique",
      ),
    fallbackLabel: text(120),
  })
  .refine((v) => !v.enabled || Boolean(v.destinationE164), {
    message: "Enabled CTA requires a confirmed E.164 destination",
    path: ["destinationE164"],
  });
export const priceOptionSchema = z.object({
  label: text(80),
  amount: z.number().finite().positive(),
  currency: z.string().regex(/^[A-Z]{3}$/),
  billingUnit: z.enum([
    "kg",
    "g",
    "unit",
    "portion",
    "package",
    "person",
    "event",
  ]),
  unitQuantity: z.number().positive(),
  netContent: z
    .object({
      quantity: z.number().positive(),
      unit: z.enum(["kg", "g", "ml", "l", "unit"]),
      count: z.number().int().positive().optional(),
    })
    .optional(),
});
export const menuCategorySchema = z.object({
  ...editorial,
  id: text(100),
  name: text(80),
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  description: text(240).optional(),
  groupLabel: text(80),
  sortOrder: z.number().int().min(0).max(9999),
  visible: z.boolean(),
});
export const menuItemSchema = z
  .object({
    ...editorial,
    id: text(100),
    name: text(120),
    slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    categoryId: text(100),
    description: text(400).optional(),
    pricingMode: z.enum(["fixed", "from", "onRequest"]),
    priceOptions: z.array(priceOptionSchema).max(1),
    image: imageSchema.optional(),
    badges: z.array(text(60)).max(3).default([]),
    featured: z.boolean(),
    availability: z.enum(["available", "outOfStock", "seasonal", "hidden"]),
    sortOrder: z.number().int().min(0).max(9999),
  })
  .refine(
    (v) =>
      v.pricingMode === "onRequest"
        ? v.priceOptions.length === 0
        : v.priceOptions.length === 1,
    "Fixed/from require one price; onRequest must have none",
  );
export const galleryImageSchema = z
  .object({
    ...editorial,
    id: text(100),
    image: imageSchema,
    caption: text(240).optional(),
    category: z.enum(["product", "space", "team", "event", "other"]),
    credit: text(160),
    sortOrder: z.number().int(),
    visible: z.boolean(),
  })
  .refine(
    (v) => v.contentStatus !== "approved" || v.image.rightsConfirmed,
    "Approved images require permission",
  );
export const promotionSchema = z
  .object({
    ...editorial,
    id: text(100),
    title: text(120),
    text: text(500),
    image: imageSchema.optional(),
    startsAt: z.string().datetime({ offset: true }),
    endsAt: z.string().datetime({ offset: true }),
    active: z.boolean(),
    campaignId: z.string().regex(/^[a-z0-9-]+$/),
    useWhatsappCta: z.boolean(),
  })
  .refine(
    (v) => Date.parse(v.endsAt) > Date.parse(v.startsAt),
    "End must follow start",
  );
export const faqSchema = z.object({
  ...editorial,
  id: text(100),
  question: text(200),
  answer: text(1000),
  sortOrder: z.number().int(),
  visible: z.boolean(),
});
export const testimonialSchema = z.object({
  ...editorial,
  id: text(100),
  author: text(80),
  text: text(800),
  source: text(160),
  sourceUrl: httpsUrlSchema.optional(),
  permissionNote: text(240),
  sortOrder: z.number().int(),
  visible: z.boolean(),
});
export const siteContentSchema = z
  .object({
    business: businessSchema,
    whatsappConversion: whatsappConversionSchema,
    menuCategories: z.array(menuCategorySchema),
    menuItems: z.array(menuItemSchema),
    galleryImages: z.array(galleryImageSchema),
    promotions: z.array(promotionSchema),
    faqs: z.array(faqSchema),
    testimonials: z.array(testimonialSchema),
  })
  .superRefine((v, ctx) => {
    const ids = new Set(v.menuCategories.map((c) => c.id));
    v.menuItems.forEach((item, index) => {
      if (!ids.has(item.categoryId))
        ctx.addIssue({
          code: "custom",
          path: ["menuItems", index, "categoryId"],
          message: "Missing category reference",
        });
    });
    for (const key of [
      "menuCategories",
      "menuItems",
      "galleryImages",
      "promotions",
      "faqs",
      "testimonials",
    ] as const) {
      if (new Set(v[key].map((item) => item.id)).size !== v[key].length)
        ctx.addIssue({
          code: "custom",
          path: [key],
          message: "Duplicate document ID",
        });
    }
  });
export type SiteContent = z.infer<typeof siteContentSchema>;
export type Business = z.infer<typeof businessSchema>;
export type MenuItem = z.infer<typeof menuItemSchema>;
export type MenuCategory = z.infer<typeof menuCategorySchema>;
export type WhatsAppConversion = z.infer<typeof whatsappConversionSchema>;
export type Promotion = z.infer<typeof promotionSchema>;
export type CtaPlacement = z.infer<typeof ctaPlacementSchema>;
export type WhatsAppIntent = z.infer<typeof whatsappIntentSchema>;
/** GROQ projects absent optional fields as null; normalize only object properties. */
export function parseSiteContent(input: unknown): SiteContent {
  const normalize = (value: unknown): unknown => {
    if (Array.isArray(value)) return value.map(normalize);
    if (value !== null && typeof value === "object")
      return Object.fromEntries(
        Object.entries(value)
          .filter(([, field]) => field !== null)
          .map(([key, field]) => [key, normalize(field)]),
      );
    return value;
  };
  return siteContentSchema.parse(normalize(input));
}
export function buildWhatsAppUrl(input: WhatsAppConversion): string | null {
  const result = whatsappConversionSchema.safeParse(input);
  if (!result.success || !result.data.enabled || !result.data.destinationE164)
    return null;
  return `https://wa.me/${result.data.destinationE164.slice(1)}?text=${encodeURIComponent(result.data.prefilledMessage)}`;
}
export function formatPrice(item: MenuItem, locale = "es-PE"): string {
  if (item.pricingMode === "onRequest") return "Consultar";
  const option = item.priceOptions[0];
  if (!option) return "Consultar";
  const money = new Intl.NumberFormat(locale, {
    style: "currency",
    currency: option.currency,
  }).format(option.amount);
  const unit = {
    kg: "kg",
    g: "g",
    unit: "unidad",
    portion: "porción",
    package: "pack",
    person: "persona",
    event: "evento",
  }[option.billingUnit];
  return `${item.pricingMode === "from" ? "Desde " : ""}${money} / ${option.unitQuantity === 1 ? "" : `${option.unitQuantity} `}${unit}`;
}
export function getHoursForDate(business: Business, instant: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: business.timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(instant);
  const part = (name: string) => parts.find((p) => p.type === name)!.value;
  const date = `${part("year")}-${part("month")}-${part("day")}`;
  return (
    business.specialHours.find((h) => h.date === date) ??
    business.openingHours.find(
      (h) => h.day === new Date(`${date}T12:00:00Z`).getUTCDay(),
    )!
  );
}
export function isPromotionActive(
  promotion: Promotion,
  now = new Date(),
): boolean {
  return (
    promotion.active &&
    now.getTime() >= Date.parse(promotion.startsAt) &&
    now.getTime() < Date.parse(promotion.endsAt)
  );
}
export function assertProductionContent(content: SiteContent): void {
  const parsed = siteContentSchema.parse(content);
  const documents = [
    parsed.business,
    parsed.whatsappConversion,
    ...parsed.menuCategories,
    ...parsed.menuItems,
    ...parsed.galleryImages,
    ...parsed.promotions,
    ...parsed.faqs,
    ...parsed.testimonials,
  ];
  if (documents.some((d) => d.contentStatus !== "approved" || !d.approvedAt))
    throw new Error(
      "Production requires approved content and approval timestamps",
    );
  const images = [
    parsed.business.logo,
    parsed.business.hero.image,
    ...parsed.menuItems.map((i) => i.image),
    ...parsed.galleryImages.map((i) => i.image),
    ...parsed.promotions.map((i) => i.image),
  ];
  if (images.some((image) => image && !image.rightsConfirmed))
    throw new Error("Production requires image permission");
}
