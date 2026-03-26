// Script para popular o blog com categorias e posts iniciais.
// Uso: node scripts/seed-blog.mjs
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

const CATEGORIES = [
  { id: "cat_novidades", name: "Novidades", slug: "novidades" },
  { id: "cat_aulas", name: "Aulas", slug: "aulas" },
  { id: "cat_eventos", name: "Eventos", slug: "eventos" },
  { id: "cat_midia", name: "Mídia", slug: "midia" },
  { id: "cat_tutoriais", name: "Tutoriais", slug: "tutoriais" },
  { id: "cat_comunidade", name: "Comunidade", slug: "comunidade" },
];

const POSTS = [
  {
    title: "CraftSapiens lança o maior servidor educacional do Brasil",
    slug: "lancamento-servidor-educacional-2026",
    excerpt: "Após meses de desenvolvimento, a CraftSapiens apresenta oficialmente sua plataforma de ensino gamificado no Minecraft. Conheça as novidades e como participar.",
    content: `## O novo capítulo da educação gamificada

Após meses de desenvolvimento intenso, a **CraftSapiens** está oficialmente no ar! Nosso servidor de Minecraft educacional combina aulas reais com a diversão do jogo mais popular do mundo.

### O que esperar

- Aulas ao vivo dentro do servidor Minecraft
- Sistema de moedas SAPIENS para recompensar o aprendizado
- Professores especializados em cada disciplina
- Minigames temáticos para fixar o conteúdo
- Community ativa com fórum e Discord

### Como participar

1. Crie sua conta gratuita em nosso site
2. Conecte-se ao servidor: \`jogar.craftsapiens.com.br\`
3. Explore o campus virtual e assista aulas

> "A CraftSapiens nasceu da ideia de que aprender pode ser tão divertido quanto jogar." — Prof. Helton

Estamos apenas começando! Fique ligado nas próximas atualizações.`,
    categorySlug: "novidades",
    tags: ["lançamento", "minecraft", "educação"],
    readTime: 5,
    publishedAt: "2026-03-19T10:00:00",
  },
  {
    title: "Como funciona o ensino gamificado da CraftSapiens",
    slug: "como-funciona-ensino-gamificado",
    excerpt: "Entenda como transformamos disciplinas escolares em aventuras interativas dentro do Minecraft, com moedas SAPIENS, XP e certificados.",
    content: `## A metodologia por trás da diversão

Na CraftSapiens, cada disciplina é transformada em uma experiência interativa dentro do Minecraft. Não usamos mods — tudo funciona com o Minecraft Java Edition padrão.

### Como funciona uma aula

- O professor apresenta o conteúdo usando um **quadro funcional** programado em Java
- Os alunos interagem com **minigames temáticos** relacionados ao conteúdo
- Construções e aulas de campo reforçam o aprendizado
- A cada aula concluída, os alunos ganham **XP** e **moedas SAPIENS**

### O sistema de recompensas

- **XP (Experiência)**: Ganha progredindo nas aulas e completando desafios
- **Moedas SAPIENS**: Moeda virtual do servidor, ganha em aulas e eventos
- **Rankings**: Os mais dedicados aparecem nos rankings do site
- **Certificados**: Ao completar um módulo, o aluno recebe certificado

### Resultados comprovados

Nossos alunos reportam **10x mais engajamento** comparado a aulas convencionais. O ambiente familiar do Minecraft remove a barreira entre "estudar" e "se divertir".`,
    categorySlug: "aulas",
    tags: ["ensino", "gamificação", "metodologia"],
    readTime: 7,
    publishedAt: "2026-03-18T14:00:00",
  },
  {
    title: "Evento: Construção Colaborativa — Roma Antiga",
    slug: "evento-construcao-colaborativa-marco",
    excerpt: "Participe do nosso maior evento de construção! Juntos vamos recriar a Roma Antiga em escala no servidor. Prêmios para os melhores construtores.",
    content: `## Roma Antiga no Minecraft!

Prepare seus blocos e sua criatividade! No dia **29 de março**, teremos nosso maior evento de construção colaborativa.

### Detalhes do evento

- **Data**: 29/03/2026, das 14h às 18h
- **Tema**: Roma Antiga — Coliseu, Fórum Romano, Aquedutos
- **Prêmios**: Moedas SAPIENS para os 3 melhores construtores
- **Requisito**: Ter conta ativa no servidor

### Categorias

- Estruturas monumentais (Coliseu, Panteão)
- Infraestrutura (aquedutos, estradas)
- Detalhes e decoração (mosaicos, jardins)

### Como participar

Basta estar online no servidor no horário do evento. As equipes serão formadas no Discord com antecedência.

Não perca!`,
    categorySlug: "eventos",
    tags: ["evento", "construção", "roma"],
    readTime: 4,
    publishedAt: "2026-03-17T09:00:00",
  },
  {
    title: "CraftSapiens é destaque na TV Globo",
    slug: "craftsapiens-destaque-tv-globo",
    excerpt: "O projeto educacional foi matéria no Jornal Nacional, mostrando como o Minecraft está sendo usado para ensinar disciplinas escolares de forma inovadora.",
    content: `## Educação gamificada na televisão nacional

A CraftSapiens foi destaque no Jornal Nacional! A reportagem mostrou como nosso servidor Minecraft está revolucionando a educação no Brasil.

### O que foi mostrado

A equipe da TV Globo visitou nosso projeto e entrevistou alunos, pais e professores. Os depoimentos foram emocionantes:

> "Meu filho nunca teve tanto interesse em estudar. Agora ele pede para assistir aula!" — Mãe de aluno

> "O Minecraft é uma ferramenta poderosa. Conseguimos ensinar conceitos complexos de forma lúdica." — Prof. Helton

### Impacto

Após a matéria, recebemos milhares de novos cadastros. Estamos trabalhando para expandir a infraestrutura e atender a demanda crescente.

Agradecemos a todos que fazem parte desta revolução educacional!`,
    categorySlug: "midia",
    tags: ["mídia", "tv", "reconhecimento"],
    readTime: 3,
    publishedAt: "2026-03-15T20:00:00",
  },
  {
    title: "Guia: Seus primeiros passos no servidor",
    slug: "guia-primeiros-passos-servidor",
    excerpt: "Tutorial completo para novos alunos: como entrar no servidor, criar sua conta, configurar o Minecraft e começar a assistir aulas gamificadas.",
    content: `## Bem-vindo à CraftSapiens!

Este guia vai te ajudar a dar os primeiros passos no nosso servidor educacional.

### Pré-requisitos

- Minecraft Java Edition (versão 1.20+)
- Conta criada no site da CraftSapiens

### Passo 1: Crie sua conta

Acesse nosso site e clique em "Criar Conta Grátis". Preencha o formulário com:

- Username (será seu nick no servidor)
- Email
- Senha (mínimo 8 caracteres)

### Passo 2: Configure o Minecraft

1. Abra o Minecraft Java Edition
2. Clique em "Multiplayer"
3. Clique em "Add Server"
4. No campo "Server Address", digite: \`jogar.craftsapiens.com.br\`
5. Clique em "Done" e depois em "Join Server"

### Passo 3: Faça login no servidor

Ao entrar, digite: \`/login suasenha\`

Pronto! Você está dentro do campus virtual da CraftSapiens.

### Passo 4: Explore!

- Visite a **Recepção** para o tour guiado
- Acesse as **Salas de Aula** quando houver aula
- Participe da **Comunidade** no Discord e no fórum do site

### Dúvidas?

Acesse nossa página de contato ou entre no Discord!`,
    categorySlug: "tutoriais",
    tags: ["tutorial", "iniciante", "guia"],
    readTime: 10,
    publishedAt: "2026-03-14T11:00:00",
  },
  {
    title: "As melhores construções de fevereiro",
    slug: "melhores-construcoes-fevereiro",
    excerpt: "Confira as construções mais incríveis feitas pelos alunos durante o mês de fevereiro. Votação e prêmios especiais para as 3 melhores!",
    content: `## Destaque do mês: fevereiro 2026

Nossos alunos são incríveis construtores! Confira as melhores construções do mês.

### Top 3

**1. Castelo Medieval — por SteveJogador**
Uma recriação impressionante de um castelo medieval com torre de menagem, fosso e ponte levadiça.

**2. Laboratório de Ciências — por Maria_MC**
Um laboratório funcional com redstone que simula experimentos de química!

**3. Biblioteca de Alexandria — por Pedro99**
Uma réplica da antiga biblioteca com estantes de livros e sala de leitura.

### Menções honrosas

- Pirâmide do Egito — por JoaoGamer
- Estação Espacial — por AnaBuilder
- Aquário Gigante — por LucasAquatic

Parabéns a todos! Os vencedores receberam **500 moedas SAPIENS** cada.

Participe no próximo mês enviando suas construções!`,
    categorySlug: "comunidade",
    tags: ["construções", "comunidade", "destaque"],
    readTime: 6,
    publishedAt: "2026-03-10T15:00:00",
  },
  {
    title: "Nova disciplina: Programação com Command Blocks",
    slug: "nova-disciplina-programacao",
    excerpt: "Aprenda lógica de programação, algoritmos e pensamento computacional usando command blocks e redstone no Minecraft.",
    content: `## Programação dentro do Minecraft

Temos o prazer de anunciar nossa mais nova disciplina: **Programação com Command Blocks**!

### O que você vai aprender

- Lógica de programação e algoritmos
- Pensamento computacional
- Condicionais, loops e variáveis (usando command blocks)
- Circuitos com redstone (eletrônica digital básica)
- Automação de processos no Minecraft

### Metodologia

As aulas são 100% práticas. Você aprende programando dentro do jogo:

- **Command Blocks**: São como "blocos de código" do Minecraft
- **Redstone**: Funciona como circuitos eletrônicos
- **Funções**: Combinações de commands que executam tarefas complexas

### Pré-requisitos

Nenhum conhecimento prévio de programação é necessário! Apenas vontade de aprender.

### Horários

As aulas acontecem às **terças e quintas, às 16h**. Confira o cronograma completo no site.`,
    categorySlug: "aulas",
    tags: ["programação", "command blocks", "nova disciplina"],
    readTime: 5,
    publishedAt: "2026-03-08T12:00:00",
  },
  {
    title: "Conheça os benefícios dos planos VIP e Premium",
    slug: "vip-premium-beneficios",
    excerpt: "Descubra o que cada plano oferece: aulas exclusivas, moedas SAPIENS bônus, cosméticos e muito mais. Escolha o plano ideal para você.",
    content: `## Turbine sua experiência na CraftSapiens

Nossos planos VIP e Premium foram pensados para quem quer aproveitar ao máximo a experiência educacional.

### Plano VIP (R$ 19,90/mês)

- Acesso a aulas avançadas
- 100 moedas SAPIENS bônus por mês
- Rank VIP no servidor
- Prioridade na fila

### Plano VIP+ (R$ 29,90/mês)

- Tudo do VIP, mais:
- Acesso a aulas ENEM
- 300 moedas SAPIENS bônus por mês
- Cosméticos exclusivos
- Rank VIP+ no servidor

### Plano Premium (R$ 49,90/mês)

- Tudo do VIP+, mais:
- 500 moedas SAPIENS bônus por mês
- Suporte prioritário
- Acesso antecipado a novos conteúdos
- Rank Premium no servidor

### Como assinar

Acesse a página da Loja no site e escolha seu plano. Aceitamos PIX, cartão e boleto.

Lembre-se: o acesso básico ao servidor e aulas básicas é **sempre gratuito**!`,
    categorySlug: "novidades",
    tags: ["vip", "premium", "planos"],
    readTime: 4,
    publishedAt: "2026-03-05T09:00:00",
  },
  {
    title: "Preparatório ENEM dentro do Minecraft — como funciona",
    slug: "preparatorio-enem-minecraft",
    excerpt: "Nosso programa preparatório para o ENEM usa simulados gamificados, revisões interativas e resolução de questões dentro do servidor.",
    content: `## ENEM + Minecraft = Aprendizado eficaz

Nosso programa preparatório para o ENEM é único: combinamos a metodologia tradicional de revisão com a interatividade do Minecraft.

### Como funciona

- **Revisões temáticas**: Cada aula cobre um tópico específico do ENEM
- **Simulados gamificados**: Questões estilo ENEM dentro do Minecraft
- **Resolução comentada**: Professores explicam cada questão em detalhes
- **Ranking de simulados**: Acompanhe seu desempenho comparado a outros alunos

### Disciplinas cobertas

- Matemática e suas Tecnologias
- Ciências da Natureza (Física, Química, Biologia)
- Ciências Humanas (História, Geografia, Filosofia, Sociologia)
- Linguagens (Português, Literatura, Redação)

### Resultados

Os alunos que participaram do programa piloto tiveram em média **15% de melhora** em simulados oficiais.

### Requisito

Disponível para assinantes **VIP+** e **Premium**. Acesse a Loja para assinar.`,
    categorySlug: "aulas",
    tags: ["enem", "vestibular", "preparatório"],
    readTime: 8,
    publishedAt: "2026-03-01T08:00:00",
  },
];

async function seed() {
  let conn;
  try {
    conn = await mariadb.createConnection(connUrl);
    console.log("Conectado ao banco de dados.");

    // Criar tabela de categorias se não existir
    await conn.query(`
      CREATE TABLE IF NOT EXISTS blog_categories (
        id VARCHAR(191) NOT NULL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        slug VARCHAR(100) NOT NULL UNIQUE
      )
    `);

    // Criar tabela de posts se não existir
    await conn.query(`
      CREATE TABLE IF NOT EXISTS blog_posts (
        id VARCHAR(191) NOT NULL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        slug VARCHAR(255) NOT NULL UNIQUE,
        content LONGTEXT NOT NULL,
        excerpt TEXT,
        cover_image VARCHAR(500),
        author_id VARCHAR(191),
        category_id VARCHAR(191) NOT NULL,
        tags TEXT,
        views INT NOT NULL DEFAULT 0,
        read_time INT NOT NULL DEFAULT 5,
        published BOOLEAN NOT NULL DEFAULT FALSE,
        published_at DATETIME,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        CONSTRAINT fk_blog_category FOREIGN KEY (category_id) REFERENCES blog_categories(id)
      )
    `);

    // Inserir categorias
    for (const cat of CATEGORIES) {
      await conn.query(
        `INSERT INTO blog_categories (id, name, slug) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE name = VALUES(name)`,
        [cat.id, cat.name, cat.slug]
      );
    }
    console.log(`${CATEGORIES.length} categorias inseridas/atualizadas.`);

    // Inserir posts
    for (const post of POSTS) {
      const catId = CATEGORIES.find((c) => c.slug === post.categorySlug)?.id;
      if (!catId) continue;

      const id = `post_${post.slug.replace(/-/g, "_").slice(0, 30)}`;
      await conn.query(
        `INSERT INTO blog_posts (id, title, slug, content, excerpt, category_id, tags, read_time, published, published_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, TRUE, ?)
         ON DUPLICATE KEY UPDATE title = VALUES(title), content = VALUES(content), excerpt = VALUES(excerpt)`,
        [id, post.title, post.slug, post.content, post.excerpt, catId, JSON.stringify(post.tags), post.readTime, post.publishedAt]
      );
    }
    console.log(`${POSTS.length} posts inseridos/atualizados.`);
    console.log("Seed concluído com sucesso!");
  } catch (err) {
    console.error("Erro no seed:", err);
    process.exit(1);
  } finally {
    if (conn) await conn.end();
  }
}

seed();
