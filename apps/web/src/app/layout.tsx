import type { Metadata } from "next";
import { draftMode } from "next/headers";
import "@fontsource-variable/manrope/wght.css";
import "@fontsource/barlow-condensed/latin-500.css";
import "@fontsource/barlow-condensed/latin-600.css";
import "@fontsource/barlow-condensed/latin-700.css";
import "@pato-food/ui/styles.css";
import {
  getSiteConfiguration,
  getSiteContent,
  resolveRuntimeContentPolicy,
} from "../lib/content";
import { shouldReadDraftContent } from "../lib/content-policy";
import { buildMetadata } from "../lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const preview = shouldReadDraftContent({
    draftModeEnabled: (await draftMode()).isEnabled,
    source: process.env.PATO_CONTENT_SOURCE,
    visibility: process.env.PATO_SITE_VISIBILITY,
    runtimeEnvironment: process.env.NODE_ENV,
  });
  const policy = resolveRuntimeContentPolicy();
  if (preview || policy.visibility !== "public")
    return buildMetadata({
      policy,
      config: getSiteConfiguration(),
      preview,
    });

  const { content, config } = await getSiteContent();
  return buildMetadata({ policy, config, content });
}
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es-PE">
      <body>{children}</body>
    </html>
  );
}
