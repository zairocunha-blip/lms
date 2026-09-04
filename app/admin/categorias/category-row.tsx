"use client";

import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { toggleCategoryAction, deleteCategoryAction } from "@/lib/actions/course";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";

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
  const [deleteOpen, setDeleteOpen] = useState(false);
  const { showToast } = useToast();

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteCategoryAction(id);
      setDeleteOpen(false);
      if (result.error) {
        showToast({ variant: "error", title: "Não foi possível excluir", description: result.error });
      } else {
        showToast({ variant: "success", title: "Categoria excluída" });
      }
    });
  }

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
        <Button
          size="sm"
          variant="secondary"
          disabled={isPending}
          onClick={() => setDeleteOpen(true)}
          aria-label={`Excluir categoria ${name}`}
        >
          <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
        </Button>
      </div>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title={`Excluir "${name}"?`}
        description={
          courseCount > 0
            ? `${courseCount} curso(s) usam esta categoria e ficarão sem categoria. Esta ação não pode ser desfeita.`
            : "Esta ação não pode ser desfeita."
        }
        confirmLabel="Excluir"
        destructive
        loading={isPending}
        onConfirm={handleDelete}
      />
    </li>
  );
}
