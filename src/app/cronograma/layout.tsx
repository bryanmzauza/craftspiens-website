import { EmBreve } from "@/components/ui/EmBreve";
import { hasDevAccess } from "@/lib/dev-access";
import { DISCORD_SCHEDULE_URL } from "@/lib/constants";

// Seção ainda não lançada: só contas do grupo "dev" veem o conteúdo (src/lib/dev-access.ts)
export default async function CronogramaLayout({ children }: { children: React.ReactNode }) {
  if (!(await hasDevAccess())) {
    return (
      <EmBreve
        title="CRONOGRAMA"
        label="Cronograma"
        description="O cronograma das aulas ao vivo é publicado toda semana no canal #cronograma-de-aulas do nosso Discord. Em breve ele também estará aqui."
        action={{ label: "Ver o cronograma no Discord", href: DISCORD_SCHEDULE_URL }}
      />
    );
  }
  return children;
}
