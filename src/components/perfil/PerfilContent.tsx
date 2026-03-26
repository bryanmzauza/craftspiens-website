"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
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
  Loader2,
} from "lucide-react";
import { PageHero } from "@/components/ui/PageHero";

type ProfileData = {
  id: string;
  username: string;
  email: string;
  role: string;
  birthDate: string | null;
  createdAt: string;
  nlogin: {
    uuid: string | null;
    lastSeen: string;
    creationDate: string;
  };
  profile: {
    bio: string | null;
    avatar: string | null;
    sapiensCoins: number;
    xp: number;
    playtimeMinutes: number;
    aulasConcluidas: number;
    rankingPosition: number | null;
    perfilPublico: boolean;
    mostrarTempoOnline: boolean;
    mostrarAtividade: boolean;
  } | null;
  stats: {
    orders: number;
    posts: number;
    comments: number;
  };
};

function formatPlaytime(minutes: number): string {
  if (minutes < 60) return `${minutes}min`;
  return `${Math.floor(minutes / 60)}h`;
}

function formatRelativeDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) return "Agora";
  if (diffMin < 60) return `Há ${diffMin}min`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `Hoje ${date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`;
  if (diffHours < 48) return "Ontem";
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

function getRoleLabel(role: string): { label: string; color: string } {
  const roles: Record<string, { label: string; color: string }> = {
    ADMIN: { label: "Admin", color: "#E53935" },
    MODERADOR: { label: "Moderador", color: "#FF9800" },
    PROFESSOR: { label: "Professor", color: "#2196F3" },
    ALUNO: { label: "Aluno", color: "#4CAF50" },
  };
  return roles[role] || roles.ALUNO;
}

function getReputationBadge(posts: number, comments: number): { label: string; icon: string } {
  const total = posts * 2 + comments;
  if (total >= 200) return { label: "Lenda", icon: "💎" };
  if (total >= 50) return { label: "Veterano", icon: "🏆" };
  if (total >= 10) return { label: "Membro", icon: "⭐" };
  return { label: "Novato", icon: "🌱" };
}

// Dados de progresso ainda são mock (virão de API de aulas futura)
const MOCK_PROGRESS = [
  { disciplina: "Matemática", concluidas: 8, total: 12, cor: "#2196F3" },
  { disciplina: "Português", concluidas: 6, total: 10, cor: "#E91E63" },
  { disciplina: "História", concluidas: 2, total: 10, cor: "#FF5722" },
  { disciplina: "Geografia", concluidas: 5, total: 10, cor: "#FF9800" },
  { disciplina: "Ciências", concluidas: 3, total: 8, cor: "#4CAF50" },
  { disciplina: "Programação", concluidas: 2, total: 4, cor: "#00BCD4" },
];

// Atividade recente ainda é mock (virá de API de atividade futura)
const MOCK_ACTIVITY = [
  { icon: LogIn, text: "Entrou no servidor", tempo: "Hoje 14:30", cor: "#4CAF50" },
  { icon: BookOpen, text: "Concluiu aula de Matemática (#8)", tempo: "Hoje 10:00", cor: "#2196F3" },
  { icon: MessageSquare, text: 'Postou no fórum: "Melhor aula!"', tempo: "Ontem", cor: "#9C27B0" },
  { icon: ShoppingCart, text: "Comprou VIP+ Mensal (R$ 29,90)", tempo: "18/03", cor: "#FFD700" },
  { icon: Award, text: "Atingiu 8.000 XP", tempo: "17/03", cor: "#FF9800" },
  { icon: Zap, text: "Desbloqueou conquista: 100h online", tempo: "15/03", cor: "#E91E63" },
];

export function PerfilContent() {
  const { data: session } = useSession();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAllProgress, setShowAllProgress] = useState(false);

  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await fetch("/api/perfil");
        if (res.ok) {
          setProfile(await res.json());
        }
      } catch {
        // Silently fail — will show fallback data
      } finally {
        setLoading(false);
      }
    }
    if (session?.user) fetchProfile();
  }, [session]);

  const username = profile?.username || session?.user?.username || "Jogador";
  const avatarUrl = profile?.nlogin?.uuid
    ? `https://mc-heads.net/avatar/${profile.nlogin.uuid}/100`
    : `https://mc-heads.net/avatar/${username}/100`;
  const roleInfo = getRoleLabel(profile?.role || session?.user?.role || "ALUNO");
  const reputation = getReputationBadge(profile?.stats?.posts || 0, profile?.stats?.comments || 0);
  const memberSince = profile?.createdAt
    ? new Date(profile.createdAt).toLocaleDateString("pt-BR", { month: "short", year: "numeric" })
    : "";
  const lastAccess = profile?.nlogin?.lastSeen
    ? formatRelativeDate(profile.nlogin.lastSeen)
    : "";

  const stats = [
    { icon: Coins, label: "Moedas SAPIENS", value: profile?.profile?.sapiensCoins?.toLocaleString("pt-BR") || "0", cor: "#FFD700" },
    { icon: Star, label: "XP Total", value: profile?.profile?.xp?.toLocaleString("pt-BR") || "0", cor: "#9C27B0" },
    { icon: Clock, label: "Tempo Online", value: formatPlaytime(profile?.profile?.playtimeMinutes || 0), cor: "#2196F3" },
    { icon: BookOpen, label: "Aulas Concluídas", value: String(profile?.profile?.aulasConcluidas || 0), cor: "#4CAF50" },
    { icon: Trophy, label: "Ranking Geral", value: profile?.profile?.rankingPosition ? `#${profile.profile.rankingPosition}` : "—", cor: "#FF9800" },
    { icon: Crown, label: "Plano Atual", value: roleInfo.label, cor: roleInfo.color },
  ];

  const visibleProgress = showAllProgress ? MOCK_PROGRESS : MOCK_PROGRESS.slice(0, 4);

  if (loading) {
    return (
      <>
        <PageHero
          title="MEU PERFIL"
          breadcrumbs={[{ label: "Home", href: "/" }, { label: "Perfil" }]}
        />
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-green-cs" />
        </div>
      </>
    );
  }

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
                src={avatarUrl}
                alt={username}
                className="h-full w-full object-cover"
              />
            </div>
          </div>

          <div className="flex-1 text-center sm:text-left">
            <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
              <h2 className="text-xl font-bold text-white">{username}</h2>
              <span
                className="rounded px-2 py-0.5 text-xs font-bold text-white"
                style={{ backgroundColor: roleInfo.color }}
              >
                {roleInfo.label}
              </span>
              <span className="rounded bg-white/10 px-2 py-0.5 text-xs text-[#A0A0A0]">
                {reputation.icon} {reputation.label}
              </span>
            </div>
            <p className="mt-1 text-sm text-[#A0A0A0]">
              {memberSince && <>Membro desde {memberSince}</>}
              {lastAccess && <> · Último acesso: {lastAccess}</>}
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
          {stats.map((stat, i) => {
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
