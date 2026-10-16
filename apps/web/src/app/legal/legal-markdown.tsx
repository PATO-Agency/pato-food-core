import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";

/** Plain Markdown only: never enable raw HTML from document content. */
export function LegalMarkdown({ children }: { children: string }) {
  return (
    <Markdown
      skipHtml
      remarkPlugins={[remarkGfm]}
      components={{
        table: ({ children }) => (
          <div
            className="legal-table"
            role="region"
            aria-label="Tabla del documento, desplazable horizontalmente"
            tabIndex={0}
          >
            <table>{children}</table>
          </div>
        ),
      }}
    >
      {children}
    </Markdown>
  );
}
