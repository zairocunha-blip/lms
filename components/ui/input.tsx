import * as React from "react";
import { cn } from "@/lib/utils/cn";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          "h-9 w-full rounded-md border border-border bg-canvas px-3 text-sm text-ink placeholder:text-muted-subtle",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:border-primary",
          "disabled:cursor-not-allowed disabled:bg-surface disabled:text-muted",
          "aria-[invalid=true]:border-danger",
          className
        )}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";
