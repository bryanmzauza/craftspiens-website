// =============================================================================
// Termos e Condições e Política de Privacidade: versão vigente
// =============================================================================
// A versão é a data da última atualização mostrada em /termos
// (src/components/termos/TermosContent.tsx). Ao mudar o texto, atualize as
// duas: todo mundo precisa aceitar de novo no próximo acesso, e cada aceite
// fica registrado em `terms_acceptances` com data, IP e navegador.

export const TERMS_VERSION = "2026-03-19";

/** Declarações que o formulário de aceite exige marcadas */
export const TERMS_STATEMENTS = {
  termos: "Li e aceito os Termos e Condições da CraftSapiens",
  privacidade: "Li e concordo com a Política de Privacidade, que explica quais dados são coletados e como são usados (LGPD)",
  idade: "Tenho 18 anos ou mais, ou meu responsável legal está ciente e autoriza o uso da plataforma",
} as const;

export type TermsStatement = keyof typeof TERMS_STATEMENTS;

export function hasAcceptedCurrentTerms(version: string | null | undefined): boolean {
  return version === TERMS_VERSION;
}
