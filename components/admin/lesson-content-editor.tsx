"use client";

import { useActionState, useState } from "react";
import { saveLessonContentAction } from "@/lib/actions/course";
import type { ActionState } from "@/lib/actions/auth";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { FileUploadField } from "@/components/admin/file-upload-field";
import { MarkdownRenderer } from "@/components/courses/markdown-renderer";
import { cn } from "@/lib/utils/cn";

const initialState: ActionState = {};

interface Lesson {
  id: string;
  title: string;
  content: { type: "MARKDOWN" | "SLIDES"; body: string | null; fileUrl: string | null; fileName: string | null } | null;
}

export function LessonContentEditor({ courseId, lesson }: { courseId: string; lesson: Lesson }) {
  const [state, formAction, isPending] = useActionState(saveLessonContentAction, initialState);
  const [type, setType] = useState<"MARKDOWN" | "SLIDES">(lesson.content?.type ?? "MARKDOWN");
  const [body, setBody] = useState(lesson.content?.body ?? "");
  const [previewing, setPreviewing] = useState(false);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{lesson.title}</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="courseId" value={courseId} />
          <input type="hidden" name="lessonId" value={lesson.id} />

          <div>
            <Label>Tipo de conteúdo</Label>
            <div className="flex gap-1.5">
              <TypeTab active={type === "MARKDOWN"} onClick={() => setType("MARKDOWN")}>
                Markdown
              </TypeTab>
              <TypeTab active={type === "SLIDES"} onClick={() => setType("SLIDES")}>
                Apresentação (PDF)
              </TypeTab>
            </div>
            <input type="hidden" name="type" value={type} />
          </div>

          {type === "MARKDOWN" ? (
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <Label className="mb-0">Conteúdo</Label>
                <button
                  type="button"
                  onClick={() => setPreviewing((v) => !v)}
                  className="text-xs font-medium text-primary hover:underline"
                >
                  {previewing ? "Editar" : "Pré-visualizar"}
                </button>
              </div>

              {previewing ? (
                <div className="max-h-[420px] overflow-y-auto rounded-md border border-border bg-surface p-4">
                  <MarkdownRenderer content={body} />
                </div>
              ) : (
                <Textarea
                  name="body"
                  rows={16}
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  className="font-mono text-sm"
                  placeholder={"## Título da seção\n\nEscreva o conteúdo da aula em Markdown…"}
                />
              )}
            </div>
          ) : (
            <div>
              <Label>Arquivo da apresentação (PDF)</Label>
              <FileUploadField
                name="fileUrl"
                fileNameFieldName="fileName"
                kind="pdf"
                accept="application/pdf"
                label="Enviar apresentação em PDF"
                defaultValue={lesson.content?.fileUrl ?? ""}
                defaultFileName={lesson.content?.fileName ?? ""}
              />
            </div>
          )}

          {state.error && (
            <p className="rounded-md border border-danger/20 bg-danger-soft px-3 py-2 text-sm text-danger" role="alert">
              {state.error}
            </p>
          )}
          {state.success && (
            <p className="rounded-md border border-success/20 bg-success-soft px-3 py-2 text-sm text-success" role="status">
              {state.success}
            </p>
          )}

          <Button type="submit" loading={isPending}>
            Salvar conteúdo
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function TypeTab({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
        active ? "border-primary bg-primary-soft text-primary-strong" : "border-border text-muted hover:bg-surface-alt"
      )}
    >
      {children}
    </button>
  );
}
