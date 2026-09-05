"use client";

import { useActionState, useMemo, useRef, useState } from "react";
import { CheckCircle2, XCircle } from "lucide-react";
import { reviewAttemptAction } from "@/lib/actions/quiz";
import type { ActionState } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils/cn";

interface ReviewOption {
  id: string;
  text: string;
  isCorrect: boolean;
}
interface ReviewAnswer {
  id: string;
  type: "OBJECTIVE" | "TEXT";
  prompt: string;
  points: number;
  options: ReviewOption[];
  selectedOptionId: string | null;
  textResponse: string | null;
  isCorrect: boolean | null;
}
interface Attempt {
  id: string;
  attemptNo: number;
  autoScorePct: number | null;
  passingScore: number;
  learnerName: string;
  courseTitle: string;
  answers: ReviewAnswer[];
}

const initialState: ActionState = {};

export function AttemptReviewForm({ attempt }: { attempt: Attempt }) {
  const [state, formAction, isPending] = useActionState(reviewAttemptAction, initialState);
  const decisionRef = useRef<"APPROVED" | "REJECTED">("APPROVED");
  const [note, setNote] = useState("");

  const textAnswers = attempt.answers.filter((a) => a.type === "TEXT");
  const [marks, setMarks] = useState<Record<string, { isCorrect: boolean; points: string }>>(
    () =>
      Object.fromEntries(
        textAnswers.map((a) => [a.id, { isCorrect: false, points: "" }])
      )
  );

  const totalPoints = attempt.answers.reduce((sum, a) => sum + a.points, 0);
  const projectedPct = useMemo(() => {
    const earned = attempt.answers.reduce((sum, a) => {
      if (a.type === "OBJECTIVE") return sum + (a.isCorrect ? a.points : 0);
      const mark = marks[a.id];
      if (!mark) return sum;
      const pts = mark.points !== "" ? Number(mark.points) : mark.isCorrect ? a.points : 0;
      return sum + (Number.isFinite(pts) ? pts : 0);
    }, 0);
    return totalPoints > 0 ? Math.round((earned / totalPoints) * 100) : 0;
  }, [attempt.answers, marks, totalPoints]);

  function setMark(answerId: string, patch: Partial<{ isCorrect: boolean; points: string }>) {
    setMarks((current) => ({ ...current, [answerId]: { ...current[answerId]!, ...patch } }));
  }

  function handleSubmit(formData: FormData) {
    const grades = textAnswers.map((a) => {
      const mark = marks[a.id]!;
      return {
        answerId: a.id,
        isCorrect: mark.isCorrect,
        ...(mark.points !== "" ? { awardedPoints: Number(mark.points) } : {}),
      };
    });
    formData.set(
      "payload",
      JSON.stringify({
        attemptId: attempt.id,
        decision: decisionRef.current,
        reviewNote: note,
        grades,
      })
    );
    formAction(formData);
  }

  return (
    <form action={handleSubmit} className="space-y-5">
      <div className="flex flex-wrap items-center gap-3 rounded-md border border-border bg-surface p-4 text-sm">
        <span className="font-medium text-ink">{attempt.learnerName}</span>
        <span className="text-muted-subtle">·</span>
        <span className="text-muted">{attempt.courseTitle}</span>
        <span className="text-muted-subtle">·</span>
        <span className="text-muted">Tentativa #{attempt.attemptNo}</span>
        <div className="ml-auto flex items-center gap-3">
          <span className="text-muted">
            Acerto automático: {attempt.autoScorePct === null ? "—" : `${attempt.autoScorePct}%`}
          </span>
          <Badge tone={projectedPct >= attempt.passingScore ? "success" : "warning"}>
            Nota projetada: {projectedPct}%
          </Badge>
        </div>
      </div>

      <ol className="space-y-4">
        {attempt.answers.map((answer, index) => (
          <li key={answer.id} className="rounded-md border border-border bg-canvas p-4">
            <div className="flex items-start justify-between gap-3">
              <p className="font-medium text-ink">
                {index + 1}. {answer.prompt || <span className="italic text-muted">(sem enunciado)</span>}
              </p>
              <Badge tone={answer.type === "OBJECTIVE" ? "primary" : "neutral"}>
                {answer.type === "OBJECTIVE" ? "Objetiva" : "Texto"} · {answer.points} pt
              </Badge>
            </div>

            {answer.type === "OBJECTIVE" ? (
              <ul className="mt-3 space-y-1.5">
                {answer.options.map((option) => {
                  const chosen = option.id === answer.selectedOptionId;
                  return (
                    <li
                      key={option.id}
                      className={cn(
                        "flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm",
                        option.isCorrect
                          ? "border-success/30 bg-success-soft text-success"
                          : chosen
                            ? "border-danger/30 bg-danger-soft text-danger"
                            : "border-border text-ink-soft"
                      )}
                    >
                      {option.isCorrect ? (
                        <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
                      ) : chosen ? (
                        <XCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
                      ) : (
                        <span className="h-4 w-4 shrink-0" />
                      )}
                      <span>{option.text || <span className="italic">(vazio)</span>}</span>
                      {chosen && <span className="ml-auto text-xs font-medium">resposta do colaborador</span>}
                    </li>
                  );
                })}
                {answer.selectedOptionId === null && (
                  <li className="text-sm italic text-muted">Não respondida.</li>
                )}
              </ul>
            ) : (
              <div className="mt-3 space-y-3">
                <div className="whitespace-pre-wrap rounded-md border border-border bg-surface px-3 py-2 text-sm text-ink-soft">
                  {answer.textResponse || <span className="italic text-muted">Não respondida.</span>}
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex gap-1.5">
                    <MarkButton
                      active={marks[answer.id]?.isCorrect === true}
                      tone="success"
                      onClick={() => setMark(answer.id, { isCorrect: true })}
                    >
                      Correta
                    </MarkButton>
                    <MarkButton
                      active={marks[answer.id]?.isCorrect === false}
                      tone="danger"
                      onClick={() => setMark(answer.id, { isCorrect: false })}
                    >
                      Incorreta
                    </MarkButton>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Label htmlFor={`pts-${answer.id}`} className="mb-0 text-xs">
                      Pontos (0–{answer.points})
                    </Label>
                    <Input
                      id={`pts-${answer.id}`}
                      type="number"
                      min={0}
                      max={answer.points}
                      value={marks[answer.id]?.points ?? ""}
                      onChange={(e) => setMark(answer.id, { points: e.target.value })}
                      placeholder={String(marks[answer.id]?.isCorrect ? answer.points : 0)}
                      className="h-8 w-20 text-sm"
                    />
                  </div>
                </div>
              </div>
            )}
          </li>
        ))}
      </ol>

      <div>
        <Label htmlFor="review-note">Comentário para o colaborador (opcional)</Label>
        <Textarea
          id="review-note"
          rows={2}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Ex.: Reveja o módulo 2 antes de tentar novamente."
        />
      </div>

      {state.error && (
        <p className="rounded-md border border-danger/20 bg-danger-soft px-3 py-2 text-sm text-danger" role="alert">
          {state.error}
        </p>
      )}

      <div className="flex flex-wrap gap-2 border-t border-border pt-4">
        <Button
          type="submit"
          loading={isPending}
          onClick={() => {
            decisionRef.current = "APPROVED";
          }}
        >
          <CheckCircle2 className="h-4 w-4" />
          Aprovar e concluir curso
        </Button>
        <Button
          type="submit"
          variant="danger"
          loading={isPending}
          onClick={() => {
            decisionRef.current = "REJECTED";
          }}
        >
          <XCircle className="h-4 w-4" />
          Reprovar
        </Button>
      </div>
    </form>
  );
}

function MarkButton({
  active,
  tone,
  onClick,
  children,
}: {
  active: boolean;
  tone: "success" | "danger";
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
        active
          ? tone === "success"
            ? "border-success/40 bg-success-soft text-success"
            : "border-danger/40 bg-danger-soft text-danger"
          : "border-border text-muted hover:bg-surface-alt"
      )}
    >
      {children}
    </button>
  );
}
