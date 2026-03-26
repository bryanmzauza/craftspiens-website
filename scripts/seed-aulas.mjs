// Script para popular disciplinas e aulas iniciais.
// Uso: node scripts/seed-aulas.mjs
//
// Requer: DATABASE_URL no .env (formato mysql://)

import { createRequire } from "module";
const require = createRequire(import.meta.url);

const dotenv = require("dotenv");
dotenv.config();

const mariadb = require("mariadb");

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  console.error("DATABASE_URL não definida no .env");
  process.exit(1);
}

const connUrl = dbUrl.replace(/^mysql:\/\//, "mariadb://");

const DISCIPLINES = [
  {
    id: "disc_matematica",
    name: "Matemática",
    slug: "matematica",
    description: "Álgebra, geometria, aritmética e lógica matemática através de construções e puzzles no Minecraft. Resolva equações construindo estruturas, entenda geometria espacial em 3D e pratique raciocínio lógico com desafios interativos.",
    shortDescription: "Álgebra, geometria, aritmética e lógica matemática através de construções e puzzles no Minecraft.",
    icon: "Calculator",
    color: "#2196F3",
    levels: '["Fundamental","Médio"]',
    order: 1,
  },
  {
    id: "disc_ciencias",
    name: "Ciências",
    slug: "ciencias",
    description: "Biologia, Física e Química com experimentos virtuais, biomas e construções temáticas no servidor. Explore o corpo humano em escala real, visite biomas recriados com precisão científica e realize experimentos químicos seguros no ambiente virtual.",
    shortDescription: "Biologia, Física e Química com experimentos virtuais, biomas e construções temáticas no servidor.",
    icon: "Microscope",
    color: "#4CAF50",
    levels: '["Fundamental","Médio"]',
    order: 2,
  },
  {
    id: "disc_historia",
    name: "História",
    slug: "historia",
    description: "Viaje no tempo visitando civilizações construídas em escala dentro do Minecraft. Egito Antigo, Roma Imperial, Brasil Colonial e muito mais. Cada época é representada com fidelidade arquitetônica e contextualização histórica completa.",
    shortDescription: "Viaje no tempo visitando civilizações construídas em escala dentro do Minecraft.",
    icon: "Globe",
    color: "#FF9800",
    levels: '["Fundamental","Médio"]',
    order: 3,
  },
  {
    id: "disc_portugues",
    name: "Português",
    slug: "portugues",
    description: "Gramática, interpretação de texto e redação com missões temáticas e desafios literários interativos. Pratique redação em contextos gamificados, resolva enigmas gramaticais e explore obras literárias em cenários 3D imersivos.",
    shortDescription: "Gramática, interpretação de texto e redação com missões temáticas e desafios literários interativos.",
    icon: "BookOpen",
    color: "#E91E63",
    levels: '["Fundamental","Médio"]',
    order: 4,
  },
  {
    id: "disc_artes",
    name: "Artes",
    slug: "artes",
    description: "Expressão artística, história da arte e criatividade através de pixel art e construções estéticas. Reproduza obras de arte famosas em pixel art, explore movimentos artísticos em galerias virtuais e desenvolva sua criatividade sem limites.",
    shortDescription: "Expressão artística, história da arte e criatividade através de pixel art e construções estéticas.",
    icon: "Palette",
    color: "#9C27B0",
    levels: '["Fundamental"]',
    order: 5,
  },
  {
    id: "disc_programacao",
    name: "Programação",
    slug: "programacao",
    description: "Lógica de programação, algoritmos e pensamento computacional com redstone e command blocks. Aprenda conceitos de programação usando circuitos de redstone, crie automações com command blocks e desenvolva raciocínio algorítmico na prática.",
    shortDescription: "Lógica de programação, algoritmos e pensamento computacional com redstone e command blocks.",
    icon: "Code",
    color: "#00BCD4",
    levels: '["Fundamental","Médio"]',
    order: 6,
  },
  {
    id: "disc_ingles",
    name: "Inglês",
    slug: "ingles",
    description: "Vocabulário, gramática e conversação em inglês com imersão em ambientes temáticos bilíngues. Explore cenários totalmente em inglês, resolva quests com diálogos nativos e pratique conversação em situações reais dentro do jogo.",
    shortDescription: "Vocabulário, gramática e conversação em inglês com imersão em ambientes temáticos bilíngues.",
    icon: "Languages",
    color: "#FF5722",
    levels: '["Fundamental","Médio"]',
    order: 7,
  },
  {
    id: "disc_educacao_fisica",
    name: "Educação Física",
    slug: "educacao-fisica",
    description: "Minigames esportivos, parkour educativo e atividades que promovem coordenação e estratégia. Pratique esportes adaptados ao Minecraft, supere desafios de parkour temáticos e aprenda sobre saúde e bem-estar de forma interativa.",
    shortDescription: "Minigames esportivos, parkour educativo e atividades que promovem coordenação e estratégia.",
    icon: "Dumbbell",
    color: "#795548",
    levels: '["Fundamental"]',
    order: 8,
  },
];

const LESSONS = [
  // Matemática
  { id: "les_mat_01", disciplineId: "disc_matematica", title: "Introdução à Álgebra", slug: "introducao-algebra", description: "Conceitos básicos de álgebra usando construções proporcionais no Minecraft.", order: 1, duration: 45 },
  { id: "les_mat_02", disciplineId: "disc_matematica", title: "Equações do 1º Grau", slug: "equacoes-primeiro-grau", description: "Resolvendo equações simples com balanças e puzzles interativos.", order: 2, duration: 40 },
  { id: "les_mat_03", disciplineId: "disc_matematica", title: "Equações do 2º Grau", slug: "equacoes-segundo-grau", description: "Fórmula de Bhaskara aplicada em desafios de construção.", order: 3, duration: 50 },
  { id: "les_mat_04", disciplineId: "disc_matematica", title: "Geometria Espacial", slug: "geometria-espacial", description: "Explore sólidos geométricos em construções 3D no servidor.", order: 4, duration: 45 },
  { id: "les_mat_05", disciplineId: "disc_matematica", title: "Funções e Gráficos", slug: "funcoes-graficos", description: "Representação visual de funções com construções automatizadas.", order: 5, duration: 50 },

  // Ciências
  { id: "les_cie_01", disciplineId: "disc_ciencias", title: "Célula e Organismo", slug: "celula-organismo", description: "Visite uma célula gigante em 3D e explore suas organelas.", order: 1, duration: 40 },
  { id: "les_cie_02", disciplineId: "disc_ciencias", title: "Biomas Brasileiros", slug: "biomas-brasileiros", description: "Explore biomas recriados com fauna e flora fidedignas.", order: 2, duration: 45 },
  { id: "les_cie_03", disciplineId: "disc_ciencias", title: "Estados da Matéria", slug: "estados-materia", description: "Experimentos visuais com sólidos, líquidos e gases.", order: 3, duration: 35 },
  { id: "les_cie_04", disciplineId: "disc_ciencias", title: "Sistema Solar", slug: "sistema-solar", description: "Viaje pelo sistema solar em escala dentro do Minecraft.", order: 4, duration: 50 },

  // História
  { id: "les_his_01", disciplineId: "disc_historia", title: "Egito Antigo", slug: "egito-antigo", description: "Explore pirâmides e templos do Egito recriados em escala real.", order: 1, duration: 50 },
  { id: "les_his_02", disciplineId: "disc_historia", title: "Roma Imperial", slug: "roma-imperial", description: "Visite o Coliseu, Fórum Romano e aquedutos em construções detalhadas.", order: 2, duration: 45 },
  { id: "les_his_03", disciplineId: "disc_historia", title: "Brasil Colonial", slug: "brasil-colonial", description: "Reviva o período colonial com engenhos, igrejas e vilas recriadas.", order: 3, duration: 45 },

  // Português
  { id: "les_por_01", disciplineId: "disc_portugues", title: "Classes Gramaticais", slug: "classes-gramaticais", description: "Identifique substantivos, verbos e adjetivos em missões temáticas.", order: 1, duration: 40 },
  { id: "les_por_02", disciplineId: "disc_portugues", title: "Interpretação de Texto", slug: "interpretacao-texto", description: "Resolva enigmas baseados em textos literários dentro do jogo.", order: 2, duration: 45 },
  { id: "les_por_03", disciplineId: "disc_portugues", title: "Redação ENEM", slug: "redacao-enem", description: "Pratique redação dissertativa-argumentativa com temas atuais.", order: 3, duration: 50 },

  // Artes
  { id: "les_art_01", disciplineId: "disc_artes", title: "Pixel Art Básica", slug: "pixel-art-basica", description: "Aprenda técnicas de pixel art recriando obras famosas.", order: 1, duration: 40 },
  { id: "les_art_02", disciplineId: "disc_artes", title: "Movimentos Artísticos", slug: "movimentos-artisticos", description: "Visite galerias temáticas: Renascimento, Impressionismo, Pop Art.", order: 2, duration: 45 },

  // Programação
  { id: "les_pro_01", disciplineId: "disc_programacao", title: "Lógica com Redstone", slug: "logica-redstone", description: "Portas lógicas AND, OR, NOT usando circuitos de redstone.", order: 1, duration: 50 },
  { id: "les_pro_02", disciplineId: "disc_programacao", title: "Algoritmos Visuais", slug: "algoritmos-visuais", description: "Crie sequências e loops com command blocks encadeados.", order: 2, duration: 45 },
  { id: "les_pro_03", disciplineId: "disc_programacao", title: "Automação com Command Blocks", slug: "automacao-command-blocks", description: "Automatize tarefas complexas usando command blocks avançados.", order: 3, duration: 55 },

  // Inglês
  { id: "les_ing_01", disciplineId: "disc_ingles", title: "Vocabulário Básico", slug: "vocabulario-basico", description: "Aprenda palavras do dia a dia explorando cenários em inglês.", order: 1, duration: 35 },
  { id: "les_ing_02", disciplineId: "disc_ingles", title: "Diálogos e Conversação", slug: "dialogos-conversacao", description: "Pratique diálogos em situações reais dentro do servidor.", order: 2, duration: 40 },
  { id: "les_ing_03", disciplineId: "disc_ingles", title: "Grammar Challenges", slug: "grammar-challenges", description: "Desafios de gramática inglesa com quizzes interativos.", order: 3, duration: 40 },

  // Educação Física
  { id: "les_edf_01", disciplineId: "disc_educacao_fisica", title: "Parkour Educativo", slug: "parkour-educativo", description: "Supere obstáculos enquanto aprende sobre coordenação motora.", order: 1, duration: 30 },
  { id: "les_edf_02", disciplineId: "disc_educacao_fisica", title: "Esportes Adaptados", slug: "esportes-adaptados", description: "Minigames de futebol, vôlei e corrida dentro do Minecraft.", order: 2, duration: 35 },
];

async function main() {
  const pool = mariadb.createPool({ uri: connUrl, multipleStatements: true });
  const conn = await pool.getConnection();

  try {
    console.log("🌱 Seed de Aulas — Disciplinas + Aulas\n");

    // 1. Inserir disciplinas
    console.log(`1/2 — Inserindo ${DISCIPLINES.length} disciplinas...`);
    for (const d of DISCIPLINES) {
      await conn.query(
        `INSERT INTO website_disciplines (id, name, slug, description, short_description, icon, color, levels, \`order\`, active)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, TRUE)
         ON DUPLICATE KEY UPDATE
           name = VALUES(name),
           description = VALUES(description),
           short_description = VALUES(short_description),
           icon = VALUES(icon),
           color = VALUES(color),
           levels = VALUES(levels),
           \`order\` = VALUES(\`order\`)`,
        [d.id, d.name, d.slug, d.description, d.shortDescription, d.icon, d.color, d.levels, d.order]
      );
    }
    console.log("   ✅ Disciplinas OK");

    // 2. Inserir aulas
    console.log(`2/2 — Inserindo ${LESSONS.length} aulas...`);
    for (const l of LESSONS) {
      await conn.query(
        `INSERT INTO website_lessons (id, discipline_id, title, slug, description, \`order\`, duration_minutes, active)
         VALUES (?, ?, ?, ?, ?, ?, ?, TRUE)
         ON DUPLICATE KEY UPDATE
           title = VALUES(title),
           description = VALUES(description),
           \`order\` = VALUES(\`order\`),
           duration_minutes = VALUES(duration_minutes)`,
        [l.id, l.disciplineId, l.title, l.slug, l.description, l.order, l.duration]
      );
    }
    console.log("   ✅ Aulas OK");

    console.log("\n✅ Seed concluído com sucesso!");
  } catch (error) {
    console.error("❌ Erro no seed:", error.message);
    process.exit(1);
  } finally {
    await conn.release();
    await pool.end();
  }
}

main();
