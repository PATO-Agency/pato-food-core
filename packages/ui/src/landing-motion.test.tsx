// @vitest-environment jsdom
import { StrictMode } from "react";
import { render, cleanup, act } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { LandingMotion } from "./landing-motion";

function Content() {
  return (
    <>
      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">Nuestra cocina</p>
          <h1 id="hero-title">Una mesa para compartir.</h1>
          <p className="hero-description">Una visita que recordar.</p>
          <div className="hero-actions">
            <a href="#menu">Ver la carta</a>
          </div>
        </div>
        <div className="hero-art">Fotografía</div>
      </section>
      <div className="section-heading">
        <p className="eyebrow">La carta</p>
        <h2>A tu gusto.</h2>
        <p>Elige tu favorito.</p>
      </div>
      <article className="menu-card" id="menu">
        Plato de temporada
      </article>
      <section className="visit-section">
        <div>
          <div className="section-heading">
            <h2>Ven a vernos.</h2>
          </div>
          <p>Dirección de prueba.</p>
        </div>
        <div className="hours-panel">Abierto hoy</div>
      </section>
    </>
  );
}

beforeAll(() => {
  vi.stubGlobal(
    "matchMedia",
    vi.fn((query: string) => ({
      matches: query.includes("prefers-reduced-motion"),
      media: query,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  );
  vi.stubGlobal("scrollTo", vi.fn());
});

afterEach(() => {
  cleanup();
  ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
});

describe("landing motion resilience", () => {
  it("renders native content and links on the server without a hidden initial state", () => {
    const markup = renderToStaticMarkup(
      <LandingMotion style={{ color: "red" }} className="preview">
        <Content />
      </LandingMotion>,
    );
    expect(markup).toContain('class="food-site preview"');
    expect(markup).toContain('style="color:red"');
    expect(markup).toContain(
      '<h1 id="hero-title">Una mesa para compartir.</h1>',
    );
    expect(markup).toContain('href="#menu"');
    expect(markup).not.toContain("landing-motion-line");
    expect(markup).not.toMatch(/opacity|visibility|transform/);
  });

  it("keeps motion active under reduced motion and cleans its own scope through strict remounts", () => {
    gsap.registerPlugin(ScrollTrigger);
    const outside = document.createElement("div");
    document.body.append(outside);
    const otherTrigger = ScrollTrigger.create({ trigger: outside });
    const view = render(
      <StrictMode>
        <LandingMotion>
          <Content />
        </LandingMotion>
      </StrictMode>,
    );
    const hero = view.container.querySelector("h1")!;
    const heading = view.container.querySelector("h2")!;
    const card = view.container.querySelector<HTMLElement>(".menu-card")!;
    expect(hero.querySelector(".landing-motion-line")).not.toBeNull();
    expect(heading.getAttribute("aria-label")).toBe("A tu gusto.");
    // Four outer roots; the nested visit heading shares its column's trigger.
    expect(
      ScrollTrigger.getAll().filter((trigger) => trigger !== otherTrigger),
    ).toHaveLength(4);
    expect(Number(card.style.opacity)).toBeGreaterThanOrEqual(0.65);
    view.unmount();
    expect(ScrollTrigger.getAll()).toEqual([otherTrigger]);
    expect(hero.innerHTML).toBe("Una mesa para compartir.");
    expect(heading.innerHTML).toBe("A tu gusto.");
    expect(heading.hasAttribute("aria-label")).toBe(false);
    expect(card.style.opacity).toBe("");
    expect(card.style.transform).toBe("");
    outside.remove();
  });

  it("restores readable native markup after a controller fails midway through setup", async () => {
    const originalTimeline = gsap.timeline;
    let count = 0;
    vi.spyOn(gsap, "timeline").mockImplementation((vars) => {
      if (++count === 2) throw new Error("Synthetic controller failure");
      return originalTimeline(vars);
    });
    const view = render(
      <LandingMotion>
        <Content />
      </LandingMotion>,
    );
    await act(async () => {
      await Promise.resolve();
    });
    expect(view.container.querySelector("h1")!.innerHTML).toBe(
      "Una mesa para compartir.",
    );
    expect(view.container.querySelector("h2")!.innerHTML).toBe("A tu gusto.");
    expect(view.container.querySelector(".landing-motion-line")).toBeNull();
    expect(ScrollTrigger.getAll()).toHaveLength(0);
    expect(
      view.container.querySelector<HTMLElement>(".hero-art")!.style.opacity,
    ).toBe("");
    expect(
      view.getByRole("link", { name: "Ver la carta" }).getAttribute("href"),
    ).toBe("#menu");
  });
});
