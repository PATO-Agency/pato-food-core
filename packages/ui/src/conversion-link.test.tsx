// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import { ConversionLink } from "./conversion-link";

afterEach(cleanup);
const props = {
  href: "https://wa.me/15555550100?text=Hola",
  location: "hero" as const,
  intent: "order" as const,
  siteKey: "synthetic-demo",
  children: "Consultar",
};
describe("conversion link", () => {
  it("ships a real anchor before hydration", () => {
    const html = renderToStaticMarkup(<ConversionLink {...props} />);
    expect(html).toContain('href="https://wa.me/15555550100?text=Hola"');
    expect(html).not.toContain("disabled");
  });
  it("unknown numbers have no contact destination and explain the pending state", () => {
    render(<ConversionLink {...props} href={null} />);
    expect(screen.queryByRole("link")).toBeNull();
    expect(
      screen.getByText("Canal de contacto pendiente de confirmar"),
    ).toBeTruthy();
    expect(
      screen
        .getByRole("button", { name: "Consultar" })
        .hasAttribute("disabled"),
    ).toBe(true);
  });
  it("reports placement without preventing navigation when analytics throws", () => {
    const track = vi.fn(() => {
      throw new Error("Blocked SDK");
    });
    render(<ConversionLink {...props} onTrack={track} />);
    const event = new MouseEvent("click", { bubbles: true, cancelable: true });
    fireEvent(screen.getByRole("link"), event);
    expect(event.defaultPrevented).toBe(false);
    expect(track).toHaveBeenCalledWith({
      cta_location: "hero",
      intent: "order",
      site_key: "synthetic-demo",
      page_path: "/",
    });
  });
  it("sanitizes paths and editable attribution before calling an adapter", () => {
    window.history.replaceState({}, "", "/private-path?phone=999999999");
    const track = vi.fn();
    render(
      <ConversionLink
        {...props}
        onTrack={track}
        contentId="menu-special"
        campaignId="campaign-9999999"
      />,
    );
    fireEvent.click(screen.getByRole("link"));
    expect(track).toHaveBeenCalledWith({
      cta_location: "hero",
      intent: "order",
      site_key: "synthetic-demo",
      page_path: "/",
      content_id: "menu-special",
    });
    window.history.replaceState({}, "", "/");
  });
});
