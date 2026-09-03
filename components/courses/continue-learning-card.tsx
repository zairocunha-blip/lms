import Link from "next/link";
import { ArrowRight, BookOpen } from "lucide-react";
import { ProgressBar } from "@/components/ui/progress-bar";
import { Button } from "@/components/ui/button";

export function ContinueLearningCard({
  courseId,
  title,
  description,
  coverUrl,
  percentage,
  lastLessonTitle,
}: {
  courseId: string;
  title: string;
  description?: string | null;
  coverUrl?: string | null;
  percentage: number;
  lastLessonTitle?: string | null;
}) {
  return (
    <Link
      href={`/cursos/${courseId}`}
      className="group flex gap-4 rounded-md border border-border bg-canvas p-4 transition-colors hover:border-border-strong"
    >
      <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-md bg-primary-soft text-primary">
        {coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={coverUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <BookOpen className="h-6 w-6" aria-hidden="true" />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate font-display text-sm font-semibold text-ink">{title}</p>
        {description && <p className="mt-0.5 line-clamp-1 text-sm text-muted">{description}</p>}

        <div className="mt-2.5 flex items-center gap-3">
          <ProgressBar value={percentage} className="max-w-[160px]" />
          <span className="shrink-0 text-xs font-medium text-muted">{percentage}%</span>
        </div>

        {lastLessonTitle && (
          <p className="mt-1.5 truncate text-xs text-muted-subtle">Última aula: {lastLessonTitle}</p>
        )}
      </div>

      <div className="flex shrink-0 items-center">
        <Button variant="secondary" size="sm" className="pointer-events-none">
          Continuar
          <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
        </Button>
      </div>
    </Link>
  );
}
