import { defineConfig } from "sanity";
import { presentationTool } from "sanity/presentation";
import { structureTool } from "sanity/structure";
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
    structureTool({ structure }),
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
