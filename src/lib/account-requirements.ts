// =============================================================================
// Exigências da conta para participar do fórum e comprar na loja
// =============================================================================
// Todo mundo precisa de e-mail confirmado, nick do Minecraft vinculado e data
// de nascimento registrada; compras exigem também o CPF de quem paga. Quem
// está sem algum item vê o aviso no topo do site (AccountGate) e as
// APIs recusam a ação com um código próprio:
//   EmailNaoVerificado (proxy), SemNick, SemIdade, CpfObrigatorio (loja)
import { prisma } from "@/lib/prisma";
import { isPlaceholderEmail } from "@/lib/email-verification";
import { hasAcceptedCurrentTerms } from "@/lib/terms";

export interface AccountRequirements {
  emailConfirmado: boolean;
  nickVinculado: boolean;
  idadeRegistrada: boolean;
  cpfRegistrado: boolean;
}

export type RequirementKey = keyof AccountRequirements;

export interface AccountStatus extends AccountRequirements {
  /** Aceite da versão vigente dos Termos e da Política de Privacidade (src/lib/terms.ts) */
  termosAceitos: boolean;
}

export async function getAccountStatus(userId: string): Promise<AccountStatus | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, emailVerifiedAt: true, nloginId: true, birthDate: true, payerCpf: true, termsVersion: true },
  });
  if (!user) return null;
  return {
    emailConfirmado: !!user.emailVerifiedAt && !isPlaceholderEmail(user.email),
    nickVinculado: user.nloginId != null,
    idadeRegistrada: user.birthDate != null,
    cpfRegistrado: !!user.payerCpf,
    termosAceitos: hasAcceptedCurrentTerms(user.termsVersion),
  };
}

/** Itens que faltam, na ordem em que devem ser resolvidos */
export function pendingRequirements(req: AccountRequirements): RequirementKey[] {
  const order: RequirementKey[] = ["emailConfirmado", "nickVinculado", "idadeRegistrada", "cpfRegistrado"];
  return order.filter((key) => !req[key]);
}

/** Tudo o que o fórum exige (o CPF é só para compras) */
export function canUseForum(req: AccountRequirements): boolean {
  return req.emailConfirmado && req.nickVinculado && req.idadeRegistrada;
}

export function canBuy(req: AccountRequirements): boolean {
  return canUseForum(req) && req.cpfRegistrado;
}
