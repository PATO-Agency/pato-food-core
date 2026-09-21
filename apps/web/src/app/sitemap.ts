import type { MetadataRoute } from "next";
import {
  getSiteConfiguration,
  resolveRuntimeContentPolicy,
} from "../lib/content";
import { buildSitemap } from "../lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  return buildSitemap({
    policy: resolveRuntimeContentPolicy(),
    config: getSiteConfiguration(),
  });
}
