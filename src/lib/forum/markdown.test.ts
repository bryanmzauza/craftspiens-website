import { describe, expect, it } from "vitest";
import { extractMentions, markdownToText, renderMarkdown } from "@/lib/forum/markdown";

describe("renderMarkdown", () => {
  it("escapa HTML da entrada", () => {
    expect(renderMarkdown('<script>alert("x")</script>')).toBe(
      "<p>&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;</p>"
    );
  });

  it("separa parágrafos e quebras de linha", () => {
    expect(renderMarkdown("linha 1\nlinha 2\n\nlinha 3")).toBe("<p>linha 1<br>linha 2</p><p>linha 3</p>");
  });

  it("aplica negrito, itálico, riscado e código em linha", () => {
    expect(renderMarkdown("**a** *b* ~~c~~ `d`")).toBe(
      "<p><strong>a</strong> <em>b</em> <del>c</del> <code>d</code></p>"
    );
  });

  it("não transforma o conteúdo do código em linha", () => {
    expect(renderMarkdown("`**x** <b>`")).toBe("<p><code>**x** &lt;b&gt;</code></p>");
  });

  it("renderiza bloco de código escapado", () => {
    expect(renderMarkdown("```\nif (a < b) **x**\n```")).toBe(
      "<pre><code>if (a &lt; b) **x**</code></pre>"
    );
  });

  it("fecha o bloco de código no fim do texto", () => {
    expect(renderMarkdown("```\naberto")).toBe("<pre><code>aberto</code></pre>");
  });

  it("rebaixa títulos para h2 a h4", () => {
    expect(renderMarkdown("# A\n## B\n### C")).toBe("<h2>A</h2><h3>B</h3><h4>C</h4>");
  });

  it("renderiza listas, citações e linha horizontal", () => {
    expect(renderMarkdown("- um\n- dois\n\n1. a\n2) b\n\n> citação\n> segue\n\n---")).toBe(
      "<ul><li>um</li><li>dois</li></ul><ol><li>a</li><li>b</li></ol><blockquote><p>citação<br>segue</p></blockquote><hr>"
    );
  });

  it("aceita links http(s) e caminhos do site", () => {
    expect(renderMarkdown("[site](https://craftsapiens.com.br) e [aulas](/aulas)")).toBe(
      '<p><a href="https://craftsapiens.com.br" target="_blank" rel="nofollow noopener noreferrer">site</a> e <a href="/aulas">aulas</a></p>'
    );
  });

  it("recusa links com outros esquemas", () => {
    expect(renderMarkdown("[x](javascript:alert(1))")).toBe("<p>[x](javascript:alert(1))</p>");
    expect(renderMarkdown("[x](//evil.com)")).toBe("<p>[x](//evil.com)</p>");
  });

  it("não deixa a URL fechar o atributo", () => {
    expect(renderMarkdown('[x](https://a.com/"onmouseover="alert)')).toBe(
      '<p><a href="https://a.com/&quot;onmouseover=&quot;alert" target="_blank" rel="nofollow noopener noreferrer">x</a></p>'
    );
  });

  it("aceita imagens só por https", () => {
    expect(renderMarkdown("![casa](https://i.imgur.com/a.png)")).toBe(
      '<p><img src="https://i.imgur.com/a.png" alt="casa" loading="lazy" referrerpolicy="no-referrer"></p>'
    );
    // Sem https a imagem não é incorporada; a URL fica só como link
    expect(renderMarkdown("![casa](http://i.imgur.com/a.png)")).toBe(
      '<p>![casa](<a href="http://i.imgur.com/a.png" target="_blank" rel="nofollow noopener noreferrer">http://i.imgur.com/a.png</a>)</p>'
    );
  });

  it("transforma URLs soltas em links", () => {
    expect(renderMarkdown("veja https://exemplo.com/a?b=1&c=2.")).toBe(
      '<p>veja <a href="https://exemplo.com/a?b=1&amp;c=2" target="_blank" rel="nofollow noopener noreferrer">https://exemplo.com/a?b=1&amp;c=2</a>.</p>'
    );
  });

  it("não cria link dentro de outro link", () => {
    expect(renderMarkdown("[https://a.com](https://a.com)")).toBe(
      '<p><a href="https://a.com" target="_blank" rel="nofollow noopener noreferrer">https://a.com</a></p>'
    );
  });

  it("transforma menções em links para o membro", () => {
    expect(renderMarkdown("oi @Steve_1, tudo bem?")).toBe(
      '<p>oi <a class="mention" href="/comunidade/membro/Steve_1">@Steve_1</a>, tudo bem?</p>'
    );
  });

  it("não trata e-mails como menções", () => {
    expect(renderMarkdown("contato@craftsapiens.com.br")).toBe("<p>contato@craftsapiens.com.br</p>");
  });

  it("mantém sublinhados dentro de palavras", () => {
    expect(renderMarkdown("snake_case_name")).toBe("<p>snake_case_name</p>");
  });
});

describe("extractMentions", () => {
  it("lista nicks sem repetir e ignora código", () => {
    expect(extractMentions("@Ana e @ana de novo, `@Code` e\n```\n@Bloco\n```\n@Bia")).toEqual(["Ana", "Bia"]);
  });

  it("ignora nicks fora do tamanho do Minecraft", () => {
    expect(extractMentions("@ab @nomemuitocompridoparaonick")).toEqual([]);
  });
});

describe("markdownToText", () => {
  it("remove a formatação e corta no tamanho", () => {
    expect(markdownToText("# Título\n\n**negrito** e [link](https://a.com) ![img](https://a.com/x.png)")).toBe(
      "Título negrito e link img"
    );
    expect(markdownToText("a".repeat(200), 10)).toBe("aaaaaaaaa…");
  });
});
