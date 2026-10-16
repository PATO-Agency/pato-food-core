import "server-only";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { getLegalDocument } from "./legal-documents";

export async function readLegalDocument(slug: string) {
  const document = getLegalDocument(slug);
  if (!document) return null;
  // Only allowlisted filenames are read; request params never form a path.
  const markdown = await readFile(
    path.join(process.cwd(), "src", "content", "legal", document.file),
    "utf8",
  );
  return { ...document, markdown: markdown.replace(/^# .+\r?\n+/, "") };
}
