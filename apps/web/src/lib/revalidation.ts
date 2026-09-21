const documentTags: Record<string, string> = {
  business: "business",
  whatsappConversion: "business",
  menuCategory: "menu",
  menuItem: "menu",
  galleryImage: "gallery",
  promotion: "promotion",
  faq: "faq",
  testimonial: "testimonial",
};

export const SANITY_OPERATIONS = ["create", "update", "delete"] as const;

export type SanityOperation = (typeof SANITY_OPERATIONS)[number];

/** The minimal, stable shape sent by the webhook projection. */
export type WebhookDocument = Readonly<{ _id: string; _type: string }>;

export function parseWebhookDocument(body: unknown): WebhookDocument | null {
  if (!body || typeof body !== "object") return null;
  const value = body as Record<string, unknown>;
  if (
    typeof value._type !== "string" ||
    typeof value._id !== "string" ||
    value._id.startsWith("drafts.") ||
    value._id.startsWith("versions.")
  )
    return null;
  return { _id: value._id, _type: value._type };
}

export function parseSanityOperation(
  value: string | null,
): SanityOperation | null {
  if (!value) return null;
  const operation = value.trim().toLowerCase();
  return (SANITY_OPERATIONS as readonly string[]).includes(operation)
    ? (operation as SanityOperation)
    : null;
}

export function tagsForWebhook(body: unknown): string[] | null {
  const document = parseWebhookDocument(body);
  if (!document) return null;
  const tag = Object.hasOwn(documentTags, document._type)
    ? documentTags[document._type]
    : undefined;
  return tag ? [tag] : null;
}
