import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import { getCourseForLearner } from "@/lib/services/course";
import { getQuizForLearner } from "@/lib/services/quiz";
import { QuizAttemptForm } from "@/components/courses/quiz-attempt-form";

export const metadata: Metadata = { title: "Prova final" };
export const dynamic = "force-dynamic";

export default async function CourseQuizPage({ params }: { params: Promise<{ cursoId: string }> }) {
  const { cursoId } = await params;
  const session = await auth();
  const userId = session!.user.id;

  const assignment = await prisma.courseAssignment.findUnique({
    where: { userId_courseId: { userId, courseId: cursoId } },
  });
  if (!assignment && session!.user.role !== "ADMIN") notFound();

  const course = await getCourseForLearner(cursoId);
  if (!course) notFound();

  const quizState = await getQuizForLearner(cursoId, userId);
  if (!quizState) redirect(`/cursos/${cursoId}`);
  if (!quizState.canAttempt) redirect(`/cursos/${cursoId}`);

  return (
    <div className="mx-auto max-w-content px-4 py-6 md:px-8 md:py-8">
      <Link
        href={`/cursos/${cursoId}`}
        className="flex items-center gap-1 text-sm font-medium text-muted hover:text-ink"
      >
        <ChevronLeft className="h-4 w-4" aria-hidden="true" />
        Voltar ao curso
      </Link>

      <p className="mt-3 text-xs font-medium uppercase tracking-wide text-muted-subtle">{course.title}</p>
      <h1 className="mt-1 font-display text-2xl font-semibold text-ink">{quizState.quiz.title}</h1>
      {quizState.quiz.description && (
        <p className="mt-2 max-w-2xl text-muted">{quizState.quiz.description}</p>
      )}

      <div className="mt-6">
        <QuizAttemptForm
          courseId={cursoId}
          quiz={quizState.quiz}
          attemptsUsed={quizState.attemptsUsed}
          attemptsLeft={quizState.attemptsLeft}
        />
      </div>
    </div>
  );
}
