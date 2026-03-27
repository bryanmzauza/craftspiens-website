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
  {
    id: "les_mat_01", disciplineId: "disc_matematica", title: "Introdução à Álgebra", slug: "introducao-algebra",
    description: "Conceitos básicos de álgebra usando construções proporcionais no Minecraft.",
    content: "<h3>O que é Álgebra?</h3><p>Álgebra é o ramo da matemática que usa letras e símbolos para representar números e quantidades em fórmulas e equações.</p><h3>Na Prática</h3><p>Nesta aula, você construirá estruturas proporcionais no Minecraft para entender como variáveis funcionam. Cada bloco representa uma unidade, e você precisará calcular quantos blocos usar para manter as proporções corretas.</p><h3>Atividade</h3><p>Construa uma casa onde a altura é sempre o dobro da largura. Depois, faça variações mantendo a proporção.</p>",
    objectives: '["Entender o conceito de variável e constante","Resolver expressões algébricas simples","Aplicar álgebra em construções proporcionais"]',
    videoUrl: null, order: 1, duration: 45,
  },
  {
    id: "les_mat_02", disciplineId: "disc_matematica", title: "Equações do 1º Grau", slug: "equacoes-primeiro-grau",
    description: "Resolvendo equações simples com balanças e puzzles interativos.",
    content: "<h3>Equilíbrio e Equações</h3><p>Uma equação do 1º grau é como uma balança: o que está de um lado deve ser igual ao que está do outro.</p><h3>Mecânica da Aula</h3><p>No servidor, você encontrará balanças gigantes feitas com pistões e redstone. Cada lado tem blocos representando valores. Sua missão é descobrir quantos blocos faltam para equilibrar.</p><h3>Exemplo</h3><p>Se um lado tem 3 blocos de ouro + X blocos de ferro, e o outro tem 7 blocos de ouro, quanto vale X?</p>",
    objectives: '["Compreender o conceito de equação como igualdade","Isolar variáveis em equações do 1º grau","Verificar soluções substituindo valores"]',
    videoUrl: null, order: 2, duration: 40,
  },
  {
    id: "les_mat_03", disciplineId: "disc_matematica", title: "Equações do 2º Grau", slug: "equacoes-segundo-grau",
    description: "Fórmula de Bhaskara aplicada em desafios de construção.",
    content: "<h3>Fórmula de Bhaskara</h3><p>A fórmula de Bhaskara resolve equações do tipo ax² + bx + c = 0. É uma das ferramentas mais importantes da matemática.</p><h3>Aplicação no Minecraft</h3><p>Nesta aula, você usará a fórmula para calcular dimensões de arcos parabólicos. Cada arco precisa ter uma altura e largura específicas — e a parábola define o formato!</p>",
    objectives: '["Identificar coeficientes a, b e c em equações do 2º grau","Aplicar a fórmula de Bhaskara","Interpretar o discriminante (delta)"]',
    videoUrl: null, order: 3, duration: 50,
  },
  {
    id: "les_mat_04", disciplineId: "disc_matematica", title: "Geometria Espacial", slug: "geometria-espacial",
    description: "Explore sólidos geométricos em construções 3D no servidor.",
    content: "<h3>Sólidos Geométricos</h3><p>O Minecraft é naturalmente 3D, tornando-o perfeito para estudar geometria espacial. Cubos, prismas, pirâmides e cilindros ganham vida como construções reais.</p><h3>Atividades</h3><p>Construa cada sólido geométrico e calcule seu volume e área de superfície usando as fórmulas apropriadas. Compare seus cálculos teóricos com a contagem real de blocos.</p>",
    objectives: '["Identificar e classificar sólidos geométricos","Calcular volume de prismas, pirâmides e cilindros","Relacionar fórmulas 2D e 3D"]',
    videoUrl: null, order: 4, duration: 45,
  },
  {
    id: "les_mat_05", disciplineId: "disc_matematica", title: "Funções e Gráficos", slug: "funcoes-graficos",
    description: "Representação visual de funções com construções automatizadas.",
    content: "<h3>Funções no Mundo Real</h3><p>Funções descrevem relações entre grandezas. No Minecraft, usamos command blocks e redstone para criar gráficos visuais de funções matemáticas.</p><h3>Prática</h3><p>Construa um plano cartesiano gigante e represente graficamente funções lineares e quadráticas usando blocos coloridos.</p>",
    objectives: '["Entender o conceito de função e seus elementos","Plotar gráficos de funções do 1º e 2º grau","Analisar comportamento de funções"]',
    videoUrl: null, order: 5, duration: 50,
  },

  // Ciências
  {
    id: "les_cie_01", disciplineId: "disc_ciencias", title: "Célula e Organismo", slug: "celula-organismo",
    description: "Visite uma célula gigante em 3D e explore suas organelas.",
    content: "<h3>Dentro da Célula</h3><p>No servidor, construímos uma célula animal em escala gigante — com mais de 100 blocos de diâmetro. Cada organela é representada com materiais e cores diferentes.</p><h3>Exploração</h3><p>Você entrará na célula e visitará cada organela: núcleo, mitocôndria, retículo endoplasmático, complexo de Golgi e muito mais. Placas informativas explicam a função de cada uma.</p>",
    objectives: '["Identificar as principais organelas celulares","Compreender a função de cada organela","Diferenciar célula animal e vegetal"]',
    videoUrl: null, order: 1, duration: 40,
  },
  {
    id: "les_cie_02", disciplineId: "disc_ciencias", title: "Biomas Brasileiros", slug: "biomas-brasileiros",
    description: "Explore biomas recriados com fauna e flora fidedignas.",
    content: "<h3>Os 6 Biomas do Brasil</h3><p>O servidor recria os principais biomas brasileiros com precisão: Amazônia, Cerrado, Caatinga, Mata Atlântica, Pampa e Pantanal.</p><h3>Missão</h3><p>Viaje por cada bioma, identifique espécies da fauna e flora, e complete desafios temáticos em cada região.</p>",
    objectives: '["Identificar os 6 biomas brasileiros","Relacionar fauna e flora a cada bioma","Compreender ameaças e preservação ambiental"]',
    videoUrl: null, order: 2, duration: 45,
  },
  {
    id: "les_cie_03", disciplineId: "disc_ciencias", title: "Estados da Matéria", slug: "estados-materia",
    description: "Experimentos visuais com sólidos, líquidos e gases.",
    content: "<h3>Sólido, Líquido e Gasoso</h3><p>Usando redstone e command blocks, simulamos transições de estado da matéria. Blocos sólidos se transformam em água (líquido) e depois em partículas (gás) conforme a temperatura sobe.</p>",
    objectives: '["Diferenciar os estados da matéria","Entender mudanças de estado (fusão, ebulição, etc.)","Relacionar temperatura e estados da matéria"]',
    videoUrl: null, order: 3, duration: 35,
  },
  {
    id: "les_cie_04", disciplineId: "disc_ciencias", title: "Sistema Solar", slug: "sistema-solar",
    description: "Viaje pelo sistema solar em escala dentro do Minecraft.",
    content: "<h3>Os Planetas</h3><p>Explore nosso sistema solar construído em escala logarítmica dentro do servidor. De Mercúrio a Netuno, cada planeta tem tamanho, cores e características representadas com fidelidade.</p>",
    objectives: '["Identificar os 8 planetas do sistema solar","Compreender órbitas e distâncias relativas","Conhecer características de cada planeta"]',
    videoUrl: null, order: 4, duration: 50,
  },

  // História
  {
    id: "les_his_01", disciplineId: "disc_historia", title: "Egito Antigo", slug: "egito-antigo",
    description: "Explore pirâmides e templos do Egito recriados em escala real.",
    content: "<h3>O Egito dos Faraós</h3><p>No servidor, recriamos a Pirâmide de Gizé, o Templo de Karnak e o Vale dos Reis em escala real. Cada construção tem informações históricas em placas interativas.</p><h3>Atividade</h3><p>Complete uma expedição arqueológica, encontrando artefatos escondidos e respondendo perguntas sobre a civilização egípcia.</p>",
    objectives: '["Compreender a sociedade e cultura do Egito Antigo","Identificar as principais construções egípcias","Entender a importância do Rio Nilo"]',
    videoUrl: null, order: 1, duration: 50,
  },
  {
    id: "les_his_02", disciplineId: "disc_historia", title: "Roma Imperial", slug: "roma-imperial",
    description: "Visite o Coliseu, Fórum Romano e aquedutos em construções detalhadas.",
    content: "<h3>A Glória de Roma</h3><p>Explore o Coliseu, o Fórum Romano e uma villa romana recriados com detalhes arquitetônicos fiéis. Aprenda sobre a República e o Império Romano.</p>",
    objectives: '["Conhecer a estrutura política de Roma","Compreender o legado cultural romano","Analisar a expansão e queda do Império"]',
    videoUrl: null, order: 2, duration: 45,
  },
  {
    id: "les_his_03", disciplineId: "disc_historia", title: "Brasil Colonial", slug: "brasil-colonial",
    description: "Reviva o período colonial com engenhos, igrejas e vilas recriadas.",
    content: "<h3>Brasil Colônia (1500-1822)</h3><p>Visite um engenho de açúcar completo, igrejas barrocas e vilas coloniais. Entenda o sistema de capitanias, a economia açucareira e o impacto da colonização.</p>",
    objectives: '["Compreender o sistema colonial português","Analisar a economia açucareira","Entender as relações sociais no período colonial"]',
    videoUrl: null, order: 3, duration: 45,
  },

  // Português
  {
    id: "les_por_01", disciplineId: "disc_portugues", title: "Classes Gramaticais", slug: "classes-gramaticais",
    description: "Identifique substantivos, verbos e adjetivos em missões temáticas.",
    content: "<h3>As 10 Classes Gramaticais</h3><p>Nesta aula, cada classe gramatical é representada por um tipo de bloco no Minecraft. Sua missão é classificar palavras encontradas em placas espalhadas pelo mapa temático.</p>",
    objectives: '["Identificar as 10 classes gramaticais","Classificar palavras em contexto","Diferenciar classes variáveis e invariáveis"]',
    videoUrl: null, order: 1, duration: 40,
  },
  {
    id: "les_por_02", disciplineId: "disc_portugues", title: "Interpretação de Texto", slug: "interpretacao-texto",
    description: "Resolva enigmas baseados em textos literários dentro do jogo.",
    content: "<h3>Leitura e Compreensão</h3><p>Explore uma biblioteca gigante no servidor, onde cada sala contém um texto diferente. Leia, interprete e responda perguntas para avançar pelos desafios.</p>",
    objectives: '["Desenvolver habilidades de leitura crítica","Identificar informações explícitas e implícitas","Reconhecer diferentes gêneros textuais"]',
    videoUrl: null, order: 2, duration: 45,
  },
  {
    id: "les_por_03", disciplineId: "disc_portugues", title: "Redação ENEM", slug: "redacao-enem",
    description: "Pratique redação dissertativa-argumentativa com temas atuais.",
    content: "<h3>Redação Nota 1000</h3><p>Aprenda a estrutura da redação do ENEM: introdução com tese, desenvolvimento argumentativo e proposta de intervenção. Temas atuais são apresentados em cenários interativos.</p>",
    objectives: '["Dominar a estrutura dissertativa-argumentativa","Elaborar tese e argumentos consistentes","Criar propostas de intervenção detalhadas"]',
    videoUrl: null, order: 3, duration: 50,
  },

  // Artes
  {
    id: "les_art_01", disciplineId: "disc_artes", title: "Pixel Art Básica", slug: "pixel-art-basica",
    description: "Aprenda técnicas de pixel art recriando obras famosas.",
    content: "<h3>Arte em Pixels</h3><p>Pixel art é a arte de criar imagens pixel a pixel — e os blocos do Minecraft são pixels perfeitos! Aprenda técnicas de sombreamento, paleta de cores e proporção.</p>",
    objectives: '["Compreender os fundamentos da pixel art","Criar composições com paleta de cores limitada","Reproduzir obras de arte em formato pixel"]',
    videoUrl: null, order: 1, duration: 40,
  },
  {
    id: "les_art_02", disciplineId: "disc_artes", title: "Movimentos Artísticos", slug: "movimentos-artisticos",
    description: "Visite galerias temáticas: Renascimento, Impressionismo, Pop Art.",
    content: "<h3>Viagem pela História da Arte</h3><p>Explore galerias virtuais com obras representativas de cada movimento artístico. Da Mona Lisa à Pop Art de Andy Warhol, cada galeria é tematizada.</p>",
    objectives: '["Identificar principais movimentos artísticos","Reconhecer obras e artistas icônicos","Compreender o contexto histórico de cada movimento"]',
    videoUrl: null, order: 2, duration: 45,
  },

  // Programação
  {
    id: "les_pro_01", disciplineId: "disc_programacao", title: "Lógica com Redstone", slug: "logica-redstone",
    description: "Portas lógicas AND, OR, NOT usando circuitos de redstone.",
    content: "<h3>Portas Lógicas</h3><p>Redstone é a eletricidade do Minecraft. Com ela, construímos circuitos que funcionam como portas lógicas reais: AND, OR, NOT, XOR e mais.</p><h3>Prática</h3><p>Construa cada porta lógica e depois combine-as para criar circuitos mais complexos, como um somador binário.</p>",
    objectives: '["Entender portas lógicas AND, OR e NOT","Construir circuitos de redstone funcionais","Combinar portas para criar lógica complexa"]',
    videoUrl: null, order: 1, duration: 50,
  },
  {
    id: "les_pro_02", disciplineId: "disc_programacao", title: "Algoritmos Visuais", slug: "algoritmos-visuais",
    description: "Crie sequências e loops com command blocks encadeados.",
    content: "<h3>Pensamento Algorítmico</h3><p>Um algoritmo é uma sequência de passos para resolver um problema. Com command blocks, você cria algoritmos visuais que executam ações no servidor.</p>",
    objectives: '["Compreender o conceito de algoritmo","Criar sequências e loops","Resolver problemas com pensamento computacional"]',
    videoUrl: null, order: 2, duration: 45,
  },
  {
    id: "les_pro_03", disciplineId: "disc_programacao", title: "Automação com Command Blocks", slug: "automacao-command-blocks",
    description: "Automatize tarefas complexas usando command blocks avançados.",
    content: "<h3>Automação</h3><p>Command blocks permitem automatizar ações no Minecraft. Aprenda a criar sistemas complexos como: seleção automática de jogadores, contagem regressiva, efeitos de partículas e mini-jogos completos.</p>",
    objectives: '["Dominar command blocks (impulse, chain, repeat)","Usar selectors e NBT data","Criar sistemas automatizados complexos"]',
    videoUrl: null, order: 3, duration: 55,
  },

  // Inglês
  {
    id: "les_ing_01", disciplineId: "disc_ingles", title: "Vocabulário Básico", slug: "vocabulario-basico",
    description: "Aprenda palavras do dia a dia explorando cenários em inglês.",
    content: "<h3>English Vocabulary</h3><p>Explore cenários do dia a dia — casa, escola, mercado, parque — totalmente rotulados em inglês. Cada objeto tem uma placa com o nome em inglês e pronúncia simplificada.</p>",
    objectives: '["Aprender vocabulário do cotidiano em inglês","Associar palavras a objetos visuais","Praticar pronúncia básica"]',
    videoUrl: null, order: 1, duration: 35,
  },
  {
    id: "les_ing_02", disciplineId: "disc_ingles", title: "Diálogos e Conversação", slug: "dialogos-conversacao",
    description: "Pratique diálogos em situações reais dentro do servidor.",
    content: "<h3>Let's Talk!</h3><p>Participe de role-plays com NPCs e outros jogadores em situações reais: pedir comida em um restaurante, comprar em uma loja, pedir informações na rua.</p>",
    objectives: '["Praticar diálogos em situações cotidianas","Usar expressões e cumprimentos em inglês","Desenvolver fluência conversacional básica"]',
    videoUrl: null, order: 2, duration: 40,
  },
  {
    id: "les_ing_03", disciplineId: "disc_ingles", title: "Grammar Challenges", slug: "grammar-challenges",
    description: "Desafios de gramática inglesa com quizzes interativos.",
    content: "<h3>Grammar Time</h3><p>Resolva desafios gramaticais em um labirinto temático. Cada sala testa um aspecto da gramática inglesa: verbos, tempos, preposições, artigos e mais.</p>",
    objectives: '["Compreender tempos verbais básicos (present, past, future)","Usar preposições e artigos corretamente","Formar frases gramaticalmente corretas"]',
    videoUrl: null, order: 3, duration: 40,
  },

  // Educação Física
  {
    id: "les_edf_01", disciplineId: "disc_educacao_fisica", title: "Parkour Educativo", slug: "parkour-educativo",
    description: "Supere obstáculos enquanto aprende sobre coordenação motora.",
    content: "<h3>Corpo em Movimento</h3><p>O parkour no Minecraft desenvolve coordenação, timing e planejamento. Cada fase do percurso ensina sobre um aspecto diferente da atividade física e saúde.</p>",
    objectives: '["Compreender a importância da coordenação motora","Aprender sobre diferentes capacidades físicas","Relacionar exercício físico e saúde"]',
    videoUrl: null, order: 1, duration: 30,
  },
  {
    id: "les_edf_02", disciplineId: "disc_educacao_fisica", title: "Esportes Adaptados", slug: "esportes-adaptados",
    description: "Minigames de futebol, vôlei e corrida dentro do Minecraft.",
    content: "<h3>Esportes no Minecraft</h3><p>Participe de minigames esportivos adaptados ao Minecraft: futebol com slime balls, vôlei com snowballs, corrida com obstáculos e muito mais!</p>",
    objectives: '["Conhecer regras básicas de diferentes esportes","Praticar trabalho em equipe","Entender o conceito de fair play"]',
    videoUrl: null, order: 2, duration: 35,
  },
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
        `INSERT INTO website_lessons (id, discipline_id, title, slug, description, content, video_url, objectives, \`order\`, duration_minutes, active)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, TRUE)
         ON DUPLICATE KEY UPDATE
           title = VALUES(title),
           description = VALUES(description),
           content = VALUES(content),
           video_url = VALUES(video_url),
           objectives = VALUES(objectives),
           \`order\` = VALUES(\`order\`),
           duration_minutes = VALUES(duration_minutes)`,
        [l.id, l.disciplineId, l.title, l.slug, l.description, l.content || null, l.videoUrl || null, l.objectives || null, l.order, l.duration]
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
