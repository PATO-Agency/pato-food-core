import { defineArrayMember, defineField, defineType } from "sanity";
import type { StructureResolver } from "sanity/structure";
import {
  businessSchema,
  openingHoursSchema,
  specialHoursSchema,
  httpsUrlSchema,
  e164Schema,
  ctaPlacementSchema,
} from "@pato-food/content-contract";

const string = (name: string, max = 120, required = true) =>
  defineField({
    name,
    type: "string",
    validation: (rule) =>
      (required ? rule.required().max(max) : rule.max(max)).custom(
        (value) =>
          value === undefined ||
          value.trim().length > 0 ||
          "Value cannot be blank",
      ),
  });
const bool = (name: string) =>
  defineField({
    name,
    type: "boolean",
    initialValue: false,
    validation: (rule) => rule.required(),
  });
const number = (name: string) =>
  defineField({
    name,
    type: "number",
    validation: (rule) => rule.required().integer().min(0).max(9999),
  });
const enumeration = (name: string, values: string[]) =>
  defineField({
    name,
    type: "string",
    options: { list: values },
    validation: (rule) =>
      rule
        .required()
        .custom(
          (value) =>
            value === undefined ||
            values.includes(value) ||
            "Select an allowed value",
        ),
  });
const strings = (
  name: string,
  max = 6,
  itemMax = 60,
  required = false,
  min?: number,
) =>
  defineField({
    name,
    type: "array",
    of: [
      defineArrayMember({
        type: "string",
        validation: (rule) =>
          rule
            .max(itemMax)
            .custom(
              (value) =>
                value === undefined ||
                value.trim().length > 0 ||
                "Value cannot be blank",
            ),
      }),
    ],
    validation: (rule) => {
      let validation = rule.max(max);
      if (min !== undefined) validation = validation.min(min);
      if (required) validation = validation.required();
      return validation;
    },
  });
const url = (name: string, required = false) =>
  defineField({
    name,
    type: "url",
    validation: (rule) => {
      const validation = required ? rule.required() : rule;
      return validation.custom(
        (value) =>
          value === undefined ||
          httpsUrlSchema.safeParse(value).success ||
          "Enter a valid HTTPS URL",
      );
    },
  });
const editorial = [
  enumeration("contentStatus", ["demo", "pendingValidation", "approved"]),
  string("sourceRef", 240),
  defineField({ name: "sourceObservedAt", type: "datetime" }),
  defineField({ name: "approvedAt", type: "datetime" }),
];
const image = (name: string) =>
  defineField({
    name,
    type: "image",
    options: { hotspot: true, accept: "image/jpeg,image/png,image/webp" },
    fields: [
      string("alt", 180, false),
      bool("rightsConfirmed"),
      string("credit", 160, false),
    ],
    validation: (rule) =>
      rule.custom(
        (value) =>
          !value?.asset ||
          (typeof value.alt === "string" && value.alt.trim().length > 0) ||
          "Alternative text is required when an image is selected",
      ),
    description:
      "Raster only. Permission must be confirmed before publication. Asset byte size, dimensions and animation require the ingestion/QA gate; accept is only an upload hint.",
  });
const interval = defineArrayMember({
  name: "interval",
  type: "object",
  fields: [string("opens", 5), string("closes", 5)],
});
const hours = (special = false) =>
  defineField({
    name: special ? "specialHours" : "openingHours",
    type: "array",
    of: [
      defineArrayMember({
        name: special ? "specialDay" : "weekday",
        type: "object",
        fields: [
          special
            ? string("date", 10)
            : defineField({
                name: "day",
                type: "number",
                options: {
                  list: [
                    { title: "Sunday", value: 0 },
                    { title: "Monday", value: 1 },
                    { title: "Tuesday", value: 2 },
                    { title: "Wednesday", value: 3 },
                    { title: "Thursday", value: 4 },
                    { title: "Friday", value: 5 },
                    { title: "Saturday", value: 6 },
                  ],
                },
                validation: (rule) => rule.required(),
              }),
          bool("closed"),
          defineField({
            name: "intervals",
            type: "array",
            of: [interval],
            validation: (rule) => rule.required(),
          }),
          ...(special ? [string("note", 200, false)] : []),
        ],
        validation: (rule) =>
          rule.custom((value) => {
            const parsed = (
              special ? specialHoursSchema : openingHoursSchema
            ).safeParse(value);
            return (
              parsed.success ||
              parsed.error.issues[0]?.message ||
              "Invalid hours"
            );
          }),
      }),
    ],
    validation: (rule) => {
      const validation = special ? rule : rule.required().length(7);
      return validation.custom((value) => {
        const parsed =
          businessSchema.shape[
            special ? "specialHours" : "openingHours"
          ].safeParse(value);
        return (
          parsed.success ||
          parsed.error.issues[0]?.message ||
          (special ? "Invalid exceptional hours" : "Invalid opening hours")
        );
      });
    },
  });
const slug = defineField({
  name: "slug",
  type: "slug",
  options: { source: "name" },
  validation: (rule) =>
    rule
      .required()
      .custom(
        (value) =>
          (typeof value?.current === "string" &&
            /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value.current)) ||
          "Use lowercase words separated by single hyphens",
      ),
});
const order = [number("sortOrder"), bool("visible")];
const priceOption = defineArrayMember({
  name: "priceOption",
  type: "object",
  fields: [
    string("label", 80),
    defineField({
      name: "amount",
      type: "number",
      validation: (rule) => rule.required().positive(),
    }),
    defineField({
      name: "currency",
      type: "string",
      validation: (rule) => rule.required().regex(/^[A-Z]{3}$/),
    }),
    enumeration("billingUnit", [
      "kg",
      "g",
      "unit",
      "portion",
      "package",
      "person",
      "event",
    ]),
    defineField({
      name: "unitQuantity",
      type: "number",
      initialValue: 1,
      validation: (rule) => rule.required().positive(),
    }),
    defineField({
      name: "netContent",
      type: "object",
      fields: [
        defineField({
          name: "quantity",
          type: "number",
          validation: (rule) => rule.required().positive(),
        }),
        enumeration("unit", ["kg", "g", "ml", "l", "unit"]),
        defineField({
          name: "count",
          type: "number",
          validation: (rule) => rule.integer().positive(),
        }),
      ],
    }),
  ],
});
const document = (name: string, fields: ReturnType<typeof defineField>[]) =>
  defineType({
    name,
    type: "document",
    fields: [...fields, ...editorial],
    initialValue: { contentStatus: "pendingValidation" },
    validation: (rule) =>
      rule.custom((value) => {
        if (value?.contentStatus === "approved" && !value.approvedAt)
          return "Approved content requires an approval timestamp";
        return true;
      }),
  });

const business = document("business", [
  string("displayName", 80),
  string("legalName", 120, false),
  string("tagline", 120),
  defineField({
    name: "description",
    type: "text",
    validation: (rule) =>
      rule
        .required()
        .max(800)
        .custom(
          (value) =>
            !value || value.trim().length > 0 || "Value cannot be blank",
        ),
  }),
  strings("businessLines", 6, 80, true, 1),
  image("logo"),
  defineField({
    name: "hero",
    type: "object",
    fields: [
      string("eyebrow", 80),
      string("title", 160),
      string("text", 500),
      image("image"),
    ],
    validation: (rule) => rule.required(),
  }),
  defineField({
    name: "address",
    type: "object",
    fields: [
      string("line", 160),
      string("city", 80),
      string("region", 80),
      defineField({
        name: "country",
        type: "string",
        validation: (rule) => rule.required().length(2),
      }),
      string("postalCode", 20, false),
    ],
    validation: (rule) => rule.required(),
  }),
  defineField({
    name: "mapsUrl",
    type: "url",
    validation: (rule) =>
      rule.custom((value) => {
        const parsed = businessSchema.shape.mapsUrl.safeParse(value);
        return (
          parsed.success ||
          parsed.error.issues[0]?.message ||
          "Enter a supported Google Maps HTTPS URL"
        );
      }),
  }),
  defineField({
    name: "phones",
    type: "array",
    of: [
      {
        type: "object",
        fields: [
          string("label", 60),
          defineField({
            name: "number",
            type: "string",
            validation: (rule) =>
              rule
                .required()
                .custom(
                  (value) =>
                    (value !== undefined &&
                      e164Schema.safeParse(value).success) ||
                    "Use a confirmed E.164 number",
                ),
          }),
          string("display", 60),
        ],
      },
    ],
    validation: (rule) => rule.max(20),
  }),
  defineField({
    name: "socialLinks",
    type: "array",
    of: [
      {
        type: "object",
        fields: [string("network", 40), url("url", true), bool("visible")],
      },
    ],
  }),
  defineField({
    name: "timezone",
    type: "string",
    validation: (rule) =>
      rule
        .required()
        .custom(
          (value) =>
            !value ||
            businessSchema.shape.timezone.safeParse(value).success ||
            "Use an IANA timezone",
        ),
  }),
  hours(),
  hours(true),
  strings("paymentMethods", 6, 60),
  defineField({
    name: "proofPoints",
    type: "array",
    of: [
      { type: "object", fields: [string("title", 80), string("detail", 200)] },
    ],
    validation: (rule) => rule.max(3),
  }),
]);
const whatsappConversion = document("whatsappConversion", [
  bool("enabled"),
  enumeration("intent", ["order", "reservation", "inquiry", "event"]),
  defineField({
    name: "destinationE164",
    type: "string",
    validation: (rule) =>
      rule.custom((value, context) => {
        if (value !== undefined && !e164Schema.safeParse(value).success)
          return "Use a confirmed E.164 number";
        return (
          context.document?.enabled !== true ||
          value !== undefined ||
          "Enabled CTA requires a confirmed E.164 destination"
        );
      }),
  }),
  string("ctaLabel", 60),
  string("prefilledMessage", 500),
  defineField({
    name: "placements",
    type: "array",
    of: [{ type: "string" }],
    options: {
      list: ["hero", "navigation", "menu", "promotion", "floating", "footer"],
    },
    validation: (rule) =>
      rule.required().custom((value) => {
        if (!value) return "Placements are required";
        if (value.some((entry) => !ctaPlacementSchema.safeParse(entry).success))
          return "Select only allowed placements";
        return (
          new Set(value).size === value.length ||
          "Each placement can appear only once"
        );
      }),
  }),
  string("fallbackLabel", 120),
]);
const menuCategory = document("menuCategory", [
  string("name", 80),
  slug,
  string("description", 240, false),
  string("groupLabel", 80),
  ...order,
]);
const menuItem = document("menuItem", [
  string("name"),
  slug,
  defineField({
    name: "category",
    type: "reference",
    to: [{ type: "menuCategory" }],
    validation: (rule) => rule.required(),
  }),
  string("description", 400, false),
  enumeration("pricingMode", ["fixed", "from", "onRequest"]),
  defineField({
    name: "priceOptions",
    type: "array",
    of: [priceOption],
    validation: (rule) =>
      rule.max(1).custom((value, context) => {
        const mode = context.document?.pricingMode;
        return mode === "onRequest"
          ? !value?.length || "Consultation items cannot have a price"
          : value?.length === 1 || "One price is required";
      }),
  }),
  image("image"),
  strings("badges", 3, 60),
  bool("featured"),
  enumeration("availability", [
    "available",
    "outOfStock",
    "seasonal",
    "hidden",
  ]),
  number("sortOrder"),
]);
const galleryImage = document("galleryImage", [
  defineField({
    ...image("image"),
    validation: (rule) =>
      rule.required().custom((value, context) => {
        if (
          value?.asset &&
          (typeof value.alt !== "string" || value.alt.trim().length === 0)
        )
          return "Alternative text is required when an image is selected";
        return (
          context.document?.contentStatus !== "approved" ||
          value?.rightsConfirmed === true ||
          "Confirm image permission before approval"
        );
      }),
  }),
  string("caption", 240, false),
  enumeration("category", ["product", "space", "team", "event", "other"]),
  string("credit", 160),
  ...order,
]);
const promotion = document("promotion", [
  string("title"),
  string("text", 500),
  image("image"),
  defineField({
    name: "startsAt",
    type: "datetime",
    validation: (rule) => rule.required(),
  }),
  defineField({
    name: "endsAt",
    type: "datetime",
    validation: (rule) =>
      rule
        .required()
        .custom(
          (value, context) =>
            !value ||
            !context.document?.startsAt ||
            Date.parse(value) > Date.parse(String(context.document.startsAt)) ||
            "End must follow start",
        ),
  }),
  bool("active"),
  defineField({
    name: "campaignId",
    type: "string",
    validation: (rule) =>
      rule
        .required()
        .max(100)
        .regex(/^[a-z0-9-]+$/, { name: "lowercase campaign ID" }),
  }),
  bool("useWhatsappCta"),
]);
const faq = document("faq", [
  string("question", 200),
  defineField({
    name: "answer",
    type: "text",
    validation: (rule) =>
      rule
        .required()
        .max(1000)
        .custom(
          (value) =>
            !value || value.trim().length > 0 || "Value cannot be blank",
        ),
  }),
  ...order,
]);
const testimonial = document("testimonial", [
  string("author", 80),
  defineField({
    name: "text",
    type: "text",
    validation: (rule) =>
      rule
        .required()
        .max(800)
        .custom(
          (value) =>
            !value || value.trim().length > 0 || "Value cannot be blank",
        ),
  }),
  string("source", 160),
  url("sourceUrl"),
  string("permissionNote", 240),
  ...order,
]);
export const schemaTypes = [
  business,
  whatsappConversion,
  menuCategory,
  menuItem,
  galleryImage,
  promotion,
  faq,
  testimonial,
];
export const singletonTypes = new Set(["business", "whatsappConversion"]);
export const structure: StructureResolver = (S) =>
  S.list()
    .title("Content")
    .items(
      schemaTypes.map((type) =>
        singletonTypes.has(type.name)
          ? S.listItem()
              .title(type.name)
              .id(type.name)
              .child(S.document().schemaType(type.name).documentId(type.name))
          : S.documentTypeListItem(type.name),
      ),
    );
export const singletonActions = new Set([
  "publish",
  "discardChanges",
  "restore",
]);
