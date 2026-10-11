// Testa a configuração de envio de e-mails (variáveis SMTP_* do .env).
//
// Uso:
//   npm run email:test -- destinatario@exemplo.com
//
// Sem destinatário, só confere a conexão e a autenticação no servidor SMTP.
// Guia de configuração: docs/email.md

import "dotenv/config";
import nodemailer from "nodemailer";

const env = process.env;
const to = process.argv[2];

const missing = ["SMTP_HOST", "SMTP_USER", "SMTP_PASS"].filter((name) => !env[name]);
if (missing.length > 0) {
  console.error(`Faltam variáveis no .env: ${missing.join(", ")}`);
  process.exit(1);
}

const port = Number(env.SMTP_PORT || 587);
const secure = env.SMTP_SECURE === "true";
const from = env.SMTP_FROM || "nao-responda@craftsapiens.com.br";
const fromName = env.SMTP_FROM_NAME || "CraftSapiens";
const replyTo = env.SMTP_REPLY_TO || undefined;

console.log(`Servidor: ${env.SMTP_HOST}:${port} (${secure ? "TLS direto" : "STARTTLS"})`);
console.log(`Remetente: ${fromName} <${from}>`);
if (replyTo) console.log(`Respostas para: ${replyTo}`);
if (env.CONTACT_INBOX) console.log(`Formulário de contato vai para: ${env.CONTACT_INBOX}`);

const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port,
  secure,
  requireTLS: !secure,
  auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
  connectionTimeout: 15_000,
  greetingTimeout: 15_000,
  socketTimeout: 30_000,
});

// Dicas para os erros mais comuns
function hint(error) {
  const code = error?.responseCode;
  const gmail = /gmail\.com$/i.test(env.SMTP_HOST);
  const text = String(error?.response ?? "");
  if (code === 535) {
    return gmail
      ? "Autenticação recusada. Use uma senha de app (exige verificação em duas etapas na conta Google), não a senha normal da conta."
      : "Autenticação recusada. Confira SMTP_USER e SMTP_PASS.";
  }
  if (/5\.4\.5|quota/i.test(text)) return "Limite diário de envio atingido. O envio volta em até 24 horas.";
  if (code === 550) return "Remetente ou destinatário recusado. Confira SMTP_FROM e o endereço de destino.";
  if (code === 554) return "Mensagem recusada pela política do servidor.";
  if (error?.code === "ETIMEDOUT" || error?.code === "ECONNECTION") return "Sem conexão com o servidor. Confira host, porta e SMTP_SECURE (porta 465 usa SMTP_SECURE=\"true\").";
  if (error?.code === "EAUTH") return "Falha de autenticação. Confira usuário e senha/token.";
  return "";
}

try {
  await transporter.verify();
  console.log("Conexão e autenticação: OK");
} catch (error) {
  console.error(`Falha ao conectar: ${error.message}`);
  const tip = hint(error);
  if (tip) console.error(tip);
  process.exit(1);
}

if (!to) {
  console.log("Nenhum destinatário informado; nenhum e-mail foi enviado.");
  process.exit(0);
}

try {
  const info = await transporter.sendMail({
    from: { name: fromName, address: from },
    to,
    ...(replyTo ? { replyTo } : {}),
    subject: "Teste de envio - CraftSapiens",
    text: `Este é um e-mail de teste da plataforma CraftSapiens.\n\nSe ele chegou na caixa de entrada (e não no spam), o envio está configurado.\nEnviado em ${new Date().toLocaleString("pt-BR")}.`,
    headers: { "Auto-Submitted": "auto-generated" },
  });
  console.log(`Enviado para ${to}. Resposta do servidor: ${info.response}`);
  console.log(`Confira se o remetente chegou como ${from}.`);
  if (/gmail\.com$/i.test(env.SMTP_HOST)) {
    console.log(`Se chegou como ${env.SMTP_USER}, cadastre ${from} em "Enviar e-mail como" nessa conta do Gmail (docs/email.md, passo 3).`);
  }
} catch (error) {
  console.error(`Falha ao enviar: ${error.message}`);
  const tip = hint(error);
  if (tip) console.error(tip);
  process.exit(1);
}
