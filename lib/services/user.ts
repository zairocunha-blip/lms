import "server-only";
import { prisma } from "@/lib/db/prisma";
import { createPasswordToken } from "@/lib/auth/tokens";
import { inviteEmailTemplate, resetEmailTemplate, sendMail } from "@/lib/email/mailer";
import { logAction } from "@/lib/services/audit";
import type { CreateUserInput, UpdateUserInput } from "@/lib/validations/user";
import type { Prisma } from "@prisma/client";

const APP_URL = process.env.NEXTAUTH_URL ?? "http://localhost:3000";

async function sendInvite(userId: string, name: string, email: string) {
  const token = await createPasswordToken(userId, "INVITE");
  const link = `${APP_URL}/convite/${token}`;
  const { subject, html } = inviteEmailTemplate({ name, link });
  await sendMail({ to: email, subject, html });
  return link;
}

/** Cria um colaborador/administrador e dispara o convite de definição de senha. */
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
      status: "PENDING",
    },
  });

  await logAction({ actorId, action: "USER_CREATED", entityType: "User", entityId: user.id });

  const inviteLink = await sendInvite(user.id, user.name, user.email);
  return { user, inviteLink };
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

/** Gera um novo convite/token de redefinição para o usuário. */
export async function resendAccess(userId: string, actorId: string) {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  const type = user.passwordHash ? "RESET" : "INVITE";
  const token = await createPasswordToken(userId, type);
  const link = `${APP_URL}/${type === "INVITE" ? "convite" : "redefinir-senha"}/${token}`;

  const template =
    type === "INVITE"
      ? inviteEmailTemplate({ name: user.name, link })
      : resetEmailTemplate({ name: user.name, link });
  await sendMail({ to: user.email, ...template });

  await logAction({ actorId, action: "USER_ACCESS_RESET", entityType: "User", entityId: userId });
  return link;
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
