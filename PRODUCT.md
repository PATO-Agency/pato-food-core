# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users and Purpose

Private demonstration for Vicafoods and PATO. Visitors explore the known food catalogue; the editor maintains it through Sanity. Success means editing a draft, previewing it and publishing a visible website change.

## Operating Context

Next.js web app and hosted Sanity Studio. Private sandbox, reserved `pato-demo-vicafoods-` documents and preexisting source documents preserved. The customer production release is pending.

## Capabilities and Constraints

Five categories and seventeen products, prices and units transcribed from supplied sources. Business validation remains pending. Stock photos are licensed and explicitly referential. Ordering is disabled. Content and native actions must remain available without JavaScript or if the animation controller fails.

## Brand Commitments

The owner specifies Vicafoods' black background, white lettering, strong yellow/gold accents and rustic old oven brick. A quiet brick pattern is drawn with CSS directly in the page background, without a wall photograph, confirmed on 13 October 2026. Requested interactions: cursor-following product photo, improved category navigation, balanced hero, GSAP scroll and text reveals.

## Evidence on Hand

Known menu: `examples/vicafoods/src/index.ts`. Licensed photos and provenance: `apps/web/public/demo/vicafoods-reference/`. No stock photo represents an authentic Vicafoods dish. Private delivery evidence and runbooks are under `docs/`.

## Product Principles

- Preserve factual content and editorial control.
- Photo exploration works with mouse, touch and keyboard.
- Authored motion stays active with `prefers-reduced-motion: reduce`, per explicit owner preference.
- Keep the demonstration protected until production is approved.

## Open Decisions

Content approval, live contact, production ownership/domain, backup recovery and client acceptance.
