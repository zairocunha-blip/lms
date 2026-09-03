"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { MoreHorizontal, Pencil, Copy, Archive, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { archiveCourseAction, deleteCourseAction, duplicateCourseAction } from "@/lib/actions/course";
import { useToast } from "@/components/ui/toast";

export function CourseRowActions({ courseId, status }: { courseId: string; status: "DRAFT" | "PUBLISHED" | "ARCHIVED" }) {
  const [confirmAction, setConfirmAction] = useState<"archive" | "delete" | null>(null);
  const [isPending, startTransition] = useTransition();
  const { showToast } = useToast();

  function handleConfirm() {
    startTransition(async () => {
      if (confirmAction === "archive") {
        await archiveCourseAction(courseId);
        showToast({ variant: "success", title: "Curso arquivado" });
      } else if (confirmAction === "delete") {
        const result = await deleteCourseAction(courseId);
        if (result.error) {
          showToast({ variant: "error", title: "Não foi possível excluir", description: result.error });
        } else {
          showToast({ variant: "success", title: "Curso excluído" });
        }
      }
      setConfirmAction(null);
    });
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex h-8 w-8 items-center justify-center rounded-md text-muted hover:bg-surface-alt hover:text-ink" aria-label="Ações">
            <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem asChild>
            <Link href={`/admin/cursos/${courseId}/editar`} className="flex items-center gap-2">
              <Pencil className="h-4 w-4" aria-hidden="true" />
              Editar
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => startTransition(() => duplicateCourseAction(courseId))}>
            <Copy className="h-4 w-4" aria-hidden="true" />
            Duplicar
          </DropdownMenuItem>
          {status !== "ARCHIVED" && (
            <DropdownMenuItem onClick={() => setConfirmAction("archive")}>
              <Archive className="h-4 w-4" aria-hidden="true" />
              Arquivar
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem destructive onClick={() => setConfirmAction("delete")}>
            <Trash2 className="h-4 w-4" aria-hidden="true" />
            Excluir
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ConfirmDialog
        open={!!confirmAction}
        onOpenChange={(open) => !open && setConfirmAction(null)}
        title={confirmAction === "archive" ? "Arquivar curso" : "Excluir curso"}
        description={
          confirmAction === "archive"
            ? "O curso deixará de aparecer como ativo, mas o histórico de progresso dos colaboradores é mantido."
            : "Esta ação não pode ser desfeita. Só é possível excluir cursos que nunca foram atribuídos a colaboradores."
        }
        confirmLabel={confirmAction === "archive" ? "Arquivar" : "Excluir"}
        destructive
        loading={isPending}
        onConfirm={handleConfirm}
      />
    </>
  );
}
