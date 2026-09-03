import * as React from "react";
import { cn } from "@/lib/utils/cn";

export function ProgressBar({
  value,
  className,
  trackClassName,
  label,
}: {
  value: number;
  className?: string;
  trackClassName?: string;
  label?: string;
}) {
  const clamped = Math.min(100, Math.max(0, value));
  return (
    <div
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label ?? `${clamped}% concluído`}
      className={cn("h-1.5 w-full overflow-hidden rounded-full bg-surface-alt", trackClassName)}
    >
      <div
        className={cn("h-full rounded-full bg-primary transition-[width] duration-300", className)}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
