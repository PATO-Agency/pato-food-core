import type { Metadata, MetadataRoute } from "next";
import {
  assertProductionContent,
  httpsUrlSchema,
  type SiteContent,
} from "@pato-food/content-contract";
import type { SiteConfiguration } from "./adapter";
import type { SiteVisibility } from "./content-policy";

const internalTitle = "PATO Food · Demostración interna";
const internalDescription =
  "Prototipo interno del sistema de sitios gastronómicos PATO Food.";

const schemaDays = [
  "https://schema.org/Sunday",
  "https://schema.org/Monday",
  "https://schema.org/Tuesday",
  "https://schema.org/Wednesday",
  "https://schema.org/Thursday",
  "https://schema.org/Friday",
  "https://schema.org/Saturday",
] as const;

export type SeoPolicy = { visibility: SiteVisibility };

export interface StructuredData {
  "@context": "https://schema.org";
  "@type": "FoodEstablishment" | "Restaurant";
  name: string;
  description: string;
  url: string;
  address: {
    "@type": "PostalAddress";
    streetAddress: string;
    addressLocality: string;
    addressRegion: string;
    addressCountry: string;
    postalCode?: string;
  };
  telephone?: string;
  sameAs?: string[];
  image?: string;
  openingHoursSpecification: Array<{
    "@type": "OpeningHoursSpecification";
    dayOfWeek: string;
    opens: string;
    closes: string;
  }>;
}

function publicUrl(config: SiteConfiguration): URL {
  const parsed = httpsUrlSchema.safeParse(config.publicUrl);
  if (!parsed.success)
    throw new Error("Public release requires an explicit HTTPS public URL");
  const url = new URL(parsed.data);
  url.hash = "";
  url.search = "";
  if (!url.pathname.endsWith("/")) url.pathname += "/";
  return url;
}

function absoluteAssetUrl(src: string, base: URL): string {
  return new URL(src, base).toString();
}

function isPrivate({
  policy,
  preview,
}: {
  policy: SeoPolicy;
  preview: boolean;
}) {
  return preview || policy.visibility !== "public";
}

export function buildMetadata({
  policy,
  config,
  content,
  preview = false,
}: {
  policy: SeoPolicy;
  config: SiteConfiguration;
  content?: SiteContent;
  preview?: boolean;
}): Metadata {
  if (isPrivate({ policy, preview }))
    return {
      title: internalTitle,
      description: internalDescription,
      robots: {
        index: false,
        follow: false,
        noarchive: true,
        nocache: true,
      },
    };

  if (!content) throw new Error("Public metadata requires site content");
  assertProductionContent(content);
  const canonical = publicUrl(config);
  const business = content.business;
  const heroImage = business.hero.image?.rightsConfirmed
    ? absoluteAssetUrl(business.hero.image.src, canonical)
    : undefined;
  const images = heroImage
    ? [{ url: heroImage, alt: business.hero.image?.alt }]
    : undefined;

  return {
    metadataBase: canonical,
    title: business.displayName,
    description: business.description,
    alternates: { canonical: canonical.toString() },
    robots: { index: true, follow: true },
    openGraph: {
      type: "website",
      locale: config.locale.replace("-", "_"),
      url: canonical.toString(),
      siteName: business.displayName,
      title: business.displayName,
      description: business.description,
      images,
    },
    twitter: {
      card: heroImage ? "summary_large_image" : "summary",
      title: business.displayName,
      description: business.description,
      images: heroImage ? [heroImage] : undefined,
    },
  };
}

export function buildStructuredData({
  policy,
  config,
  content,
  preview = false,
}: {
  policy: SeoPolicy;
  config: SiteConfiguration;
  content: SiteContent;
  preview?: boolean;
}): StructuredData | null {
  if (isPrivate({ policy, preview })) return null;
  assertProductionContent(content);
  const canonical = publicUrl(config);
  const business = content.business;
  const telephone = business.phones[0]?.number;
  const sameAs = business.socialLinks
    .filter((link) => link.visible)
    .map((link) => link.url);
  const heroImage = business.hero.image?.rightsConfirmed
    ? absoluteAssetUrl(business.hero.image.src, canonical)
    : undefined;

  return {
    "@context": "https://schema.org",
    "@type": config.schemaType ?? "FoodEstablishment",
    name: business.displayName,
    description: business.description,
    url: canonical.toString(),
    image: heroImage,
    telephone,
    sameAs: sameAs.length ? sameAs : undefined,
    address: {
      "@type": "PostalAddress",
      streetAddress: business.address.line,
      addressLocality: business.address.city,
      addressRegion: business.address.region,
      addressCountry: business.address.country,
      postalCode: business.address.postalCode,
    },
    openingHoursSpecification: business.openingHours.flatMap((hours) =>
      hours.closed
        ? []
        : hours.intervals.map((interval) => ({
            "@type": "OpeningHoursSpecification" as const,
            dayOfWeek: schemaDays[hours.day],
            opens: interval.opens,
            closes: interval.closes,
          })),
    ),
  };
}

export function serializeStructuredData(data: StructuredData): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

export function buildRobots({
  policy,
  config,
}: {
  policy: SeoPolicy;
  config: SiteConfiguration;
}): MetadataRoute.Robots {
  if (policy.visibility !== "public")
    return { rules: { userAgent: "*", disallow: "/" } };

  const canonical = publicUrl(config);
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: new URL("sitemap.xml", canonical).toString(),
  };
}

export function buildSitemap({
  policy,
  config,
}: {
  policy: SeoPolicy;
  config: SiteConfiguration;
}): MetadataRoute.Sitemap {
  if (policy.visibility !== "public") return [];
  return [
    {
      url: publicUrl(config).toString(),
      changeFrequency: "weekly",
      priority: 1,
    },
  ];
}
