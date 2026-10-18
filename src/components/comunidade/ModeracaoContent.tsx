"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, Flag, Ban, Lock, EyeOff, ShieldCheck } from "lucide-react";
import { PageHero } from "@/components/ui/PageHero";
import { api, type Author, AuthorName, Avatar, EmptyState, TopicRow, type TopicSummary } from "@/components/comunidade/shared";

interface ModerationResponse {
  reports: { open: TopicSummary[]; resolved: TopicSummary[] };
  bans: { user: Author; until: string; permanent: boolean; reason: string | null; by: Author | null }[];
  counts: { openReports: number; bans: number; locked: number; private: number };
}

export function ModeracaoContent() {
  const [data, setData] = useState<ModerationResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<ModerationResponse>("/api/forum/moderacao").then((res) => {
      if (res.ok) setData(res.data);
      else setError(res.error);
    });
  }, []);

  const breadcrumbs = [{ label: "Home", href: "/" }, { label: "Comunidade", href: "/comunidade" }, { label: "Moderação" }];

  if (error) {
    return (
      <>
        <PageHero title="MODERAÇÃO" breadcrumbs={breadcrumbs} />
        <div className="mx-auto max-w-7xl px-4 pb-16 lg:px-6">
          <EmptyState title={error} />
        </div>
      </>
    );
  }

  if (!data) {
    return (
      <>
        <PageHero title="MODERAÇÃO" breadcrumbs={breadcrumbs} />
        <div className="flex justify-center py-20">
          <Loader2 size={32} className="animate-spin text-green-cs" />
        </div>
      </>
    );
  }

  const cards = [
    { icon: Flag, label: "Denúncias abertas", value: data.counts.openReports, cor: "#E53935" },
    { icon: Ban, label: "Suspensões ativas", value: data.counts.bans, cor: "#FFC107" },
    { icon: Lock, label: "Tópicos fechados", value: data.counts.locked, cor: "#A0A0A0" },
    { icon: EyeOff, label: "Tópicos privados", value: data.counts.private, cor: "#9C27B0" },
  ];

  return (
    <>
      <PageHero
        title="MODERAÇÃO"
        subtitle="Denúncias pendentes e suspensões do fórum. As ações ficam em cada tópico e na página do membro."
        breadcrumbs={breadcrumbs}
      />

      <div className="mx-auto max-w-7xl px-4 pb-16 lg:px-6">
        <div className="mb-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {cards.map((c) => (
            <div key={c.label} className="rounded-xl border border-white/10 bg-bg-card/50 p-4">
              <c.icon size={18} style={{ color: c.cor }} aria-hidden="true" />
              <p className="mt-2 text-lg font-bold text-white">{c.value}</p>
              <p className="text-xs text-[#A0A0A0]">{c.label}</p>
            </div>
          ))}
        </div>

        <section aria-label="Denúncias abertas" className="mb-10">
          <h2 className="mb-3 flex items-center gap-2 text-lg font-bold text-white">
            <Flag size={18} className="text-error" /> Denúncias abertas
          </h2>
          {data.reports.open.length > 0 ? (
            <div className="space-y-2">
              {data.reports.open.map((t) => (
                <TopicRow key={t.id} topic={t} />
              ))}
            </div>
          ) : (
            <p className="text-sm text-[#A0A0A0]">Nenhuma denúncia pendente. Para encerrar uma, abra o tópico e marque como resolvido.</p>
          )}
        </section>

        <section aria-label="Suspensões ativas" className="mb-10">
          <h2 className="mb-3 flex items-center gap-2 text-lg font-bold text-white">
            <Ban size={18} className="text-warning" /> Suspensões ativas
          </h2>
          {data.bans.length > 0 ? (
            <div className="space-y-2">
              {data.bans.map((b) => (
                <div key={b.user.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-white/10 bg-bg-card/50 p-4">
                  <Avatar author={b.user} size={32} />
                  <div className="min-w-0 flex-1">
                    <AuthorName author={b.user} />
                    <p className="text-xs text-[#A0A0A0]">
                      {b.permanent ? "Permanente" : `Até ${new Date(b.until).toLocaleDateString("pt-BR")}`}
                      {b.reason && <> · {b.reason}</>}
                      {b.by && <> · por {b.by.username}</>}
                    </p>
                  </div>
                  <Link href={`/comunidade/membro/${b.user.username}`} className="text-xs text-green-cs hover:underline">
                    Abrir perfil
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-[#A0A0A0]">Nenhuma suspensão em vigor. Para suspender alguém, use o botão na página do membro.</p>
          )}
        </section>

        {data.reports.resolved.length > 0 && (
          <section aria-label="Denúncias encerradas">
            <h2 className="mb-3 flex items-center gap-2 text-lg font-bold text-white">
              <ShieldCheck size={18} className="text-green-cs" /> Denúncias encerradas recentemente
            </h2>
            <div className="space-y-2">
              {data.reports.resolved.map((t) => (
                <TopicRow key={t.id} topic={t} />
              ))}
            </div>
          </section>
        )}
      </div>
    </>
  );
}
