import type { NextConfig } from "next";
import { frameAncestorsDirective } from "./src/lib/framing-policy";

const frameAncestors = frameAncestorsDirective(process.env.PATO_STUDIO_ORIGIN);

const config: NextConfig = {
  agentRules: false,
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns:
      process.env.SANITY_PROJECT_ID && process.env.SANITY_DATASET
        ? [
            {
              protocol: "https",
              hostname: "cdn.sanity.io",
              pathname: `/images/${process.env.SANITY_PROJECT_ID}/${process.env.SANITY_DATASET}/**`,
            },
          ]
        : [],
  },
  transpilePackages: [
    "@pato-food/ui",
    "@pato-food/content-contract",
    "@pato-food/vicafoods",
    "@pato-food/analytics",
  ],
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Content-Security-Policy", value: frameAncestors },
        ],
      },
    ];
  },
};
export default config;
