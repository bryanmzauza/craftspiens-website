// Disciplinas das aulas e classificação dos vídeos do canal da Craftsapiens no YouTube.
//
// Usado por scripts/seed-aulas.mjs. Os vídeos vêm de scripts/data/youtube-videos.json,
// gerado por scripts/youtube-sync.mjs.
//
// A matéria é identificada pelo título do vídeo ("Aula de Química no Minecraft",
// "[LIVE] Aula no Minecraft: Física - vetores"...). Um vídeo pode entrar em mais de
// uma disciplina (ex.: "Inglês/Espanhol", "Química - ENEM"). Lives com título
// genérico usam o título transcrito da miniatura (youtube-titulos.mjs).

import { THUMBNAIL_TITLES } from "./youtube-titulos.mjs";

// `area` precisa ser uma das áreas de AREAS em src/lib/aulas.ts (filtros da página /aulas).
// `match` é testado contra o título sem acentos e em minúsculas, já sem
// "[LIVE]", "[Craftsapiens]" e afins. Inclui erros de digitação que aparecem
// nos títulos do canal (ex.: "Maetmática", "Esapnhol", "Protuguês").
export const DISCIPLINES = [
  {
    slug: "matematica",
    name: "Matemática",
    icon: "Calculator",
    color: "#2196F3",
    area: "Exatas",
    shortDescription: "Matemática básica, álgebra, funções, logaritmos, matemática financeira e cálculo, em aulas ao vivo no servidor.",
    description: "Aulas de matemática gravadas ao vivo dentro do servidor: expressões numéricas, frações, equações, funções exponenciais, logaritmos, progressões, números complexos, trigonometria, probabilidade, fractais, matemática financeira e cálculo diferencial (derivadas e regras de derivação).",
    match: /matem|maetm|calculo|logaritm|fractais|juros|probabilidade|progressao aritmetica|pitagor|arquimedes|bolsa de valores/,
  },
  {
    slug: "portugues",
    name: "Português",
    icon: "BookOpen",
    color: "#E91E63",
    area: "Linguagens",
    shortDescription: "Gramática, interpretação, gêneros textuais e redação, com aulas voltadas também para o ENEM.",
    description: "Aulas de língua portuguesa: classes de palavras, tipos de sujeito, uso da crase, os quatro porquês, encontros vocálicos, gêneros textuais e redação dissertativo-argumentativa, além de aulas de linguística.",
    match: /portugu|protugu|redacao|linguistica/,
  },
  {
    slug: "fisica",
    name: "Física",
    icon: "Atom",
    color: "#3F51B5",
    area: "Exatas",
    shortDescription: "Cinemática, termologia, eletromagnetismo, ondulatória e relatividade, com experimentos no Minecraft.",
    description: "Aulas de física no servidor: cinemática e MRUV, termologia e termodinâmica, dilatação térmica, eletrização e potenciais elétricos, lei de Faraday, ondulatória, física nuclear, relatividade geral e a série sobre viagens no tempo.",
    match: /(?<!astro)fisica|relatividade|viage(m|ns) no tempo|ogivas|armas nucleares|eletricidade e magnetismo|newton|ciencia do tiro|como funcionam os foguetes/,
  },
  {
    slug: "quimica",
    name: "Química",
    icon: "FlaskConical",
    color: "#009688",
    area: "Exatas",
    shortDescription: "Modelos atômicos, ligações, química orgânica, estequiometria e astroquímica.",
    description: "Aulas de química gravadas ao vivo: modelos atômicos e distribuição eletrônica, ligações químicas, ácidos e bases, estequiometria, reações endotérmicas e exotérmicas, química orgânica (hidrocarbonetos e funções oxigenadas), radioatividade, astroquímica e questões do ENEM.",
    match: /quimica|radioatividade|estequiometria|modelos atomicos|atomo moderno/,
  },
  {
    slug: "biologia",
    name: "Biologia",
    icon: "Dna",
    color: "#4CAF50",
    area: "Natureza",
    shortDescription: "Genética, vacinas, curiosidades da biologia e revisões para o ENEM.",
    description: "Aulas de biologia no servidor: genética mendeliana e hereditariedade, funcionamento das vacinas, curiosidades do mundo animal e revisões voltadas para o ENEM.",
    match: /biologia|axolote|genetica|vacina/,
  },
  {
    slug: "historia",
    name: "História",
    icon: "Landmark",
    color: "#FF9800",
    area: "Humanas",
    shortDescription: "Da Pré-História às guerras mundiais, com cenários históricos construídos no servidor.",
    description: "Aulas de história gravadas ao vivo: Pré-História, Paleolítico e Neolítico, povos da Mesopotâmia, civilização maia, Renascimento, mercantilismo e colonização, Independência do Brasil, Revolução Farroupilha, Primeira e Segunda Guerra Mundial e história da ciência.",
    match: /historia|paleolitico|renascimento|mesopotamia|dia d\b/,
  },
  {
    slug: "geografia",
    name: "Geografia",
    icon: "Globe",
    color: "#8BC34A",
    area: "Humanas",
    shortDescription: "Espaço geográfico, continentes, indústrias e geopolítica.",
    description: "Aulas de geografia no servidor: espaço geográfico, continentes, ilhas e oceanos, biomas, classificação das indústrias, a era dos dinossauros, Guerra Fria e geopolítica do pós-guerra.",
    match: /geografia|geogafia|continentes/,
  },
  {
    slug: "ingles",
    name: "Inglês",
    icon: "Languages",
    color: "#FF5722",
    area: "Linguagens",
    shortDescription: "Vocabulário, gramática e conversação, com minigames dentro do jogo.",
    description: "Aulas de inglês gravadas ao vivo: verbo to be, present continuous, verbos modais, phrasal verbs, preposições, vocabulário e conversação, com minigames e atividades dentro do servidor.",
    match: /ingl|inlg/,
  },
  {
    slug: "astronomia",
    name: "Astronomia",
    icon: "Telescope",
    color: "#673AB7",
    area: "Natureza",
    shortDescription: "Sistema Solar, estrelas, galáxias, buracos negros e cosmologia, com preparação para a OBA.",
    description: "Aulas de astronomia e astrofísica: planetas do Sistema Solar, leis de Kepler, gravitação, estrelas de nêutrons e magnetares, novas e supernovas, buracos negros, galáxias e matéria escura, lei de Hubble, ondas gravitacionais, astrobiologia, astroquímica, cosmologia e preparação para a Olimpíada Brasileira de Astronomia (OBA).",
    match: /astronom|astrofisica|astroquimica|astrobiologia|cosmologia|leis de kepler|buracos? negros?|galaxias|planeta|magnetares|supernova|hubble/,
  },
  {
    slug: "ciencias",
    name: "Ciências",
    icon: "Microscope",
    color: "#CDDC39",
    area: "Natureza",
    shortDescription: "Ciências para o ensino fundamental: ciclo da água, vulcões, rochas, seres vivos e mais.",
    description: "Aulas de ciências para o ensino fundamental: ciclo da água e tratamento da água, ciclo do carbono, origem da vida, reino Monera, animais extintos e dinossauros, sistema respiratório, rochas, vulcões, magnetismo e introdução à química.",
    match: /ciencias|ciencisa|vulcoes|dinossauros/,
  },
  {
    slug: "literatura",
    name: "Literatura",
    icon: "BookMarked",
    color: "#AD1457",
    area: "Linguagens",
    shortDescription: "Escolas literárias brasileiras, do Arcadismo ao Romantismo.",
    description: "Aulas de literatura gravadas ao vivo no servidor, com foco nas escolas literárias brasileiras, como o Arcadismo e o Romantismo.",
    match: /iteratura|romantismo|arcadismo/,
  },
  {
    slug: "espanhol",
    name: "Espanhol",
    icon: "Languages",
    color: "#F44336",
    area: "Linguagens",
    shortDescription: "Vocabulário, gramática e expressões do dia a dia em espanhol.",
    description: "Aulas de espanhol no servidor: vocabulário, partes do corpo, adjetivos descritivos, horas e expressões de tempo, verbos reflexivos e gramática.",
    match: /espanhol|esapnhol/,
  },
  {
    slug: "japones",
    name: "Japonês",
    icon: "Languages",
    color: "#E53935",
    area: "Linguagens",
    shortDescription: "Língua, caligrafia e cultura japonesa, com minigames no servidor.",
    description: "Aulas de japonês gravadas ao vivo: escrita e vocabulário, caligrafia, cultura japonesa e minigames de fixação.",
    match: /japon|kaguya/,
  },
  {
    slug: "programacao",
    name: "Programação e Informática",
    icon: "Code",
    color: "#00BCD4",
    area: "Exatas",
    shortDescription: "Lógica de programação, Python, informática, análise de dados e circuitos de redstone.",
    description: "Aulas de lógica de programação (algoritmos, condições, laços de repetição, estruturas de dados, fatiamento e módulos, erros e exceções em Python), informática, evolução dos computadores, segurança digital, análise de dados e circuitos de redstone.",
    match: /programacao|progamacao|informatica|redstone|seguranca digital|analise de dados/,
  },
  {
    slug: "filosofia",
    name: "Filosofia",
    icon: "Lightbulb",
    color: "#795548",
    area: "Humanas",
    shortDescription: "Filosofia e sociologia, como a alegoria da caverna de Platão.",
    description: "Aulas de filosofia e sociologia no servidor, com temas como a alegoria da caverna de Platão.",
    match: /filosofia|sociologia/,
  },
  {
    slug: "direito",
    name: "Direito",
    icon: "Scale",
    color: "#607D8B",
    area: "Humanas",
    shortDescription: "Noções de direito constitucional, direitos e deveres individuais e coletivos.",
    description: "Aulas de direito para estudantes: fundamentos e princípios constitucionais, o artigo 5º da Constituição e os direitos e deveres individuais e coletivos.",
    match: /direito/,
  },
  {
    slug: "musica",
    name: "Música",
    icon: "Music",
    color: "#9C27B0",
    area: "Linguagens",
    shortDescription: "Teoria musical, leitura rítmica, intervalos e compositores.",
    description: "Aulas de música no servidor: elementos da música, notação musical, leitura rítmica, tempo e figuras rítmicas, intervalos e compositores.",
    match: /musica|compositores/,
  },
  {
    slug: "atualidades",
    name: "Atualidades",
    icon: "Newspaper",
    color: "#FFC107",
    area: "Humanas",
    shortDescription: "Debates sobre temas atuais, como apostas online e casos em destaque no noticiário.",
    description: "Aulas de atualidades com debates sobre temas em destaque no noticiário, como a proibição das apostas online e a aplicação do direito a casos recentes.",
    match: /atualidades/,
  },
  {
    slug: "oratoria",
    name: "Oratória",
    icon: "Mic",
    color: "#FF7043",
    area: "Linguagens",
    shortDescription: "Teoria e prática de falar em público.",
    description: "Aulas de oratória com teoria e prática de falar em público, gravadas ao vivo no servidor.",
    match: /oratoria/,
  },
  {
    slug: "artes",
    name: "Artes",
    icon: "Palette",
    color: "#BA68C8",
    area: "Linguagens",
    shortDescription: "Pixel art e minigames de artes no servidor.",
    description: "Atividades de artes no servidor, com minigames e o labirinto das pixel arts.",
    match: /\bartes\b|pixel art/,
  },
  {
    slug: "xadrez",
    name: "Xadrez",
    icon: "ChessKnight",
    color: "#9E9E9E",
    area: "Outras",
    shortDescription: "Aulas de xadrez para iniciantes e torneios dentro do Minecraft.",
    description: "Aulas de xadrez para iniciantes e torneios disputados dentro do Minecraft.",
    match: /xadrez/,
  },
  {
    slug: "educacao-socioemocional",
    name: "Educação Socioemocional",
    icon: "HeartHandshake",
    color: "#EC407A",
    area: "Outras",
    shortDescription: "Educação positiva para pais, educação emocional, autismo e TDAH.",
    description: "Lives de educação positiva voltadas para pais e responsáveis (birras, choro, gritos, mentiras), aulas de educação emocional e conversas sobre autismo, altas habilidades e TDAH.",
    match: /educacao (positiva|emocional|socioemocional)|autismo|tdah|altas habilidades|roda de conversa/,
  },
  {
    slug: "ensino-religioso",
    name: "Ensino Religioso",
    icon: "BookHeart",
    color: "#8D6E63",
    area: "Outras",
    shortDescription: "Estudos bíblicos e aulas de ensino religioso.",
    description: "Estudos bíblicos, leitura da Bíblia e aulas de ensino religioso gravadas ao vivo no servidor.",
    match: /biblic|biblia|ensino religioso/,
  },
  {
    slug: "enem-vestibulares",
    name: "ENEM e Vestibulares",
    icon: "ClipboardCheck",
    color: "#FFB300",
    area: "Outras",
    shortDescription: "Revisões, simulados e aulas para o ENEM, vestibulares militares e olimpíadas.",
    description: "Aulas de revisão para o ENEM em várias matérias, simulados feitos dentro do Minecraft, o Sábado Militar (preparação para ITA, IME e EsPCEx) e preparação para a Olimpíada Brasileira de Astronomia.",
    match: /enem|vestibular|simulado|sabado militar|\bita\b|\bime\b|espcex|\boba\b/,
  },
  {
    slug: "aulas-gerais",
    name: "Outras Aulas",
    icon: "MonitorPlay",
    color: "#78909C",
    area: "Outras",
    shortDescription: "Lives de aula sem a matéria indicada no título nem na miniatura.",
    description: "Aulas transmitidas ao vivo com título genérico, como \"Aula no Minecraft\", e sem a matéria na miniatura. Elas aparecem aqui até serem classificadas.",
    match: null,
  },
  {
    slug: "servidor-comunidade",
    name: "Servidor e Comunidade",
    icon: "Radio",
    color: "#26A69A",
    area: "Outras",
    shortDescription: "Tutoriais, eventos, novidades e lives de gameplay no servidor.",
    description: "Vídeos e lives que não são aulas de uma matéria: tutoriais do servidor, eventos, inaugurações, enquetes, comunicados, o Survival Geopolítico e lives especiais de 24 e 48 horas.",
    match: null,
  },
];

// Disciplinas extras para vídeos específicos, somadas às encontradas pelo título.
// Use para classificar as lives de título genérico ("Aula no Minecraft") ou
// corrigir algum vídeo: { "<id do vídeo>": ["quimica"] }.
// Um valor iniciado por "=" substitui a classificação: { "<id>": ["=servidor-comunidade"] }.
export const OVERRIDES = {
  "pYSHK0rX5-E": ["=servidor-comunidade"], // divulgação do canal "Vamos falar de História"
  YBlNA13fboM: ["=servidor-comunidade"], // "Albert Einstein apoia a Universidade Craftsapiens"
  gLGE7fqZjG0: ["=servidor-comunidade"], // "Novo professor de Química"
  "lGFts-jw5Yc": ["=servidor-comunidade"], // "Evento DJ show musica eletrônica"
  "s9uM3YXzp-o": ["=servidor-comunidade"], // "Aula no Minecraft: Slimefun" (mecânica do servidor)
  yZ9lsUDTKc8: ["portugues"], // "O que é uma Frase?"
};

const FALLBACK_LESSON = "aulas-gerais";
const FALLBACK_OTHER = "servidor-comunidade";

/** Remove acentos, passa para minúsculas e junta espaços repetidos */
export function normalize(text) {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

/** Título para exibição: sem "[LIVE]", "[Craftsapiens]", "Cópia de" e afins */
export function cleanTitle(title) {
  const cleaned = title
    .replace(/^c[óo]pia de\s+/i, "")
    .replace(/^\[(live|premium)\]\s*/i, "")
    .replace(/^live\s+-\s+/i, "")
    .replace(/\s*-?\s*craftsapiens metaverso educacional\s*$/i, "")
    .replace(/\s*-?\s*metaverso educacional craftsapiens\s*$/i, "")
    // "Virei Turista na [Craftsapiens]": o nome faz parte da frase
    .replace(/\b(da|de|do|na|no)\s+[[(]craftsapiens[\])]/gi, "$1 Craftsapiens")
    .replace(/\s*-?\s*[[(]craftsapiens[\])]/gi, "")
    .replace(/\s+-\s+craftsapiens\s*$/i, "")
    .replace(/\s+ao vivo\s*$/i, "")
    .replace(/\bmincraft\b/gi, "Minecraft")
    .replace(/\s+/g, " ")
    .replace(/[\s\-:]+$/, "")
    .replace(/\(\s*\)/g, "")
    .trim();
  return cleaned || title.trim();
}

/** Título exibido no site: o da miniatura, quando houver, ou o do YouTube sem os marcadores */
export function displayTitle(video) {
  return THUMBNAIL_TITLES[video.id] ?? cleanTitle(video.title);
}

/** Parte do título que indica a matéria (ex.: "quimica" em "Aula de Química no Minecraft - ...") */
function subjectSegment(norm) {
  const military = norm.match(/^aula especial - sabado militar - (.+)$/);
  if (military) return military[1];

  const prefixed = norm.match(/^aulas? (?:no|na) minecraft\s*(?:[:\-]|sobre\b)\s*(.+)$/);
  if (prefixed) return prefixed[1].split(/ - |:|,| \| |\(/)[0];

  const named = norm.match(/^aulas? (?:de |sobre )?\s*(.+?)\s*(?:no|na) (?:minecraft|universidade)/);
  if (named) return named[1];

  const generic = norm.match(/^(.+?)\s*no minecraft/);
  if (generic) return generic[1];

  return null;
}

function matchDisciplines(text) {
  return DISCIPLINES.filter((d) => d.match && d.match.test(text)).map((d) => d.slug);
}

/**
 * Disciplinas de um vídeo (slugs). Sempre retorna ao menos uma:
 * aulas sem matéria identificada vão para "aulas-gerais" e o restante
 * (tutoriais, eventos, gameplay) para "servidor-comunidade".
 */
export function classify(video) {
  const override = OVERRIDES[video.id] ?? [];
  const replace = override.filter((s) => s.startsWith("=")).map((s) => s.slice(1));
  if (replace.length > 0) return replace;

  const norm = normalize(displayTitle(video));
  const segment = subjectSegment(norm);

  let slugs = segment ? matchDisciplines(segment) : [];
  if (slugs.length === 0) slugs = matchDisciplines(norm);

  // ENEM, vestibulares e olimpíadas podem aparecer em qualquer parte do título
  const enem = DISCIPLINES.find((d) => d.slug === "enem-vestibulares");
  if (enem.match.test(norm) && !slugs.includes(enem.slug)) slugs.push(enem.slug);

  slugs.push(...override);

  if (slugs.length === 0) {
    const isLessonLive = video.kind === "live" && /^aulas? /.test(norm);
    slugs.push(isLessonLive ? FALLBACK_LESSON : FALLBACK_OTHER);
  }

  return [...new Set(slugs)];
}

/** Slug de URL a partir de um texto */
export function slugify(text) {
  return normalize(text)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
