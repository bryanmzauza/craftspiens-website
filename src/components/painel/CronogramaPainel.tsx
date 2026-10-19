"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Copy,
  Megaphone,
  MessageSquareText,
  Plus,
  Repeat,
  Trash2,
  X,
} from "lucide-react";
import { SERVER_IP } from "@/lib/constants";
import {
  Btn,
  Card,
  ErrorBox,
  Field,
  IconBtn,
  Loading,
  PageHeader,
  inputClass,
  panelApi,
  usePanelData,
  useConfirm,
  useToast,
} from "@/components/painel/ui";
import { AulaEditor, type ClassDraft } from "@/components/painel/AulaEditor";
import type { PanelClass, PanelDiscipline } from "@/components/painel/types";

interface Response {
  classes: PanelClass[];
  disciplines: PanelDiscipline[];
  teachers: string[];
  notice: { text: string; until: string | null } | null;
}

const DAY_NAMES = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"];
const HOUR_PX = 48;
const DAY_MS = 24 * 60 * 60 * 1000;

/** Segunda-feira 00:00 (horário local) da semana com o deslocamento dado */
function weekStart(offset: number): Date {
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

function hhmm(date: Date): string {
  return date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

function ddmm(date: Date): string {
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

/** Colunas lado a lado para aulas que se sobrepõem no mesmo dia */
function layoutDay(classes: PanelClass[]) {
  const sorted = [...classes].sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  const laneEnds: number[] = [];
  const placed = sorted.map((c) => {
    const start = new Date(c.startsAt).getTime();
    let lane = laneEnds.findIndex((end) => end <= start);
    if (lane === -1) lane = laneEnds.length;
    laneEnds[lane] = new Date(c.endsAt).getTime();
    return { c, lane };
  });
  return { placed, lanes: Math.max(laneEnds.length, 1) };
}

export function CronogramaPainel() {
  const toast = useToast();
  const { ask, dialog } = useConfirm();
  const [offset, setOffset] = useState(0);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<PanelClass | null>(null);
  const [draft, setDraft] = useState<ClassDraft | null>(null);
  const [editorKey, setEditorKey] = useState(0);
  const [discordOpen, setDiscordOpen] = useState(false);
  const [noticeOpen, setNoticeOpen] = useState(false);
  const [noticeKey, setNoticeKey] = useState(0);
  const [copying, setCopying] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  const start = useMemo(() => weekStart(offset), [offset]);
  const end = useMemo(() => addDays(start, 7), [start]);

  const { data, error, reload: load } = usePanelData<Response>(
    `/api/painel/cronograma?${new URLSearchParams({ inicio: start.toISOString(), fim: end.toISOString() })}`
  );

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(timer);
  }, []);

  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(start, i)), [start]);

  const byDay = useMemo(() => {
    const map = days.map(() => [] as PanelClass[]);
    for (const c of data?.classes ?? []) {
      const index = Math.floor((new Date(c.startsAt).getTime() - start.getTime()) / DAY_MS);
      if (index >= 0 && index < 7) map[index].push(c);
    }
    return map;
  }, [data, days, start]);

  // Faixa de horas visível: 8h às 22h, ampliada se houver aula fora disso
  const [firstHour, lastHour] = useMemo(() => {
    let first = 8;
    let last = 22;
    for (const c of data?.classes ?? []) {
      const s = new Date(c.startsAt);
      const e = new Date(c.endsAt);
      first = Math.min(first, s.getHours());
      last = Math.max(last, e.getHours() + (e.getMinutes() > 0 ? 1 : 0));
    }
    return [first, Math.min(last, 24)];
  }, [data]);
  const hours = Array.from({ length: lastHour - firstHour }, (_, i) => firstHour + i);

  function openNew(at?: Date) {
    const base = at ?? (() => {
      const d = new Date(Math.max(start.getTime(), now));
      d.setMinutes(0, 0, 0);
      d.setHours(Math.max(d.getHours() + 1, 14));
      return d;
    })();
    setEditing(null);
    setDraft({ startsAt: base });
    setEditorKey((k) => k + 1);
    setEditorOpen(true);
  }

  function openEdit(c: PanelClass) {
    setEditing(c);
    setDraft(null);
    setEditorKey((k) => k + 1);
    setEditorOpen(true);
  }

  function openNotice() {
    setNoticeKey((k) => k + 1);
    setNoticeOpen(true);
  }

  async function copyPrevious() {
    const ok = await ask({
      title: "Copiar a semana anterior",
      message: `As aulas da semana de ${ddmm(addDays(start, -7))} a ${ddmm(addDays(start, -1))} (sem as canceladas e sem o tema do dia) serão copiadas para esta semana. Aulas iguais que já existirem aqui não são duplicadas.`,
      confirm: "Copiar",
    });
    if (!ok) return;
    setCopying(true);
    const res = await panelApi<{ created: number; skipped: number }>("/api/painel/cronograma/copiar", {
      method: "POST",
      json: { de: addDays(start, -7).toISOString(), para: start.toISOString() },
    });
    setCopying(false);
    if (!res.ok) return toast("erro", res.error);
    toast("ok", res.data.created > 0 ? `${res.data.created} aulas copiadas.` : "Todas as aulas já estavam nesta semana.");
    load();
  }

  const total = data?.classes.length ?? 0;
  const cancelledCount = data?.classes.filter((c) => c.cancelled).length ?? 0;
  const teacherCount = new Set(data?.classes.map((c) => c.teacher)).size;
  const todayIndex = Math.floor((now - start.getTime()) / DAY_MS);
  const nowMinutes = new Date(now).getHours() * 60 + new Date(now).getMinutes();

  return (
    <>
      <PageHeader
        title="CRONOGRAMA"
        description="Aulas ao vivo da semana. Clique em um horário vazio para marcar uma aula, ou em uma aula para editar ou cancelar."
        actions={
          <>
            <Btn icon={MessageSquareText} onClick={() => setDiscordOpen(true)} disabled={!data}>
              Texto para o Discord
            </Btn>
            <Btn variant="primary" icon={Plus} onClick={() => openNew()}>
              Nova aula
            </Btn>
          </>
        }
      />

      {/* Aviso de recesso */}
      {data && (
        <div className="mb-4">
          {data.notice ? (
            <div className="flex flex-wrap items-center gap-3 rounded-xl border border-warning/30 bg-warning/10 px-4 py-3">
              <Megaphone size={18} className="shrink-0 text-warning" />
              <div className="min-w-0 flex-1">
                <p className="text-sm text-[#ffe08a]">{data.notice.text}</p>
                <p className="text-[11px] text-[#A0A0A0]">
                  {data.notice.until
                    ? new Date(data.notice.until).getTime() < now
                      ? `Expirou em ${new Date(data.notice.until).toLocaleDateString("pt-BR")}: não aparece mais no site.`
                      : `No ar até ${new Date(data.notice.until).toLocaleDateString("pt-BR")}.`
                    : "No ar até ser removido."}
                </p>
              </div>
              <Btn variant="ghost" onClick={openNotice}>
                Editar aviso
              </Btn>
            </div>
          ) : (
            <button
              onClick={openNotice}
              className="flex w-full items-center gap-2 rounded-xl border border-dashed border-white/15 px-4 py-2.5 text-left text-sm text-[#A0A0A0] transition-colors hover:border-white/30 hover:text-white"
            >
              <Megaphone size={16} /> Adicionar um aviso no topo do cronograma (férias, recesso, mudança de horário)
            </button>
          )}
        </div>
      )}

      {/* Navegação da semana */}
      <Card className="mb-4 flex flex-wrap items-center gap-3 px-3 py-2.5">
        <IconBtn icon={ChevronLeft} label="Semana anterior" onClick={() => setOffset((o) => o - 1)} />
        <div className="min-w-[150px] text-center">
          <p className="text-sm font-semibold text-white">
            {ddmm(start)} a {ddmm(addDays(start, 6))}
          </p>
          <p className="text-[11px] text-[#7a7a90]">
            {offset === 0 ? "Esta semana" : offset === 1 ? "Próxima semana" : offset === -1 ? "Semana passada" : start.getFullYear()}
          </p>
        </div>
        <IconBtn icon={ChevronRight} label="Próxima semana" onClick={() => setOffset((o) => o + 1)} />
        {offset !== 0 && (
          <Btn variant="ghost" onClick={() => setOffset(0)}>
            Hoje
          </Btn>
        )}
        <span className="flex-1" />
        <span className="text-xs text-[#A0A0A0]">
          {total} {total === 1 ? "aula" : "aulas"}
          {cancelledCount > 0 && ` (${cancelledCount} ${cancelledCount === 1 ? "cancelada" : "canceladas"})`} · {teacherCount}{" "}
          {teacherCount === 1 ? "professor" : "professores"}
        </span>
        <Btn icon={Copy} loading={copying} onClick={copyPrevious}>
          Copiar semana anterior
        </Btn>
      </Card>

      {error && <ErrorBox message={error} onRetry={load} />}
      {!data && !error && <Loading />}

      {data && (
        <>
          {/* Grade da semana (telas largas) */}
          <Card className="hidden overflow-x-auto md:block">
            <div className="grid min-w-[860px] grid-cols-[52px_repeat(7,minmax(0,1fr))]">
              <div className="sticky left-0 border-b border-white/10" />
              {days.map((day, i) => {
                const today = i === todayIndex;
                return (
                  <div key={i} className={`border-b border-l border-white/10 px-2 py-2.5 text-center ${today ? "bg-green-cs/10" : ""}`}>
                    <p className={`text-[11px] font-bold uppercase ${today ? "text-green-cs" : "text-[#A0A0A0]"}`}>{DAY_NAMES[i].slice(0, 3)}</p>
                    <p className={`text-lg font-bold ${today ? "text-white" : "text-[#E0E0E0]"}`}>{day.getDate()}</p>
                  </div>
                );
              })}

              {/* Coluna das horas */}
              <div className="relative" style={{ height: hours.length * HOUR_PX }}>
                {hours.map((h, i) => (
                  <span key={h} className="absolute right-2 -translate-y-1/2 text-[10px] text-[#7a7a90]" style={{ top: i * HOUR_PX }}>
                    {i > 0 ? `${String(h).padStart(2, "0")}:00` : ""}
                  </span>
                ))}
              </div>

              {days.map((day, dayIndex) => {
                const { placed, lanes } = layoutDay(byDay[dayIndex]);
                const today = dayIndex === todayIndex;
                return (
                  <div
                    key={dayIndex}
                    className={`relative border-l border-white/10 ${today ? "bg-green-cs/[0.04]" : ""}`}
                    style={{ height: hours.length * HOUR_PX }}
                  >
                    {/* Linhas das horas, clicáveis para marcar aula */}
                    {hours.map((h, i) => (
                      <button
                        key={h}
                        type="button"
                        onClick={() => {
                          const at = new Date(day);
                          at.setHours(h, 0, 0, 0);
                          openNew(at);
                        }}
                        className="group absolute inset-x-0 border-t border-white/[0.06] transition-colors hover:bg-white/[0.04]"
                        style={{ top: i * HOUR_PX, height: HOUR_PX }}
                        aria-label={`Marcar aula ${DAY_NAMES[dayIndex]} às ${h}h`}
                      >
                        <Plus size={14} className="mx-auto hidden text-[#7a7a90] group-hover:block" />
                      </button>
                    ))}

                    {/* Linha de agora */}
                    {today && nowMinutes >= firstHour * 60 && nowMinutes <= lastHour * 60 && (
                      <div className="pointer-events-none absolute inset-x-0 z-20 flex items-center" style={{ top: ((nowMinutes - firstHour * 60) / 60) * HOUR_PX }}>
                        <span className="-ml-1 h-2 w-2 rounded-full bg-error" />
                        <span className="h-px flex-1 bg-error" />
                      </div>
                    )}

                    {placed.map(({ c, lane }) => {
                      const s = new Date(c.startsAt);
                      const e = new Date(c.endsAt);
                      const top = ((s.getHours() * 60 + s.getMinutes() - firstHour * 60) / 60) * HOUR_PX;
                      const height = Math.max(((e.getTime() - s.getTime()) / 3_600_000) * HOUR_PX, 22);
                      const live = now >= s.getTime() && now < e.getTime() && !c.cancelled;
                      return (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => openEdit(c)}
                          className={`absolute z-10 overflow-hidden rounded-lg border-l-[3px] px-1.5 py-1 text-left transition-transform hover:z-30 hover:scale-[1.02] ${c.cancelled ? "opacity-50" : ""}`}
                          style={{
                            top: top + 1,
                            height: height - 2,
                            left: `calc(${(lane / lanes) * 100}% + 2px)`,
                            width: `calc(${100 / lanes}% - 4px)`,
                            borderLeftColor: c.color,
                            backgroundColor: `${c.color}26`,
                          }}
                          title={`${c.title}${c.topic ? ` - ${c.topic}` : ""} (${hhmm(s)} às ${hhmm(e)})`}
                        >
                          <p className="flex items-center gap-1 text-[10px] text-[#C0C0C8]">
                            {live && <span className="h-1.5 w-1.5 shrink-0 animate-pulse rounded-full bg-green-cs" />}
                            {hhmm(s)}
                            {c.seriesId && <Repeat size={9} className="shrink-0 text-[#7a7a90]" />}
                          </p>
                          <p className={`truncate text-xs font-bold text-white ${c.cancelled ? "line-through" : ""}`}>{c.title}</p>
                          {height > 56 && <p className="truncate text-[10px] text-[#C0C0C8]">{c.teacher}</p>}
                          {height > 76 && c.topic && <p className="truncate text-[10px] text-[#A0A0A0]">{c.topic}</p>}
                        </button>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Lista por dia (celular) */}
          <div className="flex flex-col gap-4 md:hidden">
            {days.map((day, i) => (
              <div key={i}>
                <div className="mb-2 flex items-center justify-between">
                  <h3 className={`text-sm font-bold ${i === todayIndex ? "text-green-cs" : "text-white"}`}>
                    {DAY_NAMES[i]}, {ddmm(day)}
                    {i === todayIndex && " (hoje)"}
                  </h3>
                  <button
                    onClick={() => {
                      const at = new Date(day);
                      at.setHours(14, 0, 0, 0);
                      openNew(at);
                    }}
                    className="flex items-center gap-1 text-xs text-[#A0A0A0] hover:text-white"
                  >
                    <Plus size={13} /> Aula
                  </button>
                </div>
                {byDay[i].length === 0 ? (
                  <p className="rounded-lg border border-dashed border-white/10 px-3 py-2 text-xs text-[#6b6b80]">Sem aulas</p>
                ) : (
                  <div className="flex flex-col gap-2">
                    {byDay[i].map((c) => (
                      <button
                        key={c.id}
                        onClick={() => openEdit(c)}
                        className={`flex items-center gap-3 rounded-xl border border-white/10 bg-bg-card/60 p-3 text-left ${c.cancelled ? "opacity-50" : ""}`}
                      >
                        <span className="h-10 w-1 shrink-0 rounded-full" style={{ backgroundColor: c.color }} />
                        <span className="min-w-0 flex-1">
                          <span className="block text-[11px] text-[#A0A0A0]">
                            {hhmm(new Date(c.startsAt))} às {hhmm(new Date(c.endsAt))}
                          </span>
                          <span className={`block truncate text-sm font-semibold text-white ${c.cancelled ? "line-through" : ""}`}>{c.title}</span>
                          <span className="block truncate text-[11px] text-[#A0A0A0]">
                            {c.teacher}
                            {c.topic && ` · ${c.topic}`}
                          </span>
                        </span>
                        {c.seriesId && <Repeat size={13} className="shrink-0 text-[#7a7a90]" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {total === 0 && (
            <div className="mt-4 flex flex-col items-center rounded-2xl border border-dashed border-white/15 px-6 py-8 text-center">
              <CalendarDays size={28} className="text-[#6b6b80]" />
              <p className="mt-2 font-semibold text-white">Nenhuma aula nesta semana</p>
              <p className="mt-1 max-w-md text-sm text-[#A0A0A0]">
                Clique em um horário da grade, use &quot;Nova aula&quot; ou copie a semana anterior para começar.
              </p>
            </div>
          )}
        </>
      )}

      {data && (
        <AulaEditor
          key={editorKey}
          open={editorOpen}
          aula={editing}
          draft={draft}
          disciplines={data.disciplines}
          teachers={data.teachers}
          onClose={() => setEditorOpen(false)}
          onSaved={load}
        />
      )}
      <DiscordDialog open={discordOpen} onClose={() => setDiscordOpen(false)} start={start} classes={data?.classes ?? []} />
      <NoticeDialog key={noticeKey} open={noticeOpen} onClose={() => setNoticeOpen(false)} notice={data?.notice ?? null} onSaved={load} />
      {dialog}
    </>
  );
}

// --- Texto para o canal #cronograma-de-aulas ---

function discordText(start: Date, classes: PanelClass[]): string {
  const lines = [`**Cronograma de aulas: ${ddmm(start)} a ${ddmm(addDays(start, 6))}**`, ""];
  for (let i = 0; i < 7; i++) {
    const day = addDays(start, i);
    const dayClasses = classes
      .filter((c) => new Date(c.startsAt).toDateString() === day.toDateString())
      .sort((a, b) => a.startsAt.localeCompare(b.startsAt));
    if (dayClasses.length === 0) continue;
    lines.push(`**${DAY_NAMES[i]}${i < 5 ? "-feira" : ""} (${ddmm(day)})**`);
    for (const c of dayClasses) {
      const time = `${hhmm(new Date(c.startsAt))} às ${hhmm(new Date(c.endsAt))}`;
      const name = `${c.title}${c.topic ? `: ${c.topic}` : ""}`;
      const extra = [c.teacher, c.level, c.location].filter(Boolean).join(" · ");
      lines.push(
        c.cancelled
          ? `~~${time} - ${name}~~ (cancelada${c.cancelReason ? `: ${c.cancelReason}` : ""})`
          : `${time} - ${name} (${extra})`
      );
    }
    lines.push("");
  }
  if (lines.length === 2) lines.push("Nenhuma aula marcada nesta semana.", "");
  lines.push(`Servidor: ${SERVER_IP}`);
  return lines.join("\n");
}

function DiscordDialog({ open, onClose, start, classes }: { open: boolean; onClose: () => void; start: Date; classes: PanelClass[] }) {
  const toast = useToast();
  const text = useMemo(() => discordText(start, classes), [start, classes]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      toast("ok", "Texto copiado. Cole no canal do Discord.");
    } catch {
      toast("erro", "Não foi possível copiar. Selecione o texto e copie.");
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/70" onClick={onClose} />
          <motion.div
            role="dialog"
            aria-modal="true"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            className="relative flex max-h-[85vh] w-full max-w-xl flex-col rounded-2xl border border-white/10 bg-bg-primary p-6"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-white">Texto para o Discord</h2>
                <p className="text-sm text-[#A0A0A0]">Pronto para colar no canal #cronograma-de-aulas, com a formatação do Discord.</p>
              </div>
              <IconBtn icon={X} label="Fechar" onClick={onClose} />
            </div>
            <textarea
              readOnly
              value={text}
              className={`${inputClass} mt-4 min-h-[280px] flex-1 font-[family-name:var(--font-jetbrains-mono)] text-xs leading-relaxed`}
              onFocus={(e) => e.currentTarget.select()}
            />
            <div className="mt-4 flex justify-end gap-2">
              <Btn variant="ghost" onClick={onClose}>
                Fechar
              </Btn>
              <Btn variant="primary" icon={Copy} onClick={copy}>
                Copiar texto
              </Btn>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

// --- Aviso no topo do cronograma ---

function NoticeDialog({
  open,
  onClose,
  notice,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  notice: { text: string; until: string | null } | null;
  onSaved: () => void;
}) {
  const toast = useToast();
  // O pai troca a key a cada abertura: os campos começam do aviso atual
  const [text, setText] = useState(notice?.text ?? "");
  const [until, setUntil] = useState(() =>
    notice?.until ? new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date(notice.until)) : ""
  );
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    const res = await panelApi("/api/painel/cronograma/aviso", {
      method: "PUT",
      json: { texto: text, ate: until ? `${until}T23:59:59-03:00` : null },
    });
    setBusy(false);
    if (!res.ok) return toast("erro", res.error);
    toast("ok", "Aviso publicado no cronograma.");
    onSaved();
    onClose();
  }

  async function remove() {
    setBusy(true);
    const res = await panelApi("/api/painel/cronograma/aviso", { method: "DELETE" });
    setBusy(false);
    if (!res.ok) return toast("erro", res.error);
    toast("ok", "Aviso removido.");
    onSaved();
    onClose();
  }

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/70" onClick={onClose} />
          <motion.div
            role="dialog"
            aria-modal="true"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            className="relative w-full max-w-lg rounded-2xl border border-white/10 bg-bg-primary p-6"
          >
            <div className="flex items-start justify-between gap-3">
              <h2 className="flex items-center gap-2 text-lg font-bold text-white">
                <Megaphone size={18} className="text-warning" /> Aviso do cronograma
              </h2>
              <IconBtn icon={X} label="Fechar" onClick={onClose} />
            </div>
            <div className="mt-4 flex flex-col gap-4">
              <Field label="Texto" hint={`${text.length}/300`}>
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  rows={3}
                  maxLength={300}
                  className={inputClass}
                  placeholder="Ex.: Recesso de fim de ano de 20/12 a 10/01. As aulas voltam em 12/01."
                />
              </Field>
              <Field label="Mostrar até" hint="Último dia em que o aviso aparece. Vazio = até ser removido.">
                <input type="date" value={until} onChange={(e) => setUntil(e.target.value)} className={`${inputClass} w-auto`} />
              </Field>
            </div>
            <div className="mt-6 flex flex-wrap justify-end gap-2">
              {notice && (
                <Btn variant="danger" icon={Trash2} onClick={remove} disabled={busy} className="mr-auto">
                  Remover
                </Btn>
              )}
              <Btn variant="ghost" onClick={onClose}>
                Cancelar
              </Btn>
              <Btn variant="primary" icon={Megaphone} loading={busy} onClick={save}>
                Publicar aviso
              </Btn>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
