"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Search,
  Calendar,
  Clock,
  User,
  ChevronLeft,
  ChevronRight,
  Tag,
} from "lucide-react";
import Link from "next/link";
import { PageHero } from "@/components/ui/PageHero";

interface BlogPost {
  id: number;
  slug: string;
  titulo: string;
  resumo: string;
  imagemCapa: string;
  categoria: { nome: string; slug: string; cor: string };
  autor: { nome: string; avatar: string };
  publicadoEm: string;
  tempoLeitura: number;
  tags: string[];
}

const CATEGORIAS = [
  { nome: "Todos", slug: "todos", cor: "#FFFFFF" },
  { nome: "Novidades", slug: "novidades", cor: "#4CAF50" },
  { nome: "Aulas", slug: "aulas", cor: "#2196F3" },
  { nome: "Eventos", slug: "eventos", cor: "#FF9800" },
  { nome: "Mídia", slug: "midia", cor: "#E91E63" },
  { nome: "Tutoriais", slug: "tutoriais", cor: "#9C27B0" },
  { nome: "Comunidade", slug: "comunidade", cor: "#00BCD4" },
];

const POSTS: BlogPost[] = [
  {
    id: 1,
    slug: "lancamento-servidor-educacional-2026",
    titulo: "CraftSapiens lança o maior servidor educacional do Brasil",
    resumo: "Após meses de desenvolvimento, a CraftSapiens apresenta oficialmente sua plataforma de ensino gamificado no Minecraft. Conheça as novidades e como participar.",
    imagemCapa: "/blog/lancamento.jpg",
    categoria: { nome: "Novidades", slug: "novidades", cor: "#4CAF50" },
    autor: { nome: "Prof. Helton", avatar: "/team/helton.png" },
    publicadoEm: "2026-03-19",
    tempoLeitura: 5,
    tags: ["lançamento", "minecraft", "educação"],
  },
  {
    id: 2,
    slug: "como-funciona-ensino-gamificado",
    titulo: "Como funciona o ensino gamificado da CraftSapiens",
    resumo: "Entenda como transformamos disciplinas escolares em aventuras interativas dentro do Minecraft, com moedas SAPIENS, XP e certificados.",
    imagemCapa: "/blog/gamificacao.jpg",
    categoria: { nome: "Aulas", slug: "aulas", cor: "#2196F3" },
    autor: { nome: "Prof. Camilli", avatar: "/team/camilli.png" },
    publicadoEm: "2026-03-18",
    tempoLeitura: 7,
    tags: ["ensino", "gamificação", "metodologia"],
  },
  {
    id: 3,
    slug: "evento-construcao-colaborativa-marco",
    titulo: "Evento: Construção Colaborativa — Roma Antiga",
    resumo: "Participe do nosso maior evento de construção! Juntos vamos recriar a Roma Antiga em escala no servidor. Prêmios para os melhores construtores.",
    imagemCapa: "/blog/evento-roma.jpg",
    categoria: { nome: "Eventos", slug: "eventos", cor: "#FF9800" },
    autor: { nome: "Prof. Arthur", avatar: "/team/arthur.png" },
    publicadoEm: "2026-03-17",
    tempoLeitura: 4,
    tags: ["evento", "construção", "roma"],
  },
  {
    id: 4,
    slug: "craftsapiens-destaque-tv-globo",
    titulo: "CraftSapiens é destaque na TV Globo",
    resumo: "O projeto educacional foi matéria no Jornal Nacional, mostrando como o Minecraft está sendo usado para ensinar disciplinas escolares de forma inovadora.",
    imagemCapa: "/blog/tv-globo.jpg",
    categoria: { nome: "Mídia", slug: "midia", cor: "#E91E63" },
    autor: { nome: "Prof. Helton", avatar: "/team/helton.png" },
    publicadoEm: "2026-03-15",
    tempoLeitura: 3,
    tags: ["mídia", "tv", "reconhecimento"],
  },
  {
    id: 5,
    slug: "guia-primeiros-passos-servidor",
    titulo: "Guia: Seus primeiros passos no servidor",
    resumo: "Tutorial completo para novos alunos: como entrar no servidor, criar sua conta, configurar o Minecraft e começar a assistir aulas gamificadas.",
    imagemCapa: "/blog/tutorial.jpg",
    categoria: { nome: "Tutoriais", slug: "tutoriais", cor: "#9C27B0" },
    autor: { nome: "Prof. Wilton", avatar: "/team/wilton.png" },
    publicadoEm: "2026-03-14",
    tempoLeitura: 10,
    tags: ["tutorial", "iniciante", "guia"],
  },
  {
    id: 6,
    slug: "melhores-construcoes-fevereiro",
    titulo: "As melhores construções de fevereiro",
    resumo: "Confira as construções mais incríveis feitas pelos alunos durante o mês de fevereiro. Votação e prêmios especiais para as 3 melhores!",
    imagemCapa: "/blog/construcoes.jpg",
    categoria: { nome: "Comunidade", slug: "comunidade", cor: "#00BCD4" },
    autor: { nome: "Prof. Thawana", avatar: "/team/thawana.png" },
    publicadoEm: "2026-03-10",
    tempoLeitura: 6,
    tags: ["construções", "comunidade", "destaque"],
  },
  {
    id: 7,
    slug: "nova-disciplina-programacao",
    titulo: "Nova disciplina: Programação com Command Blocks",
    resumo: "Aprenda lógica de programação, algoritmos e pensamento computacional usando command blocks e redstone no Minecraft.",
    imagemCapa: "/blog/programacao.jpg",
    categoria: { nome: "Aulas", slug: "aulas", cor: "#2196F3" },
    autor: { nome: "Prof. Helton", avatar: "/team/helton.png" },
    publicadoEm: "2026-03-08",
    tempoLeitura: 5,
    tags: ["programação", "command blocks", "nova disciplina"],
  },
  {
    id: 8,
    slug: "vip-premium-beneficios",
    titulo: "Conheça os benefícios dos planos VIP e Premium",
    resumo: "Descubra o que cada plano oferece: aulas exclusivas, moedas SAPIENS bônus, cosméticos e muito mais. Escolha o plano ideal para você.",
    imagemCapa: "/blog/vip-premium.jpg",
    categoria: { nome: "Novidades", slug: "novidades", cor: "#4CAF50" },
    autor: { nome: "Prof. Helton", avatar: "/team/helton.png" },
    publicadoEm: "2026-03-05",
    tempoLeitura: 4,
    tags: ["vip", "premium", "planos"],
  },
  {
    id: 9,
    slug: "preparatorio-enem-minecraft",
    titulo: "Preparatório ENEM dentro do Minecraft — como funciona",
    resumo: "Nosso programa preparatório para o ENEM usa simulados gamificados, revisões interativas e resolução de questões dentro do servidor.",
    imagemCapa: "/blog/enem.jpg",
    categoria: { nome: "Aulas", slug: "aulas", cor: "#2196F3" },
    autor: { nome: "Prof. Helton", avatar: "/team/helton.png" },
    publicadoEm: "2026-03-01",
    tempoLeitura: 8,
    tags: ["enem", "vestibular", "preparatório"],
  },
];

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

const POSTS_PER_PAGE = 9;

export function BlogContent() {
  const [categoriaAtiva, setCategoriaAtiva] = useState("todos");
  const [busca, setBusca] = useState("");
  const [pagina, setPagina] = useState(1);

  const filtered = useMemo(() => {
    return POSTS.filter((post) => {
      if (categoriaAtiva !== "todos" && post.categoria.slug !== categoriaAtiva) return false;
      if (busca.trim()) {
        const q = busca.toLowerCase();
        return (
          post.titulo.toLowerCase().includes(q) ||
          post.resumo.toLowerCase().includes(q) ||
          post.tags.some((t) => t.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [categoriaAtiva, busca]);

  const totalPages = Math.ceil(filtered.length / POSTS_PER_PAGE);
  const paged = filtered.slice((pagina - 1) * POSTS_PER_PAGE, pagina * POSTS_PER_PAGE);
  const featuredPost = pagina === 1 && !busca ? paged[0] : null;
  const gridPosts = featuredPost ? paged.slice(1) : paged;

  return (
    <>
      <PageHero
        title="BLOG"
        subtitle="Novidades, atualizações e muito conteúdo."
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Blog" }]}
      />

      <div className="mx-auto max-w-7xl px-4 pb-16 lg:px-6">
        {/* Busca */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A0A0A0]" />
            <input
              type="text"
              placeholder="Buscar no blog..."
              value={busca}
              onChange={(e) => {
                setBusca(e.target.value);
                setPagina(1);
              }}
              className="w-full rounded-xl border border-white/20 bg-bg-card/50 py-3 pl-10 pr-4 text-sm text-white placeholder:text-white/40 focus:border-green-cs focus:outline-none"
            />
          </div>
        </motion.div>

        {/* Categorias */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="mb-8 flex flex-wrap gap-2"
        >
          {CATEGORIAS.map((cat) => (
            <button
              key={cat.slug}
              onClick={() => {
                setCategoriaAtiva(cat.slug);
                setPagina(1);
              }}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                categoriaAtiva === cat.slug
                  ? "text-white"
                  : "text-[#A0A0A0] hover:text-white"
              }`}
              style={
                categoriaAtiva === cat.slug
                  ? { backgroundColor: `${cat.cor}20`, color: cat.cor }
                  : {}
              }
            >
              {cat.nome}
            </button>
          ))}
        </motion.div>

        {/* Post em destaque */}
        {featuredPost && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-8"
          >
            <Link href={`/blog/${featuredPost.slug}`}>
              <div className="group overflow-hidden rounded-2xl border border-white/10 bg-bg-card/50 transition-all hover:border-white/20">
                <div className="aspect-[21/9] bg-gradient-to-br from-bg-accent to-bg-card">
                  <div className="flex h-full items-center justify-center text-[#A0A0A0]">
                    <span className="text-sm">Imagem de capa</span>
                  </div>
                </div>
                <div className="p-6">
                  <span
                    className="inline-block rounded px-2.5 py-0.5 text-xs font-bold uppercase"
                    style={{
                      backgroundColor: `${featuredPost.categoria.cor}20`,
                      color: featuredPost.categoria.cor,
                    }}
                  >
                    {featuredPost.categoria.nome}
                  </span>
                  <h2 className="mt-3 text-xl font-bold text-white transition-colors group-hover:text-green-cs sm:text-2xl">
                    {featuredPost.titulo}
                  </h2>
                  <p className="mt-2 text-sm text-[#A0A0A0] line-clamp-2">
                    {featuredPost.resumo}
                  </p>
                  <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-[#A0A0A0]">
                    <span className="flex items-center gap-1">
                      <User size={14} /> {featuredPost.autor.nome}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar size={14} /> {formatDate(featuredPost.publicadoEm)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock size={14} /> {featuredPost.tempoLeitura} min de leitura
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          </motion.div>
        )}

        {/* Grid de posts */}
        {gridPosts.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {gridPosts.map((post, i) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 * i }}
              >
                <Link href={`/blog/${post.slug}`}>
                  <div className="group h-full overflow-hidden rounded-xl border border-white/10 bg-bg-card/50 transition-all hover:border-white/20 hover:shadow-lg">
                    <div className="aspect-video bg-gradient-to-br from-bg-accent to-bg-card">
                      <div className="flex h-full items-center justify-center text-[#A0A0A0]">
                        <span className="text-xs">Imagem</span>
                      </div>
                    </div>
                    <div className="p-4">
                      <span
                        className="inline-block rounded px-2 py-0.5 text-[10px] font-bold uppercase"
                        style={{
                          backgroundColor: `${post.categoria.cor}20`,
                          color: post.categoria.cor,
                        }}
                      >
                        {post.categoria.nome}
                      </span>
                      <h3 className="mt-2 font-bold text-white transition-colors group-hover:text-green-cs line-clamp-2">
                        {post.titulo}
                      </h3>
                      <p className="mt-1.5 text-sm text-[#A0A0A0] line-clamp-2">
                        {post.resumo}
                      </p>
                      <div className="mt-3 flex items-center gap-3 text-xs text-[#A0A0A0]">
                        <span className="flex items-center gap-1">
                          <Calendar size={12} /> {formatDate(post.publicadoEm)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock size={12} /> {post.tempoLeitura} min
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="py-16 text-center text-[#A0A0A0]">
            <Search size={40} className="mx-auto mb-4 opacity-30" />
            <p className="text-lg font-medium">Nenhum post encontrado</p>
            <p className="text-sm">Tente ajustar os filtros ou buscar por outro termo.</p>
          </div>
        )}

        {/* Paginação */}
        {totalPages > 1 && (
          <div className="mt-10 flex items-center justify-center gap-2">
            <button
              onClick={() => setPagina((p) => Math.max(1, p - 1))}
              disabled={pagina === 1}
              className="rounded-lg border border-white/20 p-2 text-[#A0A0A0] transition-colors hover:text-white disabled:opacity-30"
            >
              <ChevronLeft size={18} />
            </button>
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i + 1}
                onClick={() => setPagina(i + 1)}
                className={`h-9 w-9 rounded-lg text-sm font-medium transition-all ${
                  pagina === i + 1
                    ? "bg-green-cs text-white"
                    : "text-[#A0A0A0] hover:bg-white/10 hover:text-white"
                }`}
              >
                {i + 1}
              </button>
            ))}
            <button
              onClick={() => setPagina((p) => Math.min(totalPages, p + 1))}
              disabled={pagina === totalPages}
              className="rounded-lg border border-white/20 p-2 text-[#A0A0A0] transition-colors hover:text-white disabled:opacity-30"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        )}
      </div>
    </>
  );
}
