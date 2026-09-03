import type { Metadata } from "next";
import Link from "next/link";
import { History } from "lucide-react";
import { auth } from "@/auth";
import { getMyCourses } from "@/lib/services/course";
import { Table, Thead, Tbody, Tr, Th, Td } from "@/components/ui/table";
import { AssignmentStatusBadge } from "@/components/ui/status-badge";
import { ProgressBar } from "@/components/ui/progress-bar";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDate } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";

export const metadata: Metadata = { title: "Histórico" };
export const dynamic = "force-dynamic";

const filters = [
  { value: "all", label: "Todos" },
  { value: "IN_PROGRESS", label: "Em andamento" },
  { value: "NOT_STARTED", label: "Não iniciados" },
  { value: "COMPLETED", label: "Concluídos" },
] as const;

export default async function HistoryPage({
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
      <h1 className="font-display text-2xl font-semibold text-ink">Histórico</h1>
      <p className="mt-1 text-muted">Todos os treinamentos já atribuídos a você.</p>

      <div className="mt-5 flex gap-1 border-b border-border">
        {filters.map((filter) => (
          <Link
            key={filter.value}
            href={filter.value === "all" ? "/historico" : `/historico?status=${filter.value}`}
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
          icon={History}
          title="Nenhum registro encontrado"
          description="Seu histórico de treinamentos aparecerá aqui assim que você iniciar um curso."
        />
      ) : (
        <div className="mt-6 rounded-md border border-border bg-canvas px-1">
          <Table>
            <Thead>
              <tr>
                <Th>Curso</Th>
                <Th>Categoria</Th>
                <Th>Status</Th>
                <Th>Progresso</Th>
                <Th>Início</Th>
                <Th>Conclusão</Th>
              </tr>
            </Thead>
            <Tbody>
              {filtered.map(({ course, assignment, progress }) => (
                <Tr key={course.id}>
                  <Td>
                    <Link href={`/cursos/${course.id}`} className="font-medium text-ink hover:text-primary">
                      {course.title}
                    </Link>
                  </Td>
                  <Td>{course.category?.name ?? "—"}</Td>
                  <Td>
                    <AssignmentStatusBadge status={assignment.status} />
                  </Td>
                  <Td className="w-40">
                    <div className="flex items-center gap-2">
                      <ProgressBar value={progress?.percentage ?? 0} />
                      <span className="text-xs text-muted">{progress?.percentage ?? 0}%</span>
                    </div>
                  </Td>
                  <Td>{formatDate(progress?.startedAt)}</Td>
                  <Td>{formatDate(assignment.completedAt)}</Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </div>
      )}
    </div>
  );
}
