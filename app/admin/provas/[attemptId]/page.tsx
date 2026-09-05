import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { getAttemptForReview } from "@/lib/services/quiz";
import { prisma } from "@/lib/db/prisma";
import { AttemptReviewForm } from "@/components/admin/attempt-review-form";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = { title: "Corrigir prova" };
export const dynamic = "force-dynamic";

export default async function ReviewAttemptPage({ params }: { params: Promise<{ attemptId: string }> }) {
  const { attemptId } = await params;
  const attempt = await getAttemptForReview(attemptId);
  if (!attempt) notFound();

  const quiz = await prisma.quiz.findUnique({
    where: { id: attempt.quizId },
    select: { passingScore: true },
  });

  const alreadyReviewed = attempt.status !== "PENDING_REVIEW";

  // Ordena as respostas pela ordem das questões na prova.
  const answers = [...attempt.answers]
    .sort((a, b) => a.question.order - b.question.order)
    .map((a) => ({
      id: a.id,
      type: a.question.type,
      prompt: a.question.prompt,
      points: a.question.points,
      options: a.question.options.map((o) => ({ id: o.id, text: o.text, isCorrect: o.isCorrect })),
      selectedOptionId: a.selectedOptionId,
      textResponse: a.textResponse,
      isCorrect: a.isCorrect,
    }));

  return (
    <div className="max-w-3xl">
      <Link href="/admin/provas" className="flex items-center gap-1 text-sm font-medium text-muted hover:text-ink">
        <ChevronLeft className="h-4 w-4" aria-hidden="true" />
        Provas
      </Link>

      <div className="mt-2 flex items-center gap-3">
        <h1 className="font-display text-2xl font-semibold text-ink">Corrigir prova</h1>
        {alreadyReviewed && (
          <Badge tone={attempt.status === "APPROVED" ? "success" : "danger"}>
            {attempt.status === "APPROVED" ? "Aprovada" : "Reprovada"}
          </Badge>
        )}
      </div>

      <div className="mt-6">
        {alreadyReviewed ? (
          <p className="rounded-md border border-border bg-surface px-4 py-3 text-sm text-muted">
            Esta tentativa já foi corrigida
            {attempt.finalScorePct !== null ? ` — nota final ${attempt.finalScorePct}%` : ""}.
          </p>
        ) : (
          <AttemptReviewForm
            attempt={{
              id: attempt.id,
              attemptNo: attempt.attemptNo,
              autoScorePct: attempt.autoScorePct,
              passingScore: quiz?.passingScore ?? 70,
              learnerName: attempt.user.name,
              courseTitle: attempt.quiz.course.title,
              answers,
            }}
          />
        )}
      </div>
    </div>
  );
}
