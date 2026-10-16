# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users and Purpose

Private demonstration for Vicafoods and PATO. Visitors explore the known food catalogue; the editor maintains it through Sanity. Success means editing a draft, previewing it and publishing a visible website change.

## Operating Context

Next.js web app and hosted Sanity Studio. Private sandbox, reserved `pato-demo-vicafoods-` documents and preexisting source documents preserved. The customer production release is pending.

## Capabilities and Constraints

Seven categories and twenty-seven catalogue records: fourteen prepared dishes, twelve Carnicería & Market products and one Catering service. The editable Sanity category field `catalogSection` separates these sections with `menu`, `market` and `catering`. Market contains the original two products plus seven cuts and three sausages added on 14 October 2026. Eight new prices reference the business's historical 2024 butcher catalogue; two maple sausage prices are explicitly illustrative. Current prices and business validation remain pending. Stock photos are licensed and explicitly referential. Catering inquiries through WhatsApp are enabled independently through `cateringEnabled` and `cateringMessage`, using the confirmed destination. Product WhatsApp links are authorized on 15 October 2026 for available prepared dishes, featured dishes and Market products. Messages identify exact product name, catalogue section, presentation and sale unit, ask about availability and ordering, and omit prices or totals. Sold-out products have no order link; hidden products do not render. Catering remains independently enabled. No cart, payment, order database or WhatsApp API is included. Technical verification and deployment are recorded separately in the 15 October order runbook. Content and native actions must remain available without JavaScript or if the animation controller fails.

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

Content approval (postponed), production ownership/domain/accounts (for later), off-device backup and full disaster recovery, editorial training and client acceptance. On 15 October 2026 the user confirmed successful use on a physical phone, including opening WhatsApp; device/browser details and a detailed test record were not supplied. New product links require their own verification; the phone report does not approve production. Current-content backup and isolated draft recovery have been rehearsed locally.
