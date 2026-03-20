"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  Coins,
  Star,
  Clock,
  BookOpen,
  Trophy,
  Crown,
  Settings,
  ShoppingBag,
  BarChart3,
  Edit,
  LogIn,
  MessageSquare,
  Award,
  ShoppingCart,
  Zap,
} from "lucide-react";
import { PageHero } from "@/components/ui/PageHero";
import { SectionTitle } from "@/components/ui/SectionTitle";

const MOCK_PLAYER = {
  username: "SteveJogador123",
  rank: "VIP+",
  rankCor: "#FFD700",
  reputacao: "Veterano",
  reputacaoIcon: "🏆",
  membroDesde: "Mar 2025",
  ultimoAcesso: "Hoje 14:30",
  avatarUrl: "https://mc-heads.net/avatar/MHF_Steve/100",
};

const MOCK_STATS = [
  { icon: Coins, label: "Moedas SAPIENS", value: "1.250", cor: "#FFD700" },
  { icon: Star, label: "XP Total", value: "8.430", cor: "#9C27B0" },
  { icon: Clock, label: "Tempo Online", value: "127h", cor: "#2196F3" },
  { icon: BookOpen, label: "Aulas Concluídas", value: "26", cor: "#4CAF50" },
  { icon: Trophy, label: "Ranking Geral", value: "#42", cor: "#FF9800" },
  { icon: Crown, label: "Plano Atual", value: "VIP+", subvalue: "Expira 15/04/26", cor: "#FFD700" },
];

const MOCK_PROGRESS = [
  { disciplina: "Matemática", concluidas: 8, total: 12, cor: "#2196F3" },
  { disciplina: "Português", concluidas: 6, total: 10, cor: "#E91E63" },
  { disciplina: "História", concluidas: 2, total: 10, cor: "#FF5722" },
  { disciplina: "Geografia", concluidas: 5, total: 10, cor: "#FF9800" },
  { disciplina: "Ciências", concluidas: 3, total: 8, cor: "#4CAF50" },
  { disciplina: "Programação", concluidas: 2, total: 4, cor: "#00BCD4" },
];

const MOCK_ACTIVITY = [
  { icon: LogIn, text: "Entrou no servidor", tempo: "Hoje 14:30", cor: "#4CAF50" },
  { icon: BookOpen, text: "Concluiu aula de Matemática (#8)", tempo: "Hoje 10:00", cor: "#2196F3" },
  { icon: MessageSquare, text: 'Postou no fórum: "Melhor aula!"', tempo: "Ontem", cor: "#9C27B0" },
  { icon: ShoppingCart, text: "Comprou VIP+ Mensal (R$ 29,90)", tempo: "18/03", cor: "#FFD700" },
  { icon: Award, text: "Atingiu 8.000 XP", tempo: "17/03", cor: "#FF9800" },
  { icon: Zap, text: "Desbloqueou conquista: 100h online", tempo: "15/03", cor: "#E91E63" },
];

export function PerfilContent() {
  const [showAllProgress, setShowAllProgress] = useState(false);
  const visibleProgress = showAllProgress ? MOCK_PROGRESS : MOCK_PROGRESS.slice(0, 4);

  return (
    <>
      <PageHero
        title="MEU PERFIL"
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Perfil" }]}
      />

      <div className="mx-auto max-w-7xl px-4 pb-16 lg:px-6">
        {/* Header do perfil */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 flex flex-col items-center gap-6 rounded-2xl border border-white/10 bg-bg-card/50 p-6 sm:flex-row sm:items-start"
        >
          <div className="relative">
            <div className="h-24 w-24 overflow-hidden rounded-xl border-2 border-white/20 bg-bg-accent">
              <img
                src={MOCK_PLAYER.avatarUrl}
                alt={MOCK_PLAYER.username}
                className="h-full w-full object-cover"
              />
            </div>
          </div>

          <div className="flex-1 text-center sm:text-left">
            <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
              <h2 className="text-xl font-bold text-white">{MOCK_PLAYER.username}</h2>
              <span
                className="rounded px-2 py-0.5 text-xs font-bold text-white"
                style={{ backgroundColor: MOCK_PLAYER.rankCor }}
              >
                {MOCK_PLAYER.rank}
              </span>
              <span className="rounded bg-white/10 px-2 py-0.5 text-xs text-[#A0A0A0]">
                {MOCK_PLAYER.reputacaoIcon} {MOCK_PLAYER.reputacao}
              </span>
            </div>
            <p className="mt-1 text-sm text-[#A0A0A0]">
              Membro desde {MOCK_PLAYER.membroDesde} · Último acesso: {MOCK_PLAYER.ultimoAcesso}
            </p>
          </div>

          <Link
            href="/perfil/configuracoes"
            className="flex items-center gap-1.5 rounded-lg border border-white/20 px-4 py-2 text-sm text-white transition-colors hover:bg-white/10"
          >
            <Edit size={16} /> Editar Perfil
          </Link>
        </motion.div>

        {/* Cards de estatísticas */}
        <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {MOCK_STATS.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="rounded-xl border border-white/10 bg-bg-card/50 p-4 text-center"
              >
                <Icon size={20} className="mx-auto mb-2" style={{ color: stat.cor }} />
                <p className="text-xl font-bold text-white">{stat.value}</p>
                <p className="text-[10px] text-[#A0A0A0]">{stat.label}</p>
                {stat.subvalue && (
                  <p className="mt-1 text-[10px] text-[#A0A0A0]">{stat.subvalue}</p>
                )}
              </motion.div>
            );
          })}
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Progresso de Aulas */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-2xl border border-white/10 bg-bg-card/50 p-6"
          >
            <h3 className="mb-4 font-[family-name:var(--font-press-start)] text-xs text-white">
              PROGRESSO DE AULAS
            </h3>
            <div className="space-y-4">
              {visibleProgress.map((item) => {
                const percent = Math.round((item.concluidas / item.total) * 100);
                return (
                  <div key={item.disciplina}>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span className="text-white">{item.disciplina}</span>
                      <span className="text-xs text-[#A0A0A0]">
                        {item.concluidas}/{item.total} ({percent}%)
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-white/10">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${percent}%` }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="h-full rounded-full"
                        style={{ backgroundColor: item.cor }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
            {MOCK_PROGRESS.length > 4 && (
              <button
                onClick={() => setShowAllProgress(!showAllProgress)}
                className="mt-4 text-sm font-medium text-green-cs transition-colors hover:text-green-light"
              >
                {showAllProgress ? "Ver menos" : "Ver todas →"}
              </button>
            )}
          </motion.section>

          {/* Atividade Recente */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="rounded-2xl border border-white/10 bg-bg-card/50 p-6"
          >
            <h3 className="mb-4 font-[family-name:var(--font-press-start)] text-xs text-white">
              ATIVIDADE RECENTE
            </h3>
            <div className="space-y-3">
              {MOCK_ACTIVITY.map((item, i) => {
                const Icon = item.icon;
                return (
                  <div key={i} className="flex items-start gap-3">
                    <div
                      className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
                      style={{ backgroundColor: `${item.cor}15` }}
                    >
                      <Icon size={14} style={{ color: item.cor }} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-white">{item.text}</p>
                      <p className="text-xs text-[#A0A0A0]">{item.tempo}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.section>
        </div>

        {/* Links de navegação */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-8 grid gap-3 sm:grid-cols-3"
        >
          <Link
            href="/perfil/compras"
            className="flex items-center gap-3 rounded-xl border border-white/10 bg-bg-card/50 p-4 transition-all hover:border-white/20"
          >
            <ShoppingBag size={20} className="text-green-cs" />
            <span className="font-medium text-white">Minhas Compras</span>
          </Link>
          <Link
            href="/perfil/configuracoes"
            className="flex items-center gap-3 rounded-xl border border-white/10 bg-bg-card/50 p-4 transition-all hover:border-white/20"
          >
            <Settings size={20} className="text-green-cs" />
            <span className="font-medium text-white">Configurações</span>
          </Link>
          <Link
            href="/status"
            className="flex items-center gap-3 rounded-xl border border-white/10 bg-bg-card/50 p-4 transition-all hover:border-white/20"
          >
            <BarChart3 size={20} className="text-green-cs" />
            <span className="font-medium text-white">Meu Ranking</span>
          </Link>
        </motion.div>
      </div>
    </>
  );
}
