"use client";

import { useRef, type HTMLAttributes } from "react";
import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";

gsap.registerPlugin(useGSAP);

const REVEAL_ROOTS = [
  ".section-heading",
  ".menu-group",
  ".menu-card",
  ".market-product",
  ".market-category-heading",
  ".market-buying-note",
  ".gallery-grid figure",
  ".visit-section > div",
  ".hours-panel",
].join(", ");

/** Content is native, visible HTML until the client adds its scoped motion. */
export function LandingMotion({
  children,
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  const container = useRef<HTMLDivElement>(null);

  useGSAP(
    (context, contextSafe) => {
      const root = container.current;
      if (!root || !contextSafe) return;

      let disposed = false;
      let failed = false;
      let refreshFrame = 0;

      const refreshLayout = () => {
        if (disposed || failed) return;
        cancelAnimationFrame(refreshFrame);
        refreshFrame = requestAnimationFrame(() => {
          if (disposed || failed) return;
          try {
            ScrollTrigger.refresh();
          } catch {
            recoverContent();
          }
        });
      };

      // Defer reversion until SplitText's current split has finished. Reverting
      // from inside onSplit would interrupt the plugin while it owns the DOM.
      const recoverContent = () => {
        if (failed || disposed) return;
        failed = true;
        queueMicrotask(() => {
          if (!disposed) context.revert();
        });
      };

      const reveal = (
        timeline: gsap.core.Timeline,
        targets: gsap.TweenTarget,
        position = 0,
        stagger = 0,
      ) => {
        timeline.fromTo(
          targets,
          { opacity: 0.65, y: 14 },
          { opacity: 1, y: 0, stagger },
          position,
        );
      };

      const splitHeading = (
        heading: HTMLElement,
        build: (lines: Element[]) => gsap.core.Timeline,
      ) => {
        SplitText.create(heading, {
          type: "lines",
          linesClass: "landing-motion-line",
          autoSplit: true,
          aria: "auto",
          onSplit: contextSafe((split: SplitText) => {
            if (disposed || failed) return;
            try {
              const timeline = build(split.lines);
              refreshLayout();
              // SplitText reverts this timeline and transfers its playhead
              // when a font or width change creates a new set of lines.
              return timeline;
            } catch {
              recoverContent();
            }
          }),
        });
      };

      try {
        gsap.registerPlugin(ScrollTrigger, SplitText);
        // Native menu-photo and FAQ disclosures change the positions below
        // them; measuring after their toggle keeps later reveals aligned.
        root.addEventListener("toggle", refreshLayout, true);

        // The user's site preference deliberately keeps authored motion active
        // under prefers-reduced-motion. No system media query gates this setup.
        const hero = root.querySelector<HTMLElement>(".hero");
        const heroHeading = hero?.querySelector<HTMLElement>("#hero-title");
        if (hero && heroHeading) {
          splitHeading(heroHeading, (lines) => {
            const intro = gsap.timeline({
              defaults: { duration: 0.72, ease: "power3.out" },
            });
            const eyebrow = hero.querySelector(".hero-copy > .eyebrow");
            const copy = hero.querySelectorAll(
              ".hero-description, .hero-actions, .hero-note",
            );
            const art = hero.querySelector(".hero-art");
            if (eyebrow) reveal(intro, eyebrow);
            reveal(intro, lines, 0.06, 0.07);
            if (copy.length) reveal(intro, copy, 0.16, 0.07);
            if (art) {
              intro.fromTo(
                art,
                { opacity: 0.65, y: 20, scale: 0.985 },
                { opacity: 1, y: 0, scale: 1 },
                0.08,
              );
            }
            return intro;
          });
        }

        // One timeline/trigger per outer reveal root. In particular, the visit
        // heading belongs to its column, avoiding two animated ancestors.
        const candidates = Array.from(
          root.querySelectorAll<HTMLElement>(REVEAL_ROOTS),
        );
        const roots = candidates.filter(
          (element) =>
            !candidates.some(
              (parent) => parent !== element && parent.contains(element),
            ),
        );
        for (const element of roots) {
          if (failed) break;
          const heading = element.querySelector<HTMLElement>("h2");
          const build = (lines?: Element[]) => {
            const timeline = gsap.timeline({
              defaults: { duration: 0.65, ease: "power3.out" },
              scrollTrigger: {
                trigger: element,
                start: "top 88%",
                end: "bottom top",
                toggleActions: "play none play reverse",
              },
            });
            if (!heading || !lines) {
              reveal(timeline, element);
            } else {
              // Animate sibling content rather than its parent so the text
              // keeps a single opacity/transform animation at a time.
              const headingGroup = heading.parentElement;
              const siblings = Array.from(element.children).flatMap((child) =>
                child === headingGroup
                  ? Array.from(child.children).filter(
                      (node) => node !== heading,
                    )
                  : child === heading
                    ? []
                    : [child],
              );
              if (siblings.length) reveal(timeline, siblings, 0, 0.05);
              reveal(timeline, lines, 0.04, 0.07);
            }
            return timeline;
          };
          if (heading) splitHeading(heading, build);
          else build();
        }

        // Image ratios reserve their space; refresh only after actual font/split
        // layout changes, coalescing all headings into one animation frame.
        document.fonts?.ready.then(() => {
          if (!disposed && !failed) refreshLayout();
        });
        refreshLayout();
      } catch {
        recoverContent();
      }

      return () => {
        disposed = true;
        cancelAnimationFrame(refreshFrame);
        root.removeEventListener("toggle", refreshLayout, true);
        // useGSAP reverts tweens, ScrollTriggers, SplitText markup, its resize
        // observers and font listeners before discarding this scoped context.
      };
    },
    { scope: container, dependencies: [children], revertOnUpdate: true },
  );

  return (
    <div
      {...props}
      className={["food-site", className].filter(Boolean).join(" ")}
      ref={container}
    >
      {children}
    </div>
  );
}
