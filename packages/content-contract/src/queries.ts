// Use the matching Sanity client perspective in addition to these filters.
// These projections deliberately omit unrelated/internal document fields.
const editorial = "contentStatus, sourceRef, sourceObservedAt, approvedAt";
const image = '"src": asset->url, alt, rightsConfirmed';
const approved =
  'contentStatus == "approved" && defined(approvedAt) && !(_id in path("drafts.**"))';
const previewable = '!(_id in path("versions.**"))';

const siteQuery = (filter: string, singletonFilter: string) => `{
  "business": *[_type == "business" && ${singletonFilter} && ${filter}] | order(_updatedAt desc)[0]{
    ${editorial}, displayName, legalName, tagline, description, businessLines,
    "logo": select(defined(logo.asset) => logo{${image}}),
    hero{eyebrow, title, text, "image": select(defined(image.asset) => image{${image}})},
    address{line, city, region, country, postalCode}, mapsUrl,
    "phones": coalesce(phones[]{label, number, display}, []),
    "socialLinks": coalesce(socialLinks[]{network, url, visible}, []), timezone,
    openingHours[]{day, closed, intervals[]{opens, closes}},
    "specialHours": coalesce(specialHours[]{date, note, closed, intervals[]{opens, closes}}, []),
    "paymentMethods": coalesce(paymentMethods, []),
    "proofPoints": coalesce(proofPoints[]{title, detail}, [])
  },
  "whatsappConversion": *[_type == "whatsappConversion" && ${singletonFilter} && ${filter}] | order(_updatedAt desc)[0]{${editorial}, enabled, intent, destinationE164, ctaLabel, prefilledMessage, placements, fallbackLabel},
  "menuCategories": *[_type == "menuCategory" && ${filter}] | order(sortOrder asc){${editorial}, "id": _id, name, "slug": slug.current, description, groupLabel, sortOrder, visible},
  "menuItems": *[_type == "menuItem" && ${filter} && defined(category->_id) && category->contentStatus == "approved" && defined(category->approvedAt)] | order(sortOrder asc){${editorial}, "id": _id, name, "slug": slug.current, "categoryId": category._ref, description, pricingMode, "priceOptions": coalesce(priceOptions[]{label, amount, currency, billingUnit, unitQuantity, netContent{quantity, unit, count}}, []), "image": select(defined(image.asset) => image{${image}}), "badges": coalesce(badges, []), featured, availability, sortOrder},
  "galleryImages": *[_type == "galleryImage" && ${filter}] | order(sortOrder asc){${editorial}, "id": _id, image{${image}}, caption, category, credit, sortOrder, visible},
  "promotions": *[_type == "promotion" && ${filter}] | order(startsAt desc){${editorial}, "id": _id, title, text, "image": select(defined(image.asset) => image{${image}}), startsAt, endsAt, active, campaignId, useWhatsappCta},
  "faqs": *[_type == "faq" && ${filter}] | order(sortOrder asc){${editorial}, "id": _id, question, answer, sortOrder, visible},
  "testimonials": *[_type == "testimonial" && ${filter}] | order(sortOrder asc){${editorial}, "id": _id, author, text, source, sourceUrl, permissionNote, sortOrder, visible}
}`;

export const publishedSiteQuery = siteQuery(
  approved,
  '_id in ["business", "whatsappConversion"]',
);
export const previewSiteQuery = siteQuery(
  previewable,
  '_id in ["business", "drafts.business", "whatsappConversion", "drafts.whatsappConversion"]',
).replace(
  'defined(category->_id) && category->contentStatus == "approved" && defined(category->approvedAt)',
  "defined(category->_id)",
);
