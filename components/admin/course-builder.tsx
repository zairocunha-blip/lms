"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, ChevronUp, ChevronDown, GripVertical, FileText } from "lucide-react";
import {
  createModuleAction,
  renameModuleAction,
  deleteModuleAction,
  reorderModulesAction,
  createLessonAction,
  renameLessonAction,
  deleteLessonAction,
  reorderLessonsAction,
} from "@/lib/actions/course";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { cn } from "@/lib/utils/cn";
import { LessonContentEditor } from "@/components/admin/lesson-content-editor";

interface Lesson {
  id: string;
  title: string;
  order: number;
  content: { type: "MARKDOWN" | "SLIDES"; body: string | null; fileUrl: string | null; fileName: string | null } | null;
}
interface Module {
  id: string;
  title: string;
  order: number;
  lessons: Lesson[];
}

export function CourseBuilder({ courseId, modules }: { courseId: string; modules: Module[] }) {
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(
    modules[0]?.lessons[0]?.id ?? null
  );
  const [newModuleTitle, setNewModuleTitle] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<{ type: "module" | "lesson"; id: string; label: string } | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const selectedLesson = modules.flatMap((m) => m.lessons).find((l) => l.id === selectedLessonId) ?? null;

  function refresh() {
    startTransition(() => router.refresh());
  }

  function handleAddModule() {
    const title = newModuleTitle.trim();
    if (!title) return;
    startTransition(async () => {
      await createModuleAction(courseId, title);
      setNewModuleTitle("");
      router.refresh();
    });
  }

  function handleRenameModule(moduleId: string, title: string) {
    if (!title.trim()) return;
    startTransition(async () => {
      await renameModuleAction(courseId, moduleId, title.trim());
    });
  }

  function handleMoveModule(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= modules.length) return;
    const reordered = [...modules];
    const temp = reordered[index]!;
    reordered[index] = reordered[target]!;
    reordered[target] = temp;
    startTransition(async () => {
      await reorderModulesAction(
        courseId,
        reordered.map((m, i) => ({ id: m.id, order: i }))
      );
      router.refresh();
    });
  }

  function handleAddLesson(moduleId: string, title: string) {
    if (!title.trim()) return;
    startTransition(async () => {
      await createLessonAction(courseId, moduleId, title.trim());
      router.refresh();
    });
  }

  function handleRenameLesson(lessonId: string, title: string) {
    if (!title.trim()) return;
    startTransition(async () => {
      await renameLessonAction(courseId, lessonId, title.trim());
    });
  }

  function handleMoveLesson(moduleLessons: Lesson[], index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= moduleLessons.length) return;
    const reordered = [...moduleLessons];
    const temp = reordered[index]!;
    reordered[index] = reordered[target]!;
    reordered[target] = temp;
    startTransition(async () => {
      await reorderLessonsAction(
        courseId,
        reordered.map((l, i) => ({ id: l.id, order: i }))
      );
      router.refresh();
    });
  }

  function handleConfirmDelete() {
    if (!deleteTarget) return;
    startTransition(async () => {
      if (deleteTarget.type === "module") {
        await deleteModuleAction(courseId, deleteTarget.id);
      } else {
        await deleteLessonAction(courseId, deleteTarget.id);
        if (selectedLessonId === deleteTarget.id) setSelectedLessonId(null);
      }
      setDeleteTarget(null);
      router.refresh();
    });
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[320px_1fr] lg:items-start">
      <div className="rounded-md border border-border bg-canvas">
        <div className="border-b border-border px-4 py-3">
          <p className="font-display text-sm font-semibold text-ink">Estrutura do curso</p>
        </div>

        <div className="max-h-[560px] space-y-1 overflow-y-auto p-2">
          {modules.map((module, moduleIndex) => (
            <div key={module.id} className="rounded-md border border-border">
              <div className="flex items-center gap-1 border-b border-border bg-surface px-2 py-1.5">
                <GripVertical className="h-3.5 w-3.5 shrink-0 text-muted-subtle" aria-hidden="true" />
                <input
                  defaultValue={module.title}
                  onBlur={(e) => e.target.value !== module.title && handleRenameModule(module.id, e.target.value)}
                  aria-label={`Nome do módulo ${moduleIndex + 1}`}
                  className="min-w-0 flex-1 truncate bg-transparent text-sm font-medium text-ink outline-none focus:underline"
                />
                <IconButton label="Mover para cima" onClick={() => handleMoveModule(moduleIndex, -1)} disabled={moduleIndex === 0}>
                  <ChevronUp className="h-3.5 w-3.5" />
                </IconButton>
                <IconButton label="Mover para baixo" onClick={() => handleMoveModule(moduleIndex, 1)} disabled={moduleIndex === modules.length - 1}>
                  <ChevronDown className="h-3.5 w-3.5" />
                </IconButton>
                <IconButton
                  label="Excluir módulo"
                  destructive
                  onClick={() => setDeleteTarget({ type: "module", id: module.id, label: module.title })}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </IconButton>
              </div>

              <ul className="p-1">
                {module.lessons.map((lesson, lessonIndex) => (
                  <li key={lesson.id}>
                    <div
                      className={cn(
                        "flex items-center gap-1 rounded-md px-1.5 py-1",
                        selectedLessonId === lesson.id && "bg-primary-soft"
                      )}
                    >
                      <button
                        type="button"
                        onClick={() => setSelectedLessonId(lesson.id)}
                        className="flex min-w-0 flex-1 items-center gap-1.5 text-left"
                      >
                        <FileText className="h-3.5 w-3.5 shrink-0 text-muted" aria-hidden="true" />
                        <input
                          defaultValue={lesson.title}
                          onClick={(e) => e.stopPropagation()}
                          onBlur={(e) => e.target.value !== lesson.title && handleRenameLesson(lesson.id, e.target.value)}
                          aria-label={`Nome da aula ${lessonIndex + 1}`}
                          className={cn(
                            "min-w-0 flex-1 truncate bg-transparent text-sm outline-none focus:underline",
                            selectedLessonId === lesson.id ? "font-medium text-primary-strong" : "text-ink-soft"
                          )}
                        />
                      </button>
                      <IconButton label="Mover para cima" onClick={() => handleMoveLesson(module.lessons, lessonIndex, -1)} disabled={lessonIndex === 0}>
                        <ChevronUp className="h-3.5 w-3.5" />
                      </IconButton>
                      <IconButton
                        label="Mover para baixo"
                        onClick={() => handleMoveLesson(module.lessons, lessonIndex, 1)}
                        disabled={lessonIndex === module.lessons.length - 1}
                      >
                        <ChevronDown className="h-3.5 w-3.5" />
                      </IconButton>
                      <IconButton
                        label="Excluir aula"
                        destructive
                        onClick={() => setDeleteTarget({ type: "lesson", id: lesson.id, label: lesson.title })}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </IconButton>
                    </div>
                  </li>
                ))}
              </ul>

              <AddLessonRow moduleId={module.id} onAdd={handleAddLesson} />
            </div>
          ))}

          {modules.length === 0 && (
            <p className="px-2 py-4 text-center text-sm text-muted">Adicione o primeiro módulo abaixo.</p>
          )}
        </div>

        <div className="flex gap-2 border-t border-border p-2">
          <Input
            value={newModuleTitle}
            onChange={(e) => setNewModuleTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddModule())}
            placeholder="Nome do novo módulo"
          />
          <Button type="button" size="sm" variant="secondary" onClick={handleAddModule} disabled={isPending}>
            <Plus className="h-4 w-4" />
            Módulo
          </Button>
        </div>
      </div>

      <div>
        {selectedLesson ? (
          <LessonContentEditor key={selectedLesson.id} courseId={courseId} lesson={selectedLesson} />
        ) : (
          <div className="flex h-64 items-center justify-center rounded-md border border-dashed border-border text-sm text-muted">
            Selecione uma aula ao lado para editar o conteúdo.
          </div>
        )}
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title={deleteTarget?.type === "module" ? "Excluir módulo" : "Excluir aula"}
        description={`"${deleteTarget?.label}" será removido permanentemente, junto com todo o progresso registrado pelos colaboradores.`}
        confirmLabel="Excluir"
        destructive
        loading={isPending}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}

function AddLessonRow({ moduleId, onAdd }: { moduleId: string; onAdd: (moduleId: string, title: string) => void }) {
  const [title, setTitle] = useState("");
  return (
    <div className="flex gap-1.5 border-t border-border p-1.5">
      <Input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            onAdd(moduleId, title);
            setTitle("");
          }
        }}
        placeholder="Nova aula…"
        className="h-7 text-xs"
      />
      <Button
        type="button"
        size="sm"
        variant="ghost"
        className="h-7 px-2"
        onClick={() => {
          onAdd(moduleId, title);
          setTitle("");
        }}
      >
        <Plus className="h-3.5 w-3.5" />
      </Button>
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
