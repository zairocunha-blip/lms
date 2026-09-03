"use client";

import { useState, useTransition } from "react";
import { X, BookOpen } from "lucide-react";
import { AssignmentStatusBadge } from "@/components/ui/status-badge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { removeAssignmentAction } from "@/lib/actions/assignment";
import { useToast } from "@/components/ui/toast";
import { EmptyState } from "@/components/ui/empty-state";

interface Assignment {
  id: string;
  status: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";
  course: { title: string };
}

export function AssignedCoursesList({ assignments }: { assignments: Assignment[] }) {
  const [target, setTarget] = useState<Assignment | null>(null);
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
    return <EmptyState icon={BookOpen} title="Nenhum curso atribuído" description="Use o formulário acima para atribuir um treinamento." />;
  }

  return (
    <>
      <ul className="divide-y divide-border">
        {assignments.map((assignment) => (
          <li key={assignment.id} className="flex items-center justify-between gap-3 py-2.5">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-ink">{assignment.course.title}</p>
              <div className="mt-1">
                <AssignmentStatusBadge status={assignment.status} />
              </div>
            </div>
            <button
              onClick={() => setTarget(assignment)}
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-muted hover:bg-danger-soft hover:text-danger"
              aria-label={`Remover atribuição de ${assignment.course.title}`}
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
        description={target ? `O curso "${target.course.title}" deixará de aparecer para este colaborador, e o progresso registrado será perdido.` : undefined}
        confirmLabel="Remover"
        destructive
        loading={isPending}
        onConfirm={handleRemove}
      />
    </>
  );
}
