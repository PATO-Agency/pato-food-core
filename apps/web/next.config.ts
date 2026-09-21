import type { NextConfig } from "next";
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
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
        ],
      },
    ];
  },
};
export default config;
