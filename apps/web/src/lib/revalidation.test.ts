import { describe, expect, it } from "vitest";
import {
  parseSanityOperation,
  parseWebhookDocument,
  tagsForWebhook,
} from "./revalidation";

describe("webhook document contract", () => {
  it.each([
    ["business", "business"],
    ["whatsappConversion", "business"],
    ["menuCategory", "menu"],
    ["menuItem", "menu"],
    ["galleryImage", "gallery"],
    ["promotion", "promotion"],
    ["faq", "faq"],
    ["testimonial", "testimonial"],
  ])("maps published %s documents", (type, tag) => {
    expect(tagsForWebhook({ _id: "published-id", _type: type })).toEqual([tag]);
  });

  it("keeps the payload canonical and excludes non-published identities", () => {
    expect(
      parseWebhookDocument({
        _id: "item-1",
        _type: "menuItem",
        title: "ignored",
      }),
    ).toEqual({ _id: "item-1", _type: "menuItem" });
    expect(
      tagsForWebhook({ _id: "drafts.item-1", _type: "menuItem" }),
    ).toBeNull();
    expect(
      tagsForWebhook({ _id: "versions.item-1", _type: "menuItem" }),
    ).toBeNull();
    expect(tagsForWebhook({ _id: "item-1", _type: "other" })).toBeNull();
  });

  it.each(["create", "UPDATE", "delete"])("accepts operation %s", (operation) =>
    expect(parseSanityOperation(operation)).not.toBeNull(),
  );
  it.each([null, "publish", "unpublish", "", "create,update"])(
    "rejects operation %s",
    (operation) => expect(parseSanityOperation(operation)).toBeNull(),
  );
});
