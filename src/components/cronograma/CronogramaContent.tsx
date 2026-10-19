"use client";

import Link from "next/link";
import { useState, useMemo, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  CalendarDays,
  CalendarPlus,
  Download,
  Clock,
  User,
  MapPin,
  X,
  Radio,
  BookOpen,
  Loader2,
  Megaphone,
  GraduationCap,
} from "lucide-react";
import { PageHero } from "@/components/ui/PageHero";
import { DISCORD_SCHEDULE_URL, SERVER_IP } from "@/lib/constants";
import { downloadIcs, type IcsEvent } from "@/lib/ics";

// Aulas ao vivo marcadas pela equipe no painel (/painel/cronograma)
interface ScheduleEntry {
  id: string;
  title: string;
  topic: string | null;
  description: string | null;
  teacher: string;
  level: string | null;
  color: string;
  location: string | null;
  startsAt: string;
  endsAt: string;
  cancelled: boolean;
  cancelReason: string | null;
  discipline: { name: string; slug: string } | null;
}

interface Notice {
  text: string;
  until: string | null;
}

const DAYS = [
  { short: "SEG", full: "Segunda-feira" },
  { short: "TER", full: "Terça-feira" },
  { short: "QUA", full: "Quarta-feira" },
  { short: "QUI", full: "Quinta-feira" },
  { short: "SEX", full: "Sexta-feira" },
  { short: "SAB", full: "Sábado" },
  { short: "DOM", full: "Domingo" },
];

const TURNOS = ["Todos", "Manhã", "Tarde", "Noite"];
const DAY_MS = 24 * 60 * 60 * 1000;

/** Segunda-feira 00:00 da semana com o deslocamento dado */
function getWeekStart(offset: number): Date {
  const now = new Date();
  const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - ((now.getDay() + 6) % 7) + offset * 7);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

function hhmm(value: string | Date): string {
  return new Date(value).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

/** 0 = segunda ... 6 = domingo */
function weekdayIndex(value: string | Date): number {
  return (new Date(value).getDay() + 6) % 7;
}

function getTurno(value: string): string {
  const h = new Date(value).getHours();
  if (h < 12) return "Manhã";
  if (h < 18) return "Tarde";
  return "Noite";
}

function isLive(entry: ScheduleEntry, now: number): boolean {
  return !entry.cancelled && now >= new Date(entry.startsAt).getTime() && now < new Date(entry.endsAt).getTime();
}

function whenLabel(entry: ScheduleEntry, now: number): string {
  const start = new Date(entry.startsAt);
  if (isLive(entry, now)) return "Ao vivo agora";
  const minutes = Math.round((start.getTime() - now) / 60000);
  const today = new Date(now);
  const tomorrow = addDays(today, 1);
  if (start.toDateString() === today.toDateString()) {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return h > 0 ? `em ${h}h ${m}min` : `em ${m}min`;
  }
  if (start.toDateString() === tomorrow.toDateString()) return `Amanhã ${hhmm(start)}`;
  return `${DAYS[weekdayIndex(start)].full} ${hhmm(start)}`;
}

function toIcs(entry: ScheduleEntry): IcsEvent {
  return {
    id: entry.id,
    title: `${entry.title}${entry.topic ? `: ${entry.topic}` : ""} (CraftSapiens)`,
    description: [entry.description, `Professor: ${entry.teacher}`, `Servidor: ${SERVER_IP}`].filter(Boolean).join("\n"),
    location: [entry.location, SERVER_IP].filter(Boolean).join(" - "),
    startsAt: entry.startsAt,
    endsAt: entry.endsAt,
    cancelled: entry.cancelled,
  };
}

async function fetchRange(start: Date, end: Date): Promise<{ classes: ScheduleEntry[]; notice: Notice | null }> {
  const qs = new URLSearchParams({ inicio: start.toISOString(), fim: end.toISOString() });
  const res = await fetch(`/api/cronograma?${qs}`, { cache: "no-store" });
  if (!res.ok) throw new Error("Falha ao carregar o cronograma");
  return res.json();
}

export function CronogramaContent() {
  const [view, setView] = useState<"semanal" | "mensal">("semanal");
  const [weekOffset, setWeekOffset] = useState(0);
  const [monthOffset, setMonthOffset] = useState(0);
  const [selectedEntry, setSelectedEntry] = useState<ScheduleEntry | null>(null);
  const [selectedMonthDay, setSelectedMonthDay] = useState<number | null>(null);
  const [filterDisciplina, setFilterDisciplina] = useState("Todas");
  const [filterNivel, setFilterNivel] = useState("Todos");
  const [filterProfessor, setFilterProfessor] = useState("Todos");
  const [filterTurno, setFilterTurno] = useState("Todos");
  // Aulas guardadas com o intervalo pedido: ao trocar de semana ou mês, as antigas não aparecem
  const [loaded, setLoaded] = useState<{ key: string; classes: ScheduleEntry[] | null; error: boolean } | null>(null);
  const [upcoming, setUpcoming] = useState<ScheduleEntry[]>([]);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [now, setNow] = useState(() => Date.now());

  const weekStart = useMemo(() => getWeekStart(weekOffset), [weekOffset]);

  const currentMonth = useMemo(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth() + monthOffset, 1);
  }, [monthOffset]);

  // Intervalo exibido: a semana ou o mês inteiro
  const range = useMemo(() => {
    if (view === "semanal") return { start: weekStart, end: addDays(weekStart, 7) };
    return { start: currentMonth, end: new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1) };
  }, [view, weekStart, currentMonth]);

  const rangeKey = `${range.start.toISOString()}|${range.end.toISOString()}`;

  useEffect(() => {
    let cancelled = false;
    fetchRange(range.start, range.end)
      .then((data) => {
        if (cancelled) return;
        setLoaded({ key: rangeKey, classes: data.classes, error: false });
        setNotice(data.notice);
      })
      .catch(() => !cancelled && setLoaded({ key: rangeKey, classes: null, error: true }));
    return () => {
      cancelled = true;
    };
  }, [range, rangeKey]);

  const current = loaded?.key === rangeKey ? loaded : null;
  const classes = current?.classes ?? null;
  const error = current?.error ?? false;

  // Próximas aulas: das próximas duas semanas, atualizadas a cada minuto
  useEffect(() => {
    const loadUpcoming = () => {
      const start = new Date();
      fetchRange(new Date(start.getTime() - 4 * 60 * 60 * 1000), new Date(start.getTime() + 14 * DAY_MS))
        .then((data) => setUpcoming(data.classes))
        .catch(() => {});
    };
    loadUpcoming();
    const timer = setInterval(() => {
      setNow(Date.now());
      loadUpcoming();
    }, 60_000);
    return () => clearInterval(timer);
  }, []);

  const options = useMemo(() => {
    const list = classes ?? [];
    return {
      disciplinas: ["Todas", ...Array.from(new Set(list.map((c) => c.title))).sort()],
      niveis: ["Todos", ...Array.from(new Set(list.map((c) => c.level).filter((l): l is string => !!l))).sort()],
      professores: ["Todos", ...Array.from(new Set(list.map((c) => c.teacher))).sort()],
    };
  }, [classes]);

  const matches = useCallback(
    (entry: ScheduleEntry) => {
      if (filterDisciplina !== "Todas" && entry.title !== filterDisciplina) return false;
      if (filterNivel !== "Todos" && entry.level !== filterNivel) return false;
      if (filterProfessor !== "Todos" && entry.teacher !== filterProfessor) return false;
      if (filterTurno !== "Todos" && getTurno(entry.startsAt) !== filterTurno) return false;
      return true;
    },
    [filterDisciplina, filterNivel, filterProfessor, filterTurno]
  );

  const filteredSchedule = useMemo(() => (classes ?? []).filter(matches), [classes, matches]);

  const nextClasses = useMemo(
    () =>
      upcoming
        .filter((c) => !c.cancelled && new Date(c.endsAt).getTime() > now)
        .filter(matches)
        .slice(0, 5),
    [upcoming, now, matches]
  );

  const clearFilters = useCallback(() => {
    setFilterDisciplina("Todas");
    setFilterNivel("Todos");
    setFilterProfessor("Todos");
    setFilterTurno("Todos");
  }, []);

  const hasFilters = filterDisciplina !== "Todas" || filterNivel !== "Todos" || filterProfessor !== "Todos" || filterTurno !== "Todos";

  const monthDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const lastDay = new Date(year, month + 1, 0);
    const startPad = (currentMonth.getDay() + 6) % 7;
    const days: (number | null)[] = Array(startPad).fill(null);
    for (let i = 1; i <= lastDay.getDate(); i++) days.push(i);
    while (days.length % 7 !== 0) days.push(null);
    return days;
  }, [currentMonth]);

  const classesOn = useCallback(
    (date: Date): ScheduleEntry[] =>
      filteredSchedule
        .filter((e) => new Date(e.startsAt).toDateString() === date.toDateString())
        .sort((a, b) => a.startsAt.localeCompare(b.startsAt)),
    [filteredSchedule]
  );

  function exportCalendar() {
    const events = filteredSchedule.filter((c) => !c.cancelled).map(toIcs);
    const label = view === "semanal" ? `semana-${weekStart.toISOString().slice(0, 10)}` : `mes-${currentMonth.toISOString().slice(0, 7)}`;
    downloadIcs(`aulas-craftsapiens-${label}.ics`, events);
  }

  const selectClass = "rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-sm text-white focus:border-green-cs focus:outline-none";
  const today = new Date(now);

  return (
    <>
      <PageHero
        title="CRONOGRAMA"
        subtitle="Confira os horários das aulas e organize seus estudos."
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Cronograma" }]}
      />

      <div className="mx-auto max-w-7xl px-4 pb-16 lg:px-6">
        {notice && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 flex items-start gap-3 rounded-xl border border-warning/30 bg-warning/10 px-4 py-3"
          >
            <Megaphone size={18} className="mt-0.5 shrink-0 text-warning" />
            <p className="text-sm text-[#ffe08a]">{notice.text}</p>
          </motion.div>
        )}

        {/* Filtros */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-8 rounded-xl border border-white/10 bg-bg-card/50 p-4">
          <div className="flex flex-wrap items-center gap-3">
            <select value={filterDisciplina} onChange={(e) => setFilterDisciplina(e.target.value)} className={selectClass} aria-label="Disciplina">
              {options.disciplinas.map((d) => (
                <option key={d} value={d} className="bg-bg-primary">
                  {d === "Todas" ? "Todas as disciplinas" : d}
                </option>
              ))}
            </select>
            {options.niveis.length > 1 && (
              <select value={filterNivel} onChange={(e) => setFilterNivel(e.target.value)} className={selectClass} aria-label="Nível">
                {options.niveis.map((l) => (
                  <option key={l} value={l} className="bg-bg-primary">
                    {l === "Todos" ? "Todos os níveis" : l}
                  </option>
                ))}
              </select>
            )}
            <select value={filterProfessor} onChange={(e) => setFilterProfessor(e.target.value)} className={selectClass} aria-label="Professor">
              {options.professores.map((p) => (
                <option key={p} value={p} className="bg-bg-primary">
                  {p === "Todos" ? "Todos os professores" : p}
                </option>
              ))}
            </select>
            <select value={filterTurno} onChange={(e) => setFilterTurno(e.target.value)} className={selectClass} aria-label="Turno">
              {TURNOS.map((t) => (
                <option key={t} value={t} className="bg-bg-primary">
                  {t === "Todos" ? "Todos os turnos" : t}
                </option>
              ))}
            </select>

            {hasFilters && (
              <button onClick={clearFilters} className="text-sm text-[#A0A0A0] underline transition-colors hover:text-white">
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

            <button
              onClick={exportCalendar}
              disabled={!classes || filteredSchedule.length === 0}
              className="flex items-center gap-1.5 rounded-lg border border-white/20 px-3 py-2 text-sm text-[#A0A0A0] transition-colors hover:border-green-cs hover:text-green-cs disabled:opacity-40 disabled:hover:border-white/20 disabled:hover:text-[#A0A0A0]"
              title="Baixa um arquivo .ics para o Google Agenda, Outlook ou Calendário da Apple"
            >
              <Download size={16} /> Exportar {view === "semanal" ? "semana" : "mês"} para a agenda
            </button>
          </div>
        </motion.div>

        <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
          {/* Área principal */}
          <div>
            {view === "semanal" ? (
              <div className="mb-6 flex items-center justify-between">
                <button onClick={() => setWeekOffset((o) => o - 1)} className="flex items-center gap-1 text-sm text-[#A0A0A0] transition-colors hover:text-white">
                  <ChevronLeft size={18} /> Semana anterior
                </button>
                <span className="font-medium text-white">
                  {formatDate(weekStart)} — {formatDate(addDays(weekStart, 6))}
                </span>
                <button onClick={() => setWeekOffset((o) => o + 1)} className="flex items-center gap-1 text-sm text-[#A0A0A0] transition-colors hover:text-white">
                  Próxima semana <ChevronRight size={18} />
                </button>
              </div>
            ) : (
              <div className="mb-6 flex items-center justify-between">
                <button
                  onClick={() => {
                    setMonthOffset((o) => o - 1);
                    setSelectedMonthDay(null);
                  }}
                  className="flex items-center gap-1 text-sm text-[#A0A0A0] transition-colors hover:text-white"
                >
                  <ChevronLeft size={18} /> Anterior
                </button>
                <span className="font-medium capitalize text-white">{currentMonth.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}</span>
                <button
                  onClick={() => {
                    setMonthOffset((o) => o + 1);
                    setSelectedMonthDay(null);
                  }}
                  className="flex items-center gap-1 text-sm text-[#A0A0A0] transition-colors hover:text-white"
                >
                  Próximo <ChevronRight size={18} />
                </button>
              </div>
            )}

            {error ? (
              <div className="rounded-xl border border-error/30 bg-error/10 p-6 text-center text-sm text-[#ffb4b1]">
                Não foi possível carregar o cronograma. Recarregue a página.
              </div>
            ) : !classes ? (
              <div className="flex justify-center py-20">
                <Loader2 size={28} className="animate-spin text-green-cs" />
              </div>
            ) : view === "semanal" ? (
              <>
                {filteredSchedule.length === 0 && (
                  <p className="mb-4 rounded-xl border border-dashed border-white/15 px-4 py-6 text-center text-sm text-[#A0A0A0]">
                    {hasFilters ? (
                      "Nenhuma aula com esses filtros nesta semana."
                    ) : (
                      <>
                        Nenhuma aula marcada nesta semana. Os avisos também saem no canal{" "}
                        <a href={DISCORD_SCHEDULE_URL} target="_blank" rel="noopener noreferrer" className="text-green-cs hover:underline">
                          #cronograma-de-aulas
                        </a>{" "}
                        do Discord.
                      </>
                    )}
                  </p>
                )}

                {/* Grade semanal - Desktop */}
                <div className="hidden overflow-x-auto md:block">
                  <div className="grid min-w-[700px] grid-cols-7 gap-2">
                    {DAYS.map((day, index) => {
                      const date = addDays(weekStart, index);
                      const isToday = date.toDateString() === today.toDateString();
                      const dayEntries = classesOn(date);
                      return (
                        <div key={day.short} className="min-h-[200px]">
                          <div
                            className={`mb-2 rounded-lg py-2 text-center text-xs font-bold uppercase ${
                              isToday ? "bg-green-cs/20 text-green-cs" : "bg-white/5 text-[#A0A0A0]"
                            }`}
                          >
                            {day.short} <span className="font-normal">{date.getDate()}</span>
                          </div>
                          <div className="space-y-2">
                            {dayEntries.map((entry) => {
                              const live = isLive(entry, now);
                              return (
                                <motion.button
                                  key={entry.id}
                                  whileHover={{ scale: 1.02 }}
                                  onClick={() => setSelectedEntry(entry)}
                                  className={`w-full rounded-lg border p-2 text-left transition-all ${entry.cancelled ? "opacity-50" : ""}`}
                                  style={{ borderColor: `${entry.color}40`, backgroundColor: `${entry.color}10` }}
                                >
                                  {live && (
                                    <span className="mb-1 flex items-center gap-1 text-[10px] font-bold text-green-cs">
                                      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-green-cs" />
                                      AO VIVO
                                    </span>
                                  )}
                                  {entry.cancelled && <span className="mb-1 block text-[10px] font-bold text-[#ff8a87]">CANCELADA</span>}
                                  <p className="text-[10px] text-[#A0A0A0]">
                                    {hhmm(entry.startsAt)} — {hhmm(entry.endsAt)}
                                  </p>
                                  <p className={`text-xs font-bold ${entry.cancelled ? "line-through" : ""}`} style={{ color: entry.color }}>
                                    {entry.title}
                                  </p>
                                  {entry.topic && <p className="text-[10px] text-[#C0C0C8]">{entry.topic}</p>}
                                  <p className="text-[10px] text-[#A0A0A0]">{entry.teacher}</p>
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
                  {DAYS.map((day, index) => {
                    const date = addDays(weekStart, index);
                    const isToday = date.toDateString() === today.toDateString();
                    const dayEntries = classesOn(date);
                    if (dayEntries.length === 0) return null;
                    return (
                      <div key={day.short}>
                        <h3 className={`mb-2 text-sm font-bold ${isToday ? "text-green-cs" : "text-white"}`}>
                          {day.full}, {date.getDate()} {isToday && "(Hoje)"}
                        </h3>
                        <div className="space-y-2">
                          {dayEntries.map((entry) => (
                            <button
                              key={entry.id}
                              onClick={() => setSelectedEntry(entry)}
                              className={`flex w-full items-center gap-3 rounded-lg border border-white/10 bg-bg-card/50 p-3 text-left transition-all hover:border-white/20 ${
                                entry.cancelled ? "opacity-50" : ""
                              }`}
                            >
                              <div className="h-10 w-1 shrink-0 rounded-full" style={{ backgroundColor: entry.color }} />
                              <div className="min-w-0 flex-1">
                                <p className="text-xs text-[#A0A0A0]">
                                  {hhmm(entry.startsAt)} — {hhmm(entry.endsAt)}
                                  {isLive(entry, now) && <span className="ml-2 font-bold text-green-cs">AO VIVO</span>}
                                </p>
                                <p className={`font-medium text-white ${entry.cancelled ? "line-through" : ""}`}>{entry.title}</p>
                                <p className="text-xs text-[#A0A0A0]">
                                  {entry.teacher}
                                  {entry.topic && ` · ${entry.topic}`}
                                </p>
                              </div>
                              {(entry.cancelled || entry.level) && (
                                <span
                                  className="shrink-0 rounded px-2 py-0.5 text-[10px] font-bold"
                                  style={entry.cancelled ? undefined : { backgroundColor: `${entry.color}20`, color: entry.color }}
                                >
                                  {entry.cancelled ? <span className="text-[#ff8a87]">Cancelada</span> : entry.level}
                                </span>
                              )}
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
                <div className="grid grid-cols-7 gap-1">
                  {DAYS.map((d) => (
                    <div key={d.short} className="py-2 text-center text-xs font-bold text-[#A0A0A0]">
                      {d.short}
                    </div>
                  ))}

                  {monthDays.map((day, i) => {
                    if (day === null) return <div key={`pad-${i}`} />;
                    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
                    const dayClasses = classesOn(date);
                    const isToday = date.toDateString() === today.toDateString();
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
                        <span className={`text-xs ${isToday ? "font-bold text-green-cs" : "text-[#A0A0A0]"}`}>{day}</span>
                        <div className="mt-1 flex flex-wrap gap-0.5">
                          {dayClasses.slice(0, 4).map((c) => (
                            <span
                              key={c.id}
                              className={`h-1.5 w-1.5 rounded-full ${c.cancelled ? "opacity-30" : ""}`}
                              style={{ backgroundColor: c.color }}
                              title={c.title}
                            />
                          ))}
                        </div>
                        {dayClasses.length > 0 && (
                          <span className="mt-1 hidden text-[10px] text-[#7a7a90] sm:block">
                            {dayClasses.length} {dayClasses.length === 1 ? "aula" : "aulas"}
                          </span>
                        )}
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
                        {(() => {
                          const list = classesOn(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), selectedMonthDay));
                          if (list.length === 0) return <p className="text-sm text-[#A0A0A0]">Nenhuma aula neste dia.</p>;
                          return (
                            <div className="space-y-2">
                              {list.map((entry) => (
                                <button
                                  key={entry.id}
                                  onClick={() => setSelectedEntry(entry)}
                                  className={`flex w-full items-center gap-3 rounded-lg border border-white/10 p-3 text-left transition-all hover:border-white/20 ${
                                    entry.cancelled ? "opacity-50" : ""
                                  }`}
                                >
                                  <div className="h-8 w-1 shrink-0 rounded-full" style={{ backgroundColor: entry.color }} />
                                  <div>
                                    <p className={`text-sm font-medium text-white ${entry.cancelled ? "line-through" : ""}`}>{entry.title}</p>
                                    <p className="text-xs text-[#A0A0A0]">
                                      {hhmm(entry.startsAt)} — {hhmm(entry.endsAt)} · {entry.teacher}
                                    </p>
                                  </div>
                                </button>
                              ))}
                            </div>
                          );
                        })()}
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
              {nextClasses.length === 0 ? (
                <p className="text-sm text-[#A0A0A0]">Nenhuma aula marcada para os próximos dias.</p>
              ) : (
                <div className="space-y-3">
                  {nextClasses.map((entry) => (
                    <button
                      key={entry.id}
                      onClick={() => setSelectedEntry(entry)}
                      className="flex w-full items-start gap-3 rounded-lg p-2 text-left transition-colors hover:bg-white/5"
                    >
                      <div className="mt-1 h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: entry.color }} />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-white">{entry.title}</p>
                        <p className="text-xs text-[#A0A0A0]">{entry.teacher}</p>
                        <p className="text-xs font-medium text-green-cs">{whenLabel(entry, now)}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-xl border border-green-cs/20 bg-green-cs/5 p-5">
              <h3 className="mb-2 text-sm font-bold text-green-cs">IP do Servidor</h3>
              <p className="font-[family-name:var(--font-jetbrains-mono)] text-xs text-white">{SERVER_IP}</p>
              <p className="mt-2 text-xs text-[#A0A0A0]">Conecte-se para assistir às aulas ao vivo!</p>
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
              <button onClick={() => setSelectedEntry(null)} className="absolute right-4 top-4 text-[#A0A0A0] transition-colors hover:text-white" aria-label="Fechar">
                <X size={20} />
              </button>

              <div className="mb-4 flex flex-wrap gap-2">
                {selectedEntry.level && (
                  <span className="inline-block rounded-lg px-3 py-1 text-xs font-bold" style={{ backgroundColor: `${selectedEntry.color}20`, color: selectedEntry.color }}>
                    {selectedEntry.level}
                  </span>
                )}
                {isLive(selectedEntry, now) && (
                  <span className="inline-flex items-center gap-1.5 rounded-lg bg-green-cs/20 px-3 py-1 text-xs font-bold text-green-cs">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-green-cs" /> AO VIVO
                  </span>
                )}
                {selectedEntry.cancelled && <span className="inline-block rounded-lg bg-error/15 px-3 py-1 text-xs font-bold text-[#ff8a87]">CANCELADA</span>}
              </div>

              <h2 className={`text-xl font-bold text-white ${selectedEntry.cancelled ? "line-through" : ""}`}>{selectedEntry.title}</h2>
              {selectedEntry.topic && <p className="mt-0.5 text-base text-[#E0E0E0]">{selectedEntry.topic}</p>}
              {selectedEntry.cancelled && selectedEntry.cancelReason && (
                <p className="mt-2 text-sm text-[#ff8a87]">Motivo: {selectedEntry.cancelReason}</p>
              )}
              {selectedEntry.description && <p className="mt-3 whitespace-pre-line text-sm text-[#A0A0A0]">{selectedEntry.description}</p>}

              <div className="my-4 space-y-2">
                <div className="flex items-center gap-2 text-sm text-[#E0E0E0]">
                  <User size={16} className="text-green-cs" />
                  {selectedEntry.teacher}
                </div>
                <div className="flex items-center gap-2 text-sm text-[#E0E0E0]">
                  <Clock size={16} className="text-green-cs" />
                  {DAYS[weekdayIndex(selectedEntry.startsAt)].full}, {new Date(selectedEntry.startsAt).toLocaleDateString("pt-BR")},{" "}
                  {hhmm(selectedEntry.startsAt)} — {hhmm(selectedEntry.endsAt)}
                </div>
                {selectedEntry.location && (
                  <div className="flex items-center gap-2 text-sm text-[#E0E0E0]">
                    <GraduationCap size={16} className="text-green-cs" />
                    {selectedEntry.location}
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm text-[#E0E0E0]">
                  <MapPin size={16} className="text-green-cs" />
                  <span className="font-[family-name:var(--font-jetbrains-mono)] text-xs">{SERVER_IP}</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {selectedEntry.discipline && (
                  <Link
                    href={`/aulas/${selectedEntry.discipline.slug}`}
                    className="flex items-center gap-1.5 rounded-lg bg-green-cs px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-green-dark"
                  >
                    <BookOpen size={16} /> Ver disciplina
                  </Link>
                )}
                {!selectedEntry.cancelled && new Date(selectedEntry.endsAt).getTime() > now && (
                  <button
                    onClick={() => downloadIcs(`aula-${selectedEntry.id}.ics`, [toIcs(selectedEntry)])}
                    className="flex items-center gap-1.5 rounded-lg border border-white/20 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/10"
                  >
                    <CalendarPlus size={16} /> Adicionar à agenda
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
