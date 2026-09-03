import "server-only";

/**
 * Abstração de envio de e-mail. Nenhum SMTP está configurado no MVP: por
 * padrão, o conteúdo é apenas registrado no console/log do servidor, o que
 * é suficiente para desenvolvimento e para o administrador copiar o link
 * manualmente enquanto um provedor transacional não é configurado.
 *
 * Para produção, implemente `sendMail` usando o provedor desejado (Resend,
 * SES, Postmark, SMTP genérico via nodemailer etc.) e defina as variáveis
 * SMTP_HOST / SMTP_PORT / SMTP_USER / SMTP_PASS / EMAIL_FROM no .env — a
 * assinatura da função abaixo já foi pensada para não exigir mudanças no
 * restante do código quando isso acontecer.
 */
interface SendMailInput {
  to: string;
  subject: string;
  html: string;
}

export async function sendMail({ to, subject, html }: SendMailInput) {
  if (process.env.SMTP_HOST) {
    // Local reservado para a implementação real via nodemailer/Resend.
    // Mantido fora do MVP para não introduzir uma dependência de rede
    // obrigatória em ambientes de desenvolvimento/demonstração.
  }

  console.info(`[mailer] Para: ${to} | Assunto: ${subject}\n${html}`);
  return { delivered: false as const, previewedInConsole: true as const };
}

export function inviteEmailTemplate(params: { name: string; link: string }) {
  return {
    subject: "Bem-vindo(a) à plataforma de treinamentos",
    html: `<p>Olá, ${params.name}.</p><p>Sua conta foi criada. Defina sua senha para começar a acessar os treinamentos:</p><p><a href="${params.link}">${params.link}</a></p><p>Este link expira em 7 dias.</p>`,
  };
}

export function resetEmailTemplate(params: { name: string; link: string }) {
  return {
    subject: "Redefinição de senha",
    html: `<p>Olá, ${params.name}.</p><p>Recebemos uma solicitação para redefinir sua senha. Se foi você, acesse o link abaixo:</p><p><a href="${params.link}">${params.link}</a></p><p>Se você não fez essa solicitação, ignore este e-mail. Este link expira em 1 hora.</p>`,
  };
}
