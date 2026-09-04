import { Badge } from "@/components/ui/badge";

const assignmentMap = {
  NOT_STARTED: { label: "Não iniciado", tone: "neutral" as const },
  IN_PROGRESS: { label: "Em andamento", tone: "primary" as const },
  COMPLETED: { label: "Concluído", tone: "success" as const },
};

const courseMap = {
  DRAFT: { label: "Rascunho", tone: "neutral" as const },
  PUBLISHED: { label: "Publicado", tone: "success" as const },
  ARCHIVED: { label: "Arquivado", tone: "warning" as const },
};

const userStatusMap = {
  ACTIVE: { label: "Ativo", tone: "success" as const },
  INACTIVE: { label: "Inativo", tone: "danger" as const },
  PENDING: { label: "Pendente", tone: "warning" as const },
};

export function AssignmentStatusBadge({ status }: { status: keyof typeof assignmentMap }) {
  const { label, tone } = assignmentMap[status];
  return <Badge tone={tone}>{label}</Badge>;
}

export function CourseStatusBadge({ status }: { status: keyof typeof courseMap }) {
  const { label, tone } = courseMap[status];
  return <Badge tone={tone}>{label}</Badge>;
}

export function UserStatusBadge({ status }: { status: keyof typeof userStatusMap }) {
  const { label, tone } = userStatusMap[status];
  return <Badge tone={tone}>{label}</Badge>;
}
