"use client";

// Página de novo tópico (RN-FORUM-05): categoria, título, conteúdo e tags.
// Abre com a categoria da URL (?categoria=slug). Nas denúncias, o botão
// Reportar manda o conteúdo denunciado (?denunciar=<slug do tópico> e,
// opcionalmente, &comentario=<id>) e a página monta o texto inicial com o link
// e o nick do autor.

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Flag, Lightbulb, Loader2, Plus } from "lucide-react";
import { PageHero } from "@/components/ui/PageHero";
import { MarkdownEditor } from "@/components/comunidade/MarkdownEditor";
import { api, ApiError, inputClass, primaryButtonClass, secondaryButtonClass } from "@/components/comunidade/shared";
import {
  CONTENT_MAX,
  CONTENT_MIN,
  REPORTS_CATEGORY_SLUG,
  TAG_MAX_LENGTH,
  TAGS_MAX,
  TITLE_MAX,
} from "@/lib/forum/constants";

export interface CategoryOption {
  id: string;
  name: string;
  slug: string;
  staffOnly: boolean;
}

interface NovoTopicoProps {
  categoriaSlug: string | null;
  /** Slug do tópico denunciado */
  denunciar: string | null;
  /** Id do comentário denunciado (dentro do tópico de `denunciar`) */
  comentario: string | null;
}

interface ReportedPost {
  id: string;
  title: string;
  slug: string;
  category: { slug: string };
  author: { username: string };
}

interface CommentNode {
  id: string;
  author: { username: string };
  replies: CommentNode[];
}

function findComment(list: CommentNode[], id: string): CommentNode | null {
  for (const c of list) {
    if (c.id === id) return c;
    const inner = findComment(c.replies, id);
    if (inner) return inner;
  }
  return null;
}

/** Texto inicial da denúncia, com o link e o autor do conteúdo */
async function buildReport(topicSlug: string, commentId: string | null): Promise<{ title: string; content: string } | null> {
  const res = await api<{ post: ReportedPost }>(`/api/forum/topicos/${encodeURIComponent(topicSlug)}`);
  if (!res.ok) return null;
  const post = res.data.post;
  const url = `/comunidade/${post.category.slug}/${post.slug}`;

  if (commentId) {
    const comments = await api<{ comments: CommentNode[] }>(
      `/api/forum/comentarios?topicoId=${post.id}&comentario=${encodeURIComponent(commentId)}`
    );
    const comment = comments.ok ? findComment(comments.data.comments, commentId) : null;
    if (comment) {
      return {
        title: `Denúncia: comentário em ${post.title}`.slice(0, TITLE_MAX),
        content: `Denúncia sobre um [comentário](${url}#comentario-${comment.id}) de @${comment.author.username} no post "${post.title}".\n\n**Motivo:** \n\n**Provas:** `,
      };
    }
  }

  return {
    title: `Denúncia: ${post.title}`.slice(0, TITLE_MAX),
    content: `Denúncia sobre o post [${post.title}](${url}), de @${post.author.username}.\n\n**Motivo:** \n\n**Provas:** `,
  };
}

export function NovoTopicoContent({ categoriaSlug, denunciar, comentario }: NovoTopicoProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const role = session?.user?.role;
  const staff = role === "ADMIN" || role === "MODERADOR" || role === "PROFESSOR";

  const [categories, setCategories] = useState<CategoryOption[] | null>(null);
  const [categoryId, setCategoryId] = useState("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [published, setPublished] = useState(false);
  const [error, setError] = useState<{ error: string; code?: string } | null>(null);
  const [prefilling, setPrefilling] = useState(!!denunciar);

  useEffect(() => {
    let cancelled = false;
    api<{ categories: CategoryOption[] }>("/api/forum/categorias").then((res) => {
      if (!cancelled) setCategories(res.ok ? res.data.categories : []);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!denunciar) return;
    let cancelled = false;
    buildReport(denunciar, comentario).then((report) => {
      if (cancelled) return;
      if (report) {
        // Só preenche se a pessoa ainda não começou a escrever
        setTitle((current) => current || report.title);
        setContent((current) => current || report.content);
      }
      setPrefilling(false);
    });
    return () => {
      cancelled = true;
    };
  }, [denunciar, comentario]);

  const options = (categories ?? []).filter((c) => !c.staffOnly || staff);
  // Denúncia sempre cai na categoria Denúncias; senão, a da URL ou a primeira
  const wantedSlug = denunciar ? REPORTS_CATEGORY_SLUG : categoriaSlug;
  const preferred = options.find((c) => c.slug === wantedSlug) ?? options[0];
  const selectedCategoryId = options.some((c) => c.id === categoryId) ? categoryId : (preferred?.id ?? "");
  const selected = options.find((c) => c.id === selectedCategoryId) ?? null;
  const isReport = selected?.slug === REPORTS_CATEGORY_SLUG;

  // Avisa antes de sair com texto não publicado
  const dirty = !published && (title.trim().length > 0 || content.trim().length > 0);
  useEffect(() => {
    if (!dirty) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty]);

  const tags = tagInput
    .split(/[,\s]+/)
    .map((t) => t.trim())
    .filter(Boolean)
    .slice(0, TAGS_MAX);

  const valid = !!selectedCategoryId && title.trim().length > 0 && content.trim().length >= CONTENT_MIN;
  const backHref = selected ? `/comunidade/${selected.slug}` : "/comunidade";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!valid || submitting) return;
    setSubmitting(true);
    setError(null);

    const res = await api<{ slug: string; categorySlug: string }>("/api/forum/topicos", {
      method: "POST",
      body: JSON.stringify({ categoryId: selectedCategoryId, title: title.trim(), content: content.trim(), tags }),
    });

    if (!res.ok) {
      setSubmitting(false);
      setError({ error: res.error, code: res.code });
      return;
    }
    setPublished(true);
    router.push(`/comunidade/${res.data.categorySlug}/${res.data.slug}`);
  }

  const breadcrumbs = [
    { label: "Home", href: "/" },
    { label: "Comunidade", href: "/comunidade" },
    ...(selected ? [{ label: selected.name, href: `/comunidade/${selected.slug}` }] : []),
    { label: isReport ? "Nova denúncia" : "Novo post" },
  ];

  return (
    <>
      <PageHero title={isReport ? "NOVA DENÚNCIA" : "NOVO TÓPICO"} breadcrumbs={breadcrumbs} />

      <div className="mx-auto max-w-7xl px-4 pb-16 lg:px-6">
        {categories === null ? (
          <div className="flex justify-center py-20">
            <Loader2 size={32} className="animate-spin text-green-cs" />
          </div>
        ) : options.length === 0 ? (
          <p className="py-12 text-center text-[#A0A0A0]">Nenhuma categoria disponível para novos posts.</p>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[1fr_18rem]">
            <form onSubmit={handleSubmit} className="space-y-5 rounded-2xl border border-white/10 bg-bg-card/50 p-5 sm:p-6">
              <div className="grid gap-4 sm:grid-cols-[14rem_1fr]">
                <div>
                  <label htmlFor="nt-categoria" className="mb-1 block text-sm font-medium text-[#A0A0A0]">
                    Categoria
                  </label>
                  <select
                    id="nt-categoria"
                    value={selectedCategoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className={inputClass}
                    required
                  >
                    {options.map((c) => (
                      <option key={c.id} value={c.id} className="bg-bg-primary">
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="nt-titulo" className="mb-1 block text-sm font-medium text-[#A0A0A0]">
                    Título
                  </label>
                  <input
                    id="nt-titulo"
                    type="text"
                    maxLength={TITLE_MAX}
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder={isReport ? "Ex.: Denúncia contra NickDoJogador por ofensas no chat" : "Resuma o assunto em uma frase"}
                    className={inputClass}
                    required
                    autoFocus={!denunciar}
                  />
                  <p className="mt-1 text-right text-xs text-[#A0A0A0]">
                    {title.length}/{TITLE_MAX}
                  </p>
                </div>
              </div>

              {prefilling ? (
                <div className="flex items-center gap-2 text-sm text-[#A0A0A0]">
                  <Loader2 size={16} className="animate-spin" /> Preparando a denúncia...
                </div>
              ) : (
                <MarkdownEditor
                  value={content}
                  onChange={setContent}
                  minLength={CONTENT_MIN}
                  maxLength={CONTENT_MAX}
                  placeholder="Descreva com detalhes. Dá para usar Markdown, links, imagens por URL e @nick."
                  rows={16}
                  autoFocus={!!denunciar}
                />
              )}

              <div>
                <label htmlFor="nt-tags" className="mb-1 block text-sm font-medium text-[#A0A0A0]">
                  Tags <span className="font-normal">(opcional, até {TAGS_MAX}, separadas por vírgula)</span>
                </label>
                <input
                  id="nt-tags"
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  placeholder="ex.: redstone, construção, dúvida"
                  maxLength={(TAG_MAX_LENGTH + 2) * TAGS_MAX}
                  className={inputClass}
                />
                {tags.length > 0 && <p className="mt-1 text-xs text-[#A0A0A0]">{tags.map((t) => `#${t}`).join(" ")}</p>}
              </div>

              {error && <ApiError error={error.error} code={error.code} />}

              <div className="flex flex-col-reverse gap-3 border-t border-white/10 pt-4 sm:flex-row sm:justify-end">
                <Link href={backHref} className={secondaryButtonClass}>
                  Cancelar
                </Link>
                <button type="submit" disabled={!valid || submitting || prefilling} className={primaryButtonClass}>
                  {submitting ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                  {isReport ? "Enviar denúncia" : "Publicar"}
                </button>
              </div>
            </form>

            <aside className="space-y-4">
              {isReport ? (
                <div className="rounded-2xl border border-error/30 bg-error/10 p-5 text-sm text-[#E0E0E0]">
                  <p className="flex items-center gap-2 font-bold text-white">
                    <Flag size={16} className="text-error" aria-hidden="true" /> Como denunciar
                  </p>
                  <ul className="mt-3 list-disc space-y-1.5 pl-5">
                    <li>Informe o nick de quem você está denunciando.</li>
                    <li>Conte o que aconteceu e quando.</li>
                    <li>Inclua provas: links de imagens ou vídeos.</li>
                    <li>
                      A denúncia é pública. Se o assunto for sensível, a moderação pode torná-la privada, visível só para
                      você e para a equipe.
                    </li>
                    <li>Denúncias falsas podem resultar em suspensão.</li>
                  </ul>
                </div>
              ) : (
                <div className="rounded-2xl border border-white/10 bg-bg-card/50 p-5 text-sm text-[#E0E0E0]">
                  <p className="flex items-center gap-2 font-bold text-white">
                    <Lightbulb size={16} className="text-warning" aria-hidden="true" /> Dicas para um bom post
                  </p>
                  <ul className="mt-3 list-disc space-y-1.5 pl-5">
                    <li>Use um título que resuma o assunto.</li>
                    <li>Procure antes se alguém já perguntou a mesma coisa.</li>
                    <li>Em dúvidas e bugs, diga o que tentou e o que aconteceu.</li>
                    <li>Imagens entram por link (https). Mencione alguém com @nick.</li>
                    <li>Você pode editar o post por 30 minutos depois de publicar.</li>
                  </ul>
                </div>
              )}
              <p className="px-1 text-xs text-[#A0A0A0]">
                Ao publicar, você concorda em seguir os{" "}
                <Link href="/termos" target="_blank" className="text-green-cs hover:underline">
                  Termos e Condições
                </Link>{" "}
                e as regras de conduta da comunidade.
              </p>
            </aside>
          </div>
        )}
      </div>
    </>
  );
}
