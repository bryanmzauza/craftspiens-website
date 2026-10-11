"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowUpRight, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { HERO_IMAGE } from "@/components/home/hero-image";
import { SOCIAL_LINKS } from "@/lib/constants";
import {
  HIERARCHY,
  PRESS,
  TEACHING_ROLE,
  TEAM,
  TEAM_GROUPS,
  TIMELINE,
  type TeamMember,
} from "@/content/sobre";

// --- Utilitários --------------------------------------------------------------

const MONTH_FORMAT = new Intl.DateTimeFormat("pt-BR", { month: "short", year: "numeric", timeZone: "UTC" });

function formatPressDate(date: string): string {
  return MONTH_FORMAT.format(new Date(`${date}T12:00:00Z`)).replace(".", "").replace(" de ", " ");
}

/** Iniciais do primeiro e do último nome (ignora abreviações como "A.") */
function initials(name: string): string {
  const parts = name.split(/\s+/).filter((part) => !/^[A-Z]\.$/.test(part));
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase();
}

function Reveal({
  children,
  delay = 0,
  className = "",
  style,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <motion.div
      style={style}
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function SectionHeading({ eyebrow, title, className = "" }: { eyebrow: string; title: string; className?: string }) {
  return (
    <Reveal className={className}>
      <p className="font-[family-name:var(--font-jetbrains-mono)] text-xs uppercase tracking-[0.22em] text-green-cs">
        {eyebrow}
      </p>
      <h2 className="mt-5 font-[family-name:var(--font-press-start)] text-xl leading-[1.5] text-white sm:text-2xl sm:leading-[1.45]">
        {title}
      </h2>
    </Reveal>
  );
}

// --- Seções -------------------------------------------------------------------

function Hero() {
  const [discordMembers, setDiscordMembers] = useState<number | null>(null);

  useEffect(() => {
    let active = true;
    fetch("/api/discord")
      .then((res) => res.json())
      .then((data) => {
        if (active && typeof data.members === "number") setDiscordMembers(data.members);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const facts = [
    { value: "2020", label: "Início do projeto" },
    { value: "40 a 60", label: "Alunos por aula, em média" },
    ...(discordMembers
      ? [{ value: `${Math.floor(discordMembers / 1000)} mil+`, label: "Membros no Discord" }]
      : []),
  ];

  return (
    <section className="relative isolate overflow-hidden">
      <Image
        src={HERO_IMAGE}
        alt=""
        fill
        priority
        sizes="100vw"
        placeholder="blur"
        className="object-cover object-[62%_45%]"
      />
      <div aria-hidden="true" className="absolute inset-0 bg-bg-primary/75" />
      <div aria-hidden="true" className="absolute inset-0 bg-linear-to-r from-bg-primary via-bg-primary/70 to-bg-primary/20" />
      <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-40 bg-linear-to-t from-bg-primary to-transparent" />

      <div className="relative mx-auto max-w-7xl px-4 pb-20 pt-28 lg:px-6 lg:pb-28 lg:pt-36">
        <nav aria-label="Breadcrumb">
          <ol className="flex items-center gap-1.5 text-sm text-[#A0A0A0]">
            <li>
              <Link href="/" className="transition-colors hover:text-green-cs">
                Home
              </Link>
            </li>
            <li aria-hidden="true">
              <ChevronRight size={14} />
            </li>
            <li className="text-white">Sobre</li>
          </ol>
        </nav>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="mt-10 max-w-3xl"
        >
          <p className="font-[family-name:var(--font-jetbrains-mono)] text-xs uppercase tracking-[0.22em] text-green-light">
            Sobre a CraftSapiens
          </p>
          <h1 className="mt-6 font-[family-name:var(--font-press-start)] text-[1.6rem] leading-[1.45] text-white sm:text-4xl sm:leading-[1.35]">
            Uma escola dentro do <span className="text-green-cs">Minecraft</span>.
          </h1>
          <p className="mt-7 max-w-2xl text-base leading-relaxed text-[#E0E0E0] sm:text-lg">
            Professores, alunos e jogadores reunidos em um servidor onde as aulas acontecem dentro do
            jogo. O projeto começou em 2020 e hoje recebe estudantes de todo o país.
          </p>
        </motion.div>

        <motion.dl
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="mt-14 grid max-w-3xl grid-cols-2 gap-x-8 gap-y-6 border-t border-white/10 pt-8 sm:grid-cols-3"
        >
          {facts.map((fact) => (
            <div key={fact.label}>
              <dt className="sr-only">{fact.label}</dt>
              <dd className="text-3xl font-bold text-white">{fact.value}</dd>
              <dd className="mt-1 font-[family-name:var(--font-jetbrains-mono)] text-[11px] uppercase tracking-[0.18em] text-[#A0A0A0]">
                {fact.label}
              </dd>
            </div>
          ))}
        </motion.dl>
      </div>
    </section>
  );
}

function History() {
  return (
    <section className="py-24 lg:py-32">
      <div className="mx-auto grid max-w-7xl gap-14 px-4 lg:grid-cols-[5fr_7fr] lg:gap-24 lg:px-6">
        <div className="lg:sticky lg:top-32 lg:self-start">
          <SectionHeading eyebrow="Nossa história" title="Começou como uma forma de manter os alunos por perto." />
          <Reveal delay={0.1}>
            <p className="mt-6 text-base leading-relaxed text-[#E0E0E0] sm:text-lg">
              Com o ensino remoto da pandemia, o interesse das turmas caiu. O professor Helton Gonçalves
              passou a dar aulas dentro do Minecraft para falar a mesma língua dos alunos, e o que era
              uma tentativa virou um projeto com professores de várias disciplinas.
            </p>
          </Reveal>
          <Reveal delay={0.15}>
            <figure className="mt-10 border-l-2 border-green-cs pl-6">
              <blockquote className="text-lg leading-relaxed text-white">
                &ldquo;Aqui os alunos realmente querem aprender, pois é prazeroso estudar jogando.&rdquo;
              </blockquote>
              <figcaption className="mt-3 text-sm text-[#A0A0A0]">Helton Alvares Gonçalves, fundador</figcaption>
            </figure>
          </Reveal>
        </div>

        <ol className="relative border-l border-white/10">
          {TIMELINE.map((item, i) => (
            <li key={item.year} className="relative pb-12 pl-10 last:pb-0">
              <span
                aria-hidden="true"
                className="absolute -left-[5px] top-2 h-[9px] w-[9px] bg-green-cs shadow-[0_0_0_4px_#1A1A2E]"
              />
              <Reveal delay={i * 0.05}>
                <span className="font-[family-name:var(--font-jetbrains-mono)] text-sm text-green-cs">{item.year}</span>
                <h3 className="mt-2 text-lg font-bold text-white sm:text-xl">{item.title}</h3>
                <p className="mt-2 max-w-prose text-sm leading-relaxed text-[#E0E0E0] sm:text-base">
                  {item.description}
                </p>
              </Reveal>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

const HOW_IT_WORKS = [
  {
    title: "No servidor e no Discord",
    description:
      "A aula acontece dentro do jogo, com os alunos reunidos no campus, e a conversa por voz fica no Discord.",
  },
  {
    title: "Quadros, minijogos e aulas de campo",
    description:
      "Os professores projetam slides em quadros dentro do jogo, criam minijogos sobre a matéria e montam construções para aulas de campo.",
  },
  {
    title: "Minecraft sem mods",
    description:
      "Tudo funciona no Minecraft original, com programação própria em Java no servidor. Basta entrar pelo Java ou pelo Bedrock.",
  },
];

function WhoWeAre() {
  return (
    <section className="border-t border-white/[0.06] py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-4 lg:px-6">
        <div className="grid gap-10 lg:grid-cols-[5fr_7fr] lg:gap-24">
          <SectionHeading eyebrow="Quem somos" title="Como funcionam as aulas" />
          <Reveal delay={0.1}>
            <p className="text-base leading-relaxed text-[#E0E0E0] sm:text-lg lg:pt-10">
              A CraftSapiens é uma comunidade de professores, alunos e jogadores. As aulas seguem o
              conteúdo escolar e usam o próprio jogo para explicar a matéria: um modelo atômico feito de
              blocos, uma aula de física sobre gravidade, um labirinto de letras para revisar gramática.
              Preparar uma aula assim dá muito mais trabalho, mas o aluno participa porque está jogando.
            </p>
          </Reveal>
        </div>

        <div className="mt-16 grid gap-px overflow-hidden rounded-xl border border-white/10 bg-white/10 md:grid-cols-3">
          {HOW_IT_WORKS.map((item, i) => (
            <Reveal key={item.title} delay={i * 0.08} className="bg-bg-card p-8">
              <span className="font-[family-name:var(--font-jetbrains-mono)] text-sm text-[#A0A0A0]">0{i + 1}</span>
              <h3 className="mt-4 text-lg font-bold text-white">{item.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-[#E0E0E0]">{item.description}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

const VALUES = [
  { title: "Inovação na educação", description: "Usar o jogo como ferramenta de ensino, e não só como recompensa." },
  { title: "Comunidade", description: "Professores e alunos aprendendo e construindo juntos." },
  { title: "Persistência", description: "Encarar a dificuldade como parte do aprendizado." },
  { title: "Acesso", description: "Aulas gratuitas para que qualquer aluno possa participar." },
  { title: "Segurança", description: "Ambiente moderado e acompanhado, adequado a todas as idades." },
];

function MissionValues() {
  return (
    <section className="border-t border-white/[0.06] py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-4 lg:px-6">
        <SectionHeading eyebrow="Missão, visão e valores" title="O que nos move" />

        <div className="mt-14 grid gap-10 md:grid-cols-2 md:gap-16">
          <Reveal>
            <p className="font-[family-name:var(--font-jetbrains-mono)] text-xs uppercase tracking-[0.2em] text-[#A0A0A0]">
              Missão
            </p>
            <p className="mt-4 text-xl leading-relaxed text-white sm:text-2xl">
              Tornar o estudo mais atraente e divertido por meio do Minecraft.
            </p>
          </Reveal>
          <Reveal delay={0.08}>
            <p className="font-[family-name:var(--font-jetbrains-mono)] text-xs uppercase tracking-[0.2em] text-[#A0A0A0]">
              Visão
            </p>
            <p className="mt-4 text-xl leading-relaxed text-white sm:text-2xl">
              Ser referência em ensino com jogos e levar aulas de qualidade a mais estudantes.
            </p>
          </Reveal>
        </div>

        <ul className="mt-16 grid gap-x-8 gap-y-10 border-t border-white/10 pt-12 sm:grid-cols-2 lg:grid-cols-5">
          {VALUES.map((value, i) => (
            <li key={value.title}>
              <Reveal delay={i * 0.05}>
                <span className="font-[family-name:var(--font-jetbrains-mono)] text-sm text-green-cs">0{i + 1}</span>
                <h3 className="mt-3 font-bold text-white">{value.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[#E0E0E0]">{value.description}</p>
              </Reveal>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function Press() {
  const featured = PRESS.find((item) => item.featured);
  const others = PRESS.filter((item) => item !== featured);

  return (
    <section id="imprensa" className="scroll-mt-16 border-t border-white/[0.06] py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-4 lg:px-6">
        <SectionHeading eyebrow="Na imprensa" title="O que falam sobre a CraftSapiens" />

        {featured && (
          <Reveal className="mt-14">
            <a
              href={featured.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group grid gap-6 rounded-2xl border border-white/10 bg-white/[0.03] p-8 transition-colors hover:border-white/25 hover:bg-white/[0.05] lg:grid-cols-[1fr_auto] lg:items-end lg:p-12"
            >
              <div>
                <p className="flex flex-wrap items-center gap-x-3 gap-y-1 font-[family-name:var(--font-jetbrains-mono)] text-xs uppercase tracking-[0.2em]">
                  <span className="text-green-cs">{featured.outlet}</span>
                  <span className="text-[#A0A0A0]">{formatPressDate(featured.date)}</span>
                </p>
                <h3 className="mt-5 max-w-3xl text-2xl font-bold leading-snug text-white sm:text-3xl">
                  {featured.title}
                </h3>
                {featured.excerpt && (
                  <p className="mt-4 max-w-2xl text-base leading-relaxed text-[#E0E0E0]">{featured.excerpt}</p>
                )}
              </div>
              <span className="inline-flex items-center gap-2 text-sm font-semibold text-green-cs transition-colors group-hover:text-green-light">
                Ler a reportagem
                <ArrowUpRight size={18} className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden="true" />
              </span>
            </a>
          </Reveal>
        )}

        <ul className="mt-6 divide-y divide-white/10 border-y border-white/10">
          {others.map((item, i) => (
            <li key={item.url}>
              <Reveal delay={Math.min(i * 0.04, 0.2)}>
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group grid gap-2 py-6 sm:grid-cols-[12rem_1fr_auto] sm:items-baseline sm:gap-8"
                >
                  <span className="font-[family-name:var(--font-jetbrains-mono)] text-xs uppercase tracking-[0.16em] text-[#A0A0A0]">
                    {item.outlet}
                  </span>
                  <span className="text-base font-semibold leading-snug text-white transition-colors group-hover:text-green-light sm:text-lg">
                    {item.title}
                  </span>
                  <span className="flex items-center gap-3 text-xs text-[#A0A0A0]">
                    <span>
                      {item.kind} · {formatPressDate(item.date)}
                    </span>
                    <ArrowUpRight size={16} className="text-[#A0A0A0] transition-colors group-hover:text-green-cs" aria-hidden="true" />
                  </span>
                </a>
              </Reveal>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-xs text-[#A0A0A0]">Os links abrem o site de cada veículo em uma nova aba.</p>
      </div>
    </section>
  );
}

function MemberCard({ member }: { member: TeamMember }) {
  return (
    <figure>
      <div className="relative aspect-square overflow-hidden rounded-xl border border-white/10 bg-white/[0.03]">
        {member.photo ? (
          <Image
            src={member.photo}
            alt={member.name}
            fill
            sizes="(min-width: 1024px) 240px, (min-width: 640px) 30vw, 45vw"
            className="object-cover"
          />
        ) : (
          <div
            aria-hidden="true"
            className="flex h-full items-center justify-center bg-[linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[size:16px_16px]"
          >
            <span className="font-[family-name:var(--font-press-start)] text-xl text-green-cs/80 sm:text-2xl">
              {initials(member.name)}
            </span>
          </div>
        )}
      </div>
      <figcaption className="mt-4">
        <p className="font-semibold text-white">{member.name}</p>
        <p className="mt-0.5 text-sm text-[#A0A0A0]">{member.role}</p>
      </figcaption>
    </figure>
  );
}

function Team() {
  return (
    <section id="equipe" className="scroll-mt-16 border-t border-white/[0.06] py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-4 lg:px-6">
        <SectionHeading eyebrow="Nossa equipe" title="Quem faz a CraftSapiens" />

        <div className="mt-14 space-y-16">
          {TEAM_GROUPS.map((group) => {
            const members = TEAM.filter((member) => member.group === group);
            if (members.length === 0) return null;
            return (
              <div key={group}>
                <Reveal>
                  <h3 className="flex items-center gap-4 font-[family-name:var(--font-jetbrains-mono)] text-xs uppercase tracking-[0.2em] text-[#A0A0A0]">
                    {group}
                    <span aria-hidden="true" className="h-px flex-1 bg-white/10" />
                  </h3>
                </Reveal>
                <div className="mt-8 grid grid-cols-2 gap-x-5 gap-y-10 sm:grid-cols-3 lg:grid-cols-5">
                  {members.map((member, i) => (
                    <Reveal key={member.name} delay={Math.min(i * 0.05, 0.25)}>
                      <MemberCard member={member} />
                    </Reveal>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function Hierarchy() {
  const levels = HIERARCHY.length;

  return (
    <section className="border-t border-white/[0.06] py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-4 lg:px-6">
        <div className="grid gap-10 lg:grid-cols-[5fr_7fr] lg:gap-24">
          <div>
            <SectionHeading eyebrow="Hierarquia do servidor" title="Quem cuida do servidor" />
            <Reveal delay={0.1}>
              <p className="mt-6 text-base leading-relaxed text-[#E0E0E0]">
                Cada cargo responde ao de cima. Os professores ficam fora dessa cadeia: cuidam das aulas,
                enquanto a moderação cuida do servidor e da comunidade.
              </p>
            </Reveal>
          </div>

          <div>
            <ol className="space-y-2">
              {HIERARCHY.map((rank, i) => {
                // Pirâmide: cargos mais altos são mais estreitos e mais destacados
                const width = 52 + (48 * i) / Math.max(levels - 1, 1);
                const strength = 0.22 - (0.16 * i) / Math.max(levels - 1, 1);
                return (
                  <li key={rank.role} className="flex justify-center">
                    <Reveal
                      delay={i * 0.06}
                      className="w-full sm:w-[var(--rank-width)]"
                      style={{ "--rank-width": `${width}%` } as React.CSSProperties}
                    >
                      <div
                        className="flex flex-col gap-1 rounded-lg border px-5 py-4 sm:flex-row sm:items-baseline sm:gap-4"
                        style={{
                          backgroundColor: `rgba(76, 175, 80, ${strength})`,
                          borderColor: `rgba(76, 175, 80, ${strength + 0.12})`,
                        }}
                      >
                        <span className="font-[family-name:var(--font-jetbrains-mono)] text-xs text-green-light">
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <span className="font-bold text-white">{rank.role}</span>
                        <span className="text-sm text-[#E0E0E0]">{rank.description}</span>
                      </div>
                    </Reveal>
                  </li>
                );
              })}
            </ol>

            <Reveal delay={0.3} className="mt-8">
              <div className="flex flex-col gap-1 rounded-lg border border-dashed border-white/20 px-5 py-4 sm:flex-row sm:items-baseline sm:gap-4">
                <span className="font-[family-name:var(--font-jetbrains-mono)] text-xs text-[#A0A0A0]">Aulas</span>
                <span className="font-bold text-white">{TEACHING_ROLE.role}</span>
                <span className="text-sm text-[#E0E0E0]">{TEACHING_ROLE.description}</span>
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}

function JoinCta() {
  return (
    <section className="border-t border-white/[0.06] py-24">
      <Reveal className="mx-auto flex max-w-7xl flex-col items-start gap-8 px-4 sm:flex-row sm:items-center sm:justify-between lg:px-6">
        <div className="max-w-2xl">
          <h2 className="font-[family-name:var(--font-press-start)] text-lg leading-[1.5] text-white sm:text-xl">
            Quer fazer parte da equipe?
          </h2>
          <p className="mt-4 text-base leading-relaxed text-[#E0E0E0]">
            Professores, moderadores e construtores são sempre bem-vindos. Fale com a gente no Discord.
          </p>
        </div>
        <Button href={SOCIAL_LINKS.discord} size="lg">
          Falar no Discord
          <ArrowUpRight size={18} aria-hidden="true" />
        </Button>
      </Reveal>
    </section>
  );
}

export function SobreContent() {
  return (
    <>
      <Hero />
      <History />
      <WhoWeAre />
      <MissionValues />
      <Press />
      <Team />
      <Hierarchy />
      <JoinCta />
    </>
  );
}
