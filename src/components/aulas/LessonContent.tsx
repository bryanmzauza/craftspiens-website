"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Clock,
  CheckCircle,
  Circle,
  Play,
  BookOpen,
  Target,
  Loader2,
  GraduationCap,
  Calculator,
  Microscope,
  Globe,
  Palette,
  Code,
  Languages,
  Dumbbell,
} from "lucide-react";
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

interface LessonData {
  id: string;
  title: string;
  slug: string;
  description: string;
  content: string | null;
  videoUrl: string | null;
  objectives: string[];
  order: number;
  duration: number | null;
}

interface DisciplineData {
  id: string;
  name: string;
  slug: string;
  color: string;
  icon: string;
}

interface NavigationData {
  prev: { title: string; slug: string } | null;
  next: { title: string; slug: string } | null;
}

export function LessonContent({
  disciplineSlug,
  lessonSlug,
}: {
  disciplineSlug: string;
  lessonSlug: string;
}) {
  const { data: session } = useSession();
  const [lesson, setLesson] = useState<LessonData | null>(null);
  const [discipline, setDiscipline] = useState<DisciplineData | null>(null);
  const [navigation, setNavigation] = useState<NavigationData>({ prev: null, next: null });
  const [totalLessons, setTotalLessons] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchLesson() {
      try {
        const res = await fetch(`/api/aulas/${disciplineSlug}/${lessonSlug}`);
        if (!res.ok) {
          setError(res.status === 404 ? "Aula não encontrada" : "Erro ao carregar aula");
          return;
        }
        const data = await res.json();
        setLesson(data.lesson);
        setDiscipline(data.discipline);
        setNavigation(data.navigation);
        setTotalLessons(data.totalLessons);
        setCompleted(data.completed);
      } catch {
        setError("Erro ao carregar aula");
      } finally {
        setLoading(false);
      }
    }
    fetchLesson();
  }, [disciplineSlug, lessonSlug]);

  const toggleCompletion = useCallback(async () => {
    if (!lesson || toggling) return;
    setToggling(true);
    try {
      const res = await fetch("/api/aulas/progresso", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lessonId: lesson.id }),
      });
      if (res.ok) {
        const data = await res.json();
        setCompleted(data.completed);
      }
    } catch {
      // silently fail
    } finally {
      setToggling(false);
    }
  }, [lesson, toggling]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-green-cs" />
      </div>
    );
  }

  if (error || !lesson || !discipline) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <GraduationCap className="h-16 w-16 text-[#A0A0A0]" />
        <p className="text-lg text-[#A0A0A0]">{error || "Aula não encontrada"}</p>
        <Link
          href={`/aulas/${disciplineSlug}`}
          className="flex items-center gap-2 text-green-cs hover:underline"
        >
          <ArrowLeft size={16} />
          Voltar para a disciplina
        </Link>
      </div>
    );
  }

  const Icon = ICON_MAP[discipline.icon] || GraduationCap;

  return (
    <>
      <PageHero
        title={lesson.title.toUpperCase()}
        subtitle={`${discipline.name} · Aula ${String(lesson.order).padStart(2, "0")} de ${totalLessons}`}
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Aulas", href: "/aulas" },
          { label: discipline.name, href: `/aulas/${discipline.slug}` },
          { label: lesson.title },
        ]}
      />

      <div className="mx-auto max-w-7xl px-4 pb-24 lg:px-6">
        <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
          {/* Conteúdo principal */}
          <div className="space-y-8">
            {/* Vídeo */}
            {lesson.videoUrl && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="overflow-hidden rounded-2xl border border-white/10"
              >
                <div className="relative aspect-video bg-black">
                  <iframe
                    src={lesson.videoUrl}
                    title={lesson.title}
                    className="absolute inset-0 h-full w-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              </motion.div>
            )}

            {/* Placeholder quando não há vídeo */}
            {!lesson.videoUrl && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex aspect-video items-center justify-center rounded-2xl border border-white/10 bg-white/5"
              >
                <div className="text-center">
                  <Play size={48} className="mx-auto text-[#A0A0A0]" />
                  <p className="mt-3 text-[#A0A0A0]">
                    Esta aula acontece ao vivo no servidor Minecraft.
                  </p>
                  <p className="mt-1 text-sm text-[#A0A0A0]">
                    Confira o cronograma para saber o próximo horário.
                  </p>
                </div>
              </motion.div>
            )}

            {/* Descrição */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur"
            >
              <h2 className="mb-4 text-lg font-bold text-white">Sobre esta aula</h2>
              <p className="leading-relaxed text-[#E0E0E0]">{lesson.description}</p>
            </motion.div>

            {/* Conteúdo detalhado */}
            {lesson.content && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur"
              >
                <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-white">
                  <BookOpen size={20} style={{ color: discipline.color }} />
                  Material da Aula
                </h2>
                <div
                  className="prose prose-invert max-w-none text-[#E0E0E0] prose-headings:text-white prose-strong:text-white prose-a:text-green-cs"
                  dangerouslySetInnerHTML={{ __html: lesson.content }}
                />
              </motion.div>
            )}

            {/* Objetivos */}
            {lesson.objectives.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur"
              >
                <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-white">
                  <Target size={20} style={{ color: discipline.color }} />
                  Objetivos de Aprendizagem
                </h2>
                <ul className="space-y-3">
                  {lesson.objectives.map((obj, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <CheckCircle
                        size={18}
                        className="mt-0.5 shrink-0"
                        style={{ color: discipline.color }}
                      />
                      <span className="text-[#E0E0E0]">{obj}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            )}

            {/* Navegação entre aulas */}
            <div className="flex items-center justify-between gap-4">
              {navigation.prev ? (
                <Link
                  href={`/aulas/${discipline.slug}/${navigation.prev.slug}`}
                  className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white transition-all hover:border-white/20 hover:bg-white/10"
                >
                  <ArrowLeft size={16} />
                  <div className="text-left">
                    <p className="text-[10px] text-[#A0A0A0]">Anterior</p>
                    <p className="line-clamp-1 font-medium">{navigation.prev.title}</p>
                  </div>
                </Link>
              ) : (
                <div />
              )}

              {navigation.next ? (
                <Link
                  href={`/aulas/${discipline.slug}/${navigation.next.slug}`}
                  className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white transition-all hover:border-white/20 hover:bg-white/10"
                >
                  <div className="text-right">
                    <p className="text-[10px] text-[#A0A0A0]">Próxima</p>
                    <p className="line-clamp-1 font-medium">{navigation.next.title}</p>
                  </div>
                  <ArrowRight size={16} />
                </Link>
              ) : (
                <div />
              )}
            </div>
          </div>

          {/* Sidebar */}
          <aside className="space-y-6">
            {/* Info da disciplina */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="rounded-xl border border-white/10 bg-white/5 p-5 backdrop-blur"
            >
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-lg"
                  style={{ backgroundColor: `${discipline.color}20` }}
                >
                  <Icon size={20} style={{ color: discipline.color }} />
                </div>
                <div>
                  <h3 className="font-bold text-white">{discipline.name}</h3>
                  <p className="text-xs text-[#A0A0A0]">
                    Aula {lesson.order} de {totalLessons}
                  </p>
                </div>
              </div>

              {lesson.duration && (
                <div className="flex items-center gap-2 text-sm text-[#A0A0A0]">
                  <Clock size={16} style={{ color: discipline.color }} />
                  <span>Duração: {lesson.duration}min</span>
                </div>
              )}

              <div className="mt-4">
                <Button href={`/aulas/${discipline.slug}`} variant="secondary" fullWidth>
                  VER DISCIPLINA
                </Button>
              </div>
            </motion.div>

            {/* Marcar como concluída */}
            {session && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="rounded-xl border border-white/10 bg-white/5 p-5 backdrop-blur"
              >
                <h3 className="mb-3 text-sm font-bold uppercase text-[#A0A0A0]">
                  Seu progresso
                </h3>
                <button
                  onClick={toggleCompletion}
                  disabled={toggling}
                  className={`flex w-full items-center gap-3 rounded-lg border px-4 py-3 text-left text-sm font-medium transition-all ${
                    completed
                      ? "border-green-cs/50 bg-green-cs/10 text-green-cs"
                      : "border-white/20 bg-white/5 text-white hover:border-white/30"
                  }`}
                >
                  {toggling ? (
                    <Loader2 size={20} className="animate-spin" />
                  ) : completed ? (
                    <CheckCircle size={20} />
                  ) : (
                    <Circle size={20} />
                  )}
                  {completed ? "Aula concluída ✓" : "Marcar como concluída"}
                </button>
              </motion.div>
            )}

            {/* CTA para não logados */}
            {!session && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="rounded-xl border border-green-cs/20 bg-green-cs/5 p-5"
              >
                <p className="mb-3 text-sm text-[#E0E0E0]">
                  Crie uma conta para acompanhar seu progresso nas aulas.
                </p>
                <Button href="/registro" fullWidth>
                  CRIAR CONTA GRÁTIS
                </Button>
              </motion.div>
            )}

            {/* Link para cronograma */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="rounded-xl border border-white/10 bg-white/5 p-5 backdrop-blur"
            >
              <h3 className="mb-2 text-sm font-bold text-white">Aulas ao vivo</h3>
              <p className="mb-3 text-xs text-[#A0A0A0]">
                Confira o cronograma para participar das aulas dentro do servidor Minecraft.
              </p>
              <Button href="/cronograma" variant="secondary" fullWidth>
                VER CRONOGRAMA
              </Button>
            </motion.div>
          </aside>
        </div>
      </div>
    </>
  );
}
