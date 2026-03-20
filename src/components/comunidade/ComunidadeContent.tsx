"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Search,
  MessageSquare,
  Eye,
  Pin,
  Lock,
  CheckCircle,
  Users,
  TrendingUp,
  Plus,
  Megaphone,
  HelpCircle,
  Lightbulb,
  Bug,
  Trophy,
  Gamepad2,
  Clock,
} from "lucide-react";
import Link from "next/link";
import { PageHero } from "@/components/ui/PageHero";

interface ForumCategory {
  id: number;
  nome: string;
  slug: string;
  descricao: string;
  icone: string;
  icon: typeof MessageSquare;
  cor: string;
  totalTopicos: number;
  totalComentarios: number;
  ultimoPost: {
    titulo: string;
    autor: string;
    tempo: string;
  };
  somenteStaff: boolean;
}

interface Topic {
  id: number;
  titulo: string;
  slug: string;
  autor: { nome: string; avatar?: string; cargo?: string };
  dataCriacao: string;
  comentarios: number;
  views: number;
  fixado: boolean;
  fechado: boolean;
  resolvido: boolean;
  ultimaAtividade: string;
}

const CATEGORIES: ForumCategory[] = [
  {
    id: 1,
    nome: "Anúncios",
    slug: "anuncios",
    descricao: "Novidades oficiais da CraftSapiens",
    icone: "📢",
    icon: Megaphone,
    cor: "#FFD700",
    totalTopicos: 12,
    totalComentarios: 86,
    ultimoPost: { titulo: "Manutenção programada — 22/03", autor: "Admin", tempo: "2h atrás" },
    somenteStaff: true,
  },
  {
    id: 2,
    nome: "Geral",
    slug: "geral",
    descricao: "Discussões livres sobre a CraftSapiens",
    icone: "💬",
    icon: MessageSquare,
    cor: "#4CAF50",
    totalTopicos: 87,
    totalComentarios: 432,
    ultimoPost: { titulo: "Alguém mais teve lag hoje?", autor: "joao123", tempo: "15min" },
    somenteStaff: false,
  },
  {
    id: 3,
    nome: "Dúvidas de Aulas",
    slug: "duvidas",
    descricao: "Perguntas sobre disciplinas e conteúdos",
    icone: "❓",
    icon: HelpCircle,
    cor: "#2196F3",
    totalTopicos: 45,
    totalComentarios: 198,
    ultimoPost: { titulo: "Como resolver equações de 2º grau?", autor: "maria_mc", tempo: "1h atrás" },
    somenteStaff: false,
  },
  {
    id: 4,
    nome: "Sugestões",
    slug: "sugestoes",
    descricao: "Ideias para melhorar o servidor e a plataforma",
    icone: "💡",
    icon: Lightbulb,
    cor: "#FF9800",
    totalTopicos: 23,
    totalComentarios: 87,
    ultimoPost: { titulo: "Seria legal ter aula de música", autor: "pedro99", tempo: "3h atrás" },
    somenteStaff: false,
  },
  {
    id: 5,
    nome: "Bugs & Problemas",
    slug: "bugs",
    descricao: "Reportar problemas do servidor ou site",
    icone: "🐛",
    icon: Bug,
    cor: "#E53935",
    totalTopicos: 15,
    totalComentarios: 42,
    ultimoPost: { titulo: "Erro ao entrar no mapa de ciências", autor: "ana_gamer", tempo: "5h atrás" },
    somenteStaff: false,
  },
  {
    id: 6,
    nome: "Showroom",
    slug: "showroom",
    descricao: "Compartilhe construções e conquistas",
    icone: "🏗️",
    icon: Trophy,
    cor: "#9C27B0",
    totalTopicos: 34,
    totalComentarios: 215,
    ultimoPost: { titulo: "Minha réplica do Coliseu!", autor: "builder_pro", tempo: "30min" },
    somenteStaff: false,
  },
  {
    id: 7,
    nome: "Off-Topic",
    slug: "off-topic",
    descricao: "Assuntos gerais fora do tema",
    icone: "🎮",
    icon: Gamepad2,
    cor: "#00BCD4",
    totalTopicos: 56,
    totalComentarios: 370,
    ultimoPost: { titulo: "Vocês jogam outros jogos além de MC?", autor: "gamer_br", tempo: "45min" },
    somenteStaff: false,
  },
];

const MOCK_TOPICS: Record<string, Topic[]> = {
  geral: [
    {
      id: 1, titulo: "Regras do Fórum", slug: "regras-do-forum",
      autor: { nome: "Admin", cargo: "Staff" }, dataCriacao: "2026-01-01",
      comentarios: 32, views: 1240, fixado: true, fechado: true, resolvido: false, ultimaAtividade: "2h atrás",
    },
    {
      id: 2, titulo: "Bem-vindos à Comunidade CraftSapiens!", slug: "bem-vindos",
      autor: { nome: "Prof. Helton", cargo: "Staff" }, dataCriacao: "2026-01-01",
      comentarios: 15, views: 890, fixado: true, fechado: false, resolvido: false, ultimaAtividade: "5h atrás",
    },
    {
      id: 3, titulo: "Alguém mais teve lag hoje no servidor?", slug: "lag-servidor",
      autor: { nome: "joao123" }, dataCriacao: "2026-03-20",
      comentarios: 5, views: 67, fixado: false, fechado: false, resolvido: false, ultimaAtividade: "15min",
    },
    {
      id: 4, titulo: "Melhor aula da semana — Matemática com Prof. Camilli!", slug: "melhor-aula-semana",
      autor: { nome: "maria_mc" }, dataCriacao: "2026-03-19",
      comentarios: 12, views: 145, fixado: false, fechado: false, resolvido: false, ultimaAtividade: "5h atrás",
    },
    {
      id: 5, titulo: "Alguém quer jogar survival depois da aula?", slug: "jogar-survival",
      autor: { nome: "pedro99" }, dataCriacao: "2026-03-18",
      comentarios: 3, views: 42, fixado: false, fechado: false, resolvido: false, ultimaAtividade: "1d atrás",
    },
    {
      id: 6, titulo: "Quanto XP vocês têm?", slug: "quanto-xp",
      autor: { nome: "gamer_br" }, dataCriacao: "2026-03-17",
      comentarios: 18, views: 230, fixado: false, fechado: false, resolvido: false, ultimaAtividade: "2d atrás",
    },
  ],
};

const STATS = {
  totalTopicos: CATEGORIES.reduce((a, c) => a + c.totalTopicos, 0),
  totalComentarios: CATEGORIES.reduce((a, c) => a + c.totalComentarios, 0),
  totalMembros: 523,
};

export function ComunidadeContent() {
  const [busca, setBusca] = useState("");
  const [categoriaAberta, setCategoriaAberta] = useState<string | null>(null);

  const filteredCategories = useMemo(() => {
    if (!busca.trim()) return CATEGORIES;
    const q = busca.toLowerCase();
    return CATEGORIES.filter(
      (c) =>
        c.nome.toLowerCase().includes(q) ||
        c.descricao.toLowerCase().includes(q)
    );
  }, [busca]);

  const currentTopics = categoriaAberta ? MOCK_TOPICS[categoriaAberta] || [] : [];
  const currentCategory = CATEGORIES.find((c) => c.slug === categoriaAberta);

  return (
    <>
      <PageHero
        title="COMUNIDADE"
        subtitle="Participe das discussões, tire dúvidas e conecte-se com outros jogadores."
        breadcrumbs={
          categoriaAberta && currentCategory
            ? [
                { label: "Home", href: "/" },
                { label: "Comunidade", href: "/comunidade" },
                { label: currentCategory.nome },
              ]
            : [{ label: "Home", href: "/" }, { label: "Comunidade" }]
        }
      />

      <div className="mx-auto max-w-7xl px-4 pb-16 lg:px-6">
        {/* Busca */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A0A0A0]" />
            <input
              type="text"
              placeholder="Buscar no fórum..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="w-full rounded-xl border border-white/20 bg-bg-card/50 py-3 pl-10 pr-4 text-sm text-white placeholder:text-white/40 focus:border-green-cs focus:outline-none"
            />
          </div>
        </motion.div>

        {!categoriaAberta ? (
          <>
            {/* Lista de Categorias */}
            <div className="space-y-2">
              {filteredCategories.map((cat, i) => {
                const Icon = cat.icon;
                return (
                  <motion.button
                    key={cat.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    onClick={() => setCategoriaAberta(cat.slug)}
                    className="flex w-full items-center gap-4 rounded-xl border border-white/10 bg-bg-card/50 p-4 text-left transition-all hover:border-white/20 hover:bg-bg-card/80"
                  >
                    <div
                      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-xl"
                      style={{ backgroundColor: `${cat.cor}15` }}
                    >
                      <span>{cat.icone}</span>
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-white">{cat.nome}</h3>
                        {cat.somenteStaff && (
                          <span className="rounded bg-yellow-500/20 px-1.5 py-0.5 text-[10px] font-bold text-yellow-500">
                            STAFF
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-[#A0A0A0]">{cat.descricao}</p>
                    </div>

                    <div className="hidden shrink-0 items-center gap-6 text-xs text-[#A0A0A0] sm:flex">
                      <div className="text-center">
                        <p className="font-bold text-white">{cat.totalTopicos}</p>
                        <p>tópicos</p>
                      </div>
                      <div className="text-center">
                        <p className="font-bold text-white">{cat.totalComentarios}</p>
                        <p>respostas</p>
                      </div>
                    </div>

                    <div className="hidden shrink-0 text-right lg:block">
                      <p className="max-w-[200px] truncate text-sm text-white">
                        {cat.ultimoPost.titulo}
                      </p>
                      <p className="text-xs text-[#A0A0A0]">
                        {cat.ultimoPost.autor} · {cat.ultimoPost.tempo}
                      </p>
                    </div>
                  </motion.button>
                );
              })}
            </div>

            {/* Estatísticas */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mt-8 flex flex-wrap items-center justify-center gap-6 rounded-xl border border-white/10 bg-bg-card/30 p-4"
            >
              <div className="flex items-center gap-2 text-sm text-[#A0A0A0]">
                <MessageSquare size={16} className="text-green-cs" />
                <span className="font-bold text-white">{STATS.totalTopicos}</span> tópicos
              </div>
              <div className="flex items-center gap-2 text-sm text-[#A0A0A0]">
                <TrendingUp size={16} className="text-green-cs" />
                <span className="font-bold text-white">{STATS.totalComentarios}</span> comentários
              </div>
              <div className="flex items-center gap-2 text-sm text-[#A0A0A0]">
                <Users size={16} className="text-green-cs" />
                <span className="font-bold text-white">{STATS.totalMembros}</span> membros
              </div>
            </motion.div>
          </>
        ) : (
          /* Lista de Tópicos */
          <>
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setCategoriaAberta(null)}
                  className="text-sm text-[#A0A0A0] transition-colors hover:text-white"
                >
                  ← Voltar
                </button>
                <h2 className="flex items-center gap-2 text-lg font-bold text-white">
                  <span>{currentCategory?.icone}</span>
                  {currentCategory?.nome}
                </h2>
              </div>
              <button className="flex items-center gap-1.5 rounded-lg bg-green-cs px-4 py-2 text-sm font-bold text-white transition-all hover:bg-green-dark">
                <Plus size={16} /> Novo Tópico
              </button>
            </div>

            <div className="space-y-2">
              {currentTopics.map((topic, i) => (
                <motion.div
                  key={topic.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="flex items-center gap-4 rounded-xl border border-white/10 bg-bg-card/50 p-4 transition-all hover:border-white/20"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      {topic.fixado && (
                        <Pin size={14} className="shrink-0 text-yellow-500" />
                      )}
                      {topic.fechado && (
                        <Lock size={14} className="shrink-0 text-[#A0A0A0]" />
                      )}
                      {topic.resolvido && (
                        <CheckCircle size={14} className="shrink-0 text-green-cs" />
                      )}
                      <h3 className="font-medium text-white">{topic.titulo}</h3>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-[#A0A0A0]">
                      <span className={topic.autor.cargo ? "font-bold text-yellow-500" : ""}>
                        {topic.autor.nome}
                      </span>
                      {topic.autor.cargo && (
                        <span className="rounded bg-yellow-500/20 px-1 py-0.5 text-[9px] font-bold text-yellow-500">
                          {topic.autor.cargo}
                        </span>
                      )}
                      <span>·</span>
                      <span className="flex items-center gap-0.5">
                        <Clock size={12} /> {topic.ultimaAtividade}
                      </span>
                    </div>
                  </div>

                  <div className="hidden shrink-0 items-center gap-4 text-xs text-[#A0A0A0] sm:flex">
                    <div className="flex items-center gap-1">
                      <MessageSquare size={14} />
                      <span>{topic.comentarios}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Eye size={14} />
                      <span>{topic.views}</span>
                    </div>
                  </div>
                </motion.div>
              ))}

              {currentTopics.length === 0 && (
                <div className="py-12 text-center text-[#A0A0A0]">
                  <MessageSquare size={40} className="mx-auto mb-4 opacity-30" />
                  <p className="text-lg font-medium">Nenhum tópico ainda</p>
                  <p className="text-sm">Seja o primeiro a criar um tópico nesta categoria!</p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
}
