import type { MetadataRoute } from "next";
import {
  getSiteConfiguration,
  resolveRuntimeContentPolicy,
} from "../lib/content";
import { buildRobots } from "../lib/seo";
export default function robots(): MetadataRoute.Robots {
  return buildRobots({
    policy: resolveRuntimeContentPolicy(),
    config: getSiteConfiguration(),
  });
}
