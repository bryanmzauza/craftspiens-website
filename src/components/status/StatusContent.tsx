"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Wifi,
  WifiOff,
  Users,
  Server,
  Copy,
  Check,
  RefreshCw,
} from "lucide-react";
import { PageHero } from "@/components/ui/PageHero";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { SERVER_IP } from "@/lib/constants";

interface ServerStatus {
  online: boolean;
  players: { online: number; max: number };
  version: string;
  motd: string;
}

const MOCK_RANKINGS = {
  xp: [
    { rank: 1, player: "ProGamer_X", value: "15.420 XP" },
    { rank: 2, player: "CraftMaster99", value: "12.880 XP" },
    { rank: 3, player: "SapiensPro", value: "11.230 XP" },
    { rank: 4, player: "BlockBuilder", value: "9.750 XP" },
    { rank: 5, player: "RedstoneKing", value: "8.910 XP" },
  ],
  coins: [
    { rank: 1, player: "CraftMaster99", value: "8.500 🪙" },
    { rank: 2, player: "ProGamer_X", value: "7.200 🪙" },
    { rank: 3, player: "DiamondHunter", value: "6.800 🪙" },
    { rank: 4, player: "SapiensPro", value: "5.900 🪙" },
    { rank: 5, player: "RedstoneKing", value: "5.100 🪙" },
  ],
  playtime: [
    { rank: 1, player: "ProGamer_X", value: "342h" },
    { rank: 2, player: "SapiensPro", value: "298h" },
    { rank: 3, player: "CraftMaster99", value: "271h" },
    { rank: 4, player: "BlockBuilder", value: "215h" },
    { rank: 5, player: "MineExplorer", value: "189h" },
  ],
  aulas: [
    { rank: 1, player: "SapiensPro", value: "28 aulas" },
    { rank: 2, player: "ProGamer_X", value: "25 aulas" },
    { rank: 3, player: "CraftMaster99", value: "22 aulas" },
    { rank: 4, player: "StudyHard", value: "19 aulas" },
    { rank: 5, player: "DiamondHunter", value: "17 aulas" },
  ],
};

type RankingTab = keyof typeof MOCK_RANKINGS;

const RANKING_TABS: { key: RankingTab; label: string }[] = [
  { key: "xp", label: "Top XP" },
  { key: "coins", label: "Top Moedas" },
  { key: "playtime", label: "Top Tempo" },
  { key: "aulas", label: "Top Aulas" },
];

export function StatusContent() {
  const [status, setStatus] = useState<ServerStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [rankingTab, setRankingTab] = useState<RankingTab>("xp");
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

  const copyIp = async () => {
    await navigator.clipboard.writeText(SERVER_IP);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

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
                <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
                    <p className="text-xs text-[#A0A0A0]">Versão</p>
                  </div>

                  <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-center">
                    <Wifi className="mx-auto h-6 w-6 text-green-cs" />
                    <p className="mt-2 text-lg font-bold text-white">
                      {status?.motd || "—"}
                    </p>
                    <p className="text-xs text-[#A0A0A0]">MOTD</p>
                  </div>

                  <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-center">
                    <button
                      onClick={copyIp}
                      className="mx-auto flex items-center gap-2 transition-colors hover:text-green-cs"
                    >
                      <span className="font-[family-name:var(--font-jetbrains-mono)] text-sm text-white">
                        {SERVER_IP}
                      </span>
                      {copied ? (
                        <Check size={14} className="text-green-cs" />
                      ) : (
                        <Copy size={14} className="text-[#A0A0A0]" />
                      )}
                    </button>
                    <p className="mt-2 text-xs text-[#A0A0A0]">IP do Servidor</p>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        </div>
      </section>

      {/* Rankings */}
      <section className="pb-24">
        <div className="mx-auto max-w-4xl px-4 lg:px-6">
          <SectionTitle className="text-center">RANKINGS</SectionTitle>

          <div className="mt-8 flex flex-wrap justify-center gap-2">
            {RANKING_TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setRankingTab(tab.key)}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                  rankingTab === tab.key
                    ? "bg-green-cs text-white"
                    : "bg-white/5 text-[#A0A0A0] hover:bg-white/10 hover:text-white"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <motion.div
            key={rankingTab}
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
                  <th className="px-6 py-3 text-right">Valor</th>
                </tr>
              </thead>
              <tbody>
                {MOCK_RANKINGS[rankingTab].map((entry) => (
                  <tr
                    key={entry.rank}
                    className="border-b border-white/5 transition-colors hover:bg-white/5"
                  >
                    <td className="px-6 py-3">
                      <span
                        className={`font-bold ${
                          entry.rank === 1
                            ? "text-premium"
                            : entry.rank === 2
                            ? "text-[#C0C0C0]"
                            : entry.rank === 3
                            ? "text-brown"
                            : "text-[#A0A0A0]"
                        }`}
                      >
                        {entry.rank}º
                      </span>
                    </td>
                    <td className="px-6 py-3 font-medium text-white">
                      {entry.player}
                    </td>
                    <td className="px-6 py-3 text-right text-sm font-bold text-green-cs">
                      {entry.value}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </motion.div>

          <p className="mt-4 text-center text-xs text-[#A0A0A0]">
            Rankings atualizados a cada 5 minutos. Dados do servidor serão integrados na próxima versão.
          </p>
        </div>
      </section>
    </>
  );
}
