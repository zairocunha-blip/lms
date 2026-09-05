"use client";

import { useActionState, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  ClipboardList,
  ListChecks,
  PencilLine,
  ExternalLink,
} from "lucide-react";
import {
  enableQuizAction,
  updateQuizSettingsAction,
  createQuestionAction,
  updateQuestionAction,
  deleteQuestionAction,
  reorderQuestionsAction,
  createOptionAction,
  updateOptionAction,
  deleteOptionAction,
  setCorrectOptionAction,
} from "@/lib/actions/quiz";
import type { ActionState } from "@/lib/actions/auth";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { cn } from "@/lib/utils/cn";

type QuestionType = "OBJECTIVE" | "TEXT";

interface Option {
  id: string;
  text: string;
  isCorrect: boolean;
  order: number;
}
interface Question {
  id: string;
  type: QuestionType;
  prompt: string;
  points: number;
  order: number;
  options: Option[];
}
interface Quiz {
  id: string;
  title: string;
  description: string | null;
  passingScore: number;
  maxAttempts: number;
  isActive: boolean;
  questions: Question[];
}

const initialState: ActionState = {};

export function QuizBuilder({
  courseId,
  quiz,
  pendingCount,
}: {
  courseId: string;
  quiz: Quiz | null;
  pendingCount: number;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  if (!quiz) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-muted">
          Exija uma prova para que o colaborador só conclua o curso após enviá-la e ser
          aprovado por um administrador. As questões podem ser objetivas (múltipla escolha,
          corrigidas automaticamente) ou abertas para texto (corrigidas por você).
        </p>
        <Button
          type="button"
          loading={isPending}
          onClick={() => startTransition(async () => {
            await enableQuizAction(courseId);
            router.refresh();
          })}
        >
          <Plus className="h-4 w-4" />
          Exigir prova para concluir o curso
        </Button>
      </div>
    );
  }

  function handleMoveQuestion(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= quiz!.questions.length) return;
    const reordered = [...quiz!.questions];
    const temp = reordered[index]!;
    reordered[index] = reordered[target]!;
    reordered[target] = temp;
    startTransition(async () => {
      await reorderQuestionsAction(
        courseId,
        reordered.map((q, i) => ({ id: q.id, order: i }))
      );
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <QuizSettings courseId={courseId} quiz={quiz} />

      {pendingCount > 0 && (
        <Link
          href={`/admin/provas?courseId=${courseId}`}
          className="flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
        >
          <ClipboardList className="h-4 w-4" aria-hidden="true" />
          {pendingCount} prova(s) aguardando correção
          <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
        </Link>
      )}

      <div className="space-y-4">
        {quiz.questions.map((question, index) => (
          <QuestionCard
            key={question.id}
            courseId={courseId}
            question={question}
            index={index}
            total={quiz.questions.length}
            onMove={handleMoveQuestion}
          />
        ))}

        {quiz.questions.length === 0 && (
          <p className="rounded-md border border-dashed border-border px-4 py-6 text-center text-sm text-muted">
            Nenhuma questão ainda. Adicione a primeira abaixo.
          </p>
        )}
      </div>

      <div className="flex flex-wrap gap-2 border-t border-border pt-4">
        <span className="self-center text-sm font-medium text-ink-soft">Adicionar questão:</span>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          disabled={isPending}
          onClick={() => startTransition(async () => {
            await createQuestionAction(courseId, quiz.id, "OBJECTIVE");
            router.refresh();
          })}
        >
          <ListChecks className="h-4 w-4" />
          Objetiva
        </Button>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          disabled={isPending}
          onClick={() => startTransition(async () => {
            await createQuestionAction(courseId, quiz.id, "TEXT");
            router.refresh();
          })}
        >
          <PencilLine className="h-4 w-4" />
          Aberta (texto)
        </Button>
      </div>
    </div>
  );
}

function QuizSettings({ courseId, quiz }: { courseId: string; quiz: Quiz }) {
  const [state, formAction, isPending] = useActionState(updateQuizSettingsAction, initialState);
  const [active, setActive] = useState(quiz.isActive);

  return (
    <form
      action={formAction}
      className="grid gap-4 rounded-md border border-border bg-surface p-4 sm:grid-cols-2"
    >
      <input type="hidden" name="courseId" value={courseId} />

      <div className="sm:col-span-2">
        <Label htmlFor="quiz-title">Título da prova</Label>
        <Input id="quiz-title" name="title" defaultValue={quiz.title} required />
      </div>

      <div className="sm:col-span-2">
        <Label htmlFor="quiz-description">Instruções (opcional)</Label>
        <Textarea
          id="quiz-description"
          name="description"
          rows={2}
          defaultValue={quiz.description ?? ""}
          placeholder="Ex.: Você tem uma tentativa. Responda todas as questões."
        />
      </div>

      <div>
        <Label htmlFor="quiz-passing">Nota mínima para aprovar (%)</Label>
        <Input
          id="quiz-passing"
          name="passingScore"
          type="number"
          min={0}
          max={100}
          defaultValue={quiz.passingScore}
        />
      </div>

      <div>
        <Label htmlFor="quiz-attempts">Máximo de tentativas</Label>
        <Input
          id="quiz-attempts"
          name="maxAttempts"
          type="number"
          min={1}
          max={10}
          defaultValue={quiz.maxAttempts}
        />
      </div>

      <label className="flex items-center gap-2 text-sm text-ink-soft sm:col-span-2">
        <input
          type="checkbox"
          name="isActive"
          checked={active}
          onChange={(e) => setActive(e.target.checked)}
          className="h-4 w-4 rounded border-border"
        />
        Prova ativa (obrigatória para concluir o curso)
      </label>

      {state.error && (
        <p className="rounded-md border border-danger/20 bg-danger-soft px-3 py-2 text-sm text-danger sm:col-span-2" role="alert">
          {state.error}
        </p>
      )}
      {state.success && (
        <p className="rounded-md border border-success/20 bg-success-soft px-3 py-2 text-sm text-success sm:col-span-2" role="status">
          {state.success}
        </p>
      )}

      <div className="sm:col-span-2">
        <Button type="submit" size="sm" loading={isPending}>
          Salvar configurações
        </Button>
      </div>
    </form>
  );
}

function QuestionCard({
  courseId,
  question,
  index,
  total,
  onMove,
}: {
  courseId: string;
  question: Question;
  index: number;
  total: number;
  onMove: (index: number, direction: -1 | 1) => void;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [prompt, setPrompt] = useState(question.prompt);
  const [points, setPoints] = useState(String(question.points));
  const [confirmDelete, setConfirmDelete] = useState(false);

  function saveQuestion() {
    const nextPoints = Math.max(1, Number(points) || 1);
    if (prompt === question.prompt && nextPoints === question.points) return;
    startTransition(async () => {
      await updateQuestionAction(courseId, question.id, { prompt, points: nextPoints });
      router.refresh();
    });
  }

  return (
    <div className="rounded-md border border-border bg-canvas">
      <div className="flex items-center gap-2 border-b border-border bg-surface px-3 py-2">
        <span className="text-sm font-semibold text-ink">Questão {index + 1}</span>
        <Badge tone={question.type === "OBJECTIVE" ? "primary" : "neutral"}>
          {question.type === "OBJECTIVE" ? "Objetiva" : "Texto"}
        </Badge>
        <div className="ml-auto flex items-center gap-1">
          <IconButton label="Mover para cima" onClick={() => onMove(index, -1)} disabled={index === 0 || isPending}>
            <ChevronUp className="h-3.5 w-3.5" />
          </IconButton>
          <IconButton
            label="Mover para baixo"
            onClick={() => onMove(index, 1)}
            disabled={index === total - 1 || isPending}
          >
            <ChevronDown className="h-3.5 w-3.5" />
          </IconButton>
          <IconButton label="Excluir questão" destructive onClick={() => setConfirmDelete(true)}>
            <Trash2 className="h-3.5 w-3.5" />
          </IconButton>
        </div>
      </div>

      <div className="space-y-3 p-3">
        <div>
          <Label htmlFor={`prompt-${question.id}`}>Enunciado</Label>
          <Textarea
            id={`prompt-${question.id}`}
            rows={2}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onBlur={saveQuestion}
            placeholder="Escreva a pergunta…"
          />
        </div>

        <div className="w-32">
          <Label htmlFor={`points-${question.id}`}>Pontos</Label>
          <Input
            id={`points-${question.id}`}
            type="number"
            min={1}
            max={100}
            value={points}
            onChange={(e) => setPoints(e.target.value)}
            onBlur={saveQuestion}
          />
        </div>

        {question.type === "OBJECTIVE" && (
          <div className="space-y-2">
            <Label className="mb-0">Alternativas (marque a correta)</Label>
            {question.options.map((option) => (
              <OptionRow key={option.id} courseId={courseId} questionId={question.id} option={option} />
            ))}
            <Button
              type="button"
              size="sm"
              variant="ghost"
              disabled={isPending}
              onClick={() => startTransition(async () => {
                await createOptionAction(courseId, question.id);
                router.refresh();
              })}
            >
              <Plus className="h-3.5 w-3.5" />
              Adicionar alternativa
            </Button>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="Excluir questão"
        description="A questão e suas alternativas serão removidas permanentemente."
        confirmLabel="Excluir"
        destructive
        loading={isPending}
        onConfirm={() =>
          startTransition(async () => {
            await deleteQuestionAction(courseId, question.id);
            setConfirmDelete(false);
            router.refresh();
          })
        }
      />
    </div>
  );
}

function OptionRow({
  courseId,
  questionId,
  option,
}: {
  courseId: string;
  questionId: string;
  option: Option;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [text, setText] = useState(option.text);

  return (
    <div className="flex items-center gap-2">
      <input
        type="radio"
        name={`correct-${questionId}`}
        checked={option.isCorrect}
        onChange={() =>
          startTransition(async () => {
            await setCorrectOptionAction(courseId, questionId, option.id);
            router.refresh();
          })
        }
        aria-label="Alternativa correta"
        className="h-4 w-4 shrink-0"
      />
      <Input
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={() => {
          if (text === option.text) return;
          startTransition(async () => {
            await updateOptionAction(courseId, option.id, { text, isCorrect: option.isCorrect });
            router.refresh();
          });
        }}
        placeholder="Texto da alternativa"
        className="h-8 text-sm"
      />
      <IconButton
        label="Excluir alternativa"
        destructive
        disabled={isPending}
        onClick={() =>
          startTransition(async () => {
            await deleteOptionAction(courseId, option.id);
            router.refresh();
          })
        }
      >
        <Trash2 className="h-3.5 w-3.5" />
      </IconButton>
    </div>
  );
}

function IconButton({
  label,
  onClick,
  disabled,
  destructive,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  destructive?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex h-6 w-6 shrink-0 items-center justify-center rounded text-muted hover:bg-surface-alt disabled:pointer-events-none disabled:opacity-30",
        destructive && "hover:bg-danger-soft hover:text-danger"
      )}
    >
      {children}
    </button>
  );
}
