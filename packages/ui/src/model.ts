export interface LandingImage {
  src: string;
  alt: string;
  caption?: string;
}
export type ConversionLocation =
  "hero" | "navigation" | "menu" | "promotion" | "floating" | "footer";
export interface LandingPromotion {
  id: string;
  title: string;
  text: string;
  image?: LandingImage;
  campaignId: string;
  useWhatsappCta: boolean;
}
export interface LandingItem {
  id: string;
  name: string;
  description?: string;
  price: string;
  categoryId: string;
  featured: boolean;
  unavailable: boolean;
  image?: LandingImage;
}
export interface LandingContent {
  siteKey: string;
  demo: boolean;
  name: string;
  tagline: string;
  description: string;
  hero: { eyebrow: string; title: string; text: string; image?: LandingImage };
  lines: string[];
  categories: {
    id: string;
    name: string;
    description?: string;
    group?: string;
  }[];
  items: LandingItem[];
  gallery: LandingImage[];
  promotions: LandingPromotion[];
  faqs: { id: string; question: string; answer: string }[];
  address: string;
  mapsUrl?: string;
  hours: { label: string; value: string }[];
  timezone: string;
  specialHours: string[];
  socials: { label: string; href: string }[];
  conversion: {
    href: string | null;
    label: string;
    fallbackLabel: string;
    phone?: string;
    intent: "order" | "reservation" | "inquiry" | "event";
    placements: ConversionLocation[];
  };
  theme?: { accent?: string; background?: string; foreground?: string };
}
