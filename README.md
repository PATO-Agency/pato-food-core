# PATO Food Core

Private TypeScript monorepo for a configurable food-business landing page and structured Sanity editing. The local reference app uses fixtures and requires no customer account or secret.

**INTERNAL DEMO — DO NOT PUBLISH.** VICAFOODS is a prospect, not an approved customer. Its fixture remains `prospect`, `internalOnly`, and `publishBlocked`. Do not deploy it, connect a domain, provision customer services, enable real contact destinations, or publish its assets. A successful build or merged PR is not publication approval. Production requires a signed engagement, verified business details, asset rights, isolated accounts, and written launch approval.

## Local setup

Use Node.js 22.12 or later (Node 22 LTS recommended) and npm 10 or later.

```sh
npm ci
npm run dev
```

Open [localhost:3000](http://localhost:3000). The demo uses local fixtures by default. For the first dependency resolution, maintainers run `npm install` and commit the generated `package-lock.json`; subsequent installs use `npm ci`.

The root `.env.example` documents optional integrations. Put web settings in `apps/web/.env.local` and Studio settings in `apps/studio/.env.local`. Never commit these files or prefix server tokens with `NEXT_PUBLIC_`. Sanity editing requires a PATO-controlled test project with its own project ID and dataset; run `npm run dev:studio` after configuring it. Creating that project is a separate authorized operational step.

## Workspaces and validation

`apps/web` composes the Next.js landing; `apps/studio` hosts Sanity Studio. Shared packages define content contracts, editorial schemas, reusable UI and analytics. `examples/vicafoods` holds prospect-specific demonstration content. Business names and client copy belong in fixtures, not shared packages.

```sh
npm run lint
npm run typecheck
npm test
npm run check:secrets
npm run build
npm run format:check
npm run verify:editorial:synthetic
```

`npm run check` runs lint, type checks, tests, secret-pattern checks and workspace builds. `npm run format` formats implementation files; product source documents are excluded. CI validates Windows and Linux without publishing. Source packages export TypeScript and are transpiled by consuming apps. This initial private workspace is not a package release or an automatic client provisioning system.

## Contact tracking

`@pato-food/analytics` exports `trackWhatsAppClick(input, provider)`, `disabledAnalytics`, and `createGtagProvider`. Call tracking from a real WhatsApp anchor without cancelling navigation. Tracking is deferred, best effort, and catches synchronous and asynchronous provider failures. The default provider is disabled; no SDK or consent is installed implicitly.

Events are named `whatsapp_click` and mean contact intent, never a sale or confirmed order. Only placement, intent, developer-controlled opaque IDs, site key and the fixed landing path `/` are projected. Phone numbers, messages, link URLs, arbitrary paths and query strings are excluded. Never put names, contact details or user-supplied text in identifier fields. Enabling a GA4 adapter additionally requires an approved consent policy and deduplication/disablement of automatic outbound tracking, which could otherwise capture a WhatsApp URL.

## Delivery boundaries

The synthetic editorial harness covers draft isolation, publication, unpublication, deletion and signed webhook replay without using prospect content. It is dry-run by default, is restricted to the `sandbox` dataset and cleans only its reserved exact IDs. See the [Sanity editorial integration runbook](docs/runbooks/sanity-editorial-integration.md) before running it. A successful local harness does not replace evidence of delivery from a real Sanity webhook to a protected HTTPS host.

Authenticated protected previews, tenant isolation, real-device accessibility/performance, consent, backup recovery and release approval still require their own integration evidence before production. The built-in secret pattern check is a narrow defense and does not certify absence of all secrets.

No cart, payments, CRM, chatbot, WhatsApp API, automated bookings or multi-tenant dashboard are included. See the [technical architecture](docs/technical/2026-09-17-pato-food-core-architecture.md), [development plan](docs/plans/2026-09-17-pato-food-core-development-plan.md) and [protected preview runbook](docs/runbooks/vercel-protected-preview.md) for scope and launch gates. The implemented baseline is accepted for the internal pilot; ownership, external accounts and every production approval remain explicit open decisions.
