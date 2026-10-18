// =============================================================================
// Fórum: usuário da sessão e checagens antes de escrever
// =============================================================================
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { describeBan, isBanned } from "@/lib/forum/ban";
import { hasAcceptedCurrentTerms } from "@/lib/terms";
import type { ForumUser } from "@/lib/forum/permissions";

export interface SessionUser extends ForumUser {
  nloginId: number | null;
}

/** Usuário logado (ou null), com o papel da sessão */
export async function getSessionUser(): Promise<SessionUser | null> {
  const session = await auth();
  if (!session?.user?.id) return null;
  return { id: session.user.id, role: session.user.role, nloginId: session.user.nloginId };
}

export interface Writer extends SessionUser {
  createdAt: Date;
}

/**
 * Checagens comuns a toda escrita no fórum: login, nick vinculado e banimento.
 * O papel e o banimento vêm do banco, não da sessão, para valerem na hora.
 */
export async function requireWriter(): Promise<{ user: Writer } | { error: NextResponse }> {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: NextResponse.json({ error: "Não autenticado" }, { status: 401 }) };
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      role: true,
      nloginId: true,
      birthDate: true,
      termsVersion: true,
      createdAt: true,
      deactivatedAt: true,
      forumBannedUntil: true,
      forumBanReason: true,
    },
  });

  if (!user || user.deactivatedAt) {
    return { error: NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 }) };
  }

  // No fórum o autor aparece pelo nick: exige um nick do Minecraft vinculado
  if (user.nloginId == null) {
    return {
      error: NextResponse.json(
        {
          error: "Vincule seu nick do Minecraft em Configurações > Contas vinculadas para participar do fórum.",
          code: "SemNick",
        },
        { status: 403 }
      ),
    };
  }

  // Aceite da versão vigente dos Termos e da Política de Privacidade
  if (!hasAcceptedCurrentTerms(user.termsVersion)) {
    return {
      error: NextResponse.json(
        { error: "Aceite os Termos e Condições e a Política de Privacidade para participar do fórum.", code: "TermosNaoAceitos" },
        { status: 403 }
      ),
    };
  }

  // Data de nascimento registrada (contas do Google entram sem ela)
  if (user.birthDate == null) {
    return {
      error: NextResponse.json(
        {
          error: "Informe sua data de nascimento em Configurações > Dados pessoais para participar do fórum.",
          code: "SemIdade",
        },
        { status: 403 }
      ),
    };
  }

  if (isBanned({ until: user.forumBannedUntil })) {
    const reason = user.forumBanReason ? ` Motivo: ${user.forumBanReason}` : "";
    return {
      error: NextResponse.json(
        {
          error: `Você está suspenso do fórum ${describeBan(user.forumBannedUntil!)}.${reason}`,
          code: "Banido",
          bannedUntil: user.forumBannedUntil,
        },
        { status: 403 }
      ),
    };
  }

  return {
    user: { id: user.id, role: user.role, nloginId: user.nloginId, createdAt: user.createdAt },
  };
}
