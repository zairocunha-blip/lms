import type { Metadata } from "next";
import Link from "next/link";
import { BookOpen } from "lucide-react";
import { auth } from "@/auth";
import { getMyCourses } from "@/lib/services/course";
import { CourseCard } from "@/components/courses/course-card";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/utils/cn";

export const metadata: Metadata = { title: "Meus cursos" };
export const dynamic = "force-dynamic";

const filters = [
  { value: "all", label: "Todos" },
  { value: "IN_PROGRESS", label: "Em andamento" },
  { value: "NOT_STARTED", label: "Não iniciados" },
  { value: "COMPLETED", label: "Concluídos" },
] as const;

export default async function MyCoursesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const session = await auth();
  const { status } = await searchParams;
  const activeFilter = filters.some((f) => f.value === status) ? status! : "all";

  const myCourses = await getMyCourses(session!.user.id);
  const filtered =
    activeFilter === "all" ? myCourses : myCourses.filter((c) => c.assignment.status === activeFilter);

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-ink">Meus cursos</h1>
      <p className="mt-1 text-muted">Treinamentos atribuídos a você.</p>

      <div className="mt-5 flex gap-1 border-b border-border">
        {filters.map((filter) => (
          <Link
            key={filter.value}
            href={filter.value === "all" ? "/cursos" : `/cursos?status=${filter.value}`}
            className={cn(
              "border-b-2 px-3 py-2 text-sm font-medium transition-colors",
              activeFilter === filter.value
                ? "border-primary text-primary"
                : "border-transparent text-muted hover:text-ink"
            )}
          >
            {filter.label}
          </Link>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          className="mt-6"
          icon={BookOpen}
          title="Nenhum curso encontrado"
          description={
            activeFilter === "all"
              ? "Você ainda não possui cursos atribuídos."
              : "Não há cursos nesta categoria de filtro no momento."
          }
        />
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map(({ course, progress, assignment }) => (
            <CourseCard
              key={course.id}
              courseId={course.id}
              title={course.title}
              description={course.description}
              coverUrl={course.coverUrl}
              categoryName={course.category?.name}
              status={assignment.status}
              percentage={progress?.percentage ?? 0}
              assignedAt={assignment.assignedAt}
              completedAt={assignment.completedAt}
            />
          ))}
        </div>
      )}
    </div>
  );
}
