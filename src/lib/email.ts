import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const FROM_NAME = "CraftSapiens";
const FROM_EMAIL = process.env.SMTP_FROM || "noreply@craftsapiens.com.br";

function baseTemplate(content: string): string {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#1A1A2E;font-family:Arial,Helvetica,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#1A1A2E;padding:40px 20px">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#16213E;border-radius:12px;overflow:hidden;border:1px solid rgba(255,255,255,0.1)">
        <tr><td style="background:#4CAF50;padding:24px 32px;text-align:center">
          <span style="font-family:'Courier New',monospace;font-size:20px;font-weight:bold;color:#fff;letter-spacing:2px">⛏ CRAFTSAPIENS</span>
        </td></tr>
        <tr><td style="padding:32px">${content}</td></tr>
        <tr><td style="padding:16px 32px;border-top:1px solid rgba(255,255,255,0.1);text-align:center">
          <p style="color:#888;font-size:12px;margin:0">© ${new Date().getFullYear()} CraftSapiens — O Maior Metaverso Educacional do Mundo</p>
          <p style="color:#666;font-size:11px;margin:4px 0 0">Este email foi enviado automaticamente. Não responda.</p>
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

  await transporter.sendMail({
    from: `"${FROM_NAME}" <${FROM_EMAIL}>`,
    to,
    subject: "Recuperação de Senha — CraftSapiens",
    html: baseTemplate(content),
  });
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

  await transporter.sendMail({
    from: `"${FROM_NAME}" <${FROM_EMAIL}>`,
    to,
    subject: "Confirme sua inscrição — Newsletter CraftSapiens",
    html: baseTemplate(content),
  });
}

export async function sendWelcomeEmail(
  to: string,
  username: string
): Promise<void> {
  const content = `
    <h2 style="color:#fff;margin:0 0 16px;font-size:22px">Bem-vindo ao CraftSapiens! 🎮</h2>
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
        <li>IP: <code style="background:rgba(76,175,80,0.2);color:#4CAF50;padding:2px 6px;border-radius:4px">jogar.craftsapiens.com.br</code></li>
        <li>Use seu nick <strong>${escapeHtml(username)}</strong> e a senha cadastrada</li>
      </ol>
    </div>
    <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:8px 0 16px">
      <a href="${getBaseUrl()}/perfil" style="display:inline-block;background:#4CAF50;color:#fff;font-size:16px;font-weight:bold;text-decoration:none;padding:14px 40px;border-radius:8px">
        ACESSAR MEU PERFIL
      </a>
    </td></tr></table>`;

  await transporter.sendMail({
    from: `"${FROM_NAME}" <${FROM_EMAIL}>`,
    to,
    subject: "Bem-vindo ao CraftSapiens! 🎮",
    html: baseTemplate(content),
  });
}

export async function sendContactConfirmationEmail(
  to: string,
  name: string
): Promise<void> {
  const content = `
    <h2 style="color:#fff;margin:0 0 16px;font-size:22px">Mensagem Recebida ✉️</h2>
    <p style="color:#E0E0E0;font-size:15px;line-height:1.6;margin:0 0 16px">
      Olá <strong style="color:#4CAF50">${escapeHtml(name)}</strong>,
    </p>
    <p style="color:#E0E0E0;font-size:15px;line-height:1.6;margin:0 0 16px">
      Recebemos sua mensagem e responderemos em até <strong>10 dias úteis</strong>.
    </p>
    <p style="color:#aaa;font-size:13px;line-height:1.5;margin:0">
      Caso a dúvida seja urgente, entre em contato pelo nosso 
      <a href="https://wa.me/5541995871942" style="color:#4CAF50">WhatsApp</a> ou 
      <a href="https://discord.io/craftsapiens" style="color:#4CAF50">Discord</a>.
    </p>`;

  await transporter.sendMail({
    from: `"${FROM_NAME}" <${FROM_EMAIL}>`,
    to,
    subject: "Mensagem recebida — CraftSapiens",
    html: baseTemplate(content),
  });
}

function getBaseUrl(): string {
  return process.env.AUTH_URL || "http://localhost:3000";
}

export async function sendOrderConfirmationEmail(
  to: string,
  username: string,
  orderId: string,
  total: number,
  items: string[],
  paymentMethod: string
): Promise<void> {
  const methodLabels: Record<string, string> = {
    pix: "PIX",
    credit_card: "Cartão de Crédito",
    debit_card: "Cartão de Débito",
    bolbradesco: "Boleto Bancário",
    account_money: "Saldo MercadoPago",
  };

  const methodLabel = methodLabels[paymentMethod] || paymentMethod;

  const itemsHtml = items
    .map(
      (item) =>
        `<li style="color:#E0E0E0;font-size:14px;line-height:1.8">${escapeHtml(item)}</li>`
    )
    .join("");

  const content = `
    <h2 style="color:#fff;margin:0 0 16px;font-size:22px">Compra Confirmada! 🎉</h2>
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
        </tr>
        <tr>
          <td style="color:#aaa;font-size:13px;padding:4px 0">Total</td>
          <td style="color:#4CAF50;font-size:15px;font-weight:bold;padding:4px 0;text-align:right">R$ ${total.toFixed(2).replace(".", ",")}</td>
        </tr>
      </table>
      <hr style="border:none;border-top:1px solid rgba(255,255,255,0.1);margin:12px 0">
      <p style="color:#fff;font-size:13px;margin:0 0 8px"><strong>Itens:</strong></p>
      <ul style="margin:0;padding-left:20px">${itemsHtml}</ul>
    </div>
    <p style="color:#E0E0E0;font-size:14px;line-height:1.6;margin:0 0 16px">
      Se você comprou itens do servidor, eles serão ativados automaticamente ao entrar no Minecraft.
      Para VIPs e Ranks, entre no servidor para que as permissões sejam aplicadas.
    </p>
    <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:8px 0 16px">
      <a href="${getBaseUrl()}/perfil/compras" style="display:inline-block;background:#4CAF50;color:#fff;font-size:16px;font-weight:bold;text-decoration:none;padding:14px 40px;border-radius:8px">
        VER MINHAS COMPRAS
      </a>
    </td></tr></table>`;

  await transporter.sendMail({
    from: `"${FROM_NAME}" <${FROM_EMAIL}>`,
    to,
    subject: `Compra confirmada — Pedido #${orderId.slice(0, 8)} — CraftSapiens`,
    html: baseTemplate(content),
  });
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
