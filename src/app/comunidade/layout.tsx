import { EmBreve } from "@/components/ui/EmBreve";
import { hasDevAccess } from "@/lib/dev-access";

// Seção ainda não lançada: só contas do grupo "dev" veem o conteúdo (src/lib/dev-access.ts).
// As APIs do fórum são bloqueadas no proxy (src/proxy.ts).
export default async function ComunidadeLayout({ children }: { children: React.ReactNode }) {
  if (!(await hasDevAccess())) {
    return (
      <EmBreve
        title="COMUNIDADE"
        label="Comunidade"
        description="O fórum da comunidade, para tirar dúvidas e conversar com outros alunos e professores, está sendo preparado."
      />
    );
  }
  return children;
}
