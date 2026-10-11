// =============================================================================
// Conteúdo da página Sobre
// =============================================================================
// Este arquivo concentra os dados editáveis da página /sobre. Para atualizar a
// equipe, a imprensa ou a linha do tempo, edite apenas as listas abaixo.

// -----------------------------------------------------------------------------
// Equipe
// -----------------------------------------------------------------------------
// Fotos: salve a imagem em public/equipe/ (quadrada, mínimo 600x600, .jpg ou
// .webp) e informe o caminho em `photo`, por exemplo "/equipe/helton.jpg".
// Sem foto, o cartão mostra as iniciais do nome.

export type TeamGroup = "Direção" | "Professores" | "Equipe";

export interface TeamMember {
  name: string;
  role: string;
  group: TeamGroup;
  photo?: string;
}

export const TEAM_GROUPS: TeamGroup[] = ["Direção", "Professores", "Equipe"];

export const TEAM: TeamMember[] = [
  { name: "Helton A. Gonçalves", role: "Fundador e diretor", group: "Direção" },
  { name: "David Guerreiro", role: "Gestão", group: "Direção" },

  { name: "Beatriz Fernandez", role: "Inglês e espanhol", group: "Professores" },
  { name: "João Pedro Pasqualetto", role: "Química", group: "Professores" },
  { name: "Kelvin Santos", role: "Português", group: "Professores" },
  { name: "Thawana Oliveira", role: "Professora", group: "Professores" },
  { name: "Marcelo Camilli", role: "Professor", group: "Professores" },
  { name: "Wilton Andretti", role: "Professor", group: "Professores" },
  { name: "Arthur Martins", role: "Professor", group: "Professores" },

  { name: "Bryan Munaretto Zauza", role: "Desenvolvimento", group: "Equipe" },
  { name: "Erica", role: "Redes sociais", group: "Equipe" },
  { name: "Jonas Agra", role: "Minecraft Interessante", group: "Equipe" },
];

// -----------------------------------------------------------------------------
// Imprensa
// -----------------------------------------------------------------------------
// `featured: true` destaca a matéria no topo da seção (use em apenas uma).
// `kind` indica o formato: "Reportagem", "Vídeo", "Podcast" etc.

export interface PressItem {
  outlet: string;
  title: string;
  date: string; // AAAA-MM-DD
  url: string;
  kind: string;
  featured?: boolean;
  excerpt?: string;
}

export const PRESS: PressItem[] = [
  {
    outlet: "Folha de S.Paulo",
    title: "Professor cria 'escola' digital dentro do Minecraft",
    date: "2026-03-20",
    url: "https://www1.folha.uol.com.br/educacao/2026/03/professor-do-parana-cria-escola-digital-dentro-do-minecraft.shtml",
    kind: "Reportagem",
    featured: true,
    excerpt:
      "A reportagem acompanha as aulas no servidor, ouve professores do projeto e uma especialista da Unesp em métodos de ensino.",
  },
  {
    outlet: "Xataka",
    title: "Metaverso da educação? Servidor no Minecraft oferece aulas gratuitas na plataforma",
    date: "2025-07-24",
    url: "https://www.xataka.com.br/informatica/metaverso-da-educacao-servidor-no-minecraft-oferece-aulas-gratuitas-na-plataforma",
    kind: "Reportagem",
  },
  {
    outlet: "Terra",
    title: "Minecraft na escola? Professor lança servidor no Brasil",
    date: "2024-07-22",
    url: "https://www.terra.com.br/gameon/videos/minecraft-na-escola-professor-lanca-servidor-no-brasil,de268d58ef3ac750e8e154db7884d9acqzkeovz0.html",
    kind: "Vídeo",
  },
  {
    outlet: "O Povo",
    title: "CraftSapiens: servidor no Minecraft tem aulas gratuitas para Enem",
    date: "2024-07-17",
    url: "https://www.opovo.com.br/noticias/enem/2024/07/17/craftsapiens-servidor-no-minecraft-tem-aulas-gratuitas-para-enem.html",
    kind: "Reportagem",
  },
  {
    outlet: "O Tempo / Estadão",
    title: "Entenda como funciona a CraftSapiens, escola dentro do Minecraft",
    date: "2024-06-26",
    url: "https://www.otempo.com.br/tecnologia-e-games/2024/6/26/entenda-como-funciona-a-craftsapiens--escola-dentro-do-minecraft",
    kind: "Reportagem",
  },
  {
    outlet: "Estado de Minas",
    title: "Enem 2024: professor desenvolve servidor no Minecraft com aulas gratuitas",
    date: "2024-06-21",
    url: "https://www.em.com.br/educacao/2024/06/6882806-enem-2024-professor-desenvolve-servidor-no-minecraft-com-aulas-gratuitas.html",
    kind: "Reportagem",
  },
  {
    outlet: "Band B",
    title: "Professor leva a sala de aula para dentro de jogo e conquista estudantes do Brasil inteiro",
    date: "2023-10-10",
    url: "https://www.bandab.com.br/educacao/professor-araucaria-leva-aula-para-dentro-de-jogo/",
    kind: "Reportagem",
  },
  {
    outlet: "O Popular do Paraná",
    title: "Projeto criado por professor conquista alunos em todo o Brasil",
    date: "2021-05-17",
    url: "https://opopularpr.com.br/projeto-criado-por-professor-araucariense-conquista-alunos-em-todo-brasil/",
    kind: "Reportagem",
  },
];

// -----------------------------------------------------------------------------
// Linha do tempo
// -----------------------------------------------------------------------------

export interface Milestone {
  year: string;
  title: string;
  description: string;
}

export const TIMELINE: Milestone[] = [
  {
    year: "2020",
    title: "As primeiras aulas no jogo",
    description:
      "Durante a pandemia, o professor Helton Gonçalves leva as aulas para dentro do Minecraft para se aproximar dos alunos no ensino remoto.",
  },
  {
    year: "2021",
    title: "Primeira reportagem",
    description:
      "O projeto aparece na imprensa pela primeira vez e passa a receber alunos de várias partes do país.",
  },
  {
    year: "2024",
    title: "Aulas para o Enem",
    description:
      "As aulas gratuitas de preparação para o Enem ganham cobertura nacional, em veículos como Estadão, Estado de Minas e O Povo.",
  },
  {
    year: "2025",
    title: "Turmas cheias",
    description: "As aulas atendem, em média, de 40 a 60 alunos cada, com professores voluntários de várias disciplinas.",
  },
  {
    year: "2026",
    title: "Folha de S.Paulo e nova plataforma",
    description:
      "A Folha publica uma reportagem sobre o projeto, e a CraftSapiens lança a nova plataforma, com loja, fórum e acompanhamento das aulas.",
  },
];

// -----------------------------------------------------------------------------
// Hierarquia do servidor
// -----------------------------------------------------------------------------

export interface Rank {
  role: string;
  description: string;
}

/** Do cargo mais alto para o mais baixo */
export const HIERARCHY: Rank[] = [
  { role: "Reitor", description: "Responsável pelas decisões finais do projeto." },
  { role: "Diretor", description: "Administração superior. Os diretores deliberam em conselho." },
  { role: "Administradores", description: "Supervisionam o servidor e resolvem conflitos." },
  { role: "Moderadores", description: "Garantem o cumprimento das regras." },
  { role: "Ajuda", description: "Recebem e orientam os novos jogadores." },
];

/** Corpo docente: fora da cadeia de moderação, responsável pelas aulas */
export const TEACHING_ROLE: Rank = {
  role: "Professores",
  description: "Preparam e ministram as aulas dentro do servidor.",
};
