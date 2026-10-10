# Página 01 — Home (Landing Page)

> **Rota**: `/`
> **Acesso**: Público (não requer autenticação)
> **Propósito**: Página de entrada do site. Apresentar a plataforma e levar o visitante ao cadastro.

---

## Implementação atual (v0.15)

A home foi refeita na v0.15. Estrutura em ordem:

| Seção | Componente | Conteúdo |
|-------|------------|----------|
| Hero | `home/HeroSection.tsx` | Imagem do campus em tela cheia (`src/assets/home/hero.webp`, importada estaticamente), título, descrição, dois CTAs, IP do servidor com botão de copiar e status do servidor ao vivo |
| O projeto | `home/IntroSection.tsx` | Texto de apresentação e lista numerada dos três pilares (aulas no jogo, Moeda SAPIENS, Enem e reforço), cada item levando a `/aulas`; o item da moeda exibe a imagem da Moeda SAPIENS |
| Disciplinas | `home/DisciplinesSection.tsx` | Até 8 disciplinas reais vindas de `/api/aulas`; a seção some quando não há disciplinas |
| Como funciona | `home/HowItWorksSection.tsx` | Quatro passos numerados ligados por uma linha |
| Números | `home/StatsSection.tsx` | Jogadores online, alunos cadastrados e aulas disponíveis (`/api/server-status` e `/api/estatisticas`) |
| CTA final | `home/CtaSection.tsx` | A mesma imagem do hero, escurecida, com os botões de cadastro e cronograma |

Animações do hero (todas desativadas com `prefers-reduced-motion`):

- Zoom lento e contínuo na imagem (CSS, 38 s, vai e volta)
- Parallax de rolagem: a imagem desce mais devagar que a página e o texto sobe e some
- Parallax do ponteiro: imagem e texto se deslocam alguns pixels em sentidos opostos (só com mouse)
- Luz pulsando no canto superior esquerdo e partículas de poeira subindo
- Indicador de rolagem no rodapé do hero

Enquadramento por orientação (variante `stacked` em `globals.css`): em telas em pé com menos de 1024 px (celulares e tablets em pé), a imagem ocupa os 56% superiores da tela, mostrando a cena inteira, e se funde com o fundo escuro onde fica o texto; em telas largas ou deitadas, a imagem cobre o hero inteiro e o texto fica à esquerda sobre um escurecimento.

O fundo de partículas global (`layout/AnimatedBackground.tsx`) não é montado na home: a imagem do hero substitui o fundo e as seções seguintes usam a cor de fundo padrão.

---

## Regras de Negócio

### RN-HOME-01: Hero Section
- A seção hero fica no topo da página, acima da dobra (above the fold)
- Conteúdo:
  - Título principal em fonte Minecraft (Minecrafter): "CONSTRUA SEU FUTURO JOGANDO."
  - Subtítulo: "O Maior Metaverso Educacional do Mundo."
  - Descrição: "Aulas reais, gamificação e comunidade no Minecraft."
  - Dois botões CTA:
    - "INICIAR JORNADA GRÁTIS" (verde, primário) → direciona para `/registro`
    - "VER GRADE CURRICULAR" (outlined, secundário) → direciona para `/cronograma`
- Background: imagem do campus virtual em tela cheia, com zoom lento, parallax e partículas de luz (ver "Implementação atual")
- Se o usuário já estiver logado, o botão "INICIAR JORNADA GRÁTIS" deve mudar para "ACESSAR PERFIL" e direcionar para `/perfil`

### RN-HOME-02: Cards de Features
> Implementação atual (v0.15): os três itens aparecem como uma lista numerada na seção "O projeto", e não como cards. Há ainda uma seção extra de disciplinas reais, não prevista aqui.

- Exibir 3 cards de features abaixo do hero:
  1. Aulas Gamificadas — ícone de sala de aula Minecraft + descrição breve
  2. Moeda SAPIENS — ícone da moeda + descrição do sistema de recompensa
  3. Enem & Reforço — ícone de prova/teste + descrição de preparação para exames
- Cada card é clicável e direciona para a página `/aulas`
- Cards com efeito de hover (scale + glow na borda)

### RN-HOME-03: Seção "Como Funciona"
- Exibir um fluxo visual de 3-4 etapas explicando como a plataforma funciona:
  1. Crie sua conta → ícone de registro
  2. Entre no servidor → ícone do Minecraft + IP (`jogar.craftsapiens.com.br`)
  3. Assista aulas jogando → ícone de aula gamificada
  4. Conquiste recompensas → ícone de Moeda SAPIENS / XP
- Animação de fade-in ao rolar a página (Framer Motion)

### RN-HOME-04: Status do Servidor (Mini Widget)
- Exibir na home:
  - Jogadores online agora: número em tempo real (atualiza a cada 30s)
  - Total de alunos: número com animação de contagem
  - Aulas disponíveis: quantidade
- Dados do servidor obtidos via API `/api/server-status`
- Se o servidor estiver offline, exibir "Servidor em manutenção" com ícone de alerta
> Implementação atual (v0.15): o número de jogadores aparece no hero e na faixa de números; offline é exibido como "Servidor offline" / "Offline". A atualização automática a cada 30 s ainda não existe.

### RN-HOME-05: Seção de Depoimentos / Social Proof
> Status: removida na v0.14 até existirem depoimentos reais e autorizados. Não publicar depoimentos fictícios.

- Exibir 3-4 depoimentos de alunos e pais
- Cada depoimento: foto (skin do Minecraft), nome, texto, cargo (aluno/pai)
- Carrossel automático em mobile, grid em desktop
- Dados estáticos (hardcoded ou CMS)

### RN-HOME-06: CTA Final
- Seção de call-to-action antes do footer
- Título: "Pronto para construir seu futuro?"
- Botão: "CRIAR CONTA GRÁTIS" → `/registro`
- Background diferenciado (gradiente verde escuro)
> Implementação atual (v0.15): título "Pronto para começar?", botões de cadastro e cronograma (só cronograma para quem está logado) sobre a imagem do hero escurecida.

---

## Wireframe Textual

```
┌──────────────────────────────────────────────────────────────────────┐
│ [NAVBAR — ver docs/componentes/navbar.md]                            │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ██████████████████████████████                                      │
│  █ CONSTRUA SEU               █     ┌──────────────────────────┐     │
│  █ FUTURO JOGANDO.            █     │                          │     │
│  ██████████████████████████████     │   [Imagem do servidor    │     │
│                                     │    com personagens       │     │
│  O Maior Metaverso Educacional      │    Minecraft usando      │     │
│  do Mundo.                          │    becas de formatura]   │     │
│  Aulas reais, gamificação e         │                          │     │
│  comunidade no Minecraft.           └──────────────────────────┘     │
│                                                                      │
│  ┌─────────────────────┐  ┌─────────────────────────┐                │
│  │ INICIAR JORNADA     │  │ VER GRADE CURRICULAR    │                │
│  │ GRÁTIS              │  │                         │                │
│  └─────────────────────┘  └─────────────────────────┘                │
│                                                                      │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐          │
│  │  [Ícone Aula]  │  │  [Ícone Moeda] │  │  [Ícone Test]  │          │
│  │                │  │                │  │                │          │
│  │    Aulas       │  │    Moeda       │  │   Enem &       │          │
│  │  Gamificadas   │  │   SAPIENS      │  │   Reforço      │          │
│  └────────────────┘  └────────────────┘  └────────────────┘          │
│                                                                      │
├──────────────────────────────────────────────────────────────────────┤
│                        COMO FUNCIONA                                 │
│                                                                      │
│  1. Crie sua   2. Entre no   3. Assista aulas  4. Conquiste          │
│     conta         servidor      jogando           recompensas        │
│                                                                      │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  [online] 127 jogadores online  |  500+ alunos  |  30 aulas          │
│                                                                      │
├──────────────────────────────────────────────────────────────────────┤
│                       DEPOIMENTOS                                    │
│                                                                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                            │
│  │ "Texto   │  │ "Texto   │  │ "Texto   │                            │
│  │  depoi-  │  │  depoi-  │  │  depoi-  │                            │
│  │  mento"  │  │  mento"  │  │  mento"  │                            │
│  │ — Nome   │  │ — Nome   │  │ — Nome   │                            │
│  └──────────┘  └──────────┘  └──────────┘                            │
│                                                                      │
├──────────────────────────────────────────────────────────────────────┤
│                  PRONTO PARA CONSTRUIR SEU FUTURO?                   │
│              ┌───────────────────────────┐                           │
│              │    CRIAR CONTA GRÁTIS     │                           │
│              └───────────────────────────┘                           │
│                                                                      │
├──────────────────────────────────────────────────────────────────────┤
│ [FOOTER — ver docs/componentes/footer.md]                            │
└──────────────────────────────────────────────────────────────────────┘
```

---

## Dados Necessários

| Dado | Fonte | Atualização |
|------|-------|-------------|
| Jogadores online | API `/api/server-status` | A cada 30 segundos |
| Total de alunos | API `/api/estatisticas` (contas ativas) | A cada carregamento |
| Quantidade de aulas | API `/api/estatisticas` (aulas ativas) | A cada carregamento |
| Depoimentos | — (seção removida até haver depoimentos reais) | — |

---

## SEO

| Meta | Valor |
|------|-------|
| **Title** | CraftSapiens — O Maior Metaverso Educacional do Mundo |
| **Description** | Construa seu futuro jogando. Aulas reais, gamificação e comunidade no Minecraft. Aprenda de forma divertida com a CraftSapiens. |
| **Keywords** | craftsapiens, minecraft educacional, aulas minecraft, metaverso educacional, ensino gamificado |
| **OG Image** | Screenshot do servidor com logo |

---

## Responsividade

| Breakpoint | Comportamento |
|------------|---------------|
| **Desktop (lg+)** | Layout lado a lado: texto à esquerda, imagem à direita no hero. Grid 3 colunas nos cards. |
| **Tablet (md)** | Hero empilhado (texto em cima, imagem embaixo). Grid 2 colunas nos cards. |
| **Mobile (sm)** | Tudo empilhado. Cards em coluna única. CTAs full-width. Depoimentos em carrossel. |
