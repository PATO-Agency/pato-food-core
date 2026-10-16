import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { LegalMarkdown } from "../app/legal/legal-markdown";
import {
  getLegalDocument,
  legalDocuments,
  mayShowLegalDrafts,
} from "./legal-documents";

const demo = {
  siteKey: "vicafoods-demo",
  internalOnly: true,
  publishBlocked: true,
  visibility: "internal",
  deploymentEnvironment: "preview",
};

describe("legal draft boundary", () => {
  it("allows the isolated demo and blocks public/commercial/other-client contexts", () => {
    expect(mayShowLegalDrafts(demo)).toBe(true);
    for (const change of [
      { visibility: "public" },
      { deploymentEnvironment: "production" },
      { deploymentEnvironment: " production " },
      { siteKey: "another-client" },
      { internalOnly: false },
      { publishBlocked: false },
    ]) {
      expect(mayShowLegalDrafts({ ...demo, ...change })).toBe(false);
    }
  });
  it("rejects arbitrary filenames instead of resolving request paths", () => {
    for (const slug of [
      "../../../../work/legal",
      "__proto__",
      "LEEME",
      "no-existe",
    ])
      expect(getLegalDocument(slug)).toBeUndefined();
    expect(getLegalDocument("privacidad")?.file).toBe("privacidad.md");
  });
  it("keeps all five shipping documents as drafts, links within the route allowlist and excludes internal evidence", () => {
    const routes = new Set(legalDocuments.map((d) => `/legal/${d.slug}`));
    expect(legalDocuments).toHaveLength(5);
    for (const document of legalDocuments) {
      const markdown = readFileSync(
        new URL(`../content/legal/${document.file}`, import.meta.url),
        "utf8",
      );
      expect(markdown).toContain("Borrador");
      expect(markdown).toContain("[PENDIENTE:");
      expect(markdown).not.toMatch(
        /baja de oficio|work\/legal|_vercel_share|before\.json|\.env|]\([^)]*\.md\)/i,
      );
      for (const match of markdown.matchAll(/]\((\/[^)]+)\)/g))
        expect(routes.has(match[1]!)).toBe(true);
    }
  });
  it("renders tables and native links but rejects executable HTML and dangerous links", () => {
    const html = renderToStaticMarkup(
      <LegalMarkdown>
        {
          "[Privacidad](/legal/privacidad)\n\n| Dato | Estado |\n| --- | --- |\n| Plazo | Pendiente |\n\n<script>alert(1)</script>\n\n[Unsafe](javascript:alert%281%29)"
        }
      </LegalMarkdown>,
    );
    expect(html).toContain('href="/legal/privacidad"');
    expect(html).toContain("<table>");
    expect(html).not.toMatch(/<script|javascript:/i);
  });
});
