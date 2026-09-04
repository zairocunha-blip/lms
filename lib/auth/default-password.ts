/**
 * Senha padrão atribuída a todo usuário criado pelo administrador e a todo
 * usuário que tem o acesso redefinido. O sistema não envia e-mail de convite
 * nem link de redefinição: o administrador informa esta senha ao colaborador,
 * que é obrigado a trocá-la no primeiro acesso (`User.mustChangePassword`).
 *
 * Arquivo sem `server-only` de propósito — a constante também é exibida na
 * interface do administrador. Não importe bcrypt aqui.
 */
export const DEFAULT_PASSWORD = "Idx@2026";
