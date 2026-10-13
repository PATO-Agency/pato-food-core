import { describe, expect, it } from "vitest";
import { clampMenuPreview, findActiveCategory } from "./menu-catalog-utils";

describe("menu photograph placement", () => {
  it("keeps the whole photograph inside the bottom right viewport edge", () => {
    const position = clampMenuPreview(
      { x: 990, y: 740 },
      { width: 280, height: 300 },
      { width: 1000, height: 750 },
    );
    expect(position.x).toBeGreaterThanOrEqual(16);
    expect(position.y).toBeGreaterThanOrEqual(16);
    expect(position.x + 280).toBeLessThanOrEqual(984);
    expect(position.y + 300).toBeLessThanOrEqual(734);
    expect(position.x).toBeLessThan(990);
    expect(position.y).toBeLessThan(740);
  });
  it("stays visible beside the pointer and handles tiny viewports safely", () => {
    expect(
      clampMenuPreview(
        { x: 20, y: 20 },
        { width: 280, height: 300 },
        { width: 1000, height: 750 },
      ),
    ).toEqual({ x: 44, y: 44 });
    expect(
      clampMenuPreview(
        { x: 10, y: 10 },
        { width: 280, height: 300 },
        { width: 200, height: 200 },
      ),
    ).toEqual({ x: 16, y: 16 });
  });
});

describe("active menu category", () => {
  const sections = [
    { id: "lunch", top: -100 },
    { id: "bakery", top: 120 },
    { id: "drinks", top: 600 },
  ];
  it("tracks the section crossing the sticky navigation without selecting later sections early", () => {
    expect(findActiveCategory(sections, 80)).toBe("lunch");
    expect(findActiveCategory(sections, 160)).toBe("bakery");
  });
  it("selects the first category before the menu and safely handles no categories", () => {
    expect(findActiveCategory([{ id: "lunch", top: 400 }], 80)).toBe("lunch");
    expect(findActiveCategory([], 80)).toBeNull();
  });
  it("selects a native anchor target below the bar when scroll offsets reserve space", () => {
    const anchoredSections = [
      { id: "steakhouse", top: -800 },
      { id: "complements", top: 124 },
      { id: "drinks", top: 900 },
    ];
    expect(
      findActiveCategory(anchoredSections, 82, {
        scrollMarginTop: 108,
        scrollPaddingTop: 16,
      }),
    ).toBe("complements");
    expect(
      findActiveCategory(
        anchoredSections.map((section) => ({
          ...section,
          top: section.top + 14,
        })),
        82,
        { scrollMarginTop: 108, scrollPaddingTop: 16 },
      ),
    ).toBe("complements");
  });
});
