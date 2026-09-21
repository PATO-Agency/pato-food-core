import { createHash } from "node:crypto";
import { createClient, type SanityClient } from "@sanity/client";
import { encodeSignatureHeader } from "@sanity/webhook";
import {
  assertProductionContent,
  parseSiteContent,
  previewSiteQuery,
  publishedSiteQuery,
} from "@pato-food/content-contract";

type DocumentStub = { _id: string; _type: string };

const API_VERSION = "2026-09-18";
const apply = process.argv.includes("--apply");
const keep = process.argv.includes("--keep");
const confirmedSandbox = process.argv.includes("--confirm-sandbox-write");
const confirmedProject = process.argv
  .find((argument) => argument.startsWith("--confirm-project="))
  ?.slice("--confirm-project=".length);
const baseUrlArgument = process.argv
  .find((argument) => argument.startsWith("--base-url="))
  ?.slice("--base-url=".length);

const ids = {
  business: "business",
  whatsapp: "whatsappConversion",
  category: "pato-synthetic-e2e-category",
  item: "pato-synthetic-e2e-item",
  promotion: "pato-synthetic-e2e-promotion",
  faq: "pato-synthetic-e2e-faq",
  testimonial: "pato-synthetic-e2e-testimonial",
} as const;

const baseId = (id: string) => id.replace(/^drafts\./, "");
const draftId = (id: string) => `drafts.${baseId(id)}`;
const receiptId = (key: string) =>
  `revalidation-receipt.${createHash("sha256").update(key, "utf8").digest("hex")}`;
const assert = (condition: unknown, message: string): asserts condition => {
  if (!condition) throw new Error(message);
};

function approvedFields(observedAt: string) {
  return {
    contentStatus: "approved",
    sourceRef: "pato-synthetic-editorial-e2e",
    sourceObservedAt: observedAt,
    approvedAt: observedAt,
  };
}

function syntheticDocuments(observedAt: string) {
  const editorial = approvedFields(observedAt);
  return {
    publishedSingletons: [
      {
        _id: ids.business,
        _type: "business",
        ...editorial,
        displayName: "Cocina Sintética PATO",
        tagline: "Contenido aislado para pruebas editoriales",
        description:
          "Marca ficticia utilizada exclusivamente para comprobar preview, publicación y limpieza.",
        businessLines: ["Comida de prueba"],
        hero: {
          eyebrow: "PRUEBA SINTÉTICA",
          title: "Recorrido editorial verificable",
          text: "Este contenido no representa a un negocio real.",
        },
        address: {
          line: "Dirección sintética 123",
          city: "Lima",
          region: "Lima",
          country: "PE",
        },
        phones: [],
        socialLinks: [],
        timezone: "America/Lima",
        openingHours: Array.from({ length: 7 }, (_, day) => ({
          _key: `day-${day}`,
          day,
          closed: false,
          intervals: [{ _key: "interval-0", opens: "09:00", closes: "18:00" }],
        })),
        specialHours: [],
        paymentMethods: [],
        proofPoints: [],
      },
      {
        _id: ids.whatsapp,
        _type: "whatsappConversion",
        ...editorial,
        enabled: false,
        intent: "inquiry",
        ctaLabel: "Contacto sintético",
        prefilledMessage: "Mensaje de prueba; no enviar.",
        placements: ["hero"],
        fallbackLabel: "Canal desactivado durante la prueba",
      },
    ],
    drafts: [
      {
        _id: draftId(ids.category),
        _type: "menuCategory",
        ...editorial,
        name: "Categoría sintética",
        slug: { _type: "slug", current: "categoria-sintetica" },
        description: "Visible primero en preview y después en publicado.",
        groupLabel: "E2E",
        sortOrder: 9900,
        visible: true,
      },
      {
        _id: draftId(ids.item),
        _type: "menuItem",
        ...editorial,
        name: "Plato sintético",
        slug: { _type: "slug", current: "plato-sintetico" },
        category: {
          _type: "reference",
          _ref: ids.category,
          _weak: true,
        },
        description: "Marcador inequívoco PATO-SYNTHETIC-DRAFT-2026-09-19.",
        pricingMode: "fixed",
        priceOptions: [
          {
            _key: "price-0",
            label: "Unidad",
            amount: 12.5,
            currency: "PEN",
            billingUnit: "unit",
            unitQuantity: 1,
          },
        ],
        badges: ["Sintético"],
        featured: true,
        availability: "available",
        sortOrder: 9900,
      },
      {
        _id: draftId(ids.promotion),
        _type: "promotion",
        ...editorial,
        title: "Promoción sintética activa",
        text: "Vigencia amplia para comprobar el filtro temporal.",
        startsAt: "2026-09-01T00:00:00-05:00",
        endsAt: "2026-10-01T00:00:00-05:00",
        active: true,
        campaignId: "pato-synthetic-e2e",
        useWhatsappCta: false,
      },
      {
        _id: draftId(ids.faq),
        _type: "faq",
        ...editorial,
        question: "¿Este contenido es real?",
        answer: "No. Existe únicamente durante una prueba automatizada.",
        sortOrder: 9900,
        visible: true,
      },
      {
        _id: draftId(ids.testimonial),
        _type: "testimonial",
        ...editorial,
        author: "Persona sintética",
        text: "Testimonio ficticio para validar el contrato editorial.",
        source: "Harness E2E",
        permissionNote: "Contenido generado para pruebas; sin persona real.",
        sortOrder: 9900,
        visible: true,
      },
    ],
  };
}

async function existingDocuments(client: SanityClient, documentIds: string[]) {
  return client.fetch<DocumentStub[]>(
    "*[_id in $ids]{_id,_type}",
    { ids: documentIds },
    { perspective: "raw" },
  );
}

async function removeExactDocuments(
  client: SanityClient,
  documentIds: string[],
) {
  const existing = await existingDocuments(client, documentIds);
  if (!existing.length) return 0;
  let transaction = client.transaction();
  for (const document of existing)
    transaction = transaction.delete(document._id);
  await transaction.commit({ returnDocuments: false });
  return existing.length;
}

async function publish(client: SanityClient, publishedId: string) {
  await client.action({
    actionType: "sanity.action.document.publish",
    draftId: draftId(publishedId),
    publishedId,
  });
}

async function deliverWebhook(input: {
  baseUrl: string;
  secret: string;
  projectId: string;
  dataset: string;
  document: DocumentStub;
  operation: "create" | "update" | "delete";
  key: string;
  webhookId: string;
}) {
  const body = JSON.stringify(input.document);
  const signature = await encodeSignatureHeader(body, Date.now(), input.secret);
  const response = await fetch(
    new URL("/api/revalidate/sanity", input.baseUrl),
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "idempotency-key": input.key,
        "sanity-dataset": input.dataset,
        "sanity-document-id": input.document._id,
        "sanity-operation": input.operation,
        "sanity-project-id": input.projectId,
        "sanity-webhook-id": input.webhookId,
        "sanity-webhook-signature": signature,
      },
      body,
    },
  );
  const result = (await response.json()) as Record<string, unknown>;
  assert(response.ok, `Webhook returned ${response.status}`);
  return result;
}

async function verifyPreviewSurface(baseUrl: string) {
  const enable = await fetch(new URL("/api/draft/enable?redirect=/", baseUrl), {
    redirect: "manual",
  });
  assert(enable.status === 307, `Draft enable returned ${enable.status}`);
  const cookie = enable.headers.get("set-cookie");
  assert(cookie, "Draft enable did not set a cookie");
  const page = await fetch(new URL("/", baseUrl), {
    headers: { cookie: cookie.split(";", 1)[0]! },
  });
  assert(page.ok, `Preview page returned ${page.status}`);
  const html = await page.text();
  assert(
    html.includes("PATO-SYNTHETIC-DRAFT-2026-09-19"),
    "Preview page did not render the synthetic draft marker",
  );
}

async function main() {
  const projectId = process.env.SANITY_PROJECT_ID?.trim();
  const dataset = process.env.SANITY_DATASET?.trim();
  const readToken = process.env.SANITY_READ_TOKEN?.trim();
  const writeToken = process.env.SANITY_WRITE_TOKEN?.trim();
  const webhookSecret = process.env.SANITY_WEBHOOK_SECRET?.trim();
  const webhookId =
    process.env.SANITY_WEBHOOK_ID?.trim() || "pato-synthetic-local";
  const baseUrl = baseUrlArgument?.trim().replace(/\/$/, "");

  console.log("PATO synthetic editorial integration plan");
  console.log(
    "scope=draft-preview-publish-unpublish-delete-webhook-replay cleanup=exact-ids",
  );
  if (!apply) {
    console.log(
      "dry-run=true; add --apply --confirm-sandbox-write --confirm-project=<projectId>",
    );
    return;
  }
  if (!projectId || !/^[a-z0-9-]+$/.test(projectId))
    throw new Error("SANITY_PROJECT_ID is missing or invalid");
  if (dataset !== "sandbox")
    throw new Error("The integration harness is restricted to sandbox");
  if (process.env.PATO_SITE_VISIBILITY !== "internal")
    throw new Error("The integration harness requires internal visibility");
  if (!readToken || readToken.length < 24)
    throw new Error("SANITY_READ_TOKEN is missing or invalid");
  if (!writeToken || writeToken.length < 24)
    throw new Error("SANITY_WRITE_TOKEN is missing or invalid");
  if (!confirmedSandbox || confirmedProject !== projectId)
    throw new Error("Sandbox and project confirmation flags are required");
  if (baseUrl && (!webhookSecret || webhookSecret.length < 32))
    throw new Error("A strong SANITY_WEBHOOK_SECRET is required with base URL");

  const writeClient = createClient({
    projectId,
    dataset,
    apiVersion: API_VERSION,
    perspective: "raw",
    useCdn: false,
    token: writeToken,
  });
  const readClient = createClient({
    projectId,
    dataset,
    apiVersion: API_VERSION,
    useCdn: false,
    token: readToken,
  });
  const runMarker = Date.now();
  const webhookKeys = {
    create: `pato-synthetic-create-${runMarker}`,
    unpublish: `pato-synthetic-unpublish-${runMarker}`,
    delete: `pato-synthetic-delete-${runMarker}`,
  };
  const testIds = [
    ids.business,
    ids.whatsapp,
    ids.category,
    draftId(ids.category),
    ids.item,
    draftId(ids.item),
    ids.promotion,
    draftId(ids.promotion),
    ids.faq,
    draftId(ids.faq),
    ids.testimonial,
    draftId(ids.testimonial),
    ...Object.values(webhookKeys).map(receiptId),
  ];
  const conflicts = await existingDocuments(writeClient, testIds);
  assert(
    conflicts.length === 0,
    `Refusing to overwrite ${conflicts.length} existing exact test document(s)`,
  );

  const created = syntheticDocuments(new Date().toISOString());
  let completed = false;
  try {
    let transaction = writeClient.transaction();
    for (const document of [...created.publishedSingletons, ...created.drafts])
      transaction = transaction.create(document);
    await transaction.commit({ returnDocuments: false });

    const previewBefore = parseSiteContent(
      await readClient.fetch(previewSiteQuery, {}, { perspective: "drafts" }),
    );
    assert(
      previewBefore.menuItems.some((item) => item.id === ids.item),
      "Preview did not expose the synthetic draft item",
    );
    const publishedBefore = parseSiteContent(
      await readClient.fetch(
        publishedSiteQuery,
        {},
        { perspective: "published" },
      ),
    );
    assertProductionContent(publishedBefore);
    assert(
      !publishedBefore.menuItems.some((item) => item.id === ids.item),
      "Published query exposed the draft before publication",
    );
    if (baseUrl) await verifyPreviewSurface(baseUrl);
    console.log("draft-isolation=passed preview=visible published=hidden");

    for (const id of [
      ids.category,
      ids.item,
      ids.promotion,
      ids.faq,
      ids.testimonial,
    ])
      await publish(writeClient, id);

    const publishedAfter = parseSiteContent(
      await readClient.fetch(
        publishedSiteQuery,
        {},
        { perspective: "published" },
      ),
    );
    assertProductionContent(publishedAfter);
    assert(
      publishedAfter.menuItems.some((item) => item.id === ids.item),
      "Published query did not expose the synthetic item",
    );
    assert(
      publishedAfter.promotions.some(
        (promotion) => promotion.id === ids.promotion,
      ),
      "Published query did not expose the synthetic promotion",
    );
    console.log("publication=passed contract=valid");

    if (baseUrl && webhookSecret) {
      const webhookInput = {
        baseUrl,
        secret: webhookSecret,
        webhookId,
        projectId,
        dataset,
        document: { _id: ids.item, _type: "menuItem" },
        operation: "create" as const,
        key: webhookKeys.create,
      };
      const first = await deliverWebhook(webhookInput);
      const replay = await deliverWebhook(webhookInput);
      assert(first.replay !== true, "First webhook was marked as replay");
      assert(replay.replay === true, "Repeated webhook was not deduplicated");
      console.log("webhook-create=passed replay=deduplicated");
    } else {
      console.log("webhook=skipped reason=no-base-url");
    }

    await writeClient.action({
      actionType: "sanity.action.document.unpublish",
      draftId: draftId(ids.item),
      publishedId: ids.item,
    });
    const afterUnpublish = parseSiteContent(
      await readClient.fetch(
        publishedSiteQuery,
        {},
        { perspective: "published" },
      ),
    );
    assert(
      !afterUnpublish.menuItems.some((item) => item.id === ids.item),
      "Unpublished item remained in the published query",
    );
    if (baseUrl && webhookSecret)
      await deliverWebhook({
        baseUrl,
        secret: webhookSecret,
        webhookId,
        projectId,
        dataset,
        document: { _id: ids.item, _type: "menuItem" },
        operation: "delete",
        key: webhookKeys.unpublish,
      });
    console.log("unpublish=passed operation=delete");

    await writeClient.action({
      actionType: "sanity.action.document.delete",
      publishedId: ids.faq,
      includeDrafts: [],
    });
    const afterDelete = parseSiteContent(
      await readClient.fetch(
        publishedSiteQuery,
        {},
        { perspective: "published" },
      ),
    );
    assert(
      !afterDelete.faqs.some((faq) => faq.id === ids.faq),
      "Deleted FAQ remained in the published query",
    );
    if (baseUrl && webhookSecret)
      await deliverWebhook({
        baseUrl,
        secret: webhookSecret,
        webhookId,
        projectId,
        dataset,
        document: { _id: ids.faq, _type: "faq" },
        operation: "delete",
        key: webhookKeys.delete,
      });
    console.log("delete=passed stale-content=absent");
    completed = true;
  } finally {
    if (!keep) {
      const removed = await removeExactDocuments(writeClient, testIds);
      console.log(`cleanup=passed removed=${removed}`);
    } else {
      console.log("cleanup=skipped explicit-keep=true");
    }
  }
  assert(completed, "Synthetic editorial flow did not complete");
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "Unknown failure";
  console.error(`Synthetic editorial flow failed safely: ${message}`);
  process.exitCode = 1;
});
