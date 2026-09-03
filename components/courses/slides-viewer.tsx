import { FileWarning } from "lucide-react";

/**
 * Visualizador de apresentações (PDF) em proporção fixa 16:9. Usa o próprio
 * visualizador de PDF do navegador via <iframe> — abordagem escolhida no
 * MVP por não depender de bibliotecas pesadas de renderização client-side
 * (ver "Decisão técnica" no README).
 */
export function SlidesViewer({ fileUrl, fileName }: { fileUrl?: string | null; fileName?: string | null }) {
  if (!fileUrl) {
    return (
      <div className="flex aspect-video items-center justify-center rounded-md border border-dashed border-border bg-surface text-muted">
        <div className="flex flex-col items-center gap-2 text-center">
          <FileWarning className="h-6 w-6" aria-hidden="true" />
          <p className="text-sm">Nenhuma apresentação foi adicionada a esta aula ainda.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-md border border-border bg-ink">
      <div className="aspect-video w-full">
        <iframe src={fileUrl} title={fileName ?? "Apresentação"} className="h-full w-full" />
      </div>
    </div>
  );
}
