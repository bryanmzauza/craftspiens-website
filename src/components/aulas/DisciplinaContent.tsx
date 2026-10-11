"use client";

import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Clock,
  GraduationCap,
  Loader2,
  ArrowLeft,
  CalendarDays,
  Search,
} from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { PageHero } from "@/components/ui/PageHero";
import { Button } from "@/components/ui/Button";
import { LessonCard } from "@/components/aulas/LessonCard";
import { getDisciplineIcon } from "@/lib/discipline-icons";
import { FORMAT_LABELS, formatHours } from "@/lib/aulas";

interface Lesson {
  id: string;
  title: string;
  slug: string;
  description: string;
  order: number;
  duration: number | null;
  youtubeId: string | null;
  format: string | null;
  publishedAt: string | null;
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
  area: string;
  lessons: Lesson[];
  lessonsCount: number;
}

type Sort = "recentes" | "antigas";

const PAGE_SIZE = 24;

/** Busca sem diferenciar maiúsculas e acentos */
function normalize(text: string): string {
  return text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

export function DisciplinaContent({ slug }: { slug: string }) {
  const { data: session } = useSession();
  const [discipline, setDiscipline] = useState<Discipline | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [completedLessons, setCompletedLessons] = useState<Set<string>>(new Set());
  const [query, setQuery] = useState("");
  const [format, setFormat] = useState("todos");
  const [sort, setSort] = useState<Sort>("recentes");
  const [visible, setVisible] = useState(PAGE_SIZE);

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

  const disciplineId = discipline?.id;

  useEffect(() => {
    async function fetchProgress() {
      if (!session?.user || !disciplineId) return;
      try {
        // IDs das aulas concluídas nesta disciplina
        const res = await fetch(
          `/api/aulas/progresso/detalhe?disciplineId=${encodeURIComponent(disciplineId)}`
        );
        if (!res.ok) return;
        const detail = await res.json();
        setCompletedLessons(new Set(detail.completedLessonIds));
      } catch {
        // silently fail
      }
    }
    fetchProgress();
  }, [session, disciplineId]);

  const lessons = useMemo(() => discipline?.lessons ?? [], [discipline]);

  const stats = useMemo(() => {
    const formats = new Map<string, number>();
    const years: number[] = [];
    let minutes = 0;
    for (const lesson of lessons) {
      if (lesson.format) formats.set(lesson.format, (formats.get(lesson.format) ?? 0) + 1);
      if (lesson.publishedAt) years.push(new Date(lesson.publishedAt).getFullYear());
      minutes += lesson.duration ?? 0;
    }
    return {
      formats,
      minutes,
      firstYear: years.length ? Math.min(...years) : null,
      lastYear: years.length ? Math.max(...years) : null,
    };
  }, [lessons]);

  const filtered = useMemo(() => {
    const terms = normalize(query.trim());
    const list = lessons.filter(
      (l) => (format === "todos" || l.format === format) && (!terms || normalize(l.title).includes(terms))
    );
    // A API devolve em ordem cronológica (campo order)
    return sort === "recentes" ? [...list].reverse() : list;
  }, [lessons, query, format, sort]);

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

  const Icon = getDisciplineIcon(discipline.icon);
  const formatOptions = [...stats.formats.keys()];
  const period =
    stats.firstYear && stats.lastYear
      ? stats.firstYear === stats.lastYear
        ? String(stats.firstYear)
        : `${stats.firstYear} a ${stats.lastYear}`
      : null;

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
                <span
                  className="mt-1 inline-block rounded-full px-3 py-0.5 text-xs font-medium"
                  style={{
                    backgroundColor: `${discipline.color}20`,
                    color: discipline.color,
                  }}
                >
                  {discipline.area}
                </span>
              </div>
            </div>

            <p className="text-[#E0E0E0] leading-relaxed">{discipline.description}</p>
            <p className="mt-4 text-sm text-[#A0A0A0]">
              As aulas foram transmitidas ao vivo dentro do servidor e estão gravadas no canal da
              Craftsapiens no YouTube.
            </p>
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
                  <p className="font-bold text-white">
                    {discipline.lessonsCount}
                    {formatOptions.length > 1 && (
                      <span className="ml-2 text-xs font-normal text-[#A0A0A0]">
                        {formatOptions
                          .map((f) => `${stats.formats.get(f)} ${(FORMAT_LABELS[f] ?? f).toLowerCase()}${(stats.formats.get(f) ?? 0) > 1 ? "s" : ""}`)
                          .join(", ")}
                      </span>
                    )}
                  </p>
                </div>
              </div>
              {stats.minutes > 0 && (
                <div className="flex items-center gap-3">
                  <Clock size={18} style={{ color: discipline.color }} />
                  <div>
                    <p className="text-sm text-[#A0A0A0]">Conteúdo gravado</p>
                    <p className="font-bold text-white">{formatHours(stats.minutes)}</p>
                  </div>
                </div>
              )}
              {period && (
                <div className="flex items-center gap-3">
                  <CalendarDays size={18} style={{ color: discipline.color }} />
                  <div>
                    <p className="text-sm text-[#A0A0A0]">Período</p>
                    <p className="font-bold text-white">{period}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Barra de progresso */}
            {session && completedLessons.size > 0 && (
              <div className="mt-4 pt-4 border-t border-white/10">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-[#A0A0A0]">Progresso</span>
                  <span className="font-bold text-green-cs">
                    {completedLessons.size}/{discipline.lessonsCount}
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-white/10">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.round((completedLessons.size / discipline.lessonsCount) * 100)}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="h-full rounded-full bg-green-cs"
                  />
                </div>
              </div>
            )}

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

        {/* Aulas gravadas */}
        <section>
          <h3 className="mb-6 text-lg font-bold text-white">AULAS GRAVADAS</h3>

          {lessons.length === 0 ? (
            <div className="rounded-xl border border-white/10 bg-white/5 p-8 text-center">
              <GraduationCap className="mx-auto h-12 w-12 text-[#A0A0A0]" />
              <p className="mt-3 text-[#A0A0A0]">
                As aulas desta disciplina serão publicadas em breve.
              </p>
            </div>
          ) : (
            <>
              {/* Filtros */}
              <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="relative w-full lg:max-w-sm">
                  <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A0A0A0]" />
                  <input
                    type="search"
                    value={query}
                    onChange={(e) => {
                      setQuery(e.target.value);
                      setVisible(PAGE_SIZE);
                    }}
                    placeholder="Buscar pelo título..."
                    aria-label="Buscar aula pelo título"
                    className="w-full rounded-lg border border-white/20 bg-white/5 py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-white/40 focus:border-green-cs focus:outline-none"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {formatOptions.length > 1 &&
                    ["todos", ...formatOptions].map((f) => (
                      <button
                        key={f}
                        onClick={() => {
                          setFormat(f);
                          setVisible(PAGE_SIZE);
                        }}
                        className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                          format === f
                            ? "bg-green-cs text-white"
                            : "bg-white/5 text-[#A0A0A0] hover:bg-white/10 hover:text-white"
                        }`}
                      >
                        {f === "todos" ? "Todos" : FORMAT_LABELS[f] ?? f}
                      </button>
                    ))}
                  <select
                    value={sort}
                    onChange={(e) => setSort(e.target.value as Sort)}
                    aria-label="Ordenar aulas"
                    className="rounded-lg border border-white/20 bg-bg-card px-3 py-2 text-sm text-white focus:border-green-cs focus:outline-none"
                  >
                    <option value="recentes">Mais recentes</option>
                    <option value="antigas">Mais antigas</option>
                  </select>
                </div>
              </div>

              <p className="mb-4 text-sm text-[#A0A0A0]">
                {filtered.length} {filtered.length === 1 ? "aula" : "aulas"}
                {filtered.length !== lessons.length && ` de ${lessons.length}`}
              </p>

              {filtered.length === 0 ? (
                <p className="py-12 text-center text-[#A0A0A0]">
                  Nenhuma aula encontrada com esses filtros.
                </p>
              ) : (
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {filtered.slice(0, visible).map((lesson) => (
                    <LessonCard
                      key={lesson.id}
                      href={`/aulas/${discipline.slug}/${lesson.slug}`}
                      title={lesson.title}
                      youtubeId={lesson.youtubeId}
                      format={lesson.format}
                      publishedAt={lesson.publishedAt}
                      duration={lesson.duration}
                      completed={completedLessons.has(lesson.id)}
                    />
                  ))}
                </div>
              )}

              {visible < filtered.length && (
                <div className="mt-8 flex justify-center">
                  <Button variant="secondary" onClick={() => setVisible((v) => v + PAGE_SIZE)}>
                    MOSTRAR MAIS ({filtered.length - visible})
                  </Button>
                </div>
              )}
            </>
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
            Quer assistir às próximas aulas ao vivo?
          </h3>
          <p className="mt-2 text-[#A0A0A0]">
            As aulas acontecem dentro do servidor Minecraft, com os professores e a turma em tempo real.
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
