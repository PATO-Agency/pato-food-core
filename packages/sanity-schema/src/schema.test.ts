import { expect, it } from "vitest";
import { schemaTypes, singletonTypes, singletonActions } from "./index";
it("exposes exactly eight document types and provenance on every type", () => {
  expect(schemaTypes.map((s) => s.name)).toEqual([
    "business",
    "whatsappConversion",
    "menuCategory",
    "menuItem",
    "galleryImage",
    "promotion",
    "faq",
    "testimonial",
  ]);
  for (const schema of schemaTypes)
    expect(schema.fields.map((f) => f.name)).toEqual(
      expect.arrayContaining([
        "contentStatus",
        "sourceRef",
        "sourceObservedAt",
        "approvedAt",
      ]),
    );
});
it("locks singleton creation paths and disallows deletion/duplication actions", () => {
  expect([...singletonTypes]).toEqual(["business", "whatsappConversion"]);
  expect(singletonActions.has("delete")).toBe(false);
  expect(singletonActions.has("duplicate")).toBe(false);
});
it("keeps critical CMS fields behind explicit validation rules", () => {
  const requiredValidation = [
    ["business", "businessLines"],
    ["business", "openingHours"],
    ["business", "phones"],
    ["whatsappConversion", "destinationE164"],
    ["whatsappConversion", "placements"],
    ["menuItem", "priceOptions"],
    ["promotion", "campaignId"],
  ] as const;
  for (const [typeName, fieldName] of requiredValidation) {
    const schema = schemaTypes.find((type) => type.name === typeName);
    const field = schema?.fields.find(
      (candidate) => candidate.name === fieldName,
    );
    expect(field, `${typeName}.${fieldName}`).toBeDefined();
    const validation = (field as { validation?: unknown } | undefined)
      ?.validation;
    expect(typeof validation, `${typeName}.${fieldName}`).toBe("function");
  }
});
