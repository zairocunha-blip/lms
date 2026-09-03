import "server-only";
import { auth } from "@/auth";
import type { RoleCode } from "@prisma/client";

export class UnauthorizedError extends Error {
  constructor(message = "Você não tem permissão para realizar esta ação.") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

/**
 * Garante que existe uma sessão válida e ativa. Toda Server Action e Route
 * Handler que toca em dados do usuário deve começar chamando esta função —
 * nunca confiar apenas na proteção de rota feita pelo middleware.
 */
export async function requireUser() {
  const session = await auth();
  if (!session?.user || session.user.status !== "ACTIVE") {
    throw new UnauthorizedError("Sessão inválida ou expirada.");
  }
  return session.user;
}

/** Garante que o usuário autenticado possui um dos papéis informados. */
export async function requireRole(...roles: RoleCode[]) {
  const user = await requireUser();
  if (!roles.includes(user.role)) {
    throw new UnauthorizedError();
  }
  return user;
}

export async function requireAdmin() {
  return requireRole("ADMIN");
}
