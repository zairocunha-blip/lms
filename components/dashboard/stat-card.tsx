import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export function StatCard({
  label,
  value,
  icon: Icon,
  tone = "default",
}: {
  label: string;
  value: string | number;
  icon: LucideIcon;
  tone?: "default" | "primary" | "success" | "warning";
}) {
  const toneClasses = {
    default: "bg-surface-alt text-ink-soft",
    primary: "bg-primary-soft text-primary-strong",
    success: "bg-success-soft text-success",
    warning: "bg-warning-soft text-warning",
  }[tone];

  return (
    <div className="rounded-md border border-border bg-canvas p-4">
      <div className="flex items-center gap-3">
        <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-md", toneClasses)}>
          <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
        </div>
        <div>
          <p className="font-display text-xl font-semibold leading-none text-ink">{value}</p>
          <p className="mt-1 text-sm text-muted">{label}</p>
        </div>
      </div>
    </div>
  );
}
