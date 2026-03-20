"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Calculator,
  Microscope,
  Globe,
  BookOpen,
  Palette,
  Code,
  Languages,
  Dumbbell,
  GraduationCap,
  Search,
  Users,
  Clock,
  BarChart3,
} from "lucide-react";
import { PageHero } from "@/components/ui/PageHero";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { Button } from "@/components/ui/Button";

const DISCIPLINES = [
  {
    slug: "matematica",
    name: "Matemática",
    icon: Calculator,
    description: "Álgebra, geometria, aritmética e lógica matemática através de construções e puzzles no Minecraft.",
    levels: ["Fundamental", "Médio"],
    courses: 8,
    color: "#2196F3",
  },
  {
    slug: "ciencias",
    name: "Ciências",
    icon: Microscope,
    description: "Biologia, Física e Química com experimentos virtuais, biomas e construções temáticas no servidor.",
    levels: ["Fundamental", "Médio"],
    courses: 6,
    color: "#4CAF50",
  },
  {
    slug: "historia",
    name: "História",
    icon: Globe,
    description: "Viaje no tempo visitando civilizações construídas em escala dentro do Minecraft. Egito, Roma, Brasil Colonial.",
    levels: ["Fundamental", "Médio"],
    courses: 5,
    color: "#FF9800",
  },
  {
    slug: "portugues",
    name: "Português",
    icon: BookOpen,
    description: "Gramática, interpretação de texto e redação com missões temáticas e desafios literários interativos.",
    levels: ["Fundamental", "Médio"],
    courses: 6,
    color: "#E91E63",
  },
  {
    slug: "artes",
    name: "Artes",
    icon: Palette,
    description: "Expressão artística, história da arte e criatividade através de pixel art e construções estéticas.",
    levels: ["Fundamental"],
    courses: 3,
    color: "#9C27B0",
  },
  {
    slug: "programacao",
    name: "Programação",
    icon: Code,
    description: "Lógica de programação, algoritmos e pensamento computacional com redstone e command blocks.",
    levels: ["Fundamental", "Médio"],
    courses: 4,
    color: "#00BCD4",
  },
  {
    slug: "ingles",
    name: "Inglês",
    icon: Languages,
    description: "Vocabulário, gramática e conversação em inglês com imersão em ambientes temáticos bilíngues.",
    levels: ["Fundamental", "Médio"],
    courses: 5,
    color: "#FF5722",
  },
  {
    slug: "educacao-fisica",
    name: "Educação Física",
    icon: Dumbbell,
    description: "Minigames esportivos, parkour educativo e atividades que promovem coordenação e estratégia.",
    levels: ["Fundamental"],
    courses: 3,
    color: "#795548",
  },
];

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
    title: "Construções Temáticas",
    description: "Aulas de campo em cenários 3D: visite o Egito Antigo, explore o corpo humano, entre em um átomo.",
  },
];

const LEVELS = ["Todos", "Fundamental", "Médio"] as const;

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

export function AulasContent() {
  const [search, setSearch] = useState("");
  const [level, setLevel] = useState<string>("Todos");

  const filtered = useMemo(() => {
    return DISCIPLINES.filter((d) => {
      const matchSearch =
        d.name.toLowerCase().includes(search.toLowerCase()) ||
        d.description.toLowerCase().includes(search.toLowerCase());
      const matchLevel = level === "Todos" || d.levels.includes(level);
      return matchSearch && matchLevel;
    });
  }, [search, level]);

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

      {/* Catálogo de Disciplinas */}
      <section className="pb-24">
        <div className="mx-auto max-w-7xl px-4 lg:px-6">
          <SectionTitle className="text-center">DISCIPLINAS</SectionTitle>

          {/* Filters */}
          <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
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

            <div className="flex gap-2">
              {LEVELS.map((l) => (
                <button
                  key={l}
                  onClick={() => setLevel(l)}
                  className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                    level === l
                      ? "bg-green-cs text-white"
                      : "bg-white/5 text-[#A0A0A0] hover:bg-white/10 hover:text-white"
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>

          {/* Grid */}
          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
          >
            {filtered.map((discipline) => (
              <motion.div
                key={discipline.slug}
                variants={fadeIn}
                className="group rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur transition-all hover:border-green-cs hover:scale-[1.02] hover:shadow-[0_4px_24px_rgba(0,0,0,0.3)]"
              >
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-xl"
                  style={{ backgroundColor: `${discipline.color}20`, borderColor: `${discipline.color}40`, borderWidth: 1 }}
                >
                  <discipline.icon className="h-6 w-6" style={{ color: discipline.color }} />
                </div>

                <h3 className="mt-4 text-lg font-bold text-white">{discipline.name}</h3>
                <p className="mt-2 text-sm text-[#E0E0E0] line-clamp-3">{discipline.description}</p>

                <div className="mt-4 flex flex-wrap gap-1.5">
                  {discipline.levels.map((l) => (
                    <span
                      key={l}
                      className="rounded-full bg-green-cs/10 px-2.5 py-0.5 text-xs font-medium text-green-cs"
                    >
                      {l}
                    </span>
                  ))}
                </div>

                <p className="mt-3 text-xs text-[#A0A0A0]">
                  {discipline.courses} cursos disponíveis
                </p>
              </motion.div>
            ))}
          </motion.div>

          {filtered.length === 0 && (
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
              Preparação para provas e vestibulares com método gamificado. Simulados interativos, 
              resolução de questões em grupo e revisões temáticas — tudo dentro do servidor.
            </p>
            <div className="mt-8">
              <Button href="/registro">Começar Agora</Button>
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
          </motion.div>
        </div>
      </section>
    </>
  );
}
