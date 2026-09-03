"use client";

import { useTransition } from "react";
import { toggleCategoryAction } from "@/lib/actions/course";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function CategoryRow({
  id,
  name,
  isActive,
  courseCount,
}: {
  id: string;
  name: string;
  isActive: boolean;
  courseCount: number;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <li className="flex items-center justify-between gap-3 py-3">
      <div>
        <p className="text-sm font-medium text-ink">{name}</p>
        <p className="mt-0.5 text-xs text-muted-subtle">{courseCount} curso(s)</p>
      </div>
      <div className="flex items-center gap-2">
        <Badge tone={isActive ? "success" : "neutral"}>{isActive ? "Ativa" : "Inativa"}</Badge>
        <Button
          size="sm"
          variant="secondary"
          disabled={isPending}
          onClick={() => startTransition(() => toggleCategoryAction(id, !isActive))}
        >
          {isActive ? "Desativar" : "Ativar"}
        </Button>
      </div>
    </li>
  );
}
