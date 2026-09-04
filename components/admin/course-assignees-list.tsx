"use client";

import { useState, useTransition } from "react";
import { X, Users } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { AssignmentStatusBadge } from "@/components/ui/status-badge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { removeAssignmentAction } from "@/lib/actions/assignment";
import { useToast } from "@/components/ui/toast";
import { EmptyState } from "@/components/ui/empty-state";

interface Assignee {
  id: string;
  status: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";
  user: { id: string; name: string; avatarUrl: string | null; department: { name: string } | null };
}

/** Lista de colaboradores atribuídos a um curso, com opção de remover a atribuição. */
export function CourseAssigneesList({ assignments }: { assignments: Assignee[] }) {
  const [target, setTarget] = useState<Assignee | null>(null);
  const [isPending, startTransition] = useTransition();
  const { showToast } = useToast();

  function handleRemove() {
    if (!target) return;
    startTransition(async () => {
      await removeAssignmentAction(target.id);
      showToast({ variant: "success", title: "Atribuição removida" });
      setTarget(null);
    });
  }

  if (assignments.length === 0) {
    return (
      <EmptyState
        icon={Users}
        title="Nenhum colaborador atribuído"
        description="Use o formulário acima para atribuir este curso."
      />
    );
  }

  return (
    <>
      <ul className="divide-y divide-border">
        {assignments.map((assignment) => (
          <li key={assignment.id} className="flex items-center justify-between gap-3 py-2.5">
            <div className="flex min-w-0 items-center gap-2.5">
              <Avatar name={assignment.user.name} src={assignment.user.avatarUrl} size="sm" />
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-ink">{assignment.user.name}</p>
                <div className="mt-0.5 flex items-center gap-1.5">
                  <AssignmentStatusBadge status={assignment.status} />
                  {assignment.user.department && (
                    <span className="truncate text-xs text-muted-subtle">{assignment.user.department.name}</span>
                  )}
                </div>
              </div>
            </div>
            <button
              onClick={() => setTarget(assignment)}
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-muted hover:bg-danger-soft hover:text-danger"
              aria-label={`Remover ${assignment.user.name} deste curso`}
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </li>
        ))}
      </ul>

      <ConfirmDialog
        open={!!target}
        onOpenChange={(open) => !open && setTarget(null)}
        title="Remover atribuição"
        description={
          target
            ? `O curso deixará de aparecer para ${target.user.name}, e o progresso registrado será perdido.`
            : undefined
        }
        confirmLabel="Remover"
        destructive
        loading={isPending}
        onConfirm={handleRemove}
      />
    </>
  );
}
