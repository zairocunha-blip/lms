import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, CheckCircle2 } from "lucide-react";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import { getCourseForLearner, getLessonForLearner } from "@/lib/services/course";
import { getCourseProgressSummary, markLessonStarted } from "@/lib/services/progress";
import { completeLessonAction } from "@/lib/actions/progress";
import { LessonNavigation } from "@/components/courses/lesson-navigation";
import { MarkdownRenderer } from "@/components/courses/markdown-renderer";
import { SlidesViewer } from "@/components/courses/slides-viewer";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ aulaId: string }> }): Promise<Metadata> {
  const { aulaId } = await params;
  const lesson = await prisma.lesson.findUnique({ where: { id: aulaId }, select: { title: true } });
  return { title: lesson?.title ?? "Aula" };
}

export default async function LessonPage({
  params,
}: {
  params: Promise<{ cursoId: string; aulaId: string }>;
}) {
  const { cursoId, aulaId } = await params;
  const session = await auth();
  const userId = session!.user.id;

  const assignment = await prisma.courseAssignment.findUnique({
    where: { userId_courseId: { userId, courseId: cursoId } },
  });
  if (!assignment && session!.user.role !== "ADMIN") notFound();

  const [course, lesson] = await Promise.all([getCourseForLearner(cursoId), getLessonForLearner(aulaId)]);
  if (!course || !lesson || lesson.module.courseId !== cursoId) notFound();

  await markLessonStarted(userId, aulaId);
  const { completedLessonIds } = await getCourseProgressSummary(userId, cursoId);

  const orderedLessons = course.modules.flatMap((m) => m.lessons);
  const currentIndex = orderedLessons.findIndex((l) => l.id === aulaId);
  const previousLesson = currentIndex > 0 ? orderedLessons[currentIndex - 1] : null;
  const isLessonCompleted = completedLessonIds.has(aulaId);

  return (
    // Sem max-w-content e sem padding lateral de propósito: a partir de `lg`
    // isto vira um shell de duas colunas ocupando a tela inteira (mesma altura
    // do `<main>`) — módulos presos à esquerda com rolagem própria, conteúdo
    // maximizado à direita, cada um rolando de forma independente.
    <div className="flex flex-col px-4 py-4 lg:h-full lg:flex-row lg:overflow-hidden lg:px-0 lg:py-0">
      <Link href={`/cursos/${cursoId}`} className="mb-4 flex items-center gap-1 text-sm font-medium text-muted hover:text-ink lg:hidden">
        <ChevronLeft className="h-4 w-4" aria-hidden="true" />
        Voltar ao curso
      </Link>

      <LessonNavigation
        courseId={cursoId}
        courseTitle={course.title}
        modules={course.modules}
        currentLessonId={aulaId}
        completedLessonIds={completedLessonIds}
      />

      <div className="mt-6 min-w-0 flex-1 lg:mt-0 lg:h-full lg:overflow-y-auto">
        <div className="lg:px-10 lg:py-8">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-subtle">{course.title}</p>
          <h1 className="mt-1 font-display text-2xl font-semibold text-ink">{lesson.title}</h1>

          <div className="mt-6">
            {lesson.content?.type === "SLIDES" ? (
              <SlidesViewer fileUrl={lesson.content.fileUrl} fileName={lesson.content.fileName} />
            ) : lesson.content?.body ? (
              <MarkdownRenderer content={lesson.content.body} />
            ) : (
              <p className="text-sm text-muted">O conteúdo desta aula ainda não foi adicionado.</p>
            )}
          </div>

          <div className="mt-10 flex items-center justify-between border-t border-border pt-5 pb-6 lg:pb-0">
            {previousLesson ? (
              <Button variant="secondary" asChild>
                <Link href={`/cursos/${cursoId}/aula/${previousLesson.id}`}>
                  <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                  Aula anterior
                </Link>
              </Button>
            ) : (
              <span />
            )}

            {isLessonCompleted ? (
              <span className="flex items-center gap-1.5 text-sm font-medium text-success">
                <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                Aula concluída
              </span>
            ) : (
              <form action={completeLessonAction}>
                <input type="hidden" name="lessonId" value={aulaId} />
                <input type="hidden" name="courseId" value={cursoId} />
                <Button type="submit">
                  <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                  Concluir aula
                </Button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
