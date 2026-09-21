import {
  buildWhatsAppUrl,
  formatPrice,
  isPromotionActive,
  siteContentSchema,
  type SiteContent,
} from "@pato-food/content-contract";
import type { LandingContent } from "@pato-food/ui";

export interface SiteConfiguration {
  siteKey: string;
  locale: string;
  internalOnly: boolean;
  publishBlocked: boolean;
  /** Required before a public release. Never infer it from request headers. */
  publicUrl?: string;
  /** Keep the default generic until the client's business type is approved. */
  schemaType?: "FoodEstablishment" | "Restaurant";
  theme: { primary: string };
}
const days = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
];
export function adaptContent(
  input: SiteContent,
  config: SiteConfiguration,
  now = new Date(),
): LandingContent {
  const content = siteContentSchema.parse(input);
  const business = content.business;
  const categories = content.menuCategories
    .filter((c) => c.visible)
    .sort((a, b) => a.sortOrder - b.sortOrder);
  const categoryIds = new Set(categories.map((c) => c.id));
  return {
    siteKey: config.siteKey,
    demo: config.internalOnly || config.publishBlocked,
    name: business.displayName,
    tagline: business.tagline,
    description: business.description,
    hero: business.hero,
    lines: business.businessLines,
    categories: categories.map((c) => ({
      id: c.id,
      name: c.name,
      description: c.description,
      group: c.groupLabel,
    })),
    items: content.menuItems
      .filter(
        (item) =>
          item.availability !== "hidden" && categoryIds.has(item.categoryId),
      )
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((item) => {
        const net = item.priceOptions[0]?.netContent;
        const presentation = net
          ? `${net.count ? `${net.count} × ` : ""}${net.quantity} ${net.unit}`
          : undefined;
        return {
          id: item.id,
          name: item.name,
          description: [item.description, presentation]
            .filter(Boolean)
            .join(" · "),
          price: formatPrice(item, config.locale),
          categoryId: item.categoryId,
          featured: item.featured,
          unavailable: item.availability === "outOfStock",
          image: item.image,
        };
      }),
    gallery: content.galleryImages
      .filter((g) => g.visible)
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((g) => ({ ...g.image, caption: g.caption })),
    promotions: content.promotions
      .filter((promotion) => isPromotionActive(promotion, now))
      .sort((a, b) => Date.parse(a.startsAt) - Date.parse(b.startsAt))
      .map((promotion) => ({
        id: promotion.id,
        title: promotion.title,
        text: promotion.text,
        image: promotion.image,
        campaignId: promotion.campaignId,
        useWhatsappCta: promotion.useWhatsappCta,
      })),
    faqs: content.faqs
      .filter((f) => f.visible)
      .sort((a, b) => a.sortOrder - b.sortOrder),
    address: `${business.address.line}, ${business.address.city}`,
    mapsUrl: business.mapsUrl,
    hours: [...business.openingHours]
      .sort((a, b) => ((a.day + 6) % 7) - ((b.day + 6) % 7))
      .map((h) => ({
        label: days[h.day]!,
        value: h.closed
          ? "Cerrado"
          : h.intervals.map((i) => `${i.opens}–${i.closes}`).join(" / "),
      })),
    timezone: business.timezone,
    specialHours: business.specialHours.length
      ? business.specialHours.map(
          (h) =>
            `${h.date}: ${h.closed ? "Cerrado" : h.intervals.map((i) => `${i.opens}–${i.closes}`).join(" / ")}${h.note ? ` · ${h.note}` : ""}`,
        )
      : ["Feriados y horarios excepcionales por confirmar."],
    socials: business.socialLinks
      .filter((s) => s.visible)
      .map((s) => ({ label: s.network, href: s.url })),
    conversion: {
      href: buildWhatsAppUrl(content.whatsappConversion),
      label: content.whatsappConversion.ctaLabel,
      fallbackLabel: content.whatsappConversion.fallbackLabel,
      intent: content.whatsappConversion.intent,
      placements: content.whatsappConversion.placements,
      phone: content.whatsappConversion.enabled
        ? content.whatsappConversion.destinationE164
        : undefined,
    },
    theme: { accent: config.theme.primary },
  };
}
