import Link from "next/link";
import { FileQuestion } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-surface px-4 text-center">
      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-surface-alt text-muted">
        <FileQuestion className="h-5 w-5" aria-hidden="true" />
      </div>
      <h1 className="font-display text-lg font-semibold text-ink">Página não encontrada</h1>
      <p className="max-w-sm text-sm text-muted">O conteúdo que você procura não existe ou foi movido.</p>
      <Link href="/" className="mt-2 text-sm font-medium text-primary hover:underline">
        Voltar ao início
      </Link>
    </div>
  );
}
