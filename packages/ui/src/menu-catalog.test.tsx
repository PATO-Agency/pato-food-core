// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import userEvent from "@testing-library/user-event";
import { MenuCatalog } from "./menu-catalog";
import type { LandingItem } from "./model";

afterEach(() => {
  cleanup();
  document.documentElement.style.scrollPaddingTop = "";
});
const categories = [
  { id: "lunch", name: "Almuerzos" },
  { id: "bakery", name: "Panadería" },
];
const items: LandingItem[] = [
  {
    id: "bowl",
    categoryId: "lunch",
    name: "Bowl del día",
    price: "S/ 20 / porción",
    featured: false,
    unavailable: false,
    image: { src: "/bowl.jpg", alt: "Imagen referencial: Bowl del día" },
  },
  {
    id: "bread",
    categoryId: "bakery",
    name: "Pan artesanal",
    price: "S/ 8 / unidad",
    featured: false,
    unavailable: true,
  },
];

describe("menu catalog", () => {
  it("ships native photo disclosures and category anchors before JavaScript runs", () => {
    const html = renderToStaticMarkup(
      <MenuCatalog categories={categories} items={items} />,
    );
    expect(html).toContain('<details class="menu-photo-disclosure">');
    expect(html).toContain("Ver fotografía de Bowl del día");
    expect(html).toContain("Imagen referencial");
    expect(html).toContain('href="#category-bakery"');
    expect(html).toContain('id="category-bakery"');
    expect(html).toContain("Agotado");
    expect(html).not.toContain("Ver fotografía de Pan artesanal");
  });
  it("offers a keyboard reachable native summary and the full photo without a modal", async () => {
    render(<MenuCatalog categories={categories} items={items} />);
    const summary = screen
      .getByLabelText("Ver fotografía de Bowl del día")
      .closest("summary");
    expect(summary).not.toBeNull();
    const user = userEvent.setup();
    await user.tab();
    await user.tab();
    await user.tab();
    expect(document.activeElement).toBe(summary);
    const details = summary!.closest("details")!;
    fireEvent.click(summary!);
    expect(details.open).toBe(true);
    expect(
      screen.getByAltText("Imagen referencial: Bowl del día"),
    ).toBeTruthy();
    expect(screen.queryByRole("dialog")).toBeNull();
  });
  it("updates aria-current as the category scrolls under the sticky nav", async () => {
    render(<MenuCatalog categories={categories} items={items} />);
    const first = screen.getByRole("link", { name: "Almuerzos" });
    expect(first.getAttribute("aria-current")).toBe("location");
    Object.defineProperty(
      document.getElementById("category-lunch")!,
      "getBoundingClientRect",
      { value: () => ({ top: -400 }) },
    );
    const bakery = document.getElementById("category-bakery")!;
    Object.defineProperty(bakery, "getBoundingClientRect", {
      value: () => ({ top: -20 }),
    });
    fireEvent.scroll(window);
    await waitFor(() => {
      expect(
        screen
          .getByRole("link", { name: "Panadería" })
          .getAttribute("aria-current"),
      ).toBe("location");
      expect(first.hasAttribute("aria-current")).toBe(false);
    });
  });
  it("marks the native anchor destination active while respecting its scroll margin", async () => {
    document.documentElement.style.scrollPaddingTop = "16px";
    render(<MenuCatalog categories={categories} items={items} />);
    const navigation = screen.getByRole("navigation");
    Object.defineProperty(navigation, "getBoundingClientRect", {
      value: () => ({ bottom: 82 }),
    });
    Object.defineProperty(
      document.getElementById("category-lunch")!,
      "getBoundingClientRect",
      { value: () => ({ top: -800 }) },
    );
    const bakery = document.getElementById("category-bakery")!;
    bakery.style.scrollMarginTop = "108px";
    Object.defineProperty(bakery, "getBoundingClientRect", {
      value: () => ({ top: 124 }),
    });
    fireEvent.scroll(window);
    await waitFor(() =>
      expect(
        screen
          .getByRole("link", { name: "Panadería" })
          .getAttribute("aria-current"),
      ).toBe("location"),
    );
  });
});
