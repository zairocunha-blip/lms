import type { Metadata } from "next";
import { LineChart } from "lucide-react";
import { prisma } from "@/lib/db/prisma";
import { trackProgress } from "@/lib/services/assignment";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, Thead, Tbody, Tr, Th, Td } from "@/components/ui/table";
import { AssignmentStatusBadge } from "@/components/ui/status-badge";
import { ProgressBar } from "@/components/ui/progress-bar";
import { EmptyState } from "@/components/ui/empty-state";
import { PaginationLinks } from "@/components/admin/pagination-links";
import { Avatar } from "@/components/ui/avatar";
import { formatDate } from "@/lib/utils/format";

export const metadata: Metadata = { title: "Progresso" };
export const dynamic = "force-dynamic";

interface SearchParams {
  [key: string]: string | undefined;
  courseId?: string;
  departmentId?: string;
  status?: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";
  dateFrom?: string;
  dateTo?: string;
  page?: string;
}

export default async function AdminProgressPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const page = Number(params.page) || 1;

  const [{ rows, total, totalPages }, courses, departments] = await Promise.all([
    trackProgress({
      courseId: params.courseId,
      departmentId: params.departmentId,
      status: params.status,
      dateFrom: params.dateFrom,
      dateTo: params.dateTo,
      page,
    }),
    prisma.course.findMany({ orderBy: { title: "asc" }, select: { id: true, title: true } }),
    prisma.department.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-ink">Acompanhamento de progresso</h1>
      <p className="mt-1 text-muted">{total} atribuições encontradas.</p>

      <form className="mt-6 flex flex-wrap items-end gap-3 rounded-md border border-border bg-canvas p-4">
        <div className="w-52">
          <label htmlFor="courseId" className="mb-1.5 block text-sm font-medium text-ink-soft">
            Curso
          </label>
          <Select id="courseId" name="courseId" defaultValue={params.courseId ?? ""}>
            <option value="">Todos</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </Select>
        </div>

        <div className="w-44">
          <label htmlFor="departmentId" className="mb-1.5 block text-sm font-medium text-ink-soft">
            Departamento
          </label>
          <Select id="departmentId" name="departmentId" defaultValue={params.departmentId ?? ""}>
            <option value="">Todos</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </Select>
        </div>

        <div className="w-40">
          <label htmlFor="status" className="mb-1.5 block text-sm font-medium text-ink-soft">
            Status
          </label>
          <Select id="status" name="status" defaultValue={params.status ?? ""}>
            <option value="">Todos</option>
            <option value="NOT_STARTED">Não iniciado</option>
            <option value="IN_PROGRESS">Em andamento</option>
            <option value="COMPLETED">Concluído</option>
          </Select>
        </div>

        <div className="w-36">
          <label htmlFor="dateFrom" className="mb-1.5 block text-sm font-medium text-ink-soft">
            Atribuído de
          </label>
          <Input id="dateFrom" name="dateFrom" type="date" defaultValue={params.dateFrom} />
        </div>
        <div className="w-36">
          <label htmlFor="dateTo" className="mb-1.5 block text-sm font-medium text-ink-soft">
            até
          </label>
          <Input id="dateTo" name="dateTo" type="date" defaultValue={params.dateTo} />
        </div>

        <Button type="submit" variant="secondary">
          Filtrar
        </Button>
      </form>

      {rows.length === 0 ? (
        <EmptyState className="mt-6" icon={LineChart} title="Nenhum resultado" description="Ajuste os filtros para ver o progresso dos colaboradores." />
      ) : (
        <div className="mt-6 rounded-md border border-border bg-canvas px-1">
          <Table>
            <Thead>
              <tr>
                <Th>Colaborador</Th>
                <Th>Curso</Th>
                <Th>Progresso</Th>
                <Th>Status</Th>
                <Th>Último acesso</Th>
              </tr>
            </Thead>
            <Tbody>
              {rows.map(({ assignment, progress }) => (
                <Tr key={assignment.id}>
                  <Td>
                    <div className="flex items-center gap-2.5">
                      <Avatar name={assignment.user.name} src={assignment.user.avatarUrl} size="sm" />
                      <div className="min-w-0">
                        <p className="truncate font-medium text-ink">{assignment.user.name}</p>
                        <p className="truncate text-xs text-muted-subtle">{assignment.user.department?.name ?? "—"}</p>
                      </div>
                    </div>
                  </Td>
                  <Td>{assignment.course.title}</Td>
                  <Td className="w-40">
                    <div className="flex items-center gap-2">
                      <ProgressBar value={progress?.percentage ?? 0} />
                      <span className="text-xs text-muted">{progress?.percentage ?? 0}%</span>
                    </div>
                  </Td>
                  <Td>
                    <AssignmentStatusBadge status={assignment.status} />
                  </Td>
                  <Td>{formatDate(progress?.updatedAt ?? assignment.assignedAt)}</Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
          <div className="px-4 pb-4">
            <PaginationLinks page={page} totalPages={totalPages} searchParams={params} />
          </div>
        </div>
      )}
    </div>
  );
}
