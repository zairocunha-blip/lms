import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export function LoadingState({ label = "Carregando…", className }: { label?: string; className?: string }) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-2 py-14 text-muted", className)} role="status">
      <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
      <span className="text-sm">{label}</span>
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded bg-surface-alt", className)} />;
}
