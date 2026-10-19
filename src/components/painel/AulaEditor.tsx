"use client";

import { useState } from "react";
import { CalendarX, Check, Repeat, Trash2 } from "lucide-react";
import { Btn, Drawer, Field, Toggle, inputClass, panelApi, useConfirm, useToast } from "@/components/painel/ui";
import type { PanelClass, PanelDiscipline } from "@/components/painel/types";

const SWATCHES = ["#2196F3", "#00BCD4", "#4CAF50", "#FFD700", "#FF9800", "#FF5722", "#E91E63", "#9C27B0"];
const LEVELS = ["Fundamental I", "Fundamental II", "Ensino Médio", "ENEM", "Todos os níveis"];
const LOCATIONS = ["Survival", "Lobby", "Geopolítico", "Sala de aula", "Discord"];
const DURATIONS = [45, 60, 90, 120];

/** Dados iniciais de uma aula nova (dia e hora clicados na grade) */
export interface ClassDraft {
  startsAt: Date;
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function toDateInput(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function toTimeInput(d: Date) {
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function addMinutes(time: string, minutes: number): string {
  const [h, m] = time.split(":").map(Number);
  const total = Math.min(h * 60 + m + minutes, 23 * 60 + 59);
  return `${pad(Math.floor(total / 60))}:${pad(total % 60)}`;
}

function minutesBetween(start: string, end: string): number {
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  return eh * 60 + em - (sh * 60 + sm);
}

export function AulaEditor({
  open,
  aula,
  draft,
  disciplines,
  teachers,
  onClose,
  onSaved,
}: {
  open: boolean;
  aula: PanelClass | null;
  draft: ClassDraft | null;
  disciplines: PanelDiscipline[];
  teachers: string[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const toast = useToast();
  const { ask, dialog } = useConfirm();
  // O pai troca a key a cada abertura: os campos começam da aula escolhida
  // (ou do dia e hora clicados na grade)
  const [initial] = useState(() => {
    const s = aula ? new Date(aula.startsAt) : draft?.startsAt ?? new Date();
    return { date: toDateInput(s), start: toTimeInput(s), end: aula ? toTimeInput(new Date(aula.endsAt)) : addMinutes(toTimeInput(s), 60) };
  });
  const [disciplineId, setDisciplineId] = useState(aula?.disciplineId ?? "");
  const [title, setTitle] = useState(aula?.title ?? "");
  const [topic, setTopic] = useState(aula?.topic ?? "");
  const [teacher, setTeacher] = useState(aula?.teacher ?? "");
  const [level, setLevel] = useState(aula?.level ?? "");
  const [location, setLocation] = useState(aula?.location ?? "");
  const [description, setDescription] = useState(aula?.description ?? "");
  const [color, setColor] = useState(aula?.color ?? SWATCHES[0]);
  const [date, setDate] = useState(initial.date);
  const [start, setStart] = useState(initial.start);
  const [end, setEnd] = useState(initial.end);
  const [repeat, setRepeat] = useState(1);
  const [cancelled, setCancelled] = useState(aula?.cancelled ?? false);
  const [cancelReason, setCancelReason] = useState(aula?.cancelReason ?? "");
  const [scope, setScope] = useState<"esta" | "serie">("esta");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<{ field: string | null; message: string } | null>(null);

  function pickDiscipline(id: string) {
    setDisciplineId(id);
    const d = disciplines.find((x) => x.id === id);
    if (d) {
      setTitle(d.name);
      setColor(d.color);
    }
  }

  const duration = minutesBetween(start, end);
  const inSeries = !!aula?.seriesId && aula.seriesSize > 1;

  async function save() {
    setError(null);
    if (!date || !start || !end) return setError({ field: null, message: "Informe a data e os horários." });
    if (duration <= 0) return setError({ field: "endsAt", message: "O fim deve ser depois do início." });
    setSaving(true);
    const body = {
      title,
      topic,
      teacher,
      level,
      location,
      description,
      color,
      disciplineId: disciplineId || null,
      startsAt: new Date(`${date}T${start}:00`).toISOString(),
      endsAt: new Date(`${date}T${end}:00`).toISOString(),
      cancelled,
      cancelReason,
      ...(aula ? { scope } : { repeatWeeks: repeat }),
    };
    const res = aula
      ? await panelApi<{ updated: number }>(`/api/painel/cronograma/${aula.id}`, { method: "PUT", json: body })
      : await panelApi<{ created: number }>("/api/painel/cronograma", { method: "POST", json: body });
    setSaving(false);
    if (!res.ok) return setError({ field: res.field ?? null, message: res.error });
    if (aula) {
      const updated = (res.data as { updated: number }).updated;
      toast("ok", updated > 1 ? `${updated} aulas da série atualizadas.` : "Aula salva.");
    } else {
      const created = (res.data as { created: number }).created;
      toast("ok", created > 1 ? `${created} aulas marcadas, uma por semana.` : "Aula marcada.");
    }
    onSaved();
    onClose();
  }

  async function remove() {
    if (!aula) return;
    const series = inSeries && scope === "serie";
    const ok = await ask({
      title: series ? "Excluir a série" : "Excluir aula",
      message: series
        ? "Excluir esta aula e as próximas da mesma série? Para avisar os alunos, prefira cancelar: a aula continua no cronograma, riscada."
        : "Excluir esta aula do cronograma? Para avisar os alunos, prefira cancelar: a aula continua no cronograma, riscada.",
      confirm: "Excluir",
      danger: true,
    });
    if (!ok) return;
    const res = await panelApi<{ deleted: number }>(`/api/painel/cronograma/${aula.id}${series ? "?escopo=serie" : ""}`, { method: "DELETE" });
    if (!res.ok) return toast("erro", res.error);
    toast("ok", res.data.deleted > 1 ? `${res.data.deleted} aulas excluídas.` : "Aula excluída.");
    onSaved();
    onClose();
  }

  const fieldError = (name: string) => (error?.field === name ? error.message : null);

  return (
    <>
      <Drawer
        open={open}
        onClose={onClose}
        title={aula ? "Editar aula" : "Nova aula"}
        footer={
          <>
            {aula && (
              <Btn variant="danger" icon={Trash2} onClick={remove} className="mr-auto">
                Excluir
              </Btn>
            )}
            {error && <span className="text-sm text-[#ff8a87]">{error.field ? "Confira o campo marcado." : error.message}</span>}
            <Btn variant="ghost" onClick={onClose}>
              Cancelar
            </Btn>
            <Btn variant="primary" icon={Check} loading={saving} onClick={save}>
              {aula ? "Salvar" : repeat > 1 ? `Marcar ${repeat} aulas` : "Marcar aula"}
            </Btn>
          </>
        }
      >
        <div className="flex flex-col gap-5">
          {inSeries && (
            <div className="rounded-xl border border-info/25 bg-info/10 p-3">
              <p className="flex items-center gap-2 text-sm font-semibold text-[#7cc2ff]">
                <Repeat size={15} /> Aula de uma série semanal ({aula!.seriesSize} aulas)
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {(
                  [
                    ["esta", "Só esta aula"],
                    ["serie", "Esta e as próximas"],
                  ] as const
                ).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setScope(value)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${scope === value ? "bg-info/30 text-white" : "bg-white/5 text-[#A0A0A0] hover:text-white"}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              {scope === "serie" && (
                <p className="mt-2 text-[11px] text-[#A0A0A0]">
                  Nome, professor, cor e detalhes valem para todas; se mudar o dia ou o horário, todas mudam pelo mesmo tanto. O
                  tema do dia e o cancelamento ficam só nesta aula.
                </p>
              )}
            </div>
          )}

          <Field label="Disciplina" hint="Escolher uma disciplina preenche o nome e a cor e liga a aula à página da disciplina.">
            <select value={disciplineId} onChange={(e) => pickDiscipline(e.target.value)} className={inputClass}>
              <option value="" className="bg-bg-primary">
                Outra (escrever o nome)
              </option>
              {disciplines.map((d) => (
                <option key={d.id} value={d.id} className="bg-bg-primary">
                  {d.name}
                </option>
              ))}
            </select>
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nome da aula" error={fieldError("title")}>
              <input value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass} maxLength={120} placeholder="Ex.: Matemática" />
            </Field>
            <Field label="Tema do dia" hint="Opcional." error={fieldError("topic")}>
              <input value={topic} onChange={(e) => setTopic(e.target.value)} className={inputClass} maxLength={200} placeholder="Ex.: Frações com blocos" />
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Professor" error={fieldError("teacher")}>
              <input value={teacher} onChange={(e) => setTeacher(e.target.value)} list="painel-professores" className={inputClass} maxLength={100} placeholder="Ex.: Prof. Helton" />
              <datalist id="painel-professores">
                {teachers.map((t) => (
                  <option key={t} value={t} />
                ))}
              </datalist>
            </Field>
            <Field label="Nível" hint="Opcional." error={fieldError("level")}>
              <input value={level} onChange={(e) => setLevel(e.target.value)} list="painel-niveis" className={inputClass} maxLength={50} />
              <datalist id="painel-niveis">
                {LEVELS.map((l) => (
                  <option key={l} value={l} />
                ))}
              </datalist>
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Data">
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputClass} />
            </Field>
            <Field label="Início">
              <input
                type="time"
                value={start}
                onChange={(e) => {
                  const next = e.target.value;
                  // Mantém a duração ao mudar o início
                  if (next && duration > 0) setEnd(addMinutes(next, duration));
                  setStart(next);
                }}
                className={inputClass}
              />
            </Field>
            <Field label="Fim" error={fieldError("endsAt")}>
              <input type="time" value={end} onChange={(e) => setEnd(e.target.value)} className={inputClass} />
            </Field>
          </div>
          <div className="-mt-2 flex flex-wrap items-center gap-1.5">
            <span className="text-xs text-[#7a7a90]">Duração:</span>
            {DURATIONS.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setEnd(addMinutes(start, m))}
                className={`rounded-md px-2 py-1 text-xs font-semibold ${duration === m ? "bg-green-cs/20 text-green-light" : "bg-white/5 text-[#A0A0A0] hover:text-white"}`}
              >
                {m < 60 ? `${m} min` : m % 60 ? `${Math.floor(m / 60)}h${m % 60}` : `${m / 60}h`}
              </button>
            ))}
          </div>

          <Field label="Local no jogo" hint="Opcional. Onde os alunos devem estar." error={fieldError("location")}>
            <input value={location} onChange={(e) => setLocation(e.target.value)} list="painel-locais" className={inputClass} maxLength={100} />
            <datalist id="painel-locais">
              {LOCATIONS.map((l) => (
                <option key={l} value={l} />
              ))}
            </datalist>
          </Field>

          <Field label="Cor">
            <div className="flex flex-wrap items-center gap-2">
              {SWATCHES.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`h-7 w-7 rounded-lg border-2 transition-transform ${color.toUpperCase() === c ? "scale-110 border-white" : "border-transparent"}`}
                  style={{ backgroundColor: c }}
                  aria-label={`Cor ${c}`}
                />
              ))}
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value.toUpperCase())}
                className="h-7 w-10 cursor-pointer rounded border border-white/15 bg-transparent"
                aria-label="Outra cor"
              />
            </div>
          </Field>

          <Field label="Descrição" hint="Opcional. Aparece ao abrir a aula no cronograma." error={fieldError("description")}>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className={inputClass} maxLength={2000} />
          </Field>

          {!aula && (
            <Field label="Repetir" hint="Cria a mesma aula, no mesmo dia da semana e horário, pelas próximas semanas.">
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={1}
                  max={26}
                  value={repeat}
                  onChange={(e) => setRepeat(Number(e.target.value))}
                  className="flex-1 accent-[#4CAF50]"
                  aria-label="Semanas"
                />
                <span className="w-36 text-right text-sm text-white">{repeat === 1 ? "Só esta semana" : `Por ${repeat} semanas`}</span>
              </div>
            </Field>
          )}

          {aula && scope === "esta" && (
            <div className="rounded-xl border border-white/10 bg-black/10 p-4">
              <label className="flex items-center gap-2.5 text-sm text-white">
                <Toggle checked={cancelled} onChange={setCancelled} label="Aula cancelada" />
                <CalendarX size={15} className="text-[#ff8a87]" /> Aula cancelada
              </label>
              {cancelled && (
                <input
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className={`${inputClass} mt-3`}
                  maxLength={200}
                  placeholder="Motivo (aparece para os alunos). Ex.: feriado"
                />
              )}
            </div>
          )}
        </div>
      </Drawer>
      {dialog}
    </>
  );
}
