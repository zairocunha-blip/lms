"use client";

import { useState, useTransition } from "react";
import { Check, Pencil, Trash2, X } from "lucide-react";
import { renameDepartmentAction, deleteDepartmentAction } from "@/lib/actions/department";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";

export function DepartmentRow({ id, name, userCount }: { id: string; name: string; userCount: number }) {
  const [isPending, startTransition] = useTransition();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(name);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const { showToast } = useToast();

  function cancelEdit() {
    setEditing(false);
    setDraft(name);
  }

  function handleRename() {
    const next = draft.trim();
    if (next === name || next.length < 2) {
      cancelEdit();
      return;
    }
    startTransition(async () => {
      const res = await renameDepartmentAction(id, next);
      if (res.error) {
        showToast({ variant: "error", title: "Não foi possível renomear", description: res.error });
        setDraft(name);
      } else {
        showToast({ variant: "success", title: "Departamento renomeado" });
      }
      setEditing(false);
    });
  }

  function handleDelete() {
    startTransition(async () => {
      const res = await deleteDepartmentAction(id);
      setConfirmOpen(false);
      showToast(
        res.error
          ? { variant: "error", title: "Não foi possível excluir", description: res.error }
          : { variant: "success", title: "Departamento excluído" }
      );
    });
  }

  return (
    <li className="flex items-center justify-between gap-3 py-3">
      {editing ? (
        <div className="flex flex-1 items-center gap-2">
          <Input
            value={draft}
            autoFocus
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleRename();
              if (e.key === "Escape") cancelEdit();
            }}
            className="max-w-xs"
          />
          <Button size="sm" onClick={handleRename} loading={isPending} aria-label="Salvar novo nome">
            <Check className="h-4 w-4" aria-hidden="true" />
          </Button>
          <Button size="sm" variant="secondary" onClick={cancelEdit} disabled={isPending} aria-label="Cancelar">
            <X className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
      ) : (
        <div>
          <p className="text-sm font-medium text-ink">{name}</p>
          <p className="mt-0.5 text-xs text-muted-subtle">{userCount} colaborador(es)</p>
        </div>
      )}

      {!editing && (
        <div className="flex items-center gap-2">
          <Button size="sm" variant="secondary" disabled={isPending} onClick={() => setEditing(true)}>
            <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
            Renomear
          </Button>
          <Button size="sm" variant="secondary" disabled={isPending} onClick={() => setConfirmOpen(true)}>
            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
            Excluir
          </Button>
        </div>
      )}

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={`Excluir "${name}"?`}
        description={
          userCount > 0
            ? `Este departamento tem ${userCount} colaborador(es) vinculado(s). Reatribua-os a outro departamento antes de excluir.`
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
