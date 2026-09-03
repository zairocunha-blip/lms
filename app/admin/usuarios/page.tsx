import type { Metadata } from "next";
import Link from "next/link";
import { Plus, Search, Users as UsersIcon } from "lucide-react";
import { prisma } from "@/lib/db/prisma";
import { listUsers } from "@/lib/services/user";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Table, Thead, Tbody, Tr, Th, Td } from "@/components/ui/table";
import { UserStatusBadge } from "@/components/ui/status-badge";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { EmptyState } from "@/components/ui/empty-state";
import { PaginationLinks } from "@/components/admin/pagination-links";
import { UserRowActions } from "./user-row-actions";

export const metadata: Metadata = { title: "Usuários" };
export const dynamic = "force-dynamic";

interface SearchParams {
  [key: string]: string | undefined;
  search?: string;
  departmentId?: string;
  roleCode?: "ADMIN" | "EMPLOYEE";
  status?: "ACTIVE" | "INACTIVE" | "PENDING";
  page?: string;
}

export default async function AdminUsersPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const page = Number(params.page) || 1;

  const [{ users, total, totalPages }, departments] = await Promise.all([
    listUsers({
      search: params.search,
      departmentId: params.departmentId,
      roleCode: params.roleCode,
      status: params.status,
      page,
    }),
    prisma.department.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink">Usuários</h1>
          <p className="mt-1 text-muted">{total} colaboradores e administradores cadastrados.</p>
        </div>
        <Button asChild>
          <Link href="/admin/usuarios/novo">
            <Plus className="h-4 w-4" aria-hidden="true" />
            Novo usuário
          </Link>
        </Button>
      </div>

      <form className="mt-6 flex flex-wrap items-end gap-3 rounded-md border border-border bg-canvas p-4">
        <div className="min-w-[220px] flex-1">
          <label htmlFor="search" className="mb-1.5 block text-sm font-medium text-ink-soft">
            Buscar
          </label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <Input id="search" name="search" defaultValue={params.search} placeholder="Nome ou e-mail" className="pl-9" />
          </div>
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
          <label htmlFor="roleCode" className="mb-1.5 block text-sm font-medium text-ink-soft">
            Perfil
          </label>
          <Select id="roleCode" name="roleCode" defaultValue={params.roleCode ?? ""}>
            <option value="">Todos</option>
            <option value="EMPLOYEE">Colaborador</option>
            <option value="ADMIN">Administrador</option>
          </Select>
        </div>

        <div className="w-40">
          <label htmlFor="status" className="mb-1.5 block text-sm font-medium text-ink-soft">
            Status
          </label>
          <Select id="status" name="status" defaultValue={params.status ?? ""}>
            <option value="">Todos</option>
            <option value="ACTIVE">Ativo</option>
            <option value="INACTIVE">Inativo</option>
            <option value="PENDING">Convite pendente</option>
          </Select>
        </div>

        <Button type="submit" variant="secondary">
          Filtrar
        </Button>
      </form>

      {users.length === 0 ? (
        <EmptyState
          className="mt-6"
          icon={UsersIcon}
          title="Nenhum usuário encontrado"
          description="Ajuste os filtros de busca ou cadastre um novo usuário."
        />
      ) : (
        <div className="mt-6 rounded-md border border-border bg-canvas px-1">
          <Table>
            <Thead>
              <tr>
                <Th>Nome</Th>
                <Th>Departamento</Th>
                <Th>Perfil</Th>
                <Th>Status</Th>
                <Th>Cursos atribuídos</Th>
                <Th />
              </tr>
            </Thead>
            <Tbody>
              {users.map((user) => (
                <Tr key={user.id}>
                  <Td>
                    <Link href={`/admin/usuarios/${user.id}`} className="flex items-center gap-2.5">
                      <Avatar name={user.name} src={user.avatarUrl} size="sm" />
                      <div className="min-w-0">
                        <p className="truncate font-medium text-ink">{user.name}</p>
                        <p className="truncate text-xs text-muted-subtle">{user.email}</p>
                      </div>
                    </Link>
                  </Td>
                  <Td>{user.department?.name ?? "—"}</Td>
                  <Td>
                    <Badge tone={user.role.code === "ADMIN" ? "primary" : "neutral"}>
                      {user.role.code === "ADMIN" ? "Administrador" : "Colaborador"}
                    </Badge>
                  </Td>
                  <Td>
                    <UserStatusBadge status={user.status} />
                  </Td>
                  <Td>{user._count.assignments}</Td>
                  <Td>
                    <UserRowActions userId={user.id} status={user.status} />
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
