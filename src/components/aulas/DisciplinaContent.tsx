"use client";

import { useState, useEffect } from "react";
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
  Clock,
  GraduationCap,
  ChevronRight,
  Loader2,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { PageHero } from "@/components/ui/PageHero";
import { Button } from "@/components/ui/Button";

const ICON_MAP: Record<string, typeof Calculator> = {
  Calculator,
  Microscope,
  Globe,
  BookOpen,
  Palette,
  Code,
  Languages,
  Dumbbell,
};

interface Lesson {
  id: string;
  title: string;
  slug: string;
  description: string;
  order: number;
  duration: number | null;
}

interface Discipline {
  id: string;
  name: string;
  slug: string;
  description: string;
  shortDescription: string;
  icon: string;
  color: string;
  banner: string | null;
  levels: string[];
  lessons: Lesson[];
  lessonsCount: number;
}

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
};

export function DisciplinaContent({ slug }: { slug: string }) {
  const { data: session } = useSession();
  const [discipline, setDiscipline] = useState<Discipline | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchDiscipline() {
      try {
        const res = await fetch(`/api/aulas/${slug}`);
        if (!res.ok) {
          if (res.status === 404) {
            setError("Disciplina não encontrada");
          } else {
            setError("Erro ao carregar disciplina");
          }
          return;
        }
        const data = await res.json();
        setDiscipline(data.discipline);
      } catch {
        setError("Erro ao carregar disciplina");
      } finally {
        setLoading(false);
      }
    }
    fetchDiscipline();
  }, [slug]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-green-cs" />
      </div>
    );
  }

  if (error || !discipline) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <GraduationCap className="h-16 w-16 text-[#A0A0A0]" />
        <p className="text-lg text-[#A0A0A0]">{error || "Disciplina não encontrada"}</p>
        <Link
          href="/aulas"
          className="flex items-center gap-2 text-green-cs hover:underline"
        >
          <ArrowLeft size={16} />
          Voltar para Aulas
        </Link>
      </div>
    );
  }

  const Icon = ICON_MAP[discipline.icon] || GraduationCap;
  const totalDuration = discipline.lessons.reduce(
    (acc, l) => acc + (l.duration || 0),
    0
  );

  return (
    <>
      <PageHero
        title={discipline.name.toUpperCase()}
        subtitle={discipline.shortDescription}
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Aulas", href: "/aulas" },
          { label: discipline.name },
        ]}
      />

      <div className="mx-auto max-w-7xl px-4 pb-24 lg:px-6">
        {/* Info Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12 grid gap-8 lg:grid-cols-3"
        >
          <div className="lg:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <div
                className="flex h-12 w-12 items-center justify-center rounded-xl"
                style={{ backgroundColor: `${discipline.color}20` }}
              >
                <Icon size={24} style={{ color: discipline.color }} />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">{discipline.name}</h2>
                <div className="flex gap-2 mt-1">
                  {discipline.levels.map((level) => (
                    <span
                      key={level}
                      className="rounded-full px-3 py-0.5 text-xs font-medium"
                      style={{
                        backgroundColor: `${discipline.color}20`,
                        color: discipline.color,
                      }}
                    >
                      {level}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <p className="text-[#E0E0E0] leading-relaxed">{discipline.description}</p>
          </div>

          {/* Stats sidebar */}
          <div className="rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur">
            <h3 className="text-sm font-bold uppercase text-[#A0A0A0] mb-4">
              Informações
            </h3>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <GraduationCap size={18} style={{ color: discipline.color }} />
                <div>
                  <p className="text-sm text-[#A0A0A0]">Aulas disponíveis</p>
                  <p className="font-bold text-white">{discipline.lessonsCount}</p>
                </div>
              </div>
              {totalDuration > 0 && (
                <div className="flex items-center gap-3">
                  <Clock size={18} style={{ color: discipline.color }} />
                  <div>
                    <p className="text-sm text-[#A0A0A0]">Duração total</p>
                    <p className="font-bold text-white">
                      {Math.floor(totalDuration / 60) > 0 &&
                        `${Math.floor(totalDuration / 60)}h `}
                      {totalDuration % 60}min
                    </p>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-3">
                <Icon size={18} style={{ color: discipline.color }} />
                <div>
                  <p className="text-sm text-[#A0A0A0]">Níveis</p>
                  <p className="font-bold text-white">
                    {discipline.levels.join(", ")}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6">
              {session ? (
                <Button href="/cronograma" fullWidth>
                  VER CRONOGRAMA
                </Button>
              ) : (
                <Button href="/registro" fullWidth>
                  CRIAR CONTA GRÁTIS
                </Button>
              )}
            </div>
          </div>
        </motion.div>

        {/* Conteúdo Programático */}
        <section>
          <h3 className="mb-6 text-lg font-bold text-white">
            CONTEÚDO PROGRAMÁTICO
          </h3>

          {discipline.lessons.length === 0 ? (
            <div className="rounded-xl border border-white/10 bg-white/5 p-8 text-center">
              <GraduationCap className="mx-auto h-12 w-12 text-[#A0A0A0]" />
              <p className="mt-3 text-[#A0A0A0]">
                O conteúdo programático será publicado em breve.
              </p>
            </div>
          ) : (
            <motion.div
              variants={stagger}
              initial="hidden"
              animate="visible"
              className="space-y-3"
            >
              {discipline.lessons.map((lesson, index) => (
                <motion.div
                  key={lesson.id}
                  variants={fadeIn}
                  className="group flex items-center gap-4 rounded-xl border border-white/10 bg-white/5 p-4 transition-all hover:border-white/20 hover:bg-white/[0.08]"
                >
                  <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-sm font-bold"
                    style={{
                      backgroundColor: `${discipline.color}20`,
                      color: discipline.color,
                    }}
                  >
                    {String(index + 1).padStart(2, "0")}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-white">{lesson.title}</h4>
                    <p className="mt-0.5 text-sm text-[#A0A0A0] line-clamp-1">
                      {lesson.description}
                    </p>
                  </div>

                  {lesson.duration && (
                    <div className="hidden items-center gap-1 text-xs text-[#A0A0A0] sm:flex">
                      <Clock size={14} />
                      {lesson.duration}min
                    </div>
                  )}

                  <ChevronRight
                    size={18}
                    className="shrink-0 text-[#A0A0A0] transition-transform group-hover:translate-x-1"
                    style={{ color: discipline.color }}
                  />
                </motion.div>
              ))}
            </motion.div>
          )}
        </section>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-16 rounded-2xl border border-white/10 bg-gradient-to-r from-green-cs/10 to-transparent p-8 text-center"
        >
          <h3 className="text-xl font-bold text-white">
            Pronto para aprender {discipline.name}?
          </h3>
          <p className="mt-2 text-[#A0A0A0]">
            As aulas acontecem ao vivo dentro do servidor Minecraft com professores especializados.
          </p>
          <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            {session ? (
              <Button href="/cronograma">VER CRONOGRAMA DE AULAS</Button>
            ) : (
              <Button href="/registro">CRIAR CONTA GRÁTIS</Button>
            )}
            <Button href="/aulas" variant="secondary">
              VER OUTRAS DISCIPLINAS
            </Button>
          </div>
        </motion.div>
      </div>
    </>
  );
}
