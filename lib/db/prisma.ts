import { PrismaClient } from "@prisma/client";

// Evita múltiplas instâncias do Prisma Client em desenvolvimento
// (o Next.js recarrega módulos a cada alteração de arquivo).
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
