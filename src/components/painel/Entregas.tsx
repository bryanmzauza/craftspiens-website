"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CheckCircle2, RefreshCw, RotateCcw, Truck } from "lucide-react";
import {
  Badge,
  Btn,
  Card,
  DELIVERY_STATUS,
  Empty,
  ErrorBox,
  Loading,
  PageHeader,
  Segmented,
  dateTime,
  panelApi,
  usePanelData,
  timeAgo,
  useToast,
} from "@/components/painel/ui";
import type { PanelDelivery } from "@/components/painel/types";

type Filter = "atencao" | "fila" | "entregues" | "todas";

interface Response {
  deliveries: (PanelDelivery & { orderId: string; stuck: boolean })[];
  counts: { atencao: number; fila: number; entregues: number; falhas: number };
}

export function Entregas() {
  const toast = useToast();
  const [filter, setFilter] = useState<Filter>("atencao");
  const { data, error, reload: load } = usePanelData<Response>(`/api/painel/entregas?filtro=${filter}`);
  const [busy, setBusy] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // A fila muda sozinha enquanto o plugin trabalha: atualiza a cada 20 s
  useEffect(() => {
    const timer = setInterval(() => {
      if (document.visibilityState === "visible") load();
    }, 20_000);
    return () => clearInterval(timer);
  }, [load]);

  async function retry(id: string) {
    setBusy(id);
    const res = await panelApi(`/api/painel/entregas/${id}`, { method: "POST", json: { acao: "reenviar" } });
    setBusy(null);
    if (!res.ok) return toast("erro", res.error);
    toast("ok", "Entrega devolvida à fila do plugin.");
    load();
  }

  return (
    <>
      <PageHeader
        title="ENTREGAS"
        description="O que o plugin do lobby precisa entregar no jogo. Falhas ficam aqui até alguém reenviar."
        actions={
          <Btn
            icon={RefreshCw}
            loading={refreshing}
            onClick={async () => {
              setRefreshing(true);
              await load();
              setRefreshing(false);
            }}
          >
            Atualizar
          </Btn>
        }
      />

      <div className="mb-4">
        <Segmented
          value={filter}
          onChange={setFilter}
          options={[
            { value: "atencao", label: "Precisa de atenção", count: data?.counts.atencao },
            { value: "fila", label: "Na fila", count: data?.counts.fila },
            { value: "entregues", label: "Entregues", count: data?.counts.entregues },
            { value: "todas", label: "Todas" },
          ]}
        />
      </div>

      {error && <ErrorBox message={error} onRetry={load} />}
      {!data && !error && <Loading />}

      {data && data.deliveries.length === 0 && (
        <Empty icon={filter === "atencao" ? CheckCircle2 : Truck} title={filter === "atencao" ? "Tudo em dia" : "Nada por aqui"}>
          {filter === "atencao" ? "Nenhuma entrega com falha ou travada." : "Nenhuma entrega neste filtro."}
        </Empty>
      )}

      {data && data.deliveries.length > 0 && (
        <Card className="divide-y divide-white/5">
          {data.deliveries.map((d) => {
            const stuck = d.status === "PROCESSING" && d.stuck;
            return (
              <div key={d.id} className="flex flex-wrap items-start gap-3 px-4 py-3.5 sm:flex-nowrap">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`https://mc-heads.net/avatar/${d.username}/36`} alt="" width={36} height={36} className="shrink-0 rounded" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-sm font-semibold text-white">{d.username}</span>
                    <span className="text-sm text-[#A0A0A0]">· {d.productName}</span>
                    {d.kind === "REVOKE" && <Badge tone="red">Estorno</Badge>}
                    <Badge tone={DELIVERY_STATUS[d.status].tone}>{stuck ? "Travada" : DELIVERY_STATUS[d.status].label}</Badge>
                    {d.requiresOnline && d.status === "PENDING" && <Badge tone="blue">Ao entrar no servidor</Badge>}
                  </div>
                  <p className="mt-0.5 text-[11px] text-[#7a7a90]">
                    {d.platform === "BEDROCK" ? "Bedrock" : "Java"} · {d.attempts} {d.attempts === 1 ? "tentativa" : "tentativas"} · criada{" "}
                    {timeAgo(d.createdAt)}
                    {d.claimedBy && d.status === "PROCESSING" && ` · com ${d.claimedBy}`}
                    {d.deliveredAt && ` · entregue ${dateTime(d.deliveredAt)} em ${d.deliveredBy}`}
                  </p>
                  {d.lastError && d.status !== "DELIVERED" && (
                    <p className="mt-2 break-words rounded-lg bg-error/10 px-2.5 py-1.5 font-[family-name:var(--font-jetbrains-mono)] text-[11px] text-[#ffb4b1]">
                      {d.lastError}
                    </p>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Link href={`/painel/vendas?pedido=${d.orderId}`} className="text-xs text-[#A0A0A0] hover:text-white hover:underline">
                    Pedido
                  </Link>
                  {(d.status === "FAILED" || stuck || (d.status === "PENDING" && d.lastError && !d.requiresOnline)) && (
                    <Btn icon={RotateCcw} loading={busy === d.id} onClick={() => retry(d.id)}>
                      Reenviar
                    </Btn>
                  )}
                </div>
              </div>
            );
          })}
        </Card>
      )}

      <p className="mt-6 text-[11px] text-[#7a7a90]">
        Reenviar zera as tentativas e devolve a entrega à fila; o plugin pega na próxima consulta. Antes de reenviar uma falha,
        confira o erro: se o comando do plugin estiver errado, a entrega vai falhar de novo.
      </p>
    </>
  );
}
