import { afterEach, describe, expect, it, vi } from "vitest";
import {
  createGtagProvider,
  createWhatsAppClickPayload,
  trackWhatsAppClick,
  type WhatsAppClick,
} from "./index";

const click: WhatsAppClick = {
  cta_location: "hero",
  intent: "inquiry",
  site_key: "demo",
};

afterEach(() => vi.useRealTimers());

describe("WhatsApp contact-intent analytics", () => {
  it("projects only approved fields and never forwards URL, query, phone or message", () => {
    const input = {
      ...click,
      phone: "+51999999999",
      message: "Private message",
      page_path: "/?email=private@example.com#secret",
      content_id: "menu-item",
      campaign_id: "summer",
    };
    expect(createWhatsAppClickPayload(input)).toEqual({
      ...click,
      page_path: "/",
      content_id: "menu-item",
      campaign_id: "summer",
    });
  });

  it("drops contact-like identifiers and rejects invalid enums or site keys", () => {
    expect(
      createWhatsAppClickPayload({
        ...click,
        content_id: "someone@example.com",
        campaign_id: "phone51999999999",
      }),
    ).toEqual({ ...click, page_path: "/" });
    expect(
      createWhatsAppClickPayload({ ...click, site_key: "+51999999999" }),
    ).toBeNull();
    expect(
      createWhatsAppClickPayload({
        ...click,
        intent: "sale",
      } as unknown as WhatsAppClick),
    ).toBeNull();
  });

  it("returns before invoking tracking and emits the canonical event", async () => {
    vi.useFakeTimers();
    const track = vi.fn();
    expect(trackWhatsAppClick(click, { track })).toBeUndefined();
    expect(track).not.toHaveBeenCalled();
    await vi.runAllTimersAsync();
    expect(track).toHaveBeenCalledWith("whatsapp_click", {
      ...click,
      page_path: "/",
    });
  });

  it("contains synchronous and asynchronous provider failures", async () => {
    vi.useFakeTimers();
    trackWhatsAppClick(click, {
      track: () => {
        throw new Error("SDK blocked");
      },
    });
    trackWhatsAppClick(click, {
      track: () => Promise.reject(new Error("Offline")),
    });
    trackWhatsAppClick(
      click,
      createGtagProvider(() => undefined),
    );
    await expect(vi.runAllTimersAsync()).resolves.toBeDefined();
  });

  it("works with disabled analytics and contains malformed runtime input", async () => {
    vi.useFakeTimers();
    expect(() =>
      trackWhatsAppClick(null as unknown as WhatsAppClick),
    ).not.toThrow();
    trackWhatsAppClick(click);
    await vi.runAllTimersAsync();
  });
});
