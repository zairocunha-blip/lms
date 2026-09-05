"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Circle, PlayCircle, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface LessonNavModule {
  id: string;
  title: string;
  lessons: { id: string; title: string }[];
}

const STORAGE_KEY = "lms:lesson-nav-collapsed";

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
  // Sempre renderiza expandida no primeiro paint (igual ao servidor) e só lê
  // a preferência salva depois de montar — evita divergência de hidratação.
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem(STORAGE_KEY) === "1");
    } catch {
      // localStorage indisponível (aba privada etc.) — mantém expandida.
    }
  }, []);

  function toggle() {
    setCollapsed((current) => {
      const next = !current;
      try {
        localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
      } catch {
        // Sem persistência disponível — a escolha só vale para esta sessão de navegação.
      }
      return next;
    });
  }

  if (collapsed) {
    return (
      <div className="hidden shrink-0 border-r border-border lg:flex lg:h-full lg:items-start lg:justify-center lg:pt-4">
        <button
          type="button"
          onClick={toggle}
          className="flex h-9 w-9 items-center justify-center rounded-md text-muted hover:bg-surface-alt hover:text-ink"
          aria-label="Mostrar módulos do curso"
          title="Mostrar módulos do curso"
        >
          <PanelLeftOpen className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    );
  }

  return (
    // Abaixo de `lg`, continua um cartão normal no fluxo da página. A partir de
    // `lg`, vira uma coluna fixa à esquerda com a altura inteira da tela — os
    // módulos ficam "presos" ali, com rolagem própria, como no desenho.
    <nav
      aria-label="Conteúdo do curso"
      className="flex w-full shrink-0 flex-col rounded-md border border-border bg-canvas lg:h-full lg:w-80 lg:rounded-none lg:border-y-0 lg:border-l-0 lg:border-r"
    >
      <div className="flex shrink-0 items-start justify-between gap-2 border-b border-border px-4 py-3">
        <div className="min-w-0">
          <Link href={`/cursos/${courseId}`} className="text-xs font-medium text-primary hover:underline">
            Voltar à visão geral
          </Link>
          <p className="mt-1 truncate font-display text-sm font-semibold text-ink">{courseTitle}</p>
        </div>
        <button
          type="button"
          onClick={toggle}
          className="hidden h-7 w-7 shrink-0 items-center justify-center rounded-md text-muted hover:bg-surface-alt hover:text-ink lg:flex"
          aria-label="Minimizar módulos do curso"
          title="Minimizar módulos do curso"
        >
          <PanelLeftClose className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>

      <div className="max-h-[70vh] overflow-y-auto py-2 lg:max-h-none lg:flex-1">
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
