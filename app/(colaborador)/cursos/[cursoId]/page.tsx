import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { CheckCircle2, Circle, PlayCircle, BookOpen, ClipboardCheck, Lock, Clock } from "lucide-react";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import { getCourseForLearner } from "@/lib/services/course";
import { getCourseProgressSummary } from "@/lib/services/progress";
import { getQuizForLearner } from "@/lib/services/quiz";
import { ProgressBar } from "@/components/ui/progress-bar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ cursoId: string }> }): Promise<Metadata> {
  const { cursoId } = await params;
  const course = await prisma.course.findUnique({ where: { id: cursoId }, select: { title: true } });
  return { title: course?.title ?? "Curso" };
}

export default async function CourseOverviewPage({ params }: { params: Promise<{ cursoId: string }> }) {
  const { cursoId } = await params;
  const session = await auth();
  const userId = session!.user.id;

  // Regra 3 — colaborador só pode visualizar cursos aos quais tenha acesso.
  const assignment = await prisma.courseAssignment.findUnique({
    where: { userId_courseId: { userId, courseId: cursoId } },
  });
  if (!assignment && session!.user.role !== "ADMIN") notFound();

  const course = await getCourseForLearner(cursoId);
  if (!course) notFound();

  const { progress, completedLessonIds } = await getCourseProgressSummary(userId, cursoId);
  const quizState = await getQuizForLearner(cursoId, userId);
  const allLessons = course.modules.flatMap((m) => m.lessons);
  const nextIncompleteLesson = allLessons.find((l) => !completedLessonIds.has(l.id));
  const nextLesson = nextIncompleteLesson ?? allLessons[0];
  // Aulas concluídas + prova liberada e não aprovada → o CTA leva à prova.
  const ctaToQuiz = !nextIncompleteLesson && !!quizState && quizState.canAttempt;

  return (
    <div className="mx-auto max-w-content px-4 py-6 md:px-8 md:py-8">
      <div className="flex flex-col gap-6 md:flex-row">
        <div className="flex h-40 w-full shrink-0 items-center justify-center overflow-hidden rounded-md bg-primary-soft text-primary md:h-auto md:w-64">
          {course.coverUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={course.coverUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <BookOpen className="h-10 w-10" aria-hidden="true" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          {course.category && <Badge tone="neutral">{course.category.name}</Badge>}
          <h1 className="mt-2 font-display text-2xl font-semibold text-ink">{course.title}</h1>
          {course.description && <p className="mt-2 max-w-2xl text-muted">{course.description}</p>}

          <div className="mt-4 flex max-w-sm items-center gap-3">
            <ProgressBar value={progress?.percentage ?? 0} />
            <span className="shrink-0 text-sm font-medium text-muted">{progress?.percentage ?? 0}%</span>
          </div>

          {ctaToQuiz ? (
            <Button asChild className="mt-5">
              <Link href={`/cursos/${cursoId}/prova`}>
                <ClipboardCheck className="h-4 w-4" aria-hidden="true" />
                Fazer a prova final
              </Link>
            </Button>
          ) : (
            nextLesson && (
              <Button asChild className="mt-5">
                <Link href={`/cursos/${cursoId}/aula/${nextLesson.id}`}>
                  <PlayCircle className="h-4 w-4" aria-hidden="true" />
                  {progress && progress.percentage > 0 ? "Continuar curso" : "Começar curso"}
                </Link>
              </Button>
            )
          )}
        </div>
      </div>

      <div className="mt-8 space-y-3">
        {course.modules.map((module, moduleIndex) => (
          <div key={module.id} className="rounded-md border border-border bg-canvas">
            <div className="border-b border-border px-4 py-3">
              <p className="font-display text-sm font-semibold text-ink">
                Módulo {moduleIndex + 1}: {module.title}
              </p>
            </div>
            <ul>
              {module.lessons.map((lesson) => {
                const isCompleted = completedLessonIds.has(lesson.id);
                return (
                  <li key={lesson.id} className="border-b border-border last:border-0">
                    <Link
                      href={`/cursos/${cursoId}/aula/${lesson.id}`}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-surface/60"
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-success" aria-hidden="true" />
                      ) : (
                        <Circle className="h-4 w-4 shrink-0 text-border-strong" aria-hidden="true" />
                      )}
                      <span className={cn(isCompleted ? "text-muted" : "text-ink-soft")}>{lesson.title}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>

      {quizState && (
        <div className="mt-6 rounded-md border border-border bg-canvas">
          <div className="flex items-center gap-2 border-b border-border px-4 py-3">
            <ClipboardCheck className="h-4 w-4 text-primary" aria-hidden="true" />
            <p className="font-display text-sm font-semibold text-ink">{quizState.quiz.title}</p>
          </div>
          <div className="px-4 py-4">
            <QuizStatus courseId={cursoId} quizState={quizState} />
          </div>
        </div>
      )}
    </div>
  );
}

function QuizStatus({
  courseId,
  quizState,
}: {
  courseId: string;
  quizState: NonNullable<Awaited<ReturnType<typeof getQuizForLearner>>>;
}) {
  const { blockingReason, attemptsLeft, attemptsUsed, latestAttempt, quiz } = quizState;

  if (quizState.isApproved) {
    return (
      <p className="flex items-center gap-2 text-sm font-medium text-success">
        <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
        Prova aprovada
        {latestAttempt?.finalScorePct !== null && latestAttempt?.finalScorePct !== undefined
          ? ` — nota ${latestAttempt.finalScorePct}%`
          : ""}
        . Curso concluído.
      </p>
    );
  }

  if (blockingReason === "pending") {
    return (
      <p className="flex items-center gap-2 text-sm font-medium text-warning">
        <Clock className="h-4 w-4" aria-hidden="true" />
        Prova enviada — aguardando correção de um administrador.
      </p>
    );
  }

  if (blockingReason === "lessons") {
    return (
      <p className="flex items-center gap-2 text-sm text-muted">
        <Lock className="h-4 w-4" aria-hidden="true" />
        Conclua todas as aulas para liberar a prova.
      </p>
    );
  }

  if (blockingReason === "no_attempts") {
    return (
      <div className="space-y-1 text-sm">
        <p className="flex items-center gap-2 font-medium text-danger">
          <Circle className="h-4 w-4" aria-hidden="true" />
          Prova não aprovada e sem tentativas restantes. Procure o administrador.
        </p>
        {latestAttempt?.reviewNote && <p className="text-muted">Comentário: {latestAttempt.reviewNote}</p>}
      </div>
    );
  }

  // canAttempt
  return (
    <div className="space-y-2">
      {latestAttempt?.status === "REJECTED" && latestAttempt.reviewNote && (
        <p className="text-sm text-muted">Última correção: {latestAttempt.reviewNote}</p>
      )}
      <p className="text-sm text-muted">
        {quiz.questions.length} questão(ões) · {attemptsLeft} de {attemptsUsed + attemptsLeft} tentativa(s)
        restante(s).
      </p>
      <Button asChild>
        <Link href={`/cursos/${courseId}/prova`}>
          <ClipboardCheck className="h-4 w-4" aria-hidden="true" />
          {attemptsUsed > 0 ? "Refazer a prova" : "Fazer a prova"}
        </Link>
      </Button>
    </div>
  );
}
