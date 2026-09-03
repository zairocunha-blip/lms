import Link from "next/link";
import { BookOpen, Calendar, CheckCircle2 } from "lucide-react";
import { ProgressBar } from "@/components/ui/progress-bar";
import { AssignmentStatusBadge } from "@/components/ui/status-badge";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils/format";

export function CourseCard({
  courseId,
  title,
  description,
  coverUrl,
  categoryName,
  status,
  percentage,
  assignedAt,
  completedAt,
}: {
  courseId: string;
  title: string;
  description?: string | null;
  coverUrl?: string | null;
  categoryName?: string | null;
  status: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";
  percentage: number;
  assignedAt: Date;
  completedAt?: Date | null;
}) {
  return (
    <Link
      href={`/cursos/${courseId}`}
      className="flex flex-col overflow-hidden rounded-md border border-border bg-canvas transition-colors hover:border-border-strong"
    >
      <div className="flex h-32 items-center justify-center bg-primary-soft text-primary">
        {coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={coverUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <BookOpen className="h-8 w-8" aria-hidden="true" />
        )}
      </div>

      <div className="flex flex-1 flex-col p-4">
        <div className="mb-2 flex items-center gap-2">
          {categoryName && <Badge tone="neutral">{categoryName}</Badge>}
          <AssignmentStatusBadge status={status} />
        </div>

        <p className="font-display text-sm font-semibold text-ink">{title}</p>
        {description && <p className="mt-1 line-clamp-2 text-sm text-muted">{description}</p>}

        <div className="mt-3 flex items-center gap-2.5">
          <ProgressBar value={percentage} />
          <span className="shrink-0 text-xs font-medium text-muted">{percentage}%</span>
        </div>

        <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-subtle">
          {completedAt ? (
            <>
              <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
              Concluído em {formatDate(completedAt)}
            </>
          ) : (
            <>
              <Calendar className="h-3.5 w-3.5" aria-hidden="true" />
              Atribuído em {formatDate(assignedAt)}
            </>
          )}
        </div>
      </div>
    </Link>
  );
}
