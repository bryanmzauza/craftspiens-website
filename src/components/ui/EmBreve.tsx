import { Hourglass } from "lucide-react";
import { PageHero } from "@/components/ui/PageHero";
import { Button } from "@/components/ui/Button";
import { SOCIAL_LINKS } from "@/lib/constants";

interface EmBreveProps {
  /** Título da página, como no hero da seção (ex.: "CRONOGRAMA") */
  title: string;
  /** Nome da seção na trilha de navegação (ex.: "Cronograma") */
  label: string;
  /** O que a seção vai oferecer quando for lançada */
  description: string;
  /** Botão principal, para onde o conteúdo está enquanto isso (ex.: canal do Discord) */
  action?: { label: string; href: string };
}

/** Página exibida no lugar de uma seção que ainda não foi lançada */
export function EmBreve({ title, label, description, action }: EmBreveProps) {
  return (
    <>
      <PageHero
        title={title}
        breadcrumbs={[{ label: "Home", href: "/" }, { label }]}
      />

      <section className="pb-24">
        <div className="mx-auto max-w-7xl px-4 lg:px-6">
          <div className="mx-auto max-w-2xl rounded-2xl border border-white/10 bg-white/5 p-8 text-center backdrop-blur sm:p-12">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-green-cs/15 text-green-cs">
              <Hourglass size={28} aria-hidden="true" />
            </div>
            <h2 className="mt-6 font-[family-name:var(--font-press-start)] text-lg leading-[1.5] text-white sm:text-xl">
              Em breve
            </h2>
            <p className="mx-auto mt-4 max-w-md text-base leading-relaxed text-[#E0E0E0]">
              {description}
            </p>
            <p className="mx-auto mt-2 max-w-md text-sm text-[#A0A0A0]">
              Os avisos de lançamento saem primeiro no nosso Discord.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              {action ? (
                <>
                  <Button href={action.href}>{action.label}</Button>
                  <Button href="/aulas" variant="secondary">
                    Ver as aulas
                  </Button>
                </>
              ) : (
                <>
                  <Button href="/aulas">Ver as aulas</Button>
                  <Button href={SOCIAL_LINKS.discord} variant="secondary">
                    Entrar no Discord
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
