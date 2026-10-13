// Envia um e-mail de aviso do deploy automático, com o SMTP configurado no .env do site.
//
// Uso: node notificar-deploy.mjs "assunto" "corpo" [arquivo de log]
//
// Destinatário: EMAIL_AVISO (de /opt/craftsapiens/deploy.conf) ou, sem ele, CONTACT_INBOX.
// Usa o nodemailer e o dotenv instalados na versão em produção (SITE_DIR), por isso não
// precisa de dependências próprias.
import fs from "node:fs";
import { createRequire } from "node:module";
import os from "node:os";
import path from "node:path";

const siteDir = process.env.SITE_DIR || "/opt/craftsapiens/site";
const siteRequire = createRequire(path.join(siteDir, "package.json"));
const nodemailer = siteRequire("nodemailer");
siteRequire("dotenv").config({ path: path.join(siteDir, ".env"), quiet: true });

const [assunto, corpo = "", arquivoLog] = process.argv.slice(2);
const env = process.env;
const para = env.EMAIL_AVISO || env.CONTACT_INBOX;

if (!assunto) {
  console.error("uso: notificar-deploy.mjs assunto [corpo] [arquivo de log]");
  process.exit(2);
}
if (!para || !env.SMTP_HOST || !env.SMTP_USER || !env.SMTP_PASS) {
  console.error("sem destinatário (EMAIL_AVISO/CONTACT_INBOX) ou SMTP não configurado; aviso não enviado");
  process.exit(0);
}

let texto = corpo;
if (arquivoLog && fs.existsSync(arquivoLog)) {
  const linhas = fs.readFileSync(arquivoLog, "utf8").trimEnd().split("\n");
  texto += `\n\nÚltimas linhas de ${arquivoLog}:\n\n${linhas.slice(-60).join("\n")}`;
}

const secure = env.SMTP_SECURE === "true";
const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: Number(env.SMTP_PORT || 587),
  secure,
  requireTLS: !secure,
  auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
  connectionTimeout: 15_000,
  greetingTimeout: 15_000,
  socketTimeout: 30_000,
});

try {
  await transporter.sendMail({
    from: `"${env.SMTP_FROM_NAME || "CraftSapiens"}" <${env.SMTP_FROM || env.SMTP_USER}>`,
    to: para,
    subject: `[CraftSapiens] ${assunto}`,
    text: `${texto}\n\n-- \nServidor: ${os.hostname()}, ${new Date().toLocaleString("pt-BR")}`,
  });
  console.log(`aviso enviado para ${para}`);
} catch (error) {
  console.error(`falha ao enviar o aviso: ${error.message}`);
  process.exit(1);
}
