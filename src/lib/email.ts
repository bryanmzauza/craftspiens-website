import nodemailer, { type Transporter } from "nodemailer";
import { getEnv, siteUrl } from "@/lib/env";
import { CONTACT_WHATSAPP_URL, SERVER_IP, SOCIAL_LINKS } from "@/lib/constants";

// Envio por SMTP. Em produção é o SMTP do Gmail (smtp.gmail.com:465, senha de
// app), com nao-responda@craftsapiens.com.br cadastrado em "Enviar e-mail como".
// Qualquer outro SMTP funciona com as mesmas variáveis. Guia em docs/email.md.

let transporter: Transporter | undefined;

function getTransporter(): Transporter {
  if (!transporter) {
    const env = getEnv();
    transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_SECURE,
      // Na porta 587 exige STARTTLS em vez de aceitar conexão sem criptografia
      requireTLS: !env.SMTP_SECURE,
      auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASS,
      },
      connectionTimeout: 15_000,
      greetingTimeout: 15_000,
      socketTimeout: 30_000,
    });
  }
  return transporter;
}

interface SendOptions {
  /** Endereço para respostas; sem ele, usa SMTP_REPLY_TO */
  replyTo?: string;
  /** Rodapé do modelo: "auto" para e-mails ao usuário, "equipe" para avisos internos */
  footer?: "auto" | "equipe";
}

// Falhas temporárias (servidor ocupado, conexão caiu) valem uma nova tentativa
const TRANSIENT_CODES = new Set(["ECONNECTION", "ETIMEDOUT", "ESOCKET", "ECONNRESET", "EDNS"]);
const RETRY_DELAYS_MS = [1_000, 4_000];

function isTransient(error: unknown): boolean {
  const err = error as { code?: string; responseCode?: number };
  if (err.responseCode && err.responseCode >= 400 && err.responseCode < 500) return true;
  return !!err.code && TRANSIENT_CODES.has(err.code);
}

async function send(to: string, subject: string, content: string, options: SendOptions = {}): Promise<void> {
  const env = getEnv();
  const replyTo = options.replyTo ?? env.SMTP_REPLY_TO;
  const html = baseTemplate(content, options.footer ?? "auto", !!env.SMTP_REPLY_TO);

  const message = {
    from: { name: env.SMTP_FROM_NAME, address: env.SMTP_FROM },
    to,
    subject,
    html,
    // Versão em texto: alguns clientes só mostram texto e os filtros de spam
    // desconfiam de e-mails só com HTML
    text: htmlToText(content),
    ...(replyTo ? { replyTo } : {}),
    headers: { "Auto-Submitted": "auto-generated" },
  };

  for (let attempt = 0; ; attempt++) {
    try {
      await getTransporter().sendMail(message);
      return;
    } catch (error) {
      if (attempt >= RETRY_DELAYS_MS.length || !isTransient(error)) throw error;
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAYS_MS[attempt]));
    }
  }
}

/** Converte o conteúdo HTML dos modelos em texto simples */
function htmlToText(html: string): string {
  return html
    .replace(/<a [^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi, (_, href: string, label: string) => {
      const text = label.replace(/<[^>]+>/g, "").trim();
      return text && text !== href ? `${text} (${href})` : href;
    })
    .replace(/<li[^>]*>/gi, "- ")
    .replace(/<\/(p|h\d|li|tr|div|ol|ul|table)>|<br\s*\/?>|<hr[^>]*>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .split("\n")
    .map((line) => line.replace(/\s+/g, " ").trim())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function baseTemplate(content: string, footer: "auto" | "equipe", hasReplyTo: boolean): string {
  const footerNote =
    footer === "equipe"
      ? "Aviso interno da plataforma CraftSapiens."
      : hasReplyTo
        ? "Este e-mail foi enviado automaticamente. Se precisar de ajuda, basta responder."
        : "Este e-mail foi enviado automaticamente. Não responda.";
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#1A1A2E;font-family:Arial,Helvetica,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#1A1A2E;padding:40px 20px">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#16213E;border-radius:12px;overflow:hidden;border:1px solid rgba(255,255,255,0.1)">
        <tr><td style="background:#4CAF50;padding:24px 32px;text-align:center">
          <span style="font-family:'Courier New',monospace;font-size:20px;font-weight:bold;color:#fff;letter-spacing:2px">CRAFTSAPIENS</span>
        </td></tr>
        <tr><td style="padding:32px">${content}</td></tr>
        <tr><td style="padding:16px 32px;border-top:1px solid rgba(255,255,255,0.1);text-align:center">
          <p style="color:#888;font-size:12px;margin:0">© ${new Date().getFullYear()} CraftSapiens — O Maior Metaverso Educacional do Mundo</p>
          <p style="color:#666;font-size:11px;margin:4px 0 0">${footerNote}</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export async function sendPasswordResetEmail(
  to: string,
  username: string,
  resetUrl: string
): Promise<void> {
  const content = `
    <h2 style="color:#fff;margin:0 0 16px;font-size:22px">Recuperação de Senha</h2>
    <p style="color:#E0E0E0;font-size:15px;line-height:1.6;margin:0 0 16px">
      Olá <strong style="color:#4CAF50">${escapeHtml(username)}</strong>,
    </p>
    <p style="color:#E0E0E0;font-size:15px;line-height:1.6;margin:0 0 24px">
      Recebemos uma solicitação para redefinir a senha da sua conta. Clique no botão abaixo para criar uma nova senha:
    </p>
    <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:8px 0 24px">
      <a href="${escapeHtml(resetUrl)}" style="display:inline-block;background:#4CAF50;color:#fff;font-size:16px;font-weight:bold;text-decoration:none;padding:14px 40px;border-radius:8px">
        REDEFINIR SENHA
      </a>
    </td></tr></table>
    <p style="color:#aaa;font-size:13px;line-height:1.5;margin:0 0 8px">
      Se você não solicitou esta alteração, ignore este email. O link expira em <strong>1 hora</strong>.
    </p>
    <p style="color:#888;font-size:12px;line-height:1.5;margin:0">
      Link direto: <a href="${escapeHtml(resetUrl)}" style="color:#4CAF50;word-break:break-all">${escapeHtml(resetUrl)}</a>
    </p>`;

  await send(to, "Recuperação de Senha — CraftSapiens", content);
}

export async function sendNewsletterConfirmationEmail(
  to: string,
  confirmUrl: string
): Promise<void> {
  const content = `
    <h2 style="color:#fff;margin:0 0 16px;font-size:22px">Confirme sua Inscrição</h2>
    <p style="color:#E0E0E0;font-size:15px;line-height:1.6;margin:0 0 24px">
      Você solicitou inscrição na newsletter da <strong style="color:#4CAF50">CraftSapiens</strong>. 
      Para confirmar, clique no botão abaixo:
    </p>
    <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:8px 0 24px">
      <a href="${escapeHtml(confirmUrl)}" style="display:inline-block;background:#4CAF50;color:#fff;font-size:16px;font-weight:bold;text-decoration:none;padding:14px 40px;border-radius:8px">
        CONFIRMAR INSCRIÇÃO
      </a>
    </td></tr></table>
    <p style="color:#aaa;font-size:13px;line-height:1.5;margin:0">
      Se você não solicitou esta inscrição, ignore este email.
    </p>`;

  await send(to, "Confirme sua inscrição — Newsletter CraftSapiens", content);
}

export async function sendWelcomeEmail(
  to: string,
  username: string
): Promise<void> {
  const content = `
    <h2 style="color:#fff;margin:0 0 16px;font-size:22px">Bem-vindo ao CraftSapiens</h2>
    <p style="color:#E0E0E0;font-size:15px;line-height:1.6;margin:0 0 16px">
      Olá <strong style="color:#4CAF50">${escapeHtml(username)}</strong>,
    </p>
    <p style="color:#E0E0E0;font-size:15px;line-height:1.6;margin:0 0 16px">
      Sua conta foi criada com sucesso! Agora você pode acessar o site e o servidor Minecraft com o mesmo login.
    </p>
    <div style="background:rgba(255,255,255,0.05);border-radius:8px;padding:16px;margin:0 0 24px">
      <p style="color:#fff;font-size:14px;margin:0 0 8px"><strong>Como entrar no servidor:</strong></p>
      <ol style="color:#E0E0E0;font-size:14px;line-height:1.8;margin:0;padding-left:20px">
        <li>Abra o Minecraft Java Edition</li>
        <li>Vá em Multijogador → Adicionar Servidor</li>
        <li>IP: <code style="background:rgba(76,175,80,0.2);color:#4CAF50;padding:2px 6px;border-radius:4px">${SERVER_IP}</code></li>
        <li>Use seu nick <strong>${escapeHtml(username)}</strong> e a senha cadastrada</li>
      </ol>
    </div>
    <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:8px 0 16px">
      <a href="${siteUrl()}/perfil" style="display:inline-block;background:#4CAF50;color:#fff;font-size:16px;font-weight:bold;text-decoration:none;padding:14px 40px;border-radius:8px">
        ACESSAR MEU PERFIL
      </a>
    </td></tr></table>`;

  await send(to, "Bem-vindo ao CraftSapiens", content);
}

export async function sendContactConfirmationEmail(
  to: string,
  name: string
): Promise<void> {
  const content = `
    <h2 style="color:#fff;margin:0 0 16px;font-size:22px">Mensagem recebida</h2>
    <p style="color:#E0E0E0;font-size:15px;line-height:1.6;margin:0 0 16px">
      Olá <strong style="color:#4CAF50">${escapeHtml(name)}</strong>,
    </p>
    <p style="color:#E0E0E0;font-size:15px;line-height:1.6;margin:0 0 16px">
      Recebemos sua mensagem e responderemos em até <strong>10 dias úteis</strong>.
    </p>
    <p style="color:#aaa;font-size:13px;line-height:1.5;margin:0">
      Caso a dúvida seja urgente, entre em contato pelo nosso 
      <a href="${CONTACT_WHATSAPP_URL}" style="color:#4CAF50">WhatsApp</a> ou 
      <a href="${SOCIAL_LINKS.discord}" style="color:#4CAF50">Discord</a>.
    </p>`;

  await send(to, "Mensagem recebida — CraftSapiens", content);
}

export async function sendOrderConfirmationEmail(
  to: string,
  username: string,
  orderId: string,
  total: number,
  items: string[],
  paymentMethod: string,
  payment: { installments: number; paidAmount: number }
): Promise<void> {
  const methodLabels: Record<string, string> = {
    pix: "PIX",
    credit_card: "Cartão de Crédito",
    debit_card: "Cartão de Débito",
    bolbradesco: "Boleto Bancário",
    account_money: "Saldo MercadoPago",
  };

  const methodLabel = methodLabels[paymentMethod] || paymentMethod;
  const brl = (value: number) => `R$ ${value.toFixed(2).replace(".", ",")}`;
  const row = (label: string, value: string, highlight = false) => `
        <tr>
          <td style="color:#aaa;font-size:13px;padding:4px 0">${label}</td>
          <td style="color:${highlight ? "#4CAF50;font-size:15px;font-weight:bold" : "#fff;font-size:13px"};padding:4px 0;text-align:right">${value}</td>
        </tr>`;
  // Cartão parcelado: valor do pedido, parcelas, juros e total pago
  const interest = Math.round((payment.paidAmount - total) * 100) / 100;
  const amountRows =
    payment.installments > 1
      ? row("Valor do pedido", brl(total)) +
        row("Parcelas", `${payment.installments}x de ${brl(payment.paidAmount / payment.installments)}`) +
        row("Juros do Mercado Pago", interest > 0 ? brl(interest) : "sem juros") +
        row("Total pago", brl(payment.paidAmount), true)
      : row("Total", brl(total), true);

  const itemsHtml = items
    .map(
      (item) =>
        `<li style="color:#E0E0E0;font-size:14px;line-height:1.8">${escapeHtml(item)}</li>`
    )
    .join("");

  const content = `
    <h2 style="color:#fff;margin:0 0 16px;font-size:22px">Compra confirmada</h2>
    <p style="color:#E0E0E0;font-size:15px;line-height:1.6;margin:0 0 16px">
      Olá <strong style="color:#4CAF50">${escapeHtml(username)}</strong>,
    </p>
    <p style="color:#E0E0E0;font-size:15px;line-height:1.6;margin:0 0 24px">
      Seu pagamento foi aprovado e seus itens já estão sendo processados!
    </p>
    <div style="background:rgba(255,255,255,0.05);border-radius:8px;padding:16px;margin:0 0 24px">
      <p style="color:#fff;font-size:14px;margin:0 0 12px"><strong>Detalhes do pedido:</strong></p>
      <table style="width:100%;border-collapse:collapse">
        <tr>
          <td style="color:#aaa;font-size:13px;padding:4px 0">Pedido</td>
          <td style="color:#fff;font-size:13px;padding:4px 0;text-align:right">
            <code style="background:rgba(76,175,80,0.2);color:#4CAF50;padding:2px 6px;border-radius:4px">${escapeHtml(orderId.slice(0, 12))}...</code>
          </td>
        </tr>
        <tr>
          <td style="color:#aaa;font-size:13px;padding:4px 0">Pagamento</td>
          <td style="color:#fff;font-size:13px;padding:4px 0;text-align:right">${escapeHtml(methodLabel)}</td>
        </tr>${amountRows}
      </table>
      <hr style="border:none;border-top:1px solid rgba(255,255,255,0.1);margin:12px 0">
      <p style="color:#fff;font-size:13px;margin:0 0 8px"><strong>Itens:</strong></p>
      <ul style="margin:0;padding-left:20px">${itemsHtml}</ul>
    </div>
    <p style="color:#E0E0E0;font-size:14px;line-height:1.6;margin:0 0 16px">
      A entrega é automática: entre no lobby do servidor e o que você comprou é aplicado na hora.
      Planos e cosméticos valem em toda a rede, no Java e no Bedrock.
    </p>
    <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:8px 0 16px">
      <a href="${siteUrl()}/perfil/compras" style="display:inline-block;background:#4CAF50;color:#fff;font-size:16px;font-weight:bold;text-decoration:none;padding:14px 40px;border-radius:8px">
        VER MINHAS COMPRAS
      </a>
    </td></tr></table>`;

  await send(to, `Compra confirmada — Pedido #${orderId.slice(0, 8)} — CraftSapiens`, content);
}

export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export async function sendEmailChangedNotice(
  to: string,
  username: string,
  newEmail: string
): Promise<void> {
  const content = `
    <h2 style="color:#fff;margin:0 0 16px;font-size:22px">Seu email foi alterado</h2>
    <p style="color:#E0E0E0;font-size:15px;line-height:1.6;margin:0 0 16px">
      Olá <strong style="color:#4CAF50">${escapeHtml(username)}</strong>,
    </p>
    <p style="color:#E0E0E0;font-size:15px;line-height:1.6;margin:0 0 16px">
      O email da sua conta CraftSapiens foi alterado para <strong>${escapeHtml(maskEmail(newEmail))}</strong>.
    </p>
    <p style="color:#aaa;font-size:13px;line-height:1.5;margin:0">
      Se não foi você, entre em contato imediatamente pelo
      <a href="${CONTACT_WHATSAPP_URL}" style="color:#4CAF50">WhatsApp</a> ou
      <a href="${SOCIAL_LINKS.discord}" style="color:#4CAF50">Discord</a>.
    </p>`;

  await send(to, "Email da conta alterado — CraftSapiens", content);
}

function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!domain) return email;
  return `${local.slice(0, 2)}${"*".repeat(Math.max(local.length - 2, 1))}@${domain}`;
}

export async function sendEmailVerificationCode(
  to: string,
  username: string,
  code: string
): Promise<void> {
  const content = `
    <h2 style="color:#fff;margin:0 0 16px;font-size:22px">Confirme seu e-mail</h2>
    <p style="color:#E0E0E0;font-size:15px;line-height:1.6;margin:0 0 16px">
      Olá <strong style="color:#4CAF50">${escapeHtml(username)}</strong>,
    </p>
    <p style="color:#E0E0E0;font-size:15px;line-height:1.6;margin:0 0 24px">
      Use o código abaixo para confirmar este e-mail na sua conta CraftSapiens:
    </p>
    <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:8px 0 24px">
      <span style="display:inline-block;background:rgba(76,175,80,0.15);border:1px solid rgba(76,175,80,0.4);color:#fff;font-family:'Courier New',monospace;font-size:32px;font-weight:bold;letter-spacing:10px;padding:16px 28px;border-radius:8px">
        ${escapeHtml(code)}
      </span>
    </td></tr></table>
    <p style="color:#aaa;font-size:13px;line-height:1.5;margin:0">
      O código vale por <strong>15 minutos</strong>. Se você não pediu este código, ignore este e-mail.
    </p>`;

  await send(to, `${code} é o seu código de confirmação — CraftSapiens`, content);
}

/** Encaminha uma mensagem do formulário de contato para a caixa da equipe */
export async function sendContactToTeam(message: {
  name: string;
  email: string;
  category: string;
  subject: string;
  message: string;
}): Promise<boolean> {
  const inbox = getEnv().CONTACT_INBOX;
  if (!inbox) return false;

  const row = (label: string, value: string) =>
    `<tr><td style="color:#aaa;font-size:13px;padding:4px 12px 4px 0;vertical-align:top;white-space:nowrap">${label}</td>` +
    `<td style="color:#fff;font-size:13px;padding:4px 0">${escapeHtml(value)}</td></tr>`;

  const content = `
    <h2 style="color:#fff;margin:0 0 16px;font-size:22px">Nova mensagem pelo site</h2>
    <table style="border-collapse:collapse;margin:0 0 16px">
      ${row("Nome", message.name)}
      ${row("E-mail", message.email)}
      ${row("Categoria", message.category)}
      ${row("Assunto", message.subject)}
    </table>
    <div style="background:rgba(255,255,255,0.05);border-radius:8px;padding:16px;margin:0 0 16px">
      <p style="color:#E0E0E0;font-size:14px;line-height:1.6;margin:0;white-space:pre-wrap">${escapeHtml(message.message)}</p>
    </div>
    <p style="color:#aaa;font-size:13px;line-height:1.5;margin:0">
      Responda este e-mail para falar direto com quem enviou.
    </p>`;

  // Assunto sem quebras de linha (evita injeção de cabeçalhos)
  const title =
    message.subject === message.category ? message.category : `${message.category}: ${message.subject}`;
  const subject = `[Contato] ${title} - ${message.name}`.replace(/[\r\n]+/g, " ").slice(0, 200);
  await send(inbox, subject, content, { replyTo: message.email, footer: "equipe" });
  return true;
}
