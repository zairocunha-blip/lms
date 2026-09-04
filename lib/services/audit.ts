import "server-only";
import { prisma } from "@/lib/db/prisma";
import type { Prisma } from "@prisma/client";

interface LogActionInput {
  actorId: string;
  action: string;
  entityType: string;
  entityId?: string;
  metadata?: Prisma.InputJsonValue;
}

/** Registra uma ação administrativa relevante para fins de auditoria. */
export async function logAction({ actorId, action, entityType, entityId, metadata }: LogActionInput) {
  await prisma.auditLog.create({
    data: { actorId, action, entityType, entityId, metadata },
  });
}
