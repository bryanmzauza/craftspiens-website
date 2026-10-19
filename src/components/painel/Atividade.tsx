"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, History } from "lucide-react";
import { Btn, Card, Empty, ErrorBox, Loading, PageHeader, Segmented, dateTime, usePanelData } from "@/components/painel/ui";
import { describeLog } from "@/components/painel/log-labels";

interface Log {
  id: string;
  actor: string;
  action: string;
  target: string | null;
  details: unknown;
  createdAt: string;
}

interface Response {
  logs: Log[];
  pagination: { page: number; total: number; totalPages: number };
}

const FIELD_LABELS: Record<string, string> = {
  name: "nome",
  slug: "slug",
  price: "preço",
  originalPrice: "preço antigo",
  category: "categoria",
  stock: "estoque",
  active: "na loja",
  featured: "destaque",
  badge: "selo",
  durationDays: "duração",
};

function show(value: unknown): string {
  if (value === null || value === undefined || value === "") return "vazio";
  if (typeof value === "boolean") return value ? "sim" : "não";
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}T/.test(value)) return dateTime(value);
  return String(value);
}

/** Resumo legível dos detalhes gravados com a ação */
function detailText(details: unknown): string | null {
  if (!details || typeof details !== "object") return null;
  const entries = Object.entries(details as Record<string, unknown>);
  if (entries.length === 0) return null;
  return entries
    .map(([key, value]) => {
      if (value && typeof value === "object" && "de" in value && "para" in value) {
        const change = value as { de: unknown; para: unknown };
        return `${FIELD_LABELS[key] ?? key}: ${show(change.de)} para ${show(change.para)}`;
      }
      return `${FIELD_LABELS[key] ?? key}: ${show(value)}`;
    })
    .join(" · ");
}

export function Atividade() {
  const [type, setType] = useState("");
  const [page, setPage] = useState(1);
  const qs = new URLSearchParams({ pagina: String(page) });
  if (type) qs.set("tipo", type);
  const { data, error, reload: load } = usePanelData<Response>(`/api/painel/atividade?${qs}`);

  return (
    <>
      <PageHeader title="ATIVIDADE" description="Tudo o que foi feito no painel, com quem fez e quando. O nome é o informado ao abrir o painel." />

      <div className="mb-4">
        <Segmented
          value={type}
          onChange={(v) => {
            setType(v);
            setPage(1);
          }}
          options={[
            { value: "", label: "Tudo" },
            { value: "produto", label: "Produtos" },
            { value: "cupom", label: "Cupons" },
            { value: "aula", label: "Cronograma" },
            { value: "entrega", label: "Entregas" },
            { value: "acesso", label: "Acessos" },
          ]}
        />
      </div>

      {error && <ErrorBox message={error} onRetry={load} />}
      {!data && !error && <Loading />}
      {data && data.logs.length === 0 && <Empty icon={History} title="Nada registrado" />}

      {data && data.logs.length > 0 && (
        <Card className="divide-y divide-white/5">
          {data.logs.map((log) => {
            const info = describeLog(log.action);
            const detail = detailText(log.details);
            return (
              <div key={log.id} className="flex items-start gap-3 px-4 py-3">
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/5">
                  <info.icon size={15} className="text-[#A0A0A0]" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-[#C0C0C8]">
                    <span className="font-semibold text-white">{log.actor}</span> {info.label}
                    {log.target && <span className="text-white"> {log.target}</span>}
                  </p>
                  {detail && <p className="mt-0.5 break-words text-[11px] text-[#7a7a90]">{detail}</p>}
                </div>
                <span className="shrink-0 text-[11px] text-[#7a7a90]">{dateTime(log.createdAt)}</span>
              </div>
            );
          })}
        </Card>
      )}

      {data && data.pagination.totalPages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-3 text-sm text-[#A0A0A0]">
          <Btn variant="ghost" icon={ChevronLeft} disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            Anterior
          </Btn>
          Página {data.pagination.page} de {data.pagination.totalPages}
          <Btn variant="ghost" disabled={page >= data.pagination.totalPages} onClick={() => setPage((p) => p + 1)}>
            Próxima <ChevronRight size={16} />
          </Btn>
        </div>
      )}
    </>
  );
}
