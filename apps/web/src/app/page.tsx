import { draftMode } from "next/headers";
import { FoodLanding } from "@pato-food/ui";
import { adaptContent } from "../lib/adapter";
import { getSiteContent } from "../lib/content";
import { shouldReadDraftContent } from "../lib/content-policy";
import { buildStructuredData, serializeStructuredData } from "../lib/seo";
export default async function Home() {
  const draft = await draftMode();
  const preview = shouldReadDraftContent({
    draftModeEnabled: draft.isEnabled,
    source: process.env.PATO_CONTENT_SOURCE,
    visibility: process.env.PATO_SITE_VISIBILITY,
    runtimeEnvironment: process.env.NODE_ENV,
  });
  const site = await getSiteContent({ preview });
  const content = adaptContent(site.content, site.config);
  const structuredData = buildStructuredData({
    policy: site.policy,
    config: site.config,
    content: site.content,
    preview,
  });
  return (
    <>
      {structuredData ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: serializeStructuredData(structuredData),
          }}
        />
      ) : null}
      <FoodLanding
        content={content}
        preview={preview}
        previewExitAvailable={draft.isEnabled}
      />
    </>
  );
}
