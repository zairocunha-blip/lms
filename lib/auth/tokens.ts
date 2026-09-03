import "server-only";
import { randomBytes, createHash } from "crypto";
import { prisma } from "@/lib/db/prisma";
import type { TokenType } from "@prisma/client";

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hora
const INVITE_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 dias

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

/**
 * Gera um token opaco de convite/redefinição de senha.
 * Apenas o hash SHA-256 do token é persistido — o valor em texto puro só
 * existe no link enviado ao usuário, nunca no banco de dados.
 */
export async function createPasswordToken(userId: string, type: TokenType) {
  const rawToken = randomBytes(32).toString("hex");
  const tokenHash = hashToken(rawToken);
  const ttl = type === "INVITE" ? INVITE_TOKEN_TTL_MS : RESET_TOKEN_TTL_MS;

  // Invalida tokens anteriores do mesmo tipo ainda não utilizados.
  await prisma.passwordResetToken.updateMany({
    where: { userId, type, usedAt: null },
    data: { usedAt: new Date() },
  });

  await prisma.passwordResetToken.create({
    data: {
      userId,
      type,
      tokenHash,
      expiresAt: new Date(Date.now() + ttl),
    },
  });

  return rawToken;
}

export async function verifyPasswordToken(rawToken: string) {
  const tokenHash = hashToken(rawToken);

  const token = await prisma.passwordResetToken.findUnique({
    where: { tokenHash },
    include: { user: true },
  });

  if (!token) return { valid: false as const, reason: "not_found" as const };
  if (token.usedAt) return { valid: false as const, reason: "used" as const };
  if (token.expiresAt < new Date()) return { valid: false as const, reason: "expired" as const };

  return { valid: true as const, token };
}

export async function consumePasswordToken(tokenId: string) {
  await prisma.passwordResetToken.update({
    where: { id: tokenId },
    data: { usedAt: new Date() },
  });
}
