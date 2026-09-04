"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { MoreHorizontal, Eye, KeyRound, UserX, UserCheck, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { DEFAULT_PASSWORD } from "@/lib/auth/default-password";
import { setUserStatusAction, resetPasswordAction, deleteUserAction } from "@/lib/actions/user";
import { useToast } from "@/components/ui/toast";

export function UserRowActions({ userId, status }: { userId: string; status: "ACTIVE" | "INACTIVE" | "PENDING" }) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { showToast } = useToast();

  const isActive = status === "ACTIVE";

  function handleToggleStatus() {
    startTransition(async () => {
      await setUserStatusAction(userId, isActive ? "INACTIVE" : "ACTIVE");
      showToast({
        variant: "success",
        title: isActive ? "Usuário desativado" : "Usuário ativado",
      });
      setConfirmOpen(false);
    });
  }

  function handleResetPassword() {
    startTransition(async () => {
      const defaultPassword = await resetPasswordAction(userId);
      setResetOpen(false);
      showToast({
        variant: "success",
        title: "Senha redefinida",
        description: `Informe ao usuário a senha padrão ${defaultPassword}. Ele deverá trocá-la no próximo acesso.`,
      });
    });
  }

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteUserAction(userId);
      setDeleteOpen(false);
      if (result.error) {
        showToast({ variant: "error", title: "Não foi possível excluir", description: result.error });
      } else {
        showToast({ variant: "success", title: "Usuário excluído" });
      }
    });
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className="flex h-8 w-8 items-center justify-center rounded-md text-muted hover:bg-surface-alt hover:text-ink"
            aria-label="Ações"
          >
            <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem asChild>
            <Link href={`/admin/usuarios/${userId}`} className="flex items-center gap-2">
              <Eye className="h-4 w-4" aria-hidden="true" />
              Visualizar / editar
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setResetOpen(true)} disabled={isPending}>
            <KeyRound className="h-4 w-4" aria-hidden="true" />
            Redefinir para senha padrão
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem destructive={isActive} onClick={() => setConfirmOpen(true)}>
            {isActive ? <UserX className="h-4 w-4" aria-hidden="true" /> : <UserCheck className="h-4 w-4" aria-hidden="true" />}
            {isActive ? "Desativar usuário" : "Ativar usuário"}
          </DropdownMenuItem>
          <DropdownMenuItem destructive onClick={() => setDeleteOpen(true)}>
            <Trash2 className="h-4 w-4" aria-hidden="true" />
            Excluir usuário
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ConfirmDialog
        open={resetOpen}
        onOpenChange={setResetOpen}
        title="Redefinir para senha padrão"
        description={`A senha atual do usuário será substituída pela senha padrão ${DEFAULT_PASSWORD}, que ele deverá trocar no próximo acesso. Informe a nova senha a ele por um canal seguro.`}
        confirmLabel="Redefinir senha"
        loading={isPending}
        onConfirm={handleResetPassword}
      />

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={isActive ? "Desativar usuário" : "Ativar usuário"}
        description={
          isActive
            ? "O usuário não poderá mais fazer login na plataforma até ser reativado."
            : "O usuário poderá voltar a fazer login normalmente."
        }
        confirmLabel={isActive ? "Desativar" : "Ativar"}
        destructive={isActive}
        loading={isPending}
        onConfirm={handleToggleStatus}
      />

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Excluir usuário"
        description="Esta ação não pode ser desfeita. As atribuições de curso, o progresso e as notificações deste usuário serão removidos permanentemente. Se preferir manter o histórico, desative o usuário em vez de excluir."
        confirmLabel="Excluir"
        destructive
        loading={isPending}
        onConfirm={handleDelete}
      />
    </>
  );
}
