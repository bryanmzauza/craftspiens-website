"use client";

// Editor de Markdown do fórum: barra de ferramentas, pré-visualização e contador.
// A pré-visualização usa o mesmo conversor do servidor (src/lib/forum/markdown.ts).

import { useId, useRef, useState } from "react";
import { Bold, Italic, Link2, Image, Code, Quote, List, Eye, Pencil } from "lucide-react";
import { renderMarkdown } from "@/lib/forum/markdown";
import { MarkdownBody } from "@/components/comunidade/shared";

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minLength?: number;
  maxLength: number;
  rows?: number;
  autoFocus?: boolean;
  label?: string;
}

type Wrap = { before: string; after: string; placeholder: string; block?: boolean };

const TOOLS: { icon: typeof Bold; title: string; wrap: Wrap }[] = [
  { icon: Bold, title: "Negrito", wrap: { before: "**", after: "**", placeholder: "texto" } },
  { icon: Italic, title: "Itálico", wrap: { before: "*", after: "*", placeholder: "texto" } },
  { icon: Link2, title: "Link", wrap: { before: "[", after: "](https://)", placeholder: "texto do link" } },
  { icon: Image, title: "Imagem por URL (https)", wrap: { before: "![", after: "](https://)", placeholder: "descrição" } },
  { icon: Code, title: "Código", wrap: { before: "`", after: "`", placeholder: "código" } },
  { icon: Quote, title: "Citação", wrap: { before: "> ", after: "", placeholder: "citação", block: true } },
  { icon: List, title: "Lista", wrap: { before: "- ", after: "", placeholder: "item", block: true } },
];

export function MarkdownEditor({
  value,
  onChange,
  placeholder,
  minLength,
  maxLength,
  rows = 8,
  autoFocus,
  label = "Conteúdo",
}: MarkdownEditorProps) {
  const [preview, setPreview] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const id = useId();

  function apply(wrap: Wrap) {
    const el = textareaRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selected = value.slice(start, end) || wrap.placeholder;
    let before = wrap.before;
    // Blocos (citação, lista) começam em linha própria
    if (wrap.block && start > 0 && value[start - 1] !== "\n") before = `\n${before}`;
    const next = `${value.slice(0, start)}${before}${selected}${wrap.after}${value.slice(end)}`;
    onChange(next);
    requestAnimationFrame(() => {
      el.focus();
      const cursor = start + before.length;
      el.setSelectionRange(cursor, cursor + selected.length);
    });
  }

  const tooShort = minLength !== undefined && value.trim().length > 0 && value.trim().length < minLength;

  return (
    <div>
      <div className="mb-1 flex items-center justify-between gap-2">
        <label htmlFor={id} className="text-sm font-medium text-[#A0A0A0]">
          {label}
        </label>
        <div className="flex items-center gap-1 text-xs">
          <button
            type="button"
            onClick={() => setPreview(false)}
            className={`flex items-center gap-1 rounded px-2 py-1 ${!preview ? "bg-white/10 text-white" : "text-[#A0A0A0] hover:text-white"}`}
          >
            <Pencil size={12} /> Escrever
          </button>
          <button
            type="button"
            onClick={() => setPreview(true)}
            className={`flex items-center gap-1 rounded px-2 py-1 ${preview ? "bg-white/10 text-white" : "text-[#A0A0A0] hover:text-white"}`}
          >
            <Eye size={12} /> Pré-visualizar
          </button>
        </div>
      </div>

      <div className="rounded-lg border border-white/20 bg-bg-card/50 focus-within:border-green-cs">
        {!preview && (
          <div className="flex flex-wrap items-center gap-0.5 border-b border-white/10 px-2 py-1">
            {TOOLS.map((tool) => (
              <button
                key={tool.title}
                type="button"
                title={tool.title}
                aria-label={tool.title}
                onClick={() => apply(tool.wrap)}
                className="rounded p-1.5 text-[#A0A0A0] transition-colors hover:bg-white/10 hover:text-white"
              >
                <tool.icon size={15} />
              </button>
            ))}
            <span className="ml-auto hidden text-[11px] text-[#A0A0A0] sm:inline">
              Markdown: **negrito**, *itálico*, `código`, @nick
            </span>
          </div>
        )}

        {preview ? (
          <div className="min-h-[8rem] px-4 py-3 text-sm text-[#E0E0E0]">
            {value.trim() ? (
              <MarkdownBody html={renderMarkdown(value)} />
            ) : (
              <p className="text-[#A0A0A0]">Nada para mostrar ainda.</p>
            )}
          </div>
        ) : (
          <textarea
            id={id}
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value.slice(0, maxLength))}
            placeholder={placeholder}
            rows={rows}
            autoFocus={autoFocus}
            maxLength={maxLength}
            className="w-full resize-y bg-transparent px-4 py-3 text-sm text-white placeholder:text-white/40 focus:outline-none"
          />
        )}
      </div>

      <div className="mt-1 flex items-center justify-between text-xs text-[#A0A0A0]">
        <span>{tooShort ? `Mínimo de ${minLength} caracteres` : ""}</span>
        <span className={value.length >= maxLength ? "text-error" : ""}>
          {value.length}/{maxLength}
        </span>
      </div>
    </div>
  );
}
