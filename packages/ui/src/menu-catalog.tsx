"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import type { LandingContent, LandingItem } from "./model";
import { clampMenuPreview, findActiveCategory } from "./menu-catalog-utils";
import { ProductOrderLink } from "./product-order-link";
import type { AnalyticsAdapter } from "./conversion-link";

gsap.registerPlugin(useGSAP);

export function MenuCatalog({
  categories,
  items,
  siteKey,
  onTrack,
}: {
  categories: LandingContent["categories"];
  items: LandingItem[];
  siteKey: string;
  onTrack?: AnalyticsAdapter;
}) {
  const root = useRef<HTMLDivElement>(null);
  const nav = useRef<HTMLElement>(null);
  const preview = useRef<HTMLDivElement>(null);
  const [activeCategory, setActiveCategory] = useState<string | null>(
    categories[0]?.id ?? null,
  );
  const [previewItem, setPreviewItem] = useState<LandingItem | null>(null);

  useEffect(() => {
    const container = root.current;
    const navigation = nav.current;
    if (!container || !navigation) return;
    const groups = [
      ...container.querySelectorAll<HTMLElement>("[data-menu-category]"),
    ];
    let frame = 0;
    const update = () => {
      frame = 0;
      const next = findActiveCategory(
        groups.map((group) => ({
          id: group.dataset.menuCategory!,
          top: group.getBoundingClientRect().top,
        })),
        navigation.getBoundingClientRect().bottom + 16,
        {
          scrollMarginTop: Math.max(
            0,
            ...groups.map(
              (group) =>
                Number.parseFloat(
                  window.getComputedStyle(group).scrollMarginTop,
                ) || 0,
            ),
          ),
          scrollPaddingTop:
            Number.parseFloat(
              window.getComputedStyle(document.documentElement)
                .scrollPaddingTop,
            ) || 0,
        },
      );
      setActiveCategory(next);
    };
    const schedule = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    container.addEventListener("toggle", schedule, true);
    const resize =
      typeof ResizeObserver === "undefined"
        ? null
        : new ResizeObserver(schedule);
    resize?.observe(container);
    resize?.observe(navigation);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      container.removeEventListener("toggle", schedule, true);
      resize?.disconnect();
    };
  }, [categories]);

  useGSAP(
    (_context, contextSafe) => {
      const card = preview.current;
      const container = root.current;
      if (!card || !container || !window.matchMedia || !contextSafe) return;
      const media = gsap.matchMedia();
      // The user's site preference keeps animation enabled under reduced motion.
      media.add("(hover: hover) and (pointer: fine)", () => {
        const xTo = gsap.quickTo(card, "x", {
          duration: 0.2,
          ease: "power3.out",
        });
        const yTo = gsap.quickTo(card, "y", {
          duration: 0.2,
          ease: "power3.out",
        });
        let visible = false;
        let lastPointer = { x: 0, y: 0 };
        let viewport = { width: window.innerWidth, height: window.innerHeight };
        let size = {
          width: card.offsetWidth || 280,
          height: card.offsetHeight || 300,
        };
        const hide = contextSafe(() => {
          visible = false;
          gsap.to(card, {
            autoAlpha: 0,
            scale: 0.97,
            duration: 0.18,
            ease: "power2.out",
            overwrite: "auto",
          });
        });
        const move = (event: PointerEvent) => {
          if (!visible || event.pointerType !== "mouse") return;
          lastPointer = { x: event.clientX, y: event.clientY };
          const position = clampMenuPreview(lastPointer, size, viewport);
          xTo(position.x);
          yTo(position.y);
        };
        const bindings = [
          ...container.querySelectorAll<HTMLElement>("[data-preview-item]"),
        ].map((row) => {
          const item = items.find(
            (candidate) => candidate.id === row.dataset.previewItem,
          );
          const show = contextSafe((event: PointerEvent) => {
            if (event.pointerType !== "mouse" || !item?.image) return;
            lastPointer = { x: event.clientX, y: event.clientY };
            const position = clampMenuPreview(lastPointer, size, viewport);
            if (!visible) {
              xTo(position.x, position.x);
              yTo(position.y, position.y);
            }
            setPreviewItem(item);
            visible = true;
            move(event);
            gsap.to(card, {
              autoAlpha: 1,
              scale: 1,
              duration: 0.2,
              ease: "power2.out",
              overwrite: "auto",
            });
          });
          row.addEventListener("pointerenter", show);
          row.addEventListener("pointermove", move);
          row.addEventListener("pointerleave", hide);
          return { row, show };
        });
        const onResize = () => {
          viewport = { width: window.innerWidth, height: window.innerHeight };
          size = {
            width: card.offsetWidth || 280,
            height: card.offsetHeight || 300,
          };
          const position = clampMenuPreview(lastPointer, size, viewport);
          xTo(position.x);
          yTo(position.y);
        };
        const onKey = (event: KeyboardEvent) => {
          if (event.key === "Escape" || event.key === "Tab") hide();
        };
        window.addEventListener("resize", onResize);
        window.addEventListener("scroll", hide, { passive: true });
        window.addEventListener("blur", hide);
        window.addEventListener("keydown", onKey);
        return () => {
          bindings.forEach(({ row, show }) => {
            row.removeEventListener("pointerenter", show);
            row.removeEventListener("pointermove", move);
            row.removeEventListener("pointerleave", hide);
          });
          window.removeEventListener("resize", onResize);
          window.removeEventListener("scroll", hide);
          window.removeEventListener("blur", hide);
          window.removeEventListener("keydown", onKey);
        };
      });
      return () => media.revert();
    },
    { scope: root, dependencies: [items, categories], revertOnUpdate: true },
  );

  return (
    <div className="menu-catalog" ref={root}>
      <nav
        className="category-links menu-category-nav"
        aria-label="Categorías de la carta"
        ref={nav}
      >
        {categories.map((category) => (
          <a
            href={`#category-${category.id}`}
            key={category.id}
            aria-current={
              activeCategory === category.id ? "location" : undefined
            }
          >
            {category.name}
          </a>
        ))}
      </nav>
      <div className="menu-groups">
        {categories.map((category) => (
          <section
            id={`category-${category.id}`}
            data-menu-category={category.id}
            className="menu-group"
            key={category.id}
            aria-labelledby={`category-heading-${category.id}`}
          >
            <div className="menu-category-heading">
              <h3 id={`category-heading-${category.id}`}>{category.name}</h3>
              {category.group && (
                <p className="menu-category-description">{category.group}</p>
              )}
              {category.description && (
                <p className="menu-group__intro">{category.description}</p>
              )}
            </div>
            <ul>
              {items
                .filter((item) => item.categoryId === category.id)
                .map((item) => (
                  <li
                    className={
                      item.image
                        ? "menu-catalog-item has-photograph"
                        : "menu-catalog-item"
                    }
                    data-preview-item={item.image ? item.id : undefined}
                    key={item.id}
                  >
                    <div className="menu-catalog-item-copy">
                      <h4>{item.name}</h4>
                      {item.description && (
                        <p className="menu-item__description">
                          {item.description}
                        </p>
                      )}
                      {item.unavailable && (
                        <span className="status">Agotado</span>
                      )}
                      <div className="menu-item-actions">
                        <ProductOrderLink
                          item={item}
                          siteKey={siteKey}
                          location="menu-item"
                          onTrack={onTrack}
                        />
                        {item.image && (
                          <details className="menu-photo-disclosure">
                            <summary
                              aria-label={`Ver fotografía de ${item.name}`}
                            >
                              <span>Ver fotografía</span>
                              <svg
                                className="menu-photo-icon"
                                aria-hidden="true"
                                focusable="false"
                                viewBox="0 0 20 20"
                                fill="none"
                              >
                                <path
                                  d="M5 15 15 5M5 5h10v10"
                                  stroke="currentColor"
                                  strokeWidth="1.4"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                            </summary>
                            <figure className="menu-inline-photo">
                              <div>
                                <Image
                                  src={item.image.src}
                                  alt={item.image.alt}
                                  fill
                                  sizes="(max-width: 680px) calc(100vw - 140px), 360px"
                                  loading="lazy"
                                />
                              </div>
                              <figcaption>Imagen referencial</figcaption>
                            </figure>
                          </details>
                        )}
                      </div>
                    </div>
                    <span className="menu-price">{item.price}</span>
                  </li>
                ))}
            </ul>
          </section>
        ))}
      </div>
      <div className="menu-cursor-preview" ref={preview} aria-hidden="true">
        {previewItem?.image && (
          <>
            <div className="menu-cursor-photo">
              <Image src={previewItem.image.src} alt="" fill sizes="280px" />
              <span>Imagen referencial</span>
            </div>
            <div className="menu-cursor-caption">
              <strong>{previewItem.name}</strong>
              <span>{previewItem.price}</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
