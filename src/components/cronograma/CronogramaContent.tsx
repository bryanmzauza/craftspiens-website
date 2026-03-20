"use client";

import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  CalendarDays,
  Download,
  Clock,
  User,
  MapPin,
  X,
  Radio,
  BookOpen,
} from "lucide-react";
import { PageHero } from "@/components/ui/PageHero";
import { SERVER_IP } from "@/lib/constants";

type DayOfWeek = "seg" | "ter" | "qua" | "qui" | "sex" | "sab" | "dom";

interface ScheduleEntry {
  id: number;
  disciplina: string;
  professor: string;
  professorFoto: string;
  diaSemana: DayOfWeek;
  horaInicio: string;
  horaFim: string;
  nivel: string;
  cor: string;
  descricao: string;
}

const DAYS_MAP: Record<DayOfWeek, { short: string; full: string; index: number }> = {
  seg: { short: "SEG", full: "Segunda-feira", index: 0 },
  ter: { short: "TER", full: "Terça-feira", index: 1 },
  qua: { short: "QUA", full: "Quarta-feira", index: 2 },
  qui: { short: "QUI", full: "Quinta-feira", index: 3 },
  sex: { short: "SEX", full: "Sexta-feira", index: 4 },
  sab: { short: "SAB", full: "Sábado", index: 5 },
  dom: { short: "DOM", full: "Domingo", index: 6 },
};

const SCHEDULE: ScheduleEntry[] = [
  {
    id: 1,
    disciplina: "Matemática",
    professor: "Prof. Camilli",
    professorFoto: "/team/camilli.png",
    diaSemana: "seg",
    horaInicio: "14:00",
    horaFim: "15:30",
    nivel: "Fundamental",
    cor: "#2196F3",
    descricao: "Álgebra e geometria aplicadas em construções Minecraft. Resolução de problemas com blocos e redstone.",
  },
  {
    id: 2,
    disciplina: "Física",
    professor: "Prof. Wilton",
    professorFoto: "/team/wilton.png",
    diaSemana: "seg",
    horaInicio: "16:00",
    horaFim: "17:30",
    nivel: "Médio",
    cor: "#00BCD4",
    descricao: "Mecânica e elétrica com experimentos usando redstone, pistões e minecarts.",
  },
  {
    id: 3,
    disciplina: "Geografia",
    professor: "Prof. Arthur",
    professorFoto: "/team/arthur.png",
    diaSemana: "ter",
    horaInicio: "15:00",
    horaFim: "16:30",
    nivel: "Fundamental",
    cor: "#FF9800",
    descricao: "Biomas, relevo e geopolítica explorados através dos mundos do servidor.",
  },
  {
    id: 4,
    disciplina: "Português",
    professor: "Prof. Thawana",
    professorFoto: "/team/thawana.png",
    diaSemana: "qua",
    horaInicio: "14:00",
    horaFim: "15:30",
    nivel: "Fundamental",
    cor: "#E91E63",
    descricao: "Interpretação de texto, gramática e redação com missões narrativas e desafios literários.",
  },
  {
    id: 5,
    disciplina: "Química",
    professor: "Prof. Camilli",
    professorFoto: "/team/camilli.png",
    diaSemana: "qua",
    horaInicio: "16:00",
    horaFim: "17:30",
    nivel: "Médio",
    cor: "#9C27B0",
    descricao: "Elementos, reações e tabela periódica com experimentos de poções e brewing no Minecraft.",
  },
  {
    id: 6,
    disciplina: "ENEM Preparatório",
    professor: "Prof. Helton",
    professorFoto: "/team/helton.png",
    diaSemana: "qui",
    horaInicio: "15:00",
    horaFim: "17:00",
    nivel: "ENEM",
    cor: "#FFD700",
    descricao: "Revisão interdisciplinar focada no ENEM com simulados gamificados e resolução de questões.",
  },
  {
    id: 7,
    disciplina: "História",
    professor: "Prof. Arthur",
    professorFoto: "/team/arthur.png",
    diaSemana: "sex",
    horaInicio: "14:00",
    horaFim: "15:30",
    nivel: "Fundamental",
    cor: "#FF5722",
    descricao: "Civilizações antigas, Brasil Colonial e História Moderna visitando construções históricas em escala.",
  },
  {
    id: 8,
    disciplina: "Ciências",
    professor: "Prof. Wilton",
    professorFoto: "/team/wilton.png",
    diaSemana: "sab",
    horaInicio: "10:00",
    horaFim: "11:30",
    nivel: "Fundamental",
    cor: "#4CAF50",
    descricao: "Biologia e ecologia com exploração de biomas, fauna e flora do Minecraft.",
  },
  {
    id: 9,
    disciplina: "Programação",
    professor: "Prof. Helton",
    professorFoto: "/team/helton.png",
    diaSemana: "sab",
    horaInicio: "14:00",
    horaFim: "15:30",
    nivel: "Médio",
    cor: "#00BCD4",
    descricao: "Lógica de programação e algoritmos com command blocks, redstone e datapacks.",
  },
  {
    id: 10,
    disciplina: "Artes",
    professor: "Prof. Thawana",
    professorFoto: "/team/thawana.png",
    diaSemana: "ter",
    horaInicio: "10:00",
    horaFim: "11:30",
    nivel: "Fundamental",
    cor: "#9C27B0",
    descricao: "Pixel art, história da arte e criatividade com construções estéticas no servidor.",
  },
];

const LEVELS = ["Todos", "Fundamental", "Médio", "ENEM"];
const TURNOS = ["Todos", "Manhã", "Tarde", "Noite"];
const DISCIPLINES_LIST = ["Todas", ...Array.from(new Set(SCHEDULE.map((s) => s.disciplina)))];
const PROFESSORS_LIST = ["Todos", ...Array.from(new Set(SCHEDULE.map((s) => s.professor)))];

function getWeekDates(offset: number): { start: Date; end: Date } {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(now);
  monday.setDate(now.getDate() + mondayOffset + offset * 7);
  monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return { start: monday, end: sunday };
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

function getTurno(hora: string): string {
  const h = parseInt(hora.split(":")[0]);
  if (h < 12) return "Manhã";
  if (h < 18) return "Tarde";
  return "Noite";
}

function isCurrentlyLive(entry: ScheduleEntry): boolean {
  const now = new Date();
  const dayIndex = (now.getDay() + 6) % 7;
  const dayKey = Object.keys(DAYS_MAP)[dayIndex] as DayOfWeek;
  if (entry.diaSemana !== dayKey) return false;

  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const [startH, startM] = entry.horaInicio.split(":").map(Number);
  const [endH, endM] = entry.horaFim.split(":").map(Number);
  return nowMinutes >= startH * 60 + startM && nowMinutes <= endH * 60 + endM;
}

function getNextClasses(schedule: ScheduleEntry[]): (ScheduleEntry & { when: string })[] {
  const now = new Date();
  const currentDayIndex = (now.getDay() + 6) % 7;
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const days = Object.keys(DAYS_MAP) as DayOfWeek[];

  const upcoming: (ScheduleEntry & { minutesUntil: number; when: string })[] = [];

  for (const entry of schedule) {
    const entryDayIndex = DAYS_MAP[entry.diaSemana].index;
    let daysUntil = entryDayIndex - currentDayIndex;
    if (daysUntil < 0) daysUntil += 7;

    const [startH, startM] = entry.horaInicio.split(":").map(Number);
    const entryMinutes = startH * 60 + startM;

    if (daysUntil === 0 && entryMinutes <= nowMinutes) {
      daysUntil = 7;
    }

    const minutesUntil = daysUntil * 24 * 60 + (entryMinutes - nowMinutes);

    let when: string;
    if (daysUntil === 0) {
      const hours = Math.floor((entryMinutes - nowMinutes) / 60);
      const mins = (entryMinutes - nowMinutes) % 60;
      when = hours > 0 ? `em ${hours}h ${mins}min` : `em ${mins}min`;
    } else if (daysUntil === 1) {
      when = `Amanhã ${entry.horaInicio}`;
    } else {
      when = `${DAYS_MAP[entry.diaSemana].full} ${entry.horaInicio}`;
    }

    upcoming.push({ ...entry, minutesUntil, when });
  }

  return upcoming
    .sort((a, b) => a.minutesUntil - b.minutesUntil)
    .slice(0, 5);
}

export function CronogramaContent() {
  const [view, setView] = useState<"semanal" | "mensal">("semanal");
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedEntry, setSelectedEntry] = useState<ScheduleEntry | null>(null);
  const [filterDisciplina, setFilterDisciplina] = useState("Todas");
  const [filterNivel, setFilterNivel] = useState("Todos");
  const [filterProfessor, setFilterProfessor] = useState("Todos");
  const [filterTurno, setFilterTurno] = useState("Todos");
  const [monthOffset, setMonthOffset] = useState(0);
  const [selectedMonthDay, setSelectedMonthDay] = useState<number | null>(null);

  const weekDates = useMemo(() => getWeekDates(weekOffset), [weekOffset]);

  const filteredSchedule = useMemo(() => {
    return SCHEDULE.filter((entry) => {
      if (filterDisciplina !== "Todas" && entry.disciplina !== filterDisciplina) return false;
      if (filterNivel !== "Todos" && entry.nivel !== filterNivel) return false;
      if (filterProfessor !== "Todos" && entry.professor !== filterProfessor) return false;
      if (filterTurno !== "Todos" && getTurno(entry.horaInicio) !== filterTurno) return false;
      return true;
    });
  }, [filterDisciplina, filterNivel, filterProfessor, filterTurno]);

  const nextClasses = useMemo(() => getNextClasses(filteredSchedule), [filteredSchedule]);

  const clearFilters = useCallback(() => {
    setFilterDisciplina("Todas");
    setFilterNivel("Todos");
    setFilterProfessor("Todos");
    setFilterTurno("Todos");
  }, []);

  const hasFilters = filterDisciplina !== "Todas" || filterNivel !== "Todos" || filterProfessor !== "Todos" || filterTurno !== "Todos";

  const currentMonth = useMemo(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + monthOffset);
    return d;
  }, [monthOffset]);

  const monthDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startPad = (firstDay.getDay() + 6) % 7;
    const days: (number | null)[] = Array(startPad).fill(null);
    for (let i = 1; i <= lastDay.getDate(); i++) days.push(i);
    while (days.length % 7 !== 0) days.push(null);
    return days;
  }, [currentMonth]);

  const getDayClasses = useCallback(
    (day: number): ScheduleEntry[] => {
      const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
      const dayIndex = (date.getDay() + 6) % 7;
      const dayKey = Object.keys(DAYS_MAP)[dayIndex] as DayOfWeek;
      return filteredSchedule.filter((e) => e.diaSemana === dayKey);
    },
    [currentMonth, filteredSchedule]
  );

  const days = Object.entries(DAYS_MAP) as [DayOfWeek, typeof DAYS_MAP[DayOfWeek]][];

  return (
    <>
      <PageHero
        title="CRONOGRAMA"
        subtitle="Confira os horários das aulas e organize seus estudos."
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Cronograma" }]}
      />

      <div className="mx-auto max-w-7xl px-4 pb-16 lg:px-6">
        {/* Filtros */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 rounded-xl border border-white/10 bg-bg-card/50 p-4"
        >
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={filterDisciplina}
              onChange={(e) => setFilterDisciplina(e.target.value)}
              className="rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-sm text-white focus:border-green-cs focus:outline-none"
            >
              {DISCIPLINES_LIST.map((d) => (
                <option key={d} value={d} className="bg-bg-primary">{d}</option>
              ))}
            </select>

            <select
              value={filterNivel}
              onChange={(e) => setFilterNivel(e.target.value)}
              className="rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-sm text-white focus:border-green-cs focus:outline-none"
            >
              {LEVELS.map((l) => (
                <option key={l} value={l} className="bg-bg-primary">{l}</option>
              ))}
            </select>

            <select
              value={filterProfessor}
              onChange={(e) => setFilterProfessor(e.target.value)}
              className="rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-sm text-white focus:border-green-cs focus:outline-none"
            >
              {PROFESSORS_LIST.map((p) => (
                <option key={p} value={p} className="bg-bg-primary">{p}</option>
              ))}
            </select>

            <select
              value={filterTurno}
              onChange={(e) => setFilterTurno(e.target.value)}
              className="rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-sm text-white focus:border-green-cs focus:outline-none"
            >
              {TURNOS.map((t) => (
                <option key={t} value={t} className="bg-bg-primary">{t}</option>
              ))}
            </select>

            {hasFilters && (
              <button
                onClick={clearFilters}
                className="text-sm text-[#A0A0A0] underline transition-colors hover:text-white"
              >
                Limpar filtros
              </button>
            )}
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setView("semanal")}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  view === "semanal" ? "bg-green-cs/20 text-green-cs" : "text-[#A0A0A0] hover:text-white"
                }`}
              >
                <Calendar size={16} /> Semanal
              </button>
              <button
                onClick={() => setView("mensal")}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  view === "mensal" ? "bg-green-cs/20 text-green-cs" : "text-[#A0A0A0] hover:text-white"
                }`}
              >
                <CalendarDays size={16} /> Mensal
              </button>
            </div>

            <button className="flex items-center gap-1.5 rounded-lg border border-white/20 px-3 py-2 text-sm text-[#A0A0A0] transition-colors hover:border-green-cs hover:text-green-cs">
              <Download size={16} /> Exportar Calendário
            </button>
          </div>
        </motion.div>

        <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
          {/* Área principal */}
          <div>
            {view === "semanal" ? (
              <>
                {/* Navegação semanal */}
                <div className="mb-6 flex items-center justify-between">
                  <button
                    onClick={() => setWeekOffset((o) => o - 1)}
                    className="flex items-center gap-1 text-sm text-[#A0A0A0] transition-colors hover:text-white"
                  >
                    <ChevronLeft size={18} /> Semana anterior
                  </button>
                  <span className="font-medium text-white">
                    {formatDate(weekDates.start)} — {formatDate(weekDates.end)}
                  </span>
                  <button
                    onClick={() => setWeekOffset((o) => o + 1)}
                    className="flex items-center gap-1 text-sm text-[#A0A0A0] transition-colors hover:text-white"
                  >
                    Próxima semana <ChevronRight size={18} />
                  </button>
                </div>

                {/* Grade semanal - Desktop */}
                <div className="hidden overflow-x-auto md:block">
                  <div className="grid min-w-[700px] grid-cols-7 gap-2">
                    {days.map(([key, day]) => {
                      const now = new Date();
                      const isToday = (now.getDay() + 6) % 7 === day.index && weekOffset === 0;
                      const dayEntries = filteredSchedule
                        .filter((e) => e.diaSemana === key)
                        .sort((a, b) => a.horaInicio.localeCompare(b.horaInicio));

                      return (
                        <div key={key} className="min-h-[200px]">
                          <div
                            className={`mb-2 rounded-lg py-2 text-center text-xs font-bold uppercase ${
                              isToday
                                ? "bg-green-cs/20 text-green-cs"
                                : "bg-white/5 text-[#A0A0A0]"
                            }`}
                          >
                            {day.short}
                          </div>
                          <div className="space-y-2">
                            {dayEntries.map((entry) => {
                              const live = isCurrentlyLive(entry);
                              return (
                                <motion.button
                                  key={entry.id}
                                  whileHover={{ scale: 1.02 }}
                                  onClick={() => setSelectedEntry(entry)}
                                  className="w-full rounded-lg border p-2 text-left transition-all"
                                  style={{
                                    borderColor: `${entry.cor}40`,
                                    backgroundColor: `${entry.cor}10`,
                                  }}
                                >
                                  {live && (
                                    <span className="mb-1 flex items-center gap-1 text-[10px] font-bold text-green-cs">
                                      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-green-cs" />
                                      AO VIVO
                                    </span>
                                  )}
                                  <p className="text-[10px] text-[#A0A0A0]">
                                    {entry.horaInicio} — {entry.horaFim}
                                  </p>
                                  <p
                                    className="text-xs font-bold"
                                    style={{ color: entry.cor }}
                                  >
                                    {entry.disciplina}
                                  </p>
                                  <p className="text-[10px] text-[#A0A0A0]">
                                    {entry.professor}
                                  </p>
                                </motion.button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Grade semanal - Mobile (lista por dia) */}
                <div className="space-y-4 md:hidden">
                  {days.map(([key, day]) => {
                    const now = new Date();
                    const isToday = (now.getDay() + 6) % 7 === day.index && weekOffset === 0;
                    const dayEntries = filteredSchedule
                      .filter((e) => e.diaSemana === key)
                      .sort((a, b) => a.horaInicio.localeCompare(b.horaInicio));

                    if (dayEntries.length === 0) return null;

                    return (
                      <div key={key}>
                        <h3
                          className={`mb-2 text-sm font-bold ${
                            isToday ? "text-green-cs" : "text-white"
                          }`}
                        >
                          {day.full} {isToday && "(Hoje)"}
                        </h3>
                        <div className="space-y-2">
                          {dayEntries.map((entry) => (
                            <button
                              key={entry.id}
                              onClick={() => setSelectedEntry(entry)}
                              className="flex w-full items-center gap-3 rounded-lg border border-white/10 bg-bg-card/50 p-3 text-left transition-all hover:border-white/20"
                            >
                              <div
                                className="h-10 w-1 shrink-0 rounded-full"
                                style={{ backgroundColor: entry.cor }}
                              />
                              <div className="min-w-0 flex-1">
                                <p className="text-xs text-[#A0A0A0]">
                                  {entry.horaInicio} — {entry.horaFim}
                                </p>
                                <p className="font-medium text-white">{entry.disciplina}</p>
                                <p className="text-xs text-[#A0A0A0]">{entry.professor}</p>
                              </div>
                              <span
                                className="shrink-0 rounded px-2 py-0.5 text-[10px] font-bold"
                                style={{
                                  backgroundColor: `${entry.cor}20`,
                                  color: entry.cor,
                                }}
                              >
                                {entry.nivel}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              /* Visão Mensal */
              <div>
                <div className="mb-6 flex items-center justify-between">
                  <button
                    onClick={() => setMonthOffset((o) => o - 1)}
                    className="flex items-center gap-1 text-sm text-[#A0A0A0] transition-colors hover:text-white"
                  >
                    <ChevronLeft size={18} /> Anterior
                  </button>
                  <span className="font-medium capitalize text-white">
                    {currentMonth.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}
                  </span>
                  <button
                    onClick={() => setMonthOffset((o) => o + 1)}
                    className="flex items-center gap-1 text-sm text-[#A0A0A0] transition-colors hover:text-white"
                  >
                    Próximo <ChevronRight size={18} />
                  </button>
                </div>

                <div className="grid grid-cols-7 gap-1">
                  {["SEG", "TER", "QUA", "QUI", "SEX", "SAB", "DOM"].map((d) => (
                    <div key={d} className="py-2 text-center text-xs font-bold text-[#A0A0A0]">
                      {d}
                    </div>
                  ))}

                  {monthDays.map((day, i) => {
                    if (day === null) return <div key={`pad-${i}`} />;
                    const classes = getDayClasses(day);
                    const isToday =
                      monthOffset === 0 && day === new Date().getDate();
                    const isSelected = selectedMonthDay === day;

                    return (
                      <button
                        key={day}
                        onClick={() => setSelectedMonthDay(isSelected ? null : day)}
                        className={`min-h-[60px] rounded-lg border p-1.5 text-left transition-all sm:min-h-[80px] ${
                          isToday
                            ? "border-green-cs/50 bg-green-cs/10"
                            : isSelected
                              ? "border-white/30 bg-white/10"
                              : "border-white/5 bg-bg-card/30 hover:border-white/15"
                        }`}
                      >
                        <span className={`text-xs ${isToday ? "font-bold text-green-cs" : "text-[#A0A0A0]"}`}>
                          {day}
                        </span>
                        <div className="mt-1 flex flex-wrap gap-0.5">
                          {classes.slice(0, 3).map((c) => (
                            <span
                              key={c.id}
                              className="h-1.5 w-1.5 rounded-full"
                              style={{ backgroundColor: c.cor }}
                              title={c.disciplina}
                            />
                          ))}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Detalhe do dia selecionado */}
                <AnimatePresence>
                  {selectedMonthDay !== null && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-4 overflow-hidden rounded-xl border border-white/10 bg-bg-card/50"
                    >
                      <div className="p-4">
                        <h3 className="mb-3 font-bold text-white">
                          Aulas de {selectedMonthDay}/{currentMonth.getMonth() + 1}
                        </h3>
                        {getDayClasses(selectedMonthDay).length === 0 ? (
                          <p className="text-sm text-[#A0A0A0]">Nenhuma aula neste dia.</p>
                        ) : (
                          <div className="space-y-2">
                            {getDayClasses(selectedMonthDay).map((entry) => (
                              <button
                                key={entry.id}
                                onClick={() => setSelectedEntry(entry)}
                                className="flex w-full items-center gap-3 rounded-lg border border-white/10 p-3 text-left transition-all hover:border-white/20"
                              >
                                <div
                                  className="h-8 w-1 shrink-0 rounded-full"
                                  style={{ backgroundColor: entry.cor }}
                                />
                                <div>
                                  <p className="text-sm font-medium text-white">{entry.disciplina}</p>
                                  <p className="text-xs text-[#A0A0A0]">
                                    {entry.horaInicio} — {entry.horaFim} · {entry.professor}
                                  </p>
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>

          {/* Sidebar - Próximas Aulas */}
          <aside className="space-y-6">
            <div className="rounded-xl border border-white/10 bg-bg-card/50 p-5">
              <h3 className="mb-4 flex items-center gap-2 font-[family-name:var(--font-press-start)] text-xs text-white">
                <Radio size={14} className="text-green-cs" />
                PRÓXIMAS AULAS
              </h3>
              <div className="space-y-3">
                {nextClasses.map((entry, i) => (
                  <button
                    key={entry.id}
                    onClick={() => setSelectedEntry(entry)}
                    className="flex w-full items-start gap-3 rounded-lg p-2 text-left transition-colors hover:bg-white/5"
                  >
                    <div
                      className="mt-1 h-2 w-2 shrink-0 rounded-full"
                      style={{ backgroundColor: entry.cor }}
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-white">{entry.disciplina}</p>
                      <p className="text-xs text-[#A0A0A0]">{entry.professor}</p>
                      <p className="text-xs font-medium text-green-cs">{entry.when}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-green-cs/20 bg-green-cs/5 p-5">
              <h3 className="mb-2 text-sm font-bold text-green-cs">IP do Servidor</h3>
              <p className="font-[family-name:var(--font-jetbrains-mono)] text-xs text-white">
                {SERVER_IP}
              </p>
              <p className="mt-2 text-xs text-[#A0A0A0]">
                Conecte-se para assistir às aulas ao vivo!
              </p>
            </div>
          </aside>
        </div>
      </div>

      {/* Modal de detalhes da aula */}
      <AnimatePresence>
        {selectedEntry && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedEntry(null)}
          >
            <div className="absolute inset-0 bg-black/70" />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-lg rounded-2xl border border-white/10 bg-bg-primary p-6"
            >
              <button
                onClick={() => setSelectedEntry(null)}
                className="absolute right-4 top-4 text-[#A0A0A0] transition-colors hover:text-white"
              >
                <X size={20} />
              </button>

              <div
                className="mb-4 inline-block rounded-lg px-3 py-1 text-xs font-bold"
                style={{
                  backgroundColor: `${selectedEntry.cor}20`,
                  color: selectedEntry.cor,
                }}
              >
                {selectedEntry.nivel}
              </div>

              <h2 className="mb-1 text-xl font-bold text-white">{selectedEntry.disciplina}</h2>
              <p className="mb-4 text-sm text-[#A0A0A0]">{selectedEntry.descricao}</p>

              <div className="mb-4 space-y-2">
                <div className="flex items-center gap-2 text-sm text-[#E0E0E0]">
                  <User size={16} className="text-green-cs" />
                  {selectedEntry.professor}
                </div>
                <div className="flex items-center gap-2 text-sm text-[#E0E0E0]">
                  <Clock size={16} className="text-green-cs" />
                  {DAYS_MAP[selectedEntry.diaSemana].full}, {selectedEntry.horaInicio} — {selectedEntry.horaFim}
                </div>
                <div className="flex items-center gap-2 text-sm text-[#E0E0E0]">
                  <MapPin size={16} className="text-green-cs" />
                  <span className="font-[family-name:var(--font-jetbrains-mono)] text-xs">{SERVER_IP}</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <button className="flex items-center gap-1.5 rounded-lg bg-green-cs px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-green-dark">
                  <BookOpen size={16} /> Ver Disciplina
                </button>
                <button className="flex items-center gap-1.5 rounded-lg border border-white/20 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/10">
                  <Clock size={16} /> Adicionar Lembrete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
