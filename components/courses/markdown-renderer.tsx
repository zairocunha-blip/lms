import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import rehypeHighlight from "rehype-highlight";

// Allowlist explícita de tags/atributos permitidos no Markdown das aulas.
// Bloqueia scripts, handlers de evento inline e HTML bruto — mitiga XSS
// mesmo que o autor do conteúdo cole HTML malicioso dentro do Markdown.
const sanitizeSchema = {
  ...defaultSchema,
  attributes: {
    ...defaultSchema.attributes,
    img: [...(defaultSchema.attributes?.img ?? []), "src", "alt", "title", "width", "height"],
    code: [...(defaultSchema.attributes?.code ?? []), "className"],
    span: [...(defaultSchema.attributes?.span ?? []), "className"],
  },
};

export function MarkdownRenderer({ content }: { content: string }) {
  return (
    <div className="lesson-markdown">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[[rehypeSanitize, sanitizeSchema], rehypeHighlight]}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
