import { defineCliConfig } from "sanity/cli";
export default defineCliConfig({
  deployment: { autoUpdates: false },
  api: {
    projectId: process.env.SANITY_STUDIO_PROJECT_ID || "localdemo",
    dataset: process.env.SANITY_STUDIO_DATASET || "development",
  },
});
