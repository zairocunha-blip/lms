import Link from "next/link";
import { CheckCircle2, Circle, PlayCircle } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface LessonNavModule {
  id: string;
  title: string;
  lessons: { id: string; title: string }[];
}

export function LessonNavigation({
  courseId,
  courseTitle,
  modules,
  currentLessonId,
  completedLessonIds,
}: {
  courseId: string;
  courseTitle: string;
  modules: LessonNavModule[];
  currentLessonId: string;
  completedLessonIds: Set<string>;
}) {
  return (
    <nav
      aria-label="Conteúdo do curso"
      className="w-full shrink-0 rounded-md border border-border bg-canvas lg:sticky lg:top-8 lg:w-72"
    >
      <div className="border-b border-border px-4 py-3">
        <Link href={`/cursos/${courseId}`} className="text-xs font-medium text-primary hover:underline">
          Voltar à visão geral
        </Link>
        <p className="mt-1 truncate font-display text-sm font-semibold text-ink">{courseTitle}</p>
      </div>

      <div className="max-h-[70vh] overflow-y-auto py-2">
        {modules.map((module, moduleIndex) => (
          <div key={module.id} className="px-2 py-1.5">
            <p className="px-2 py-1 text-xs font-semibold uppercase tracking-wide text-muted-subtle">
              Módulo {moduleIndex + 1}: {module.title}
            </p>
            <ul>
              {module.lessons.map((lesson) => {
                const isCurrent = lesson.id === currentLessonId;
                const isCompleted = completedLessonIds.has(lesson.id);
                return (
                  <li key={lesson.id}>
                    <Link
                      href={`/cursos/${courseId}/aula/${lesson.id}`}
                      aria-current={isCurrent ? "page" : undefined}
                      className={cn(
                        "flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm",
                        isCurrent ? "bg-primary-soft text-primary-strong font-medium" : "text-ink-soft hover:bg-surface-alt"
                      )}
                    >
                      {isCurrent ? (
                        <PlayCircle className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                      ) : isCompleted ? (
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-success" aria-hidden="true" />
                      ) : (
                        <Circle className="h-4 w-4 shrink-0 text-border-strong" aria-hidden="true" />
                      )}
                      <span className="truncate">{lesson.title}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </nav>
  );
}
