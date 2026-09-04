-- Substitui o fluxo de convite/redefinição por e-mail pela senha padrão com
-- troca obrigatória no primeiro acesso.

-- AlterTable
ALTER TABLE "users" ADD COLUMN "mustChangePassword" BOOLEAN NOT NULL DEFAULT false;

-- DropForeignKey
ALTER TABLE "password_reset_tokens" DROP CONSTRAINT "password_reset_tokens_userId_fkey";

-- DropTable
DROP TABLE "password_reset_tokens";

-- DropEnum
DROP TYPE "TokenType";
