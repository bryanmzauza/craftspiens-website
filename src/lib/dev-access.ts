// =============================================================================
// Acesso às seções em desenvolvimento (hoje: nenhuma)
// =============================================================================
// Enquanto não forem lançadas, só contas cujo nick está no grupo "dev" do
// LuckPerms as veem. Os demais visitantes recebem a página "Em breve". Para
// lançar uma seção, remova o layout dela (src/app/<secao>/layout.tsx) e, se ela
// tiver APIs restritas, tire-as de `devOnlyApis` em src/proxy.ts. A comunidade
// foi lançada assim na v0.22 e o cronograma na v0.23.1.
import { auth } from "@/lib/auth";
import { getNloginById } from "@/lib/nlogin";
import { getPlayerGroups } from "@/lib/luckperms";

const DEV_GROUP = "dev";

/** true se a conta tem nick vinculado e esse nick está no grupo "dev". Falha fechada. */
export async function isDevAccount(nloginId: number | null | undefined): Promise<boolean> {
  if (nloginId == null) return false;
  try {
    const nlogin = await getNloginById(nloginId);
    const groups = await getPlayerGroups(nlogin?.unique_id);
    return groups.includes(DEV_GROUP);
  } catch (error) {
    console.error("[dev-access] Erro ao ler o grupo no LuckPerms:", error);
    return false;
  }
}

/** Mesma checagem, a partir da sessão atual */
export async function hasDevAccess(): Promise<boolean> {
  const session = await auth();
  return isDevAccount(session?.user?.nloginId);
}
