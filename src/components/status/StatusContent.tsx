"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import {
  WifiOff,
  Users,
  Server,
  MonitorSmartphone,
  RefreshCw,
} from "lucide-react";
import { PageHero } from "@/components/ui/PageHero";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { HowToConnect } from "@/components/status/HowToConnect";

interface ServerStatus {
  online: boolean;
  players: { online: number; max: number };
  version: string;
  motd: string;
}

interface RankingEntry {
  position: number;
  username: string;
  uuid: string | null;
  aulas: number;
}

export function StatusContent() {
  const [status, setStatus] = useState<ServerStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [ranking, setRanking] = useState<RankingEntry[]>([]);
  const [rankingLoading, setRankingLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/server-status");
      const data: ServerStatus = await res.json();
      setStatus(data);
      setLastUpdate(new Date());
    } catch {
      setStatus({ online: false, players: { online: 0, max: 0 }, version: "", motd: "" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 15000);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  useEffect(() => {
    async function fetchRanking() {
      try {
        const res = await fetch("/api/ranking");
        if (res.ok) {
          const data = await res.json();
          setRanking(data.ranking ?? []);
        }
      } catch {
        // silently fail — ranking fica oculto
      } finally {
        setRankingLoading(false);
      }
    }
    fetchRanking();
  }, []);

  return (
    <>
      <PageHero
        title="STATUS DO SERVIDOR"
        subtitle="Informações em tempo real sobre o servidor Minecraft."
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Status" },
        ]}
      />

      {/* Server Status Panel */}
      <section className="pb-16">
        <div className="mx-auto max-w-4xl px-4 lg:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur"
          >
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <RefreshCw className="h-8 w-8 animate-spin text-green-cs" />
              </div>
            ) : (
              <>
                {/* Status indicator */}
                <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
                  <div className="flex items-center gap-3">
                    {status?.online ? (
                      <>
                        <span className="relative flex h-4 w-4">
                          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-cs opacity-75" />
                          <span className="relative inline-flex h-4 w-4 rounded-full bg-green-cs" />
                        </span>
                        <span className="text-xl font-bold text-green-cs">ONLINE</span>
                      </>
                    ) : (
                      <>
                        <WifiOff className="h-5 w-5 text-error" />
                        <span className="text-xl font-bold text-error">OFFLINE</span>
                      </>
                    )}
                  </div>

                  {lastUpdate && (
                    <span className="text-xs text-[#A0A0A0]">
                      Atualizado: {lastUpdate.toLocaleTimeString("pt-BR")}
                    </span>
                  )}
                </div>

                {/* Stats Grid */}
                <div className="mt-8 grid gap-4 sm:grid-cols-3">
                  <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-center">
                    <Users className="mx-auto h-6 w-6 text-green-cs" />
                    <p className="mt-2 text-2xl font-bold text-white">
                      {status?.players.online ?? 0}
                      <span className="text-sm font-normal text-[#A0A0A0]">
                        /{status?.players.max ?? 0}
                      </span>
                    </p>
                    <p className="text-xs text-[#A0A0A0]">Jogadores</p>
                  </div>

                  <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-center">
                    <Server className="mx-auto h-6 w-6 text-green-cs" />
                    <p className="mt-2 text-lg font-bold text-white">
                      {status?.version || "—"}
                    </p>
                    <p className="text-xs text-[#A0A0A0]">Versões (Java)</p>
                  </div>

                  <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-center">
                    <MonitorSmartphone className="mx-auto h-6 w-6 text-green-cs" />
                    <p className="mt-2 text-lg font-bold text-white">Java e Bedrock</p>
                    <p className="text-xs text-[#A0A0A0]">Edições aceitas</p>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        </div>
      </section>

      <HowToConnect />

      {/* Ranking de aulas */}
      {rankingLoading ? (
        <div className="flex items-center justify-center pb-24">
          <RefreshCw className="h-6 w-6 animate-spin text-green-cs" />
        </div>
      ) : (
        ranking.length > 0 && (
          <section className="pb-24">
            <div className="mx-auto max-w-4xl px-4 lg:px-6">
              <SectionTitle className="text-center">TOP AULAS</SectionTitle>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="mt-8 overflow-hidden rounded-xl border border-white/10 bg-white/5 backdrop-blur"
              >
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/10 text-left text-xs uppercase text-[#A0A0A0]">
                      <th className="px-6 py-3 w-16">#</th>
                      <th className="px-6 py-3">Jogador</th>
                      <th className="px-6 py-3 text-right">Aulas concluídas</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ranking.map((entry) => (
                      <tr
                        key={entry.position}
                        className="border-b border-white/5 transition-colors hover:bg-white/5"
                      >
                        <td className="px-6 py-3">
                          <span
                            className={`font-bold ${
                              entry.position === 1
                                ? "text-premium"
                                : entry.position === 2
                                ? "text-[#C0C0C0]"
                                : entry.position === 3
                                ? "text-brown"
                                : "text-[#A0A0A0]"
                            }`}
                          >
                            {entry.position}º
                          </span>
                        </td>
                        <td className="px-6 py-3 font-medium text-white">
                          {entry.username}
                        </td>
                        <td className="px-6 py-3 text-right text-sm font-bold text-green-cs">
                          {entry.aulas} {entry.aulas === 1 ? "aula" : "aulas"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </motion.div>

              <p className="mt-4 text-center text-xs text-[#A0A0A0]">
                Ranking dos alunos com mais aulas concluídas. Apenas perfis públicos são exibidos.
              </p>
            </div>
          </section>
        )
      )}
    </>
  );
}
