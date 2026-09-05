import type { Metadata } from "next";
import Link from "next/link";
import { ClipboardCheck } from "lucide-react";
import { prisma } from "@/lib/db/prisma";
import { listPendingAttempts } from "@/lib/services/quiz";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Table, Thead, Tbody, Tr, Th, Td } from "@/components/ui/table";
import { EmptyState } from "@/components/ui/empty-state";
import { PaginationLinks } from "@/components/admin/pagination-links";
import { Avatar } from "@/components/ui/avatar";
import { formatDateTime } from "@/lib/utils/format";

export const metadata: Metadata = { title: "Provas" };
export const dynamic = "force-dynamic";

interface SearchParams {
  [key: string]: string | undefined;
  courseId?: string;
  page?: string;
}

export default async function AdminQuizzesPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const page = Number(params.page) || 1;

  const [{ attempts, total, totalPages }, courses] = await Promise.all([
    listPendingAttempts({ courseId: params.courseId, page }),
    prisma.course.findMany({
      where: { quiz: { isNot: null } },
      orderBy: { title: "asc" },
      select: { id: true, title: true },
    }),
  ]);

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-ink">Provas aguardando correção</h1>
      <p className="mt-1 text-muted">{total} prova(s) pendente(s) de correção.</p>

      <form className="mt-6 flex flex-wrap items-end gap-3 rounded-md border border-border bg-canvas p-4">
        <div className="w-64">
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
        <Button type="submit" variant="secondary">
          Filtrar
        </Button>
      </form>

      {attempts.length === 0 ? (
        <EmptyState
          className="mt-6"
          icon={ClipboardCheck}
          title="Nada para corrigir"
          description="Quando um colaborador enviar uma prova, ela aparece aqui para sua avaliação."
        />
      ) : (
        <div className="mt-6 rounded-md border border-border bg-canvas px-1">
          <Table>
            <Thead>
              <tr>
                <Th>Colaborador</Th>
                <Th>Curso</Th>
                <Th>Tentativa</Th>
                <Th>Acerto automático</Th>
                <Th>Enviada em</Th>
                <Th>Ação</Th>
              </tr>
            </Thead>
            <Tbody>
              {attempts.map((attempt) => (
                <Tr key={attempt.id}>
                  <Td>
                    <div className="flex items-center gap-2.5">
                      <Avatar name={attempt.user.name} src={attempt.user.avatarUrl} size="sm" />
                      <div className="min-w-0">
                        <p className="truncate font-medium text-ink">{attempt.user.name}</p>
                        <p className="truncate text-xs text-muted-subtle">
                          {attempt.user.department?.name ?? "—"}
                        </p>
                      </div>
                    </div>
                  </Td>
                  <Td>{attempt.quiz.course.title}</Td>
                  <Td>#{attempt.attemptNo}</Td>
                  <Td>{attempt.autoScorePct === null ? "—" : `${attempt.autoScorePct}%`}</Td>
                  <Td>{formatDateTime(attempt.submittedAt)}</Td>
                  <Td>
                    <Button asChild size="sm" variant="secondary">
                      <Link href={`/admin/provas/${attempt.id}`}>Corrigir</Link>
                    </Button>
                  </Td>
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
