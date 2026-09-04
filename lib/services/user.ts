import "server-only";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db/prisma";
import { DEFAULT_PASSWORD } from "@/lib/auth/default-password";
import { logAction } from "@/lib/services/audit";
import type { CreateUserInput, UpdateUserInput } from "@/lib/validations/user";
import type { Prisma } from "@prisma/client";

function hashDefaultPassword() {
  return bcrypt.hash(DEFAULT_PASSWORD, 12);
}

/**
 * Cria um colaborador/administrador já com a senha padrão definida. O
 * administrador informa a senha ao usuário por fora do sistema; o primeiro
 * login obriga a troca (`mustChangePassword`).
 */
export async function createUser(input: CreateUserInput, actorId: string) {
  const role = await prisma.role.findUniqueOrThrow({ where: { code: input.roleCode } });

  const user = await prisma.user.create({
    data: {
      name: input.name,
      email: input.email.toLowerCase(),
      jobTitle: input.jobTitle || null,
      departmentId: input.departmentId || null,
      hiredAt: input.hiredAt ? new Date(input.hiredAt) : null,
      roleId: role.id,
      status: "ACTIVE",
      passwordHash: await hashDefaultPassword(),
      mustChangePassword: true,
    },
  });

  await logAction({ actorId, action: "USER_CREATED", entityType: "User", entityId: user.id });

  return { user, defaultPassword: DEFAULT_PASSWORD };
}

export async function updateUser(input: UpdateUserInput, actorId: string) {
  const role = await prisma.role.findUniqueOrThrow({ where: { code: input.roleCode } });

  const user = await prisma.user.update({
    where: { id: input.id },
    data: {
      name: input.name,
      email: input.email.toLowerCase(),
      jobTitle: input.jobTitle || null,
      departmentId: input.departmentId || null,
      hiredAt: input.hiredAt ? new Date(input.hiredAt) : null,
      roleId: role.id,
      status: input.status,
    },
  });

  await logAction({ actorId, action: "USER_UPDATED", entityType: "User", entityId: user.id });
  return user;
}

/** Regra 8 — usuário desativado não pode mais autenticar. */
export async function setUserStatus(userId: string, status: "ACTIVE" | "INACTIVE", actorId: string) {
  const user = await prisma.user.update({ where: { id: userId }, data: { status } });
  await logAction({
    actorId,
    action: status === "ACTIVE" ? "USER_ACTIVATED" : "USER_DEACTIVATED",
    entityType: "User",
    entityId: userId,
  });
  return user;
}

/**
 * Devolve o usuário à senha padrão — é o caminho para quem esqueceu a senha:
 * o colaborador pede ao administrador, que redefine aqui e informa a senha
 * padrão. A troca volta a ser obrigatória no próximo acesso.
 */
export async function resetPasswordToDefault(userId: string, actorId: string) {
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash: await hashDefaultPassword(), mustChangePassword: true },
  });

  await logAction({ actorId, action: "USER_PASSWORD_RESET", entityType: "User", entityId: userId });
  return DEFAULT_PASSWORD;
}

interface ListUsersParams {
  search?: string;
  departmentId?: string;
  roleCode?: "ADMIN" | "EMPLOYEE";
  status?: "ACTIVE" | "INACTIVE" | "PENDING";
  page?: number;
  pageSize?: number;
}

export async function listUsers(params: ListUsersParams) {
  const { search, departmentId, roleCode, status, page = 1, pageSize = 15 } = params;

  const where: Prisma.UserWhereInput = {
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } },
          ],
        }
      : {}),
    ...(departmentId ? { departmentId } : {}),
    ...(roleCode ? { role: { code: roleCode } } : {}),
    ...(status ? { status } : {}),
  };

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      include: {
        role: true,
        department: true,
        _count: { select: { assignments: true } },
      },
      orderBy: { name: "asc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.user.count({ where }),
  ]);

  return { users, total, page, pageSize, totalPages: Math.max(1, Math.ceil(total / pageSize)) };
}

export async function getUserDetail(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    include: {
      role: true,
      department: true,
      assignments: {
        include: { course: { include: { category: true } } },
        orderBy: { assignedAt: "desc" },
      },
      courseProgress: true,
    },
  });
}
