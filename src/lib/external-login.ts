// =============================================================================
// Login e vínculo por contas externas (Google e Microsoft)
// =============================================================================
// Regras:
// - Google: entra se a conta Google já estiver vinculada. Sem vínculo, se o e-mail
//   já pertence a uma conta com e-mail confirmado, vincula e entra; se o e-mail
//   não foi confirmado, o dono precisa entrar com nick e senha antes. Se o e-mail
//   não pertence a ninguém, cria uma conta no site (sem nick).
// - Microsoft: entra apenas se o nLogin já tiver o jogador pelo identificador
//   oficial (mojang_id para Java original, bedrock_id para Bedrock). Não cria
//   contas do jogo.
// - Vínculo: com uma intenção de vínculo ativa (link-intent.ts), o retorno do
//   login externo vincula a conta ao usuário logado em vez de fazer login novo.
import { prisma, prismaMariaDb } from "@/lib/prisma";
import { consumeLinkIntent } from "@/lib/link-intent";
import { isPlaceholderEmail } from "@/lib/email-verification";
import type { MinecraftIdentity } from "@/lib/minecraft-auth";

export type SignInResult = true | string;

export interface SessionIdentity {
  id: string;
  username: string;
  email: string;
  role: "ALUNO" | "PROFESSOR" | "MODERADOR" | "ADMIN";
  nloginId: number | null;
  sessionVersion: number;
  emailConfirmed: boolean;
}

export interface GoogleIdentity {
  sub: string;
  email: string;
  emailConfirmed: boolean;
  name: string | null;
}

const LINK_PAGE = "/perfil/configuracoes?aba=vinculos";

const loginError = (code: string) => `/login?error=${code}`;
const linkError = (code: string) => `${LINK_PAGE}&erro=${code}`;

// --- Google ---------------------------------------------------------------------

export async function handleGoogleSignIn(google: GoogleIdentity): Promise<SignInResult> {
  if (!google.emailConfirmed) return loginError("GoogleEmailNaoVerificado");

  const email = google.email.trim().toLowerCase();
  const existingLink = await prisma.linkedAccount.findUnique({
    where: { provider_providerAccountId: { provider: "google", providerAccountId: google.sub } },
  });

  const intent = await consumeLinkIntent("google");
  if (intent) {
    if (existingLink && existingLink.userId !== intent.userId) return linkError("ContaJaVinculada");
    if (!existingLink) {
      const alreadyHasGoogle = await prisma.linkedAccount.findUnique({
        where: { userId_provider: { userId: intent.userId, provider: "google" } },
      });
      if (alreadyHasGoogle) return linkError("GoogleJaVinculado");
      await prisma.linkedAccount.create({
        data: { userId: intent.userId, provider: "google", providerAccountId: google.sub, email },
      });
    }
    await confirmEmailFromProvider(intent.userId, email);
    return true;
  }

  if (existingLink) {
    // Vínculos antigos: o Google verificou este e-mail, então ele confirma a conta
    await confirmEmailFromProvider(existingLink.userId, email);
    return true;
  }

  // Sem vínculo, mas o e-mail já pertence a uma conta: só vincula se esse e-mail
  // foi confirmado com o código. Um e-mail não confirmado pode ter sido cadastrado
  // por outra pessoa, e vincular o Google entregaria a conta dela ao dono do e-mail.
  const emailInUse = await prisma.user.findUnique({
    where: { email },
    select: { id: true, emailVerifiedAt: true, linkedAccounts: { where: { provider: "google" }, select: { id: true } } },
  });
  if (emailInUse) {
    if (!emailInUse.emailVerifiedAt) return loginError("GoogleEmailEmUso");
    if (emailInUse.linkedAccounts.length > 0) return loginError("GoogleOutraConta");
    await prisma.linkedAccount.create({
      data: { userId: emailInUse.id, provider: "google", providerAccountId: google.sub, email },
    });
    return true;
  }

  await prisma.user.create({
    data: {
      email,
      // O Google já confirmou este e-mail
      emailVerifiedAt: new Date(),
      displayName: google.name?.slice(0, 100) ?? null,
      nloginId: null,
      role: "ALUNO",
      profile: { create: { sapiensCoins: 0, xp: 0 } },
      linkedAccounts: { create: { provider: "google", providerAccountId: google.sub, email } },
    },
  });
  return true;
}

// Conta que entra ou vincula pelo Google ou pela Microsoft sem ter confirmado o
// e-mail: o provedor já verificou o e-mail, então ele passa a valer como e-mail
// confirmado. Não troca um e-mail já confirmado nem usa um e-mail de outra conta.
async function confirmEmailFromProvider(userId: string, email: string) {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true, emailVerifiedAt: true } });
  if (!user || (user.emailVerifiedAt && !isPlaceholderEmail(user.email))) return;

  const owner = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (owner && owner.id !== userId) return;

  await prisma.user.update({ where: { id: userId }, data: { email, emailVerifiedAt: new Date() } });
}

export async function resolveGoogleUser(sub: string): Promise<SessionIdentity | null> {
  const link = await prisma.linkedAccount.findUnique({
    where: { provider_providerAccountId: { provider: "google", providerAccountId: sub } },
    select: { userId: true },
  });
  return link ? loadSessionIdentity(link.userId) : null;
}

// --- Microsoft (Minecraft Java e Bedrock) ---------------------------------------

async function findNloginByIdentity(identity: MinecraftIdentity) {
  return prismaMariaDb.nlogin.findFirst({
    where: {
      OR: [
        ...(identity.javaUuid ? [{ mojang_id: identity.javaUuid }] : []),
        { bedrock_id: identity.bedrockUuid },
      ],
    },
  });
}

/**
 * Registra a validação pela Microsoft (para mostrar "Verificado pela Microsoft")
 * e usa o e-mail verificado da conta Microsoft para confirmar o e-mail do site.
 */
async function recordMicrosoftLink(userId: string, identity: MinecraftIdentity) {
  const email = identity.microsoftEmail ?? null;
  const [current, sameXuid] = await Promise.all([
    prisma.linkedAccount.findUnique({
      where: { userId_provider: { userId, provider: "microsoft" } },
      select: { id: true },
    }),
    prisma.linkedAccount.findUnique({
      where: { provider_providerAccountId: { provider: "microsoft", providerAccountId: identity.xuid } },
      select: { userId: true },
    }),
  ]);

  if (!sameXuid || sameXuid.userId === userId) {
    if (current) {
      await prisma.linkedAccount.update({
        where: { id: current.id },
        data: { providerAccountId: identity.xuid, ...(email ? { email } : {}) },
      });
    } else {
      await prisma.linkedAccount.create({
        data: { userId, provider: "microsoft", providerAccountId: identity.xuid, email },
      });
    }
  }

  if (email) await confirmEmailFromProvider(userId, email);
}

export async function handleMicrosoftSignIn(identity: MinecraftIdentity): Promise<SignInResult> {
  const nlogin = await findNloginByIdentity(identity);
  const intent = await consumeLinkIntent("microsoft");

  if (intent) {
    if (!nlogin) return linkError("MicrosoftSemConta");
    const owner = await prisma.user.findUnique({ where: { nloginId: nlogin.id }, select: { id: true } });
    if (owner && owner.id !== intent.userId) return linkError("NickJaVinculado");
    if (!owner) {
      const user = await prisma.user.findUnique({ where: { id: intent.userId }, select: { nloginId: true } });
      if (!user) return linkError("ContaNaoEncontrada");
      if (user.nloginId != null) return linkError("ContaJaTemNick");
      await prisma.user.update({ where: { id: intent.userId }, data: { nloginId: nlogin.id } });
    }
    await recordMicrosoftLink(intent.userId, identity);
    return true;
  }

  // Login: só para quem já tem conta no nLogin com o identificador oficial
  if (!nlogin) return loginError("MicrosoftSemConta");

  let user = await prisma.user.findUnique({ where: { nloginId: nlogin.id }, select: { id: true } });
  if (!user) {
    // Jogador do servidor que ainda não tinha conta no site: cria a conta do site
    const email = (nlogin.email || `${nlogin.last_name}@craftsapiens.temp`).toLowerCase();
    const emailInUse = await prisma.user.findUnique({ where: { email }, select: { id: true } });
    user = await prisma.user.create({
      data: {
        email: emailInUse ? `${nlogin.last_name.toLowerCase()}.${nlogin.id}@craftsapiens.temp` : email,
        nloginId: nlogin.id,
        role: "ALUNO",
        profile: { create: { sapiensCoins: 0, xp: 0 } },
      },
      select: { id: true },
    });
  }
  await recordMicrosoftLink(user.id, identity);

  await prismaMariaDb.nlogin.update({ where: { id: nlogin.id }, data: { last_seen: new Date() } });
  return true;
}

export async function resolveMicrosoftUser(identity: MinecraftIdentity): Promise<SessionIdentity | null> {
  const nlogin = await findNloginByIdentity(identity);
  if (!nlogin) return null;
  const user = await prisma.user.findUnique({ where: { nloginId: nlogin.id }, select: { id: true } });
  return user ? loadSessionIdentity(user.id) : null;
}

// --- Comum ----------------------------------------------------------------------

/** Dados da sessão de um usuário; reativa a conta se ela estava desativada */
export async function loadSessionIdentity(userId: string): Promise<SessionIdentity | null> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return null;

  if (user.deactivatedAt) {
    await prisma.user.update({ where: { id: user.id }, data: { deactivatedAt: null } });
  }

  const nlogin = user.nloginId != null
    ? await prismaMariaDb.nlogin.findFirst({ where: { id: user.nloginId }, select: { last_name: true } })
    : null;

  return {
    id: user.id,
    username: nlogin?.last_name ?? user.displayName ?? "Aluno",
    email: user.email,
    role: user.role,
    nloginId: user.nloginId,
    sessionVersion: user.sessionVersion,
    emailConfirmed: !!user.emailVerifiedAt && !isPlaceholderEmail(user.email),
  };
}
