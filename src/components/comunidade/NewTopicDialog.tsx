"use client";

// Diálogo de novo tópico (RN-FORUM-05): categoria, título, conteúdo e tags.
// Também usado pelo botão Reportar, que abre a categoria Denúncias com o
// texto já preenchido.

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2, Plus, X } from "lucide-react";
import { MarkdownEditor } from "@/components/comunidade/MarkdownEditor";
import { api, ApiError, inputClass, primaryButtonClass, secondaryButtonClass } from "@/components/comunidade/shared";
import { CONTENT_MAX, CONTENT_MIN, TAG_MAX_LENGTH, TAGS_MAX, TITLE_MAX } from "@/lib/forum/constants";

export interface CategoryOption {
  id: string;
  name: string;
  slug: string;
  staffOnly: boolean;
}

interface NewTopicDialogProps {
  open: boolean;
  onClose: () => void;
  /** Categorias já carregadas; sem elas o diálogo busca a lista */
  categories?: CategoryOption[];
  defaultCategorySlug?: string;
  initialTitle?: string;
  initialContent?: string;
  /** Papel do usuário, para esconder as categorias restritas à equipe */
  role?: string;
}

export function NewTopicDialog({
  open,
  onClose,
  categories: given,
  defaultCategorySlug,
  initialTitle = "",
  initialContent = "",
  role,
}: NewTopicDialogProps) {
  const router = useRouter();
  const [loadedCategories, setCategories] = useState<CategoryOption[]>([]);
  const categories = given ?? loadedCategories;
  const [categoryId, setCategoryId] = useState("");
  const [title, setTitle] = useState(initialTitle);
  const [content, setContent] = useState(initialContent);
  const [tagInput, setTagInput] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<{ error: string; code?: string } | null>(null);

  const staff = role === "ADMIN" || role === "MODERADOR" || role === "PROFESSOR";
  const options = categories.filter((c) => !c.staffOnly || staff);

  // Ao abrir, repõe os campos iniciais (ajuste de estado durante o render)
  const [wasOpen, setWasOpen] = useState(open);
  if (wasOpen !== open) {
    setWasOpen(open);
    if (open) {
      setTitle(initialTitle);
      setContent(initialContent);
      setTagInput("");
      setError(null);
    }
  }

  // Carrega as categorias quando não vieram da página
  useEffect(() => {
    if (!open || given) return;
    let cancelled = false;
    api<{ categories: CategoryOption[] }>("/api/forum/categorias").then((res) => {
      if (!cancelled && res.ok) setCategories(res.data.categories);
    });
    return () => {
      cancelled = true;
    };
  }, [open, given]);

  // Categoria em uso: a escolhida, se ainda existir, senão a da página ou a primeira
  const preferred = options.find((c) => c.slug === defaultCategorySlug) ?? options[0];
  const selectedCategoryId = options.some((c) => c.id === categoryId) ? categoryId : (preferred?.id ?? "");

  const tags = tagInput
    .split(/[,\s]+/)
    .map((t) => t.trim())
    .filter(Boolean)
    .slice(0, TAGS_MAX);

  const valid = selectedCategoryId && title.trim().length > 0 && content.trim().length >= CONTENT_MIN;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!valid || submitting) return;
    setSubmitting(true);
    setError(null);

    const res = await api<{ slug: string; categorySlug: string }>("/api/forum/topicos", {
      method: "POST",
      body: JSON.stringify({ categoryId: selectedCategoryId, title: title.trim(), content: content.trim(), tags }),
    });

    setSubmitting(false);
    if (!res.ok) {
      setError({ error: res.error, code: res.code });
      return;
    }
    onClose();
    router.push(`/comunidade/${res.data.categorySlug}/${res.data.slug}`);
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto bg-black/70 p-4 pt-10 sm:items-center"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.97, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.97, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="novo-topico-titulo"
            className="w-full max-w-2xl rounded-2xl border border-white/10 bg-bg-primary p-5 shadow-2xl sm:p-6"
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 id="novo-topico-titulo" className="text-lg font-bold text-white">
                Novo tópico
              </h2>
              <button type="button" onClick={onClose} aria-label="Fechar" className="text-[#A0A0A0] hover:text-white">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-[1fr_2fr]">
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
                    placeholder="Resuma o assunto em uma frase"
                    className={inputClass}
                    required
                  />
                  <p className="mt-1 text-right text-xs text-[#A0A0A0]">
                    {title.length}/{TITLE_MAX}
                  </p>
                </div>
              </div>

              <MarkdownEditor
                value={content}
                onChange={setContent}
                minLength={CONTENT_MIN}
                maxLength={CONTENT_MAX}
                placeholder="Descreva com detalhes. Dá para usar Markdown, links, imagens por URL e @nick."
                rows={10}
              />

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
                {tags.length > 0 && (
                  <p className="mt-1 text-xs text-[#A0A0A0]">{tags.map((t) => `#${t}`).join(" ")}</p>
                )}
              </div>

              {error && <ApiError error={error.error} code={error.code} />}

              <div className="flex justify-end gap-3">
                <button type="button" onClick={onClose} className={secondaryButtonClass}>
                  Cancelar
                </button>
                <button type="submit" disabled={!valid || submitting} className={primaryButtonClass}>
                  {submitting ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                  Publicar
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
