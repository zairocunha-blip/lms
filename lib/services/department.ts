import "server-only";
import { prisma } from "@/lib/db/prisma";
import { logAction } from "@/lib/services/audit";

/** Erro exibível: o departamento ainda tem colaboradores vinculados. */
export class DepartmentInUseError extends Error {}

export function listDepartments() {
  return prisma.department.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { users: true } } },
  });
}

export async function createDepartment(name: string, actorId: string) {
  const department = await prisma.department.create({ data: { name } });
  await logAction({ actorId, action: "DEPARTMENT_CREATED", entityType: "Department", entityId: department.id });
  return department;
}

export async function renameDepartment(id: string, name: string, actorId: string) {
  const department = await prisma.department.update({ where: { id }, data: { name } });
  await logAction({
    actorId,
    action: "DEPARTMENT_RENAMED",
    entityType: "Department",
    entityId: id,
    metadata: { name },
  });
  return department;
}

/**
 * Exclui um departamento. `User.departmentId` é opcional e sem cascata, então
 * apagar um departamento em uso deixaria os colaboradores sem área de forma
 * silenciosa — por isso bloqueamos e pedimos a reatribuição antes.
 */
export async function deleteDepartment(id: string, actorId: string) {
  const userCount = await prisma.user.count({ where: { departmentId: id } });
  if (userCount > 0) {
    throw new DepartmentInUseError(
      `Não é possível excluir: ${userCount} colaborador(es) ainda estão neste departamento. Reatribua-os antes.`
    );
  }
  await prisma.department.delete({ where: { id } });
  await logAction({ actorId, action: "DEPARTMENT_DELETED", entityType: "Department", entityId: id });
}
