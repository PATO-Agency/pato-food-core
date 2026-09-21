# Reference web

Local-only Next.js App Router demonstration. Content uses the VICAFOODS fixture by default; generic components live in `@pato-food/ui`. An isolated Sanity sandbox is configured for editorial preview, but no analytics script, public deployment or active contact destination is provisioned.

Set `PATO_CONTENT_SOURCE=sanity` only with an isolated, PATO-controlled project and configure `SANITY_PROJECT_ID`, `SANITY_DATASET` and the server-only `SANITY_READ_TOKEN`. The current `sandbox` dataset is public; the token is still kept server-only and grants Viewer access only. CMS responses are projected and parsed at runtime; published reads accept only approved content. Draft Mode switches to the draft perspective. Unknown source values fail closed, and fixture content is rejected whenever `PATO_SITE_VISIBILITY=public`.

The internal demo sets generic robots metadata, `robots.txt` and `X-Robots-Tag` to `noindex`; it emits neither VICAFOODS metadata nor structured data. These are indexing signals, not access control. Internal production mode fails closed, while local development is restricted to loopback hosts. A local `next start` smoke test must deliberately set `PATO_LOCAL_INTERNAL=confirmed` and remain bound to loopback. A hosted internal preview additionally requires real upstream authentication and the explicit `PATO_HOSTED_INTERNAL_PREVIEW=authenticated` assertion; neither assertion provides authentication by itself.

A future public release additionally requires `PATO_SITE_URL` with the approved HTTPS origin. Only approved Sanity content can then produce canonical, Open Graph/Twitter metadata, sitemap and `FoodEstablishment` structured data. The URL is never inferred from request headers. Preview stays non-indexable and never emits business structured data.

## Integration adapters

- `/api/draft/enable?secret=…&redirect=/` requires `SANITY_PREVIEW_SECRET` of at least 32 characters. Draft cookies expire after 30 minutes. Only an internal Sanity surface honors the cookie, uses the draft perspective and bypasses the published-content cache.
- `/api/draft/disable` exits preview.
- In loopback development, `internal + sanity` reads drafts automatically so
  `http://localhost:3000` works across browser profiles without sharing a Draft
  Mode cookie. Production and hosted previews do not inherit this behavior.
- `POST /api/revalidate/sanity` requires `SANITY_WEBHOOK_SECRET` of at least 32 characters, Sanity's `idempotency-key`, official operation and source headers, a valid signature and a canonical published document payload `{ "_id": "…", "_type": "menuItem" }`. It bounds bodies to 16 KiB, verifies project/dataset/document and optional `SANITY_WEBHOOK_ID`, and maps only supported document types to cache tags. `SANITY_REVALIDATION_TOKEN` persists hashed replay receipts and must be limited to the `revalidationReceipt` type.
- Configure delete/unpublish payloads with `coalesce(after()._id, before()._id)` and the equivalent `_type`; see the repository runbook. Before production, add telemetry/alert routing, authenticated preview hosting and a consent-approved analytics provider.
- CTAs are actual anchors when enabled, with a non-blocking analytics adapter; demos use the disabled provider. Unknown contact numbers render a visible pending state with no destination.

The internal fixture renders the two supplied local food photographs and keeps all supplied assets publication-blocked because usage rights are not confirmed. Missing media still renders honest editorial placeholders. A production image adapter must use approved, optimized derivatives and an explicit trusted remote-host allowlist.
