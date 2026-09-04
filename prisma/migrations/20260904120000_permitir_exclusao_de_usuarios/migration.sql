-- Relaxa 3 chaves estrangeiras que hoje bloqueiam a exclusão de um usuário
-- (RESTRICT) para SET NULL: o histórico é preservado, só perde a referência
-- de quem praticou a ação. Nenhuma tela hoje exibe esses campos, então a
-- mudança de NOT NULL para nullable não exige ajuste de UI.

-- Course.createdById
ALTER TABLE "courses" DROP CONSTRAINT "courses_createdById_fkey";
ALTER TABLE "courses" ALTER COLUMN "createdById" DROP NOT NULL;
ALTER TABLE "courses" ADD CONSTRAINT "courses_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CourseAssignment.assignedById
ALTER TABLE "course_assignments" DROP CONSTRAINT "course_assignments_assignedById_fkey";
ALTER TABLE "course_assignments" ALTER COLUMN "assignedById" DROP NOT NULL;
ALTER TABLE "course_assignments" ADD CONSTRAINT "course_assignments_assignedById_fkey" FOREIGN KEY ("assignedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AuditLog.actorId
ALTER TABLE "audit_logs" DROP CONSTRAINT "audit_logs_actorId_fkey";
ALTER TABLE "audit_logs" ALTER COLUMN "actorId" DROP NOT NULL;
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
