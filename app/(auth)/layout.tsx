import { GraduationCap } from "lucide-react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-surface px-4 py-12">
      <div className="w-full max-w-[380px]">
        <div className="mb-8 flex items-center justify-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-white">
            <GraduationCap className="h-5 w-5" aria-hidden="true" />
          </div>
          <div className="leading-tight">
            <p className="font-display text-lg font-semibold text-ink">IDX DataCenters</p>
            <p className="text-xs text-muted">Treinamentos</p>
          </div>
        </div>
        <div className="rounded-md border border-border bg-canvas p-7 shadow-elevation">{children}</div>
        <p className="mt-6 text-center text-xs text-muted-subtle">
          Portal interno da IDX DataCenters — acesso restrito a colaboradores.
        </p>
      </div>
    </div>
  );
}
