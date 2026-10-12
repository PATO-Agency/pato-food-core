import { defineCliConfig } from "sanity/cli";
export default defineCliConfig({
  deployment: { appId: "ken6f5p9bq2t2eehkzdhn53q", autoUpdates: false },
  api: {
    projectId: process.env.SANITY_STUDIO_PROJECT_ID || "localdemo",
    dataset: process.env.SANITY_STUDIO_DATASET || "development",
  },
});
