# Página 02 — Sobre

> **Rota**: `/sobre`
> **Acesso**: Público
> **Propósito**: Apresentar a história, a equipe e a proposta da CraftSapiens.

---

## Implementação atual (v0.15)

A página foi refeita na v0.15. O conteúdo editável fica em `src/content/sobre.ts`; o layout, em `src/components/sobre/SobreContent.tsx`.

| Seção | Conteúdo |
|-------|----------|
| Hero | Imagem do campus com escurecimento, título, texto de apresentação e três números: início em 2020, 40 a 60 alunos por aula em média (Folha, 2026) e membros no Discord (ao vivo, via `/api/discord`) |
| Nossa história | Texto sobre a origem do projeto, citação do fundador e linha do tempo (`TIMELINE`) com marcos confirmados pela imprensa |
| Quem somos | Como as aulas funcionam: servidor e Discord, quadros e minijogos, Minecraft sem mods |
| Missão, visão e valores | Missão e visão em destaque e os cinco valores numerados |
| Na imprensa | Matéria em destaque (Folha de S.Paulo) e lista das demais (`PRESS`), todas com link para o original em nova aba |
| Nossa equipe | Membros agrupados em Direção, Professores e Equipe (`TEAM`); cada cartão mostra a foto ou, sem foto, as iniciais |
| Hierarquia | Pirâmide com os cinco cargos da moderação (`HIERARCHY`) e os professores à parte (`TEACHING_ROLE`) |
| CTA | Convite para entrar na equipe pelo Discord |

Como atualizar:

- **Foto de um membro:** salve a imagem em `public/equipe/` (quadrada, mínimo 600 x 600) e preencha `photo: "/equipe/arquivo.jpg"` no membro correspondente em `TEAM`.
- **Novo membro:** adicione um item em `TEAM` com `name`, `role` e `group`.
- **Nova matéria:** adicione um item em `PRESS` com veículo, título, data (AAAA-MM-DD), link e formato. Só inclua links conferidos.

O fundo de partículas global não é montado nesta página, como na home.

---

## Regras de Negócio

### RN-SOBRE-01: Hero da Página
- Banner com título "SOBRE NÓS" em fonte Minecraft
- Breadcrumb: Home > Sobre
- Background com leve overlay escuro sobre imagem do servidor

### RN-SOBRE-02: Nossa História
- Seção com timeline visual contando a trajetória da CraftSapiens
- Citação do fundador:
  > "Aqui os alunos realmente querem aprender, pois é prazeroso estudar jogando."
  > — Helton Alvares Gonçalves, Fundador
- Marcos importantes (fundação, primeiras aulas, reconhecimento na mídia, expansão)
- Animação de scroll: cada marco aparece progressivamente

### RN-SOBRE-03: Quem Somos
- Texto descritivo explicando:
  - O que é a CraftSapiens: uma plataforma de estudo gamificado dentro do Minecraft
  - Uso de Minecraft nativo (sem mods) para ensino, área em que a CraftSapiens foi pioneira
  - Programação em Java para criar um quadro funcional dentro do jogo
  - Minigames temáticos e aulas de campo com construções temáticas
  - Preparar essas aulas exige bem mais trabalho que aulas convencionais (o texto original fala em "10x mais difícil")
- Vídeo embed do Prof. Helton explicando como funcionam as aulas

### RN-SOBRE-04: Missão, Visão e Valores
- **Missão**: Tornar o ensino mais atraente e divertido através da gamificação no Minecraft
- **Visão**: Ser referência mundial em ensino gamificado
- **Valores**:
  - Inovação educacional
  - Comunidade e colaboração
  - Não desistir diante do desafio
  - Acessibilidade (versão gratuita disponível)
  - Segurança (ambiente monitorado)
- Exibir em cards ou layout de 3 colunas com ícones

### RN-SOBRE-05: Reconhecimento na Mídia
- Grid de logos / thumbnails de aparições na mídia:
  - Jornal O Popular do Paraná
  - YouTube com Willzy (1.2M+ inscritos)
  - Futurium Podcast
  - Outras aparições televisivas e impressas
- Cada item pode ser clicável (link para a matéria/vídeo original)

### RN-SOBRE-06: Nossa Equipe
- Grid de membros da equipe com:
  - Foto (skin do Minecraft renderizada ou foto real)
  - Nome
  - Cargo/Função
- Membros conhecidos:
  - **Helton A. Gonçalves** — Diretor/Fundador
  - **Jonas Agra** — Dono da página Minecraft Interessante
  - **Thawana Oliveira** — Professora
  - **Marcelo Camilli** — Professor
  - **Erica** — Redes Sociais
  - **Wilton Andretti** — Professor
  - **Arthur Martins** — Professor
- Botão "Junte-se à equipe" → Link para formulário de interesse ou Discord

### RN-SOBRE-07: Hierarquia do Servidor
- Exibir a hierarquia da equipe do servidor de forma visual:
  - **Reitor**: Responsável por qualquer deliberação
  - **Diretor**: Administração superior, deliberam em conselho
  - **Administradores**: Supervisionam e gerenciam conflitos
  - **Moderadores**: Garantem cumprimento das regras
  - **Ajuda**: Auxiliam novatos
  - **Professores**: Ministram as aulas
- Layout de organograma ou lista hierárquica visual

---

## Wireframe Textual

```
┌──────────────────────────────────────────────────────────────────┐
│ [NAVBAR]                                                         │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Home > Sobre                                                    │
│                                                                  │
│  ███████████████████                                             │
│  █   SOBRE NÓS     █                                             │
│  ███████████████████                                             │
│                                                                  │
├──────────────────────────────────────────────────────────────────┤
│                      NOSSA HISTÓRIA                              │
│                                                                  │
│  ┌─────┐     ┌─────┐     ┌─────┐     ┌─────┐                     │
│  │2020 │────→│2021 │────→│2022 │────→│2026 │  ← Timeline         │
│  │Fund.│     │Mídia│     │Expan│     │Novo │                     │
│  └─────┘     └─────┘     └─────┘     │Site │                     │
│                                      └─────┘                     │
│                                                                  │
│  "Aqui os alunos realmente querem aprender, pois é               │
│      prazeroso estudar jogando."                                 │
│      — Helton Alvares Gonçalves, Fundador                        │
│                                                                  │
├──────────────────────────────────────────────────────────────────┤
│                      QUEM SOMOS NÓS?                             │
│                                                                  │
│  [Texto descritivo]              [Vídeo do Prof. Helton]         │
│  A CraftSapiens oferece                                          │
│  aulas gamificadas dentro                                        │
│  do Minecraft...                                                 │
│                                                                  │
├──────────────────────────────────────────────────────────────────┤
│                  MISSÃO, VISÃO E VALORES                         │
│                                                                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                        │
│  │  Missão  │  │  Visão   │  │ Valores  │                        │
│  │  ...     │  │  ...     │  │  ...     │                        │
│  └──────────┘  └──────────┘  └──────────┘                        │
│                                                                  │
├──────────────────────────────────────────────────────────────────┤
│                  RECONHECIMENTO NA MÍDIA                         │
│                                                                  │
│  [Logo Jornal] [Thumb Willzy] [Logo Podcast] [Thumb TV]          │
│                                                                  │
├──────────────────────────────────────────────────────────────────┤
│                     NOSSA EQUIPE                                 │
│                                                                  │
│  ┌────┐  ┌────┐  ┌────┐  ┌────┐  ┌────┐  ┌────┐  ┌────┐          │
│  │Hel.│  │Jon.│  │Tha.│  │Mar.│  │Eri.│  │Wil.│  │Art.│          │
│  │Dir.│  │MC  │  │Prof│  │Prof│  │Red.│  │Prof│  │Prof│          │
│  └────┘  └────┘  └────┘  └────┘  └────┘  └────┘  └────┘          │
│                                                                  │
│              ┌──────────────────────┐                            │
│              │  JUNTE-SE À EQUIPE   │                            │
│              └──────────────────────┘                            │
│                                                                  │
├──────────────────────────────────────────────────────────────────┤
│ [FOOTER]                                                         │
└──────────────────────────────────────────────────────────────────┘
```

---

## SEO

| Meta | Valor |
|------|-------|
| **Title** | Sobre — CraftSapiens \| O Maior Metaverso Educacional |
| **Description** | Conheça a história da CraftSapiens, o maior metaverso educacional do mundo. Aulas gamificadas no Minecraft fundadas pelo Prof. Helton Alvares Gonçalves. |
| **OG Image** | Foto da equipe ou render do servidor |

---

## Responsividade

| Breakpoint | Comportamento |
|------------|---------------|
| **Desktop** | Timeline horizontal, equipe em grid 4 colunas, texto + vídeo lado a lado |
| **Tablet** | Timeline horizontal compacta, equipe em 3 colunas |
| **Mobile** | Timeline vertical, equipe em 2 colunas, vídeo abaixo do texto |
