"use client";

import { useActionState, useRef, useState } from "react";
import { submitAttemptAction } from "@/lib/actions/quiz";
import type { ActionState } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { cn } from "@/lib/utils/cn";

interface Option {
  id: string;
  text: string;
}
interface Question {
  id: string;
  type: "OBJECTIVE" | "TEXT";
  prompt: string;
  options: Option[];
}
interface Quiz {
  id: string;
  title: string;
  description: string | null;
  questions: Question[];
}

const initialState: ActionState = {};

export function QuizAttemptForm({
  courseId,
  quiz,
  attemptsUsed,
  attemptsLeft,
}: {
  courseId: string;
  quiz: Quiz;
  attemptsUsed: number;
  attemptsLeft: number;
}) {
  const [state, formAction, isPending] = useActionState(submitAttemptAction, initialState);
  const [answers, setAnswers] = useState<Record<string, { selectedOptionId?: string; textResponse?: string }>>({});
  const [confirmOpen, setConfirmOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const answeredCount = quiz.questions.filter((q) => {
    const a = answers[q.id];
    if (!a) return false;
    return q.type === "OBJECTIVE" ? !!a.selectedOptionId : !!a.textResponse?.trim();
  }).length;
  const allAnswered = answeredCount === quiz.questions.length;

  function setAnswer(questionId: string, patch: { selectedOptionId?: string; textResponse?: string }) {
    setAnswers((current) => ({ ...current, [questionId]: { ...current[questionId], ...patch } }));
  }

  function submit(formData: FormData) {
    formData.set(
      "payload",
      JSON.stringify({
        quizId: quiz.id,
        answers: quiz.questions.map((q) => ({
          questionId: q.id,
          selectedOptionId: answers[q.id]?.selectedOptionId,
          textResponse: answers[q.id]?.textResponse,
        })),
      })
    );
    formAction(formData);
  }

  return (
    <form ref={formRef} action={submit} className="space-y-5">
      <p className="text-sm text-muted">
        {quiz.questions.length} questão(ões) · Tentativa {attemptsUsed + 1} de {attemptsUsed + attemptsLeft} ·{" "}
        {answeredCount}/{quiz.questions.length} respondidas
      </p>

      <ol className="space-y-4">
        {quiz.questions.map((question, index) => (
          <li key={question.id} className="rounded-md border border-border bg-canvas p-4">
            <p className="font-medium text-ink">
              {index + 1}. {question.prompt}
            </p>

            {question.type === "OBJECTIVE" ? (
              <div className="mt-3 space-y-1.5">
                {question.options.map((option) => {
                  const checked = answers[question.id]?.selectedOptionId === option.id;
                  return (
                    <label
                      key={option.id}
                      className={cn(
                        "flex cursor-pointer items-center gap-2.5 rounded-md border px-3 py-2 text-sm",
                        checked
                          ? "border-primary bg-primary-soft text-primary-strong"
                          : "border-border text-ink-soft hover:bg-surface-alt"
                      )}
                    >
                      <input
                        type="radio"
                        name={`q-${question.id}`}
                        checked={checked}
                        onChange={() => setAnswer(question.id, { selectedOptionId: option.id })}
                        className="h-4 w-4 shrink-0"
                      />
                      {option.text}
                    </label>
                  );
                })}
              </div>
            ) : (
              <div className="mt-3">
                <Label htmlFor={`text-${question.id}`} className="sr-only">
                  Sua resposta
                </Label>
                <Textarea
                  id={`text-${question.id}`}
                  rows={4}
                  value={answers[question.id]?.textResponse ?? ""}
                  onChange={(e) => setAnswer(question.id, { textResponse: e.target.value })}
                  placeholder="Escreva sua resposta…"
                />
              </div>
            )}
          </li>
        ))}
      </ol>

      {state.error && (
        <p className="rounded-md border border-danger/20 bg-danger-soft px-3 py-2 text-sm text-danger" role="alert">
          {state.error}
        </p>
      )}

      <div className="flex items-center gap-3 border-t border-border pt-4">
        <Button type="button" onClick={() => setConfirmOpen(true)} disabled={!allAnswered || isPending}>
          Enviar prova para correção
        </Button>
        {!allAnswered && <span className="text-sm text-muted">Responda todas as questões para enviar.</span>}
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Enviar prova?"
        description={
          `Depois de enviar, você não pode alterar as respostas. Um administrador vai corrigir a prova. ` +
          `Esta é a tentativa ${attemptsUsed + 1} de ${attemptsUsed + attemptsLeft}.`
        }
        confirmLabel="Enviar"
        loading={isPending}
        onConfirm={() => {
          setConfirmOpen(false);
          formRef.current?.requestSubmit();
        }}
      />
    </form>
  );
}
