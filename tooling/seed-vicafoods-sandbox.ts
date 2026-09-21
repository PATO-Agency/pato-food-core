import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { createClient } from "@sanity/client";
import { vicafoodsContent } from "@pato-food/vicafoods";

type ExistingDocument = {
  _id: string;
  _type: "menuCategory" | "menuItem";
  name?: string;
  slug?: string;
};

type SeedDocument = {
  _id: string;
  _type: string;
  [key: string]: unknown;
};

type AssetReference = {
  _type: "reference";
  _ref: string;
};

const API_VERSION = "2026-09-18";
const apply = process.argv.includes("--apply");
const confirmedSandbox = process.argv.includes("--confirm-sandbox-write");
const confirmedProject = process.argv
  .find((argument) => argument.startsWith("--confirm-project="))
  ?.slice("--confirm-project=".length);

const normalize = (value: string | undefined) =>
  value
    ?.normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();

const baseId = (id: string) => id.replace(/^drafts\./, "");
const draftId = (id: string) => `drafts.${baseId(id)}`;

function compact<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function editorialFields(value: {
  contentStatus: string;
  sourceRef: string;
  sourceObservedAt?: string;
}) {
  return compact({
    contentStatus: value.contentStatus,
    sourceRef: value.sourceRef,
    sourceObservedAt: value.sourceObservedAt,
  });
}

function resolveExistingId(
  type: ExistingDocument["_type"],
  fallback: string,
  name: string,
  slug: string,
  existing: ExistingDocument[],
) {
  const normalizedName = normalize(name);
  const normalizedSlug = normalize(slug);
  const matches = new Set(
    existing
      .filter(
        (document) =>
          document._type === type &&
          (normalize(document.name) === normalizedName ||
            normalize(document.slug) === normalizedSlug),
      )
      .map((document) => baseId(document._id)),
  );
  if (matches.size > 1)
    throw new Error(`Ambiguous existing ${type} for ${slug}`);
  return [...matches][0] ?? fallback;
}

function imageValue(
  asset: AssetReference,
  alt: string,
  credit = "Activo suministrado; derechos pendientes",
) {
  return {
    _type: "image",
    asset,
    alt,
    rightsConfirmed: false,
    credit,
  };
}

async function ensureImageAsset(
  client: ReturnType<typeof createClient>,
  relativeSource: string,
) {
  const absolutePath = path.join(
    process.cwd(),
    "apps",
    "web",
    "public",
    relativeSource.replace(/^\//, ""),
  );
  const bytes = await readFile(absolutePath);
  const sha1 = createHash("sha1").update(bytes).digest("hex");
  const existingId = await client.fetch<string | null>(
    '*[_type == "sanity.imageAsset" && sha1hash == $sha1][0]._id',
    { sha1 },
  );
  if (existingId) return { _type: "reference", _ref: existingId } as const;
  const uploaded = await client.assets.upload("image", bytes, {
    filename: path.basename(absolutePath),
  });
  return { _type: "reference", _ref: uploaded._id } as const;
}

function buildDocuments(
  existing: ExistingDocument[],
  assets: Record<string, AssetReference>,
) {
  const business = vicafoodsContent.business;
  const conversion = vicafoodsContent.whatsappConversion;
  const categoryIds = new Map(
    vicafoodsContent.menuCategories.map((category) => [
      category.id,
      resolveExistingId(
        "menuCategory",
        category.id,
        category.name,
        category.slug,
        existing,
      ),
    ]),
  );

  const documents: SeedDocument[] = [
    compact({
      _id: "drafts.business",
      _type: "business",
      ...editorialFields(business),
      displayName: business.displayName,
      legalName: business.legalName,
      tagline: business.tagline,
      description: business.description,
      businessLines: business.businessLines,
      hero: {
        eyebrow: business.hero.eyebrow,
        title: business.hero.title,
        text: business.hero.text,
        image: imageValue(
          assets["/demo/vicafoods/hamburguesa-vicafoods.png"]!,
          "Hamburguesa con pan marcado VICAFOODS",
        ),
      },
      address: business.address,
      mapsUrl: business.mapsUrl,
      phones: business.phones.map((phone, index) => ({
        _key: `phone-${index}`,
        ...phone,
      })),
      socialLinks: business.socialLinks.map((link, index) => ({
        _key: `social-${index}`,
        ...link,
      })),
      timezone: business.timezone,
      openingHours: business.openingHours.map((day) => ({
        _key: `day-${day.day}`,
        ...day,
        intervals: day.intervals.map((interval, index) => ({
          _key: `interval-${index}`,
          ...interval,
        })),
      })),
      specialHours: business.specialHours.map((day, index) => ({
        _key: `special-${index}`,
        ...day,
        intervals: day.intervals.map((interval, intervalIndex) => ({
          _key: `interval-${intervalIndex}`,
          ...interval,
        })),
      })),
      paymentMethods: business.paymentMethods,
      proofPoints: business.proofPoints.map((point, index) => ({
        _key: `proof-${index}`,
        ...point,
      })),
    }),
    compact({
      _id: "drafts.whatsappConversion",
      _type: "whatsappConversion",
      ...editorialFields(conversion),
      enabled: false,
      intent: conversion.intent,
      destinationE164: conversion.destinationE164,
      ctaLabel: conversion.ctaLabel,
      prefilledMessage: conversion.prefilledMessage,
      placements: conversion.placements,
      fallbackLabel: conversion.fallbackLabel,
    }),
  ];

  for (const category of vicafoodsContent.menuCategories) {
    documents.push(
      compact({
        _id: draftId(categoryIds.get(category.id)!),
        _type: "menuCategory",
        ...editorialFields(category),
        name: category.name,
        slug: { _type: "slug", current: category.slug },
        description: category.description,
        groupLabel: category.groupLabel,
        sortOrder: category.sortOrder,
        visible: category.visible,
      }),
    );
  }

  for (const item of vicafoodsContent.menuItems) {
    const itemId = resolveExistingId(
      "menuItem",
      item.id,
      item.name,
      item.slug,
      existing,
    );
    const image = item.image
      ? imageValue(assets[item.image.src]!, item.image.alt)
      : undefined;
    documents.push(
      compact({
        _id: draftId(itemId),
        _type: "menuItem",
        ...editorialFields(item),
        name: item.name,
        slug: { _type: "slug", current: item.slug },
        category: {
          _type: "reference",
          _ref: categoryIds.get(item.categoryId),
          _weak: true,
        },
        description: item.description,
        pricingMode: item.pricingMode,
        priceOptions: item.priceOptions.map((option, index) => ({
          _key: `price-${index}`,
          ...option,
        })),
        image,
        badges: item.badges,
        featured: item.featured,
        availability: item.availability,
        sortOrder: item.sortOrder,
      }),
    );
  }

  for (const gallery of vicafoodsContent.galleryImages) {
    documents.push(
      compact({
        _id: draftId(gallery.id),
        _type: "galleryImage",
        ...editorialFields(gallery),
        image: imageValue(
          assets[gallery.image.src]!,
          gallery.image.alt,
          gallery.credit,
        ),
        caption: gallery.caption,
        category: gallery.category,
        credit: gallery.credit,
        sortOrder: gallery.sortOrder,
        visible: gallery.visible,
      }),
    );
  }

  return documents;
}

async function main() {
  console.log("VICAFOODS sandbox seed plan");
  console.log(
    `categories=${vicafoodsContent.menuCategories.length} items=${vicafoodsContent.menuItems.length} gallery=${vicafoodsContent.galleryImages.length} assets=2`,
  );
  console.log("status=pendingValidation whatsapp=disabled publish=false");
  if (!apply) {
    console.log(
      "dry-run=true; add --apply --confirm-sandbox-write --confirm-project=<projectId> to write drafts",
    );
    return;
  }

  const projectId = process.env.SANITY_PROJECT_ID?.trim();
  const dataset = process.env.SANITY_DATASET?.trim();
  const token = process.env.SANITY_WRITE_TOKEN?.trim();
  if (!projectId || !/^[a-z0-9-]+$/.test(projectId))
    throw new Error("SANITY_PROJECT_ID is missing or invalid");
  if (dataset !== "sandbox")
    throw new Error("This seed is restricted to the sandbox dataset");
  if (process.env.PATO_SITE_VISIBILITY !== "internal")
    throw new Error("This seed requires PATO_SITE_VISIBILITY=internal");
  if (!token || token.length < 24)
    throw new Error("SANITY_WRITE_TOKEN is missing or invalid");
  if (!confirmedSandbox || confirmedProject !== projectId)
    throw new Error("Sandbox and project confirmation flags are required");

  const client = createClient({
    projectId,
    dataset,
    apiVersion: API_VERSION,
    perspective: "raw",
    useCdn: false,
    token,
  });
  const existing = await client.fetch<ExistingDocument[]>(
    '*[_type in ["menuCategory", "menuItem"] && !(_id in path("versions.**"))]{_id,_type,name,"slug":slug.current}',
  );
  const burgerSource = "/demo/vicafoods/hamburguesa-vicafoods.png";
  const choripanSource = "/demo/vicafoods/choripan-papas.png";
  const assets = {
    [burgerSource]: await ensureImageAsset(client, burgerSource),
    [choripanSource]: await ensureImageAsset(client, choripanSource),
  };
  const documents = buildDocuments(existing, assets);
  const baseIds = documents.map((document) => baseId(document._id));
  const draftIds = documents.map((document) => document._id);
  const publishedBefore = await client.fetch<number>(
    'count(*[_id in $ids && !(_id in path("drafts.**"))])',
    { ids: baseIds },
  );
  let transaction = client.transaction();
  for (const document of documents)
    transaction = transaction.createOrReplace(document);
  await transaction.commit({ returnDocuments: false });
  const verification = await client.fetch<{
    draftCount: number;
    publishedCount: number;
    unconfirmedImages: number;
  }>(
    `{
      "draftCount": count(*[_id in $draftIds]),
      "publishedCount": count(*[_id in $baseIds && !(_id in path("drafts.**"))]),
      "unconfirmedImages": count(*[_id in $draftIds && defined(image.asset) && image.rightsConfirmed != true])
    }`,
    { draftIds, baseIds },
  );
  if (
    verification.draftCount !== documents.length ||
    verification.publishedCount !== publishedBefore
  )
    throw new Error("Post-write verification failed");
  console.log(
    `drafts=${verification.draftCount} publishedChanges=0 unconfirmedImages=${verification.unconfirmedImages}`,
  );
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "Unknown failure";
  console.error(`Seed failed safely: ${message}`);
  process.exitCode = 1;
});
