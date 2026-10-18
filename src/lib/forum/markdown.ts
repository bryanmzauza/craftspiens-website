// =============================================================================
// Markdown do fórum: conversão segura para HTML
// =============================================================================
// Funciona no servidor e no navegador (pré-visualização). Todo o texto de
// entrada é escapado antes de qualquer transformação, e só saem as tags
// geradas aqui, com atributos conferidos: não há como injetar HTML ou script.
//
// Suportado: parágrafos, títulos (# a ###), negrito, itálico, riscado, código
// em linha e em bloco, citações, listas, linha horizontal, links, imagens por
// URL https e menções @nick.

export const MENTION_BASE = "/comunidade/membro/";

// Nick do Minecraft: 3 a 16 caracteres, letras, números e sublinhado
const MENTION_RE = /(^|[^\w/@])@([A-Za-z0-9_]{3,16})\b/g;

export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/** URL aceita em links: http(s) absoluta ou caminho do próprio site */
function safeLinkUrl(url: string): string | null {
  const trimmed = url.trim();
  if (/^https?:\/\/[^\s]+$/i.test(trimmed)) return trimmed;
  if (/^\/(?!\/)[^\s]*$/.test(trimmed)) return trimmed;
  return null;
}

/** URL aceita em imagens: só https (CSP do site: img-src https:) */
function safeImageUrl(url: string): string | null {
  const trimmed = url.trim();
  return /^https:\/\/[^\s]+$/i.test(trimmed) ? trimmed : null;
}

function renderInline(text: string): string {
  // Trechos que não devem sofrer outras transformações saem como marcadores e
  // voltam no fim (código, links e imagens)
  const slots: string[] = [];
  const keep = (html: string) => {
    slots.push(html);
    return `\u0000${slots.length - 1}\u0000`;
  };

  let html = escapeHtml(text);

  // Código em linha
  html = html.replace(/`([^`\n]+)`/g, (_, code: string) =>
    keep(`<code>${code}</code>`)
  );

  // Imagens ![alt](url)
  html = html.replace(/!\[([^\]\n]*)\]\(([^)\s]+)\)/g, (match, alt: string, url: string) => {
    const src = safeImageUrl(url);
    if (!src) return match;
    return keep(`<img src="${src}" alt="${alt}" loading="lazy" referrerpolicy="no-referrer">`);
  });

  // Links [texto](url); uma imagem recusada acima ("![...](http://...)") fica como texto
  html = html.replace(/(^|[^!])\[([^\]\n]+)\]\(([^)\s]+)\)/g, (match, before: string, label: string, url: string) => {
    const href = safeLinkUrl(url);
    if (!href) return match;
    return `${before}${keep(linkTag(href, label))}`;
  });

  // URLs soltas
  html = html.replace(/(^|[^"'=>\w])(https?:\/\/[^\s<]+[^\s<.,;:!?)\]"'])/gi, (_, before: string, url: string) =>
    `${before}${keep(linkTag(url, url))}`
  );

  // Menções @nick
  html = html.replace(MENTION_RE, (_, before: string, nick: string) =>
    `${before}${keep(`<a class="mention" href="${MENTION_BASE}${nick}">@${nick}</a>`)}`
  );

  // Ênfases
  html = html.replace(/\*\*([^*\n]+?)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/__([^_\n]+?)__/g, "<strong>$1</strong>");
  html = html.replace(/(^|[^*\w])\*([^*\n]+?)\*(?!\w)/g, "$1<em>$2</em>");
  html = html.replace(/(^|[^_\w])_([^_\n]+?)_(?!\w)/g, "$1<em>$2</em>");
  html = html.replace(/~~([^~\n]+?)~~/g, "<del>$1</del>");

  return html.replace(/\u0000(\d+)\u0000/g, (_, i: string) => slots[Number(i)]);
}

function linkTag(href: string, label: string): string {
  const external = /^https?:\/\//i.test(href);
  const attrs = external ? ' target="_blank" rel="nofollow noopener noreferrer"' : "";
  return `<a href="${href}"${attrs}>${label}</a>`;
}

function renderBlocks(lines: string[]): string {
  const out: string[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (line.trim() === "") {
      i++;
      continue;
    }

    // Bloco de código
    if (/^```/.test(line)) {
      const code: string[] = [];
      i++;
      while (i < lines.length && !/^```/.test(lines[i])) {
        code.push(lines[i]);
        i++;
      }
      i++; // fecha o bloco (ou fim do texto)
      out.push(`<pre><code>${escapeHtml(code.join("\n"))}</code></pre>`);
      continue;
    }

    // Títulos: # vira h2 (o h1 é o título do tópico)
    const heading = /^(#{1,3})\s+(.+?)\s*#*$/.exec(line);
    if (heading) {
      const level = heading[1].length + 1;
      out.push(`<h${level}>${renderInline(heading[2])}</h${level}>`);
      i++;
      continue;
    }

    // Linha horizontal
    if (/^\s*(-{3,}|\*{3,})\s*$/.test(line)) {
      out.push("<hr>");
      i++;
      continue;
    }

    // Citação
    if (/^>\s?/.test(line)) {
      const quoted: string[] = [];
      while (i < lines.length && /^>\s?/.test(lines[i])) {
        quoted.push(lines[i].replace(/^>\s?/, ""));
        i++;
      }
      out.push(`<blockquote>${renderBlocks(quoted)}</blockquote>`);
      continue;
    }

    // Lista sem ordem
    if (/^\s*[-*]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])) {
        items.push(`<li>${renderInline(lines[i].replace(/^\s*[-*]\s+/, ""))}</li>`);
        i++;
      }
      out.push(`<ul>${items.join("")}</ul>`);
      continue;
    }

    // Lista numerada
    if (/^\s*\d+[.)]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*\d+[.)]\s+/.test(lines[i])) {
        items.push(`<li>${renderInline(lines[i].replace(/^\s*\d+[.)]\s+/, ""))}</li>`);
        i++;
      }
      out.push(`<ol>${items.join("")}</ol>`);
      continue;
    }

    // Parágrafo: linhas seguidas até uma linha vazia ou outro bloco
    const para: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() !== "" &&
      !/^```/.test(lines[i]) &&
      !/^#{1,3}\s+/.test(lines[i]) &&
      !/^>\s?/.test(lines[i]) &&
      !/^\s*[-*]\s+/.test(lines[i]) &&
      !/^\s*\d+[.)]\s+/.test(lines[i]) &&
      !/^\s*(-{3,}|\*{3,})\s*$/.test(lines[i])
    ) {
      para.push(renderInline(lines[i]));
      i++;
    }
    out.push(`<p>${para.join("<br>")}</p>`);
  }

  return out.join("");
}

/** Converte o Markdown do fórum em HTML seguro */
export function renderMarkdown(source: string): string {
  const lines = source.replace(/\r\n?/g, "\n").split("\n");
  return renderBlocks(lines);
}

/** Nicks mencionados com @, sem repetição e fora dos trechos de código */
export function extractMentions(source: string): string[] {
  const withoutCode = source
    .replace(/\r\n?/g, "\n")
    .replace(/```[\s\S]*?(```|$)/g, " ")
    .replace(/`[^`\n]*`/g, " ");
  const found = new Map<string, string>();
  for (const match of withoutCode.matchAll(MENTION_RE)) {
    const nick = match[2];
    const key = nick.toLowerCase();
    if (!found.has(key)) found.set(key, nick);
  }
  return [...found.values()];
}

/** Texto simples a partir do Markdown, para resumos e descrições */
export function markdownToText(source: string, maxLength = 160): string {
  const text = source
    .replace(/\r\n?/g, "\n")
    .replace(/```[\s\S]*?(```|$)/g, " ")
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^>\s?/gm, "")
    .replace(/^\s*([-*]|\d+[.)])\s+/gm, "")
    .replace(/[`*_~]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 1).trimEnd()}…`;
}
