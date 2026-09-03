import { GraduationCap } from "lucide-react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-surface px-4 py-12">
      <div className="w-full max-w-[380px]">
        <div className="mb-8 flex items-center justify-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-white">
            <GraduationCap className="h-[18px] w-[18px]" aria-hidden="true" />
          </div>
          <span className="font-display text-lg font-semibold text-ink">Treinamentos</span>
        </div>
        <div className="rounded-md border border-border bg-canvas p-7 shadow-elevation">{children}</div>
        <p className="mt-6 text-center text-xs text-muted-subtle">
          Plataforma interna — acesso restrito a colaboradores da empresa.
        </p>
      </div>
    </div>
  );
}
