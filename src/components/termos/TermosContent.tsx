"use client";

import { useEffect, useState } from "react";
import { Printer } from "lucide-react";
import { PageHero } from "@/components/ui/PageHero";
import { CONTACT_EMAIL } from "@/lib/constants";

const SECTIONS = [
  {
    id: "adesao",
    title: "1. Da Adesão",
    content: `A adesão ao presente termo far-se-á no momento do registro em nosso servidor/plataforma. Em se tratando de incapazes e/ou relativamente incapazes, presume-se que o registro foi acompanhado e consentido por seus respectivos responsáveis legais.`,
  },
  {
    id: "regras",
    title: "2. Regras de Conduta",
    content: `O jogador se compromete a seguir as regras de conduta do servidor, evitando comportamentos ofensivos, discriminatórios, vexatórios ou de má índole. O jogador possui total responsabilidade por suas ações dentro do servidor e em quaisquer canais relacionados à CraftSapiens.\n\nA administração se exime de responsabilidade sobre atitudes de terceiros. As regras detalhadas e atualizadas estão disponíveis no nosso servidor Discord.`,
  },
  {
    id: "punicoes",
    title: "3. Punições",
    content: `Violações das regras podem resultar em: confisco de itens, mute (silenciamento), banimento temporário ou permanente e reclusão. A decisão da administração é soberana.\n\nO jogador poderá apelar via email: ${CONTACT_EMAIL}. Caso a apelação seja negada, não caberá mais recurso adicional. Qualquer tentativa de burlar um banimento constitui violação direta dos termos de uso.`,
  },
  {
    id: "premium",
    title: "4. Premium / VIP",
    content: `A modalidade Premium/VIP é uma distinção concedida por contribuição financeira espontânea. Os valores são pré-definidos pela administração.\n\nAs contrapartidas (benefícios) do plano podem sofrer alterações ou remoção, com aviso prévio mínimo de 7 (sete) dias. A remoção ou alteração de benefícios não justifica pedido de reembolso.`,
  },
  {
    id: "contribuicao",
    title: "5. Da Contribuição",
    content: `A idade mínima para realizar contribuições financeiras é de 16 (dezesseis) anos. Menores de 16 anos devem ter a compra realizada por um responsável legal.\n\nO servidor não se responsabiliza por compras realizadas por menores de idade sem autorização dos responsáveis.`,
  },
  {
    id: "estorno",
    title: "6. Estorno / Reembolso",
    content: `Se o jogador já usufruiu dos benefícios adquiridos, não haverá reembolso. A realização de chargeback (estorno unilateral) resultará em banimento permanente da plataforma.\n\nAntes de solicitar qualquer estorno junto à operadora de pagamento, o jogador deve entrar em contato conosco via ${CONTACT_EMAIL}. Em caso de estorno unilateral por parte da administração, o valor será devolvido e a conta será banida.`,
  },
  {
    id: "distincoes",
    title: "7. Distinções de Tratamento",
    content: `O status VIP/Premium não isenta o jogador de punições. Se o jogador for banido por conduta própria, não terá direito a restituição de valores contribuídos.`,
  },
  {
    id: "dados",
    title: "8. Dados e Privacidade",
    content: `Todas as interações realizadas nas dependências do servidor e da plataforma (conversas, ações, logs de acesso, etc.) são registradas e armazenadas. Ao aceitar estes termos, o jogador anui com a coleta, armazenamento e eventual visualização destes dados pela administração para fins de moderação e segurança.`,
  },
  {
    id: "moeda",
    title: "9. Da Moeda SAPIENS",
    content: `A Moeda SAPIENS é uma moeda virtual exclusiva do ecossistema CraftSapiens, sem qualquer valor monetário real fora do servidor. A Moeda SAPIENS não pode ser trocada por moeda corrente real ou por produtos/serviços fora da plataforma.`,
  },
  {
    id: "manutencao",
    title: "10. Manutenção do Servidor",
    content: `Manutenções programadas serão comunicadas previamente no servidor Discord oficial. Manutenções eventuais (emergenciais) serão comunicadas in-game com no mínimo 1 minuto de antecedência.\n\nA perda de itens ou progresso durante períodos de manutenção não gera obrigação de devolução por parte da administração. Em caso de erro grave, poderá ser realizado rollback a critério da equipe técnica.`,
  },
  {
    id: "equipe",
    title: "11. Hierarquia da Equipe",
    content: `A equipe do servidor é composta por: Reitor, Diretor, Administradores, Moderadores, equipe de Ajuda e Professores. Toda a equipe atua de forma voluntária.\n\nA equipe administrativa possui poderes que incluem: acesso a inventário de jogadores, baús, terrenos, teletransporte e demais ferramentas necessárias para a administração do servidor.`,
  },
  {
    id: "ouvidoria",
    title: "12. Ouvidoria",
    content: `O canal oficial de ouvidoria é o email: ${CONTACT_EMAIL}. O prazo máximo de resposta é de 15 (quinze) dias corridos.\n\nO jogador deve contatar o servidor através dos canais oficiais antes de buscar outros meios de resolução.`,
  },
  {
    id: "encerramento",
    title: "13. Encerramento das Atividades",
    content: `Em caso de encerramento das atividades do servidor, a comunidade será notificada com no mínimo 30 (trinta) dias de antecedência. Contribuições financeiras não serão aceitas durante o período de encerramento.`,
  },
];

const PRIVACY_SECTIONS = [
  {
    id: "dados-coletados",
    title: "Dados Coletados",
    content: `Coletamos os seguintes dados: username, email, data de nascimento, endereço IP, dados de uso (páginas visitadas, cliques, tempo de permanência), dados do servidor Minecraft (logs de chat, ações, inventário). Dados de pagamento são processados pelo MercadoPago — não armazenamos dados de cartão de crédito.`,
  },
  {
    id: "uso-dados",
    title: "Uso dos Dados",
    content: `Seus dados são utilizados para: autenticação e gerenciamento de conta, entrega de produtos comprados, comunicações (email, notificações), moderação e segurança do servidor, e melhoria contínua dos nossos serviços.`,
  },
  {
    id: "compartilhamento",
    title: "Compartilhamento",
    content: `Não vendemos dados pessoais. Compartilhamos dados apenas com processadores de pagamento e serviços de email essenciais para a operação, ou em caso de obrigação legal.`,
  },
  {
    id: "cookies",
    title: "Cookies",
    content: `Utilizamos cookies de sessão (autenticação), cookies de preferência (tema, idioma) e cookies analíticos (opcionais, com consentimento do usuário).`,
  },
  {
    id: "direitos",
    title: "Direitos do Usuário (LGPD)",
    content: `Conforme a Lei Geral de Proteção de Dados, você tem direito a: acesso aos seus dados pessoais, correção de dados incorretos, exclusão de dados (direito ao esquecimento), portabilidade dos dados e revogação de consentimento. Contato do encarregado: ${CONTACT_EMAIL}.`,
  },
  {
    id: "seguranca",
    title: "Segurança",
    content: `Senhas são armazenadas com hash bcrypt. Toda comunicação é realizada via HTTPS. O acesso ao banco de dados é restrito à equipe técnica autorizada.`,
  },
  {
    id: "menores",
    title: "Menores de Idade",
    content: `Menores de 13 anos não podem criar conta na plataforma. Usuários entre 13 e 17 anos devem ter ciência e consentimento de seus pais ou responsáveis legais.`,
  },
  {
    id: "alteracoes",
    title: "Alterações na Política",
    content: `Alterações nesta política serão comunicadas com no mínimo 7 (sete) dias de antecedência. A versão anterior ficará disponível para consulta.`,
  },
];

export function TermosContent() {
  const [activeSection, setActiveSection] = useState(SECTIONS[0].id);
  const [activeTab, setActiveTab] = useState<"termos" | "privacidade">("termos");

  useEffect(() => {
    if (window.location.hash === "#privacidade") {
      setActiveTab("privacidade");
    }
  }, []);

  useEffect(() => {
    const sections = activeTab === "termos" ? SECTIONS : PRIVACY_SECTIONS;
    const observers: IntersectionObserver[] = [];

    for (const section of sections) {
      const el = document.getElementById(section.id);
      if (!el) continue;

      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setActiveSection(section.id);
          }
        },
        { rootMargin: "-20% 0px -70% 0px" }
      );
      observer.observe(el);
      observers.push(observer);
    }

    return () => observers.forEach((o) => o.disconnect());
  }, [activeTab]);

  const currentSections = activeTab === "termos" ? SECTIONS : PRIVACY_SECTIONS;

  return (
    <>
      <PageHero
        title="TERMOS E CONDIÇÕES"
        subtitle="Última atualização: 19/03/2026"
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Termos e Condições" },
        ]}
      />

      {/* Tab Toggle */}
      <div className="mx-auto max-w-7xl px-4 lg:px-6">
        <div className="flex gap-2 border-b border-white/10 pb-px">
          <button
            onClick={() => setActiveTab("termos")}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === "termos"
                ? "border-b-2 border-green-cs text-green-cs"
                : "text-[#A0A0A0] hover:text-white"
            }`}
          >
            Termos e Condições
          </button>
          <button
            onClick={() => setActiveTab("privacidade")}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === "privacidade"
                ? "border-b-2 border-green-cs text-green-cs"
                : "text-[#A0A0A0] hover:text-white"
            }`}
          >
            Política de Privacidade
          </button>
        </div>
      </div>

      <section className="py-12 pb-24">
        <div className="mx-auto max-w-7xl px-4 lg:px-6">
          <div className="grid gap-12 lg:grid-cols-[240px_1fr]">
            {/* Table of Contents — Desktop sticky sidebar */}
            <aside className="hidden lg:block">
              <nav className="sticky top-24 space-y-1">
                {currentSections.map((section) => (
                  <a
                    key={section.id}
                    href={`#${section.id}`}
                    className={`block rounded-lg px-3 py-2 text-xs transition-colors ${
                      activeSection === section.id
                        ? "bg-green-cs/10 text-green-cs font-medium"
                        : "text-[#A0A0A0] hover:text-white"
                    }`}
                  >
                    {section.title}
                  </a>
                ))}

                <hr className="my-4 border-white/10" />

                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs text-[#A0A0A0] transition-colors hover:text-white"
                >
                  <Printer size={14} />
                  Imprimir
                </button>
              </nav>
            </aside>

            {/* Content */}
            <div className="space-y-10">
              {currentSections.map((section) => (
                <article
                  key={section.id}
                  id={section.id}
                  className="scroll-mt-24"
                >
                  <h3 className="text-lg font-bold text-white">
                    {section.title}
                  </h3>
                  <div className="mt-3 space-y-3 text-sm leading-relaxed text-[#E0E0E0]">
                    {section.content.split("\n\n").map((paragraph, i) => (
                      <p key={i}>{paragraph}</p>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
