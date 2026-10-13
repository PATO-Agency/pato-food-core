import { defineConfig } from "sanity";
import { presentationTool } from "sanity/presentation";
import { structureTool } from "sanity/structure";
import type { StructureResolver } from "sanity/structure";
import { createPreviewTool } from "./preview-tool";
import {
  schemaTypes,
  singletonTypes,
  singletonActions,
  structure,
} from "@pato-food/sanity-schema";

const previewUrl =
  process.env.SANITY_STUDIO_PREVIEW_URL ||
  process.env.SANITY_STUDIO_PREVIEW_ORIGIN ||
  "http://localhost:3000";
const parsedPreviewUrl = new URL(previewUrl);
if (
  parsedPreviewUrl.search ||
  parsedPreviewUrl.hash ||
  parsedPreviewUrl.username ||
  parsedPreviewUrl.password
)
  throw new Error(
    "SANITY_STUDIO_PREVIEW_URL must not contain credentials or query parameters",
  );
const previewOrigin = parsedPreviewUrl.origin;
const demoStudio = process.env.SANITY_STUDIO_DEMO_SITE === "vicafoods";
if (demoStudio && process.env.SANITY_STUDIO_DATASET !== "sandbox")
  throw new Error("Vicafoods demo Studio requires the sandbox dataset");
const studioStructure: StructureResolver = demoStudio
  ? (S) =>
      S.list()
        .title("Demo Vicafoods")
        .items([
          ...[
            ["business", "Negocio de la demo"],
            ["whatsappConversion", "Canal de la demo"],
          ].map(([type, title]) =>
            S.listItem()
              .title(title!)
              .id(`demo-${type}`)
              .child(
                S.document()
                  .schemaType(type!)
                  .documentId(`pato-demo-vicafoods-${type}`),
              ),
          ),
          ...[
            ["menuCategory", "Categorías de la demo"],
            ["menuItem", "Productos de la demo"],
            ["galleryImage", "Fotografías de referencia"],
          ].map(([type, title]) =>
            S.listItem()
              .title(title!)
              .id(`demo-${type}`)
              .child(
                S.documentTypeList(type!)
                  .title(title!)
                  .filter(
                    '_type == $type && (string::startsWith(_id, "pato-demo-vicafoods-") || string::startsWith(_id, "drafts.pato-demo-vicafoods-"))',
                  )
                  .params({ type }),
              ),
          ),
          S.divider(),
          S.listItem()
            .title("Contenido original")
            .id("original-content")
            .child(
              S.list()
                .title("Contenido original")
                .items([
                  ...["business", "whatsappConversion"].map((type) =>
                    S.listItem()
                      .title(type)
                      .id(type)
                      .child(S.document().schemaType(type).documentId(type)),
                  ),
                  ...S.documentTypeListItems().filter(
                    (item) => !singletonTypes.has(item.getId()!),
                  ),
                ]),
            ),
        ])
  : structure;
const isLocalPreview =
  parsedPreviewUrl.protocol === "http:" &&
  ["localhost", "127.0.0.1", "[::1]"].includes(parsedPreviewUrl.hostname);
if (parsedPreviewUrl.protocol !== "https:" && !isLocalPreview)
  throw new Error(
    "SANITY_STUDIO_PREVIEW_URL must use HTTPS or a loopback HTTP origin",
  );

// Buildable scaffold only. Supply a separately owned project to connect a Studio.
export default defineConfig({
  name: "pato-food-reference",
  title: "PATO Food — Content Studio",
  projectId: process.env.SANITY_STUDIO_PROJECT_ID || "localdemo",
  dataset: process.env.SANITY_STUDIO_DATASET || "development",
  plugins: [
    structureTool({ structure: studioStructure }),
    presentationTool({
      previewUrl: {
        initial: previewUrl,
        previewMode: {
          enable: "/api/draft/enable",
          disable: "/api/draft/disable",
        },
      },
      allowOrigins: [previewOrigin],
    }),
  ],
  tools: [createPreviewTool(previewOrigin)],
  schema: {
    types: schemaTypes,
    templates: (templates) =>
      templates.filter((t) => !singletonTypes.has(t.schemaType)),
  },
  document: {
    actions: (actions, context) =>
      singletonTypes.has(context.schemaType)
        ? actions.filter(
            (action) => action.action && singletonActions.has(action.action),
          )
        : actions,
  },
});
