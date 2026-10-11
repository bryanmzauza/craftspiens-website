"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  GraduationCap,
  Search,
  Users,
  Clock,
  BarChart3,
  Loader2,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";
import { PageHero } from "@/components/ui/PageHero";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { Button } from "@/components/ui/Button";
import { LessonCard } from "@/components/aulas/LessonCard";
import { getDisciplineIcon } from "@/lib/discipline-icons";
import { AREAS, formatHours } from "@/lib/aulas";
import { SOCIAL_LINKS } from "@/lib/constants";

interface DisciplineData {
  id: string;
  name: string;
  slug: string;
  description: string;
  shortDescription: string;
  icon: string;
  color: string;
  area: string;
  lessonsCount: number;
  totalMinutes: number;
}

interface RecentLesson {
  id: string;
  title: string;
  slug: string;
  youtubeId: string | null;
  format: string | null;
  publishedAt: string | null;
  duration: number | null;
  discipline: { name: string; slug: string; color: string };
}

const HOW_IT_WORKS = [
  {
    icon: Users,
    title: "Dentro do Servidor",
    description: "Aulas acontecem ao vivo no servidor Minecraft, com professores guiando em tempo real.",
  },
  {
    icon: BarChart3,
    title: "Quadro Funcional",
    description: "Programação Java avançada cria quadros interativos dentro do jogo — sem mods necessários.",
  },
  {
    icon: GraduationCap,
    title: "Minigames Temáticos",
    description: "Cada aula inclui atividades gamificadas como quizzes, puzzles e construções avaliativas.",
  },
  {
    icon: Clock,
    title: "Aulas Gravadas",
    description: "As lives ficam gravadas no canal do YouTube e organizadas por disciplina aqui no site.",
  },
];

const AREA_FILTERS = ["Todas", ...AREAS] as const;

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.05 } },
};

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

export function AulasContent() {
  const [search, setSearch] = useState("");
  const [area, setArea] = useState<string>("Todas");
  const [disciplines, setDisciplines] = useState<DisciplineData[]>([]);
  const [loading, setLoading] = useState(true);
  const [recent, setRecent] = useState<RecentLesson[]>([]);

  const fetchDisciplines = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("busca", search);
      if (area !== "Todas") params.set("area", area);
      const res = await fetch(`/api/aulas?${params}`);
      if (res.ok) {
        const data = await res.json();
        setDisciplines(data.disciplines);
      }
    } catch {
      // silently fail — shows empty state
    } finally {
      setLoading(false);
    }
  }, [search, area]);

  useEffect(() => {
    const timer = setTimeout(fetchDisciplines, 300);
    return () => clearTimeout(timer);
  }, [fetchDisciplines]);

  useEffect(() => {
    let active = true;
    fetch("/api/aulas/recentes?limite=8")
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error(res.statusText))))
      .then((data) => {
        if (active) setRecent(data.lessons ?? []);
      })
      .catch(() => {
        // sem a vitrine de recentes
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <>
      <PageHero
        title="AULAS GAMIFICADAS"
        subtitle="Aprenda de forma divertida dentro do Minecraft. Sem mods, sem complicação."
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Aulas" },
        ]}
      />

      {/* Como Funciona */}
      <section className="pb-16">
        <div className="mx-auto max-w-7xl px-4 lg:px-6">
          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4"
          >
            {HOW_IT_WORKS.map((item) => (
              <motion.div
                key={item.title}
                variants={fadeIn}
                className="rounded-xl border border-white/10 bg-white/5 p-5 backdrop-blur"
              >
                <item.icon className="h-8 w-8 text-green-cs" />
                <h3 className="mt-3 text-sm font-bold text-white">{item.title}</h3>
                <p className="mt-1.5 text-xs text-[#E0E0E0]">{item.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Aulas recentes */}
      {recent.length > 0 && (
        <section className="pb-20">
          <div className="mx-auto max-w-7xl px-4 lg:px-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <SectionTitle>AULAS RECENTES</SectionTitle>
              <a
                href={SOCIAL_LINKS.youtube}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm font-semibold text-green-cs hover:underline"
              >
                Canal no YouTube
                <ExternalLink size={14} aria-hidden="true" />
              </a>
            </div>
            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {recent.map((lesson) => (
                <LessonCard
                  key={lesson.id}
                  href={`/aulas/${lesson.discipline.slug}/${lesson.slug}`}
                  title={lesson.title}
                  youtubeId={lesson.youtubeId}
                  format={lesson.format}
                  publishedAt={lesson.publishedAt}
                  duration={lesson.duration}
                  label={lesson.discipline.name}
                  color={lesson.discipline.color}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Catálogo de Disciplinas */}
      <section className="pb-24">
        <div className="mx-auto max-w-7xl px-4 lg:px-6">
          <SectionTitle className="text-center">DISCIPLINAS</SectionTitle>

          {/* Filters */}
          <div className="mt-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative flex-1 max-w-md">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A0A0A0]" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar disciplina..."
                className="w-full rounded-lg border border-white/20 bg-white/5 py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-white/40 focus:border-green-cs focus:outline-none"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              {AREA_FILTERS.map((a) => (
                <button
                  key={a}
                  onClick={() => setArea(a)}
                  className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                    area === a
                      ? "bg-green-cs text-white"
                      : "bg-white/5 text-[#A0A0A0] hover:bg-white/10 hover:text-white"
                  }`}
                >
                  {a}
                </button>
              ))}
            </div>
          </div>

          {/* Grid */}
          {loading ? (
            <div className="mt-12 flex justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-green-cs" />
            </div>
          ) : (
            <motion.div
              key={`${area}-${search}`}
              variants={stagger}
              initial="hidden"
              animate="visible"
              className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
            >
              {disciplines.map((discipline) => {
                const Icon = getDisciplineIcon(discipline.icon);
                return (
                  <motion.div key={discipline.slug} variants={fadeIn}>
                    <Link href={`/aulas/${discipline.slug}`} className="block h-full">
                      <div className="group flex h-full flex-col rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur transition-all hover:border-green-cs hover:scale-[1.02] hover:shadow-[0_4px_24px_rgba(0,0,0,0.3)]">
                        <div
                          className="flex h-12 w-12 items-center justify-center rounded-xl"
                          style={{ backgroundColor: `${discipline.color}20`, borderColor: `${discipline.color}40`, borderWidth: 1 }}
                        >
                          <Icon className="h-6 w-6" style={{ color: discipline.color }} />
                        </div>

                        <h3 className="mt-4 text-lg font-bold text-white">{discipline.name}</h3>
                        <p className="mt-2 text-sm text-[#E0E0E0] line-clamp-3">
                          {discipline.shortDescription}
                        </p>

                        <div className="mt-auto pt-4">
                          <span
                            className="rounded-full px-2.5 py-0.5 text-xs font-medium"
                            style={{
                              backgroundColor: `${discipline.color}20`,
                              color: discipline.color,
                            }}
                          >
                            {discipline.area}
                          </span>
                          <p className="mt-3 text-xs text-[#A0A0A0]">
                            {discipline.lessonsCount} {discipline.lessonsCount === 1 ? "aula" : "aulas"}
                            {discipline.totalMinutes > 0 && ` · ${formatHours(discipline.totalMinutes)} de conteúdo`}
                          </p>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </motion.div>
          )}

          {!loading && disciplines.length === 0 && (
            <p className="mt-12 text-center text-[#A0A0A0]">
              Nenhuma disciplina encontrada com esses filtros.
            </p>
          )}
        </div>
      </section>

      {/* Seção ENEM */}
      <section className="pb-24">
        <div className="mx-auto max-w-4xl px-4 lg:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="rounded-2xl bg-gradient-to-br from-xp/20 to-bg-card/80 border border-xp/20 p-12 text-center backdrop-blur"
          >
            <GraduationCap className="mx-auto h-12 w-12 text-xp" />
            <h3 className="mt-4 font-[family-name:var(--font-press-start)] text-xl text-white sm:text-2xl">
              ENEM & REFORÇO
            </h3>
            <p className="mt-4 text-[#E0E0E0]">
              Revisões para o ENEM, simulados feitos dentro do Minecraft, o Sábado Militar com
              preparação para ITA, IME e EsPCEx e aulas para a Olimpíada Brasileira de Astronomia.
            </p>
            <div className="mt-8">
              <Button href="/aulas/enem-vestibulares">Ver aulas de ENEM e vestibulares</Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Seção para Pais */}
      <section className="pb-24">
        <div className="mx-auto max-w-4xl px-4 lg:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="rounded-2xl border border-white/10 bg-white/5 p-12 backdrop-blur"
          >
            <h3 className="text-center font-[family-name:var(--font-press-start)] text-lg text-white sm:text-xl">
              PARA PAIS E RESPONSÁVEIS
            </h3>
            <div className="mt-6 grid gap-6 sm:grid-cols-3">
              <div className="text-center">
                <BarChart3 className="mx-auto h-8 w-8 text-green-cs" />
                <h4 className="mt-3 text-sm font-bold text-white">Acompanhe o Progresso</h4>
                <p className="mt-1 text-xs text-[#E0E0E0]">
                  Veja o desempenho do seu filho em cada disciplina pelo painel do perfil.
                </p>
              </div>
              <div className="text-center">
                <Users className="mx-auto h-8 w-8 text-green-cs" />
                <h4 className="mt-3 text-sm font-bold text-white">Ambiente Seguro</h4>
                <p className="mt-1 text-xs text-[#E0E0E0]">
                  Servidor monitorado com moderadores ativos e regras rígidas de conduta.
                </p>
              </div>
              <div className="text-center">
                <Clock className="mx-auto h-8 w-8 text-green-cs" />
                <h4 className="mt-3 text-sm font-bold text-white">Horários Definidos</h4>
                <p className="mt-1 text-xs text-[#E0E0E0]">
                  Aulas com cronograma fixo. Confira a grade na página de cronograma.
                </p>
              </div>
            </div>
            <p className="mt-8 text-center text-sm text-[#A0A0A0]">
              Há também lives de educação positiva para pais em{" "}
              <Link href="/aulas/educacao-socioemocional" className="text-green-cs hover:underline">
                Educação Socioemocional
              </Link>
              .
            </p>
          </motion.div>
        </div>
      </section>
    </>
  );
}
