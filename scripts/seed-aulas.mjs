// Script para popular disciplinas e aulas (PostgreSQL) com os vídeos e lives
// públicos do canal da Craftsapiens no YouTube.
// Uso: npm run db:seed:aulas  (ou node scripts/seed-aulas.mjs)
//
// Requer: POSTGRES_URL no .env e tabelas criadas com `npm run db:push:pg`.
// Os vídeos vêm de scripts/data/youtube-videos.json ou de AULAS_YOUTUBE_FILE (atualize
// com `npm run aulas:youtube`); as disciplinas e as regras de classificação ficam em
// scripts/lib/youtube-aulas.mjs, e os títulos lidos das miniaturas em youtube-titulos.mjs.
//
// Idempotente: disciplinas por slug e aulas por id. Aulas e disciplinas que não
// estão mais na lista são desativadas, sem apagar o progresso dos alunos.

import { readFile } from "node:fs/promises";
import { prisma, disconnect } from "./lib/pg-prisma.mjs";
import { DISCIPLINES, classify, displayTitle, slugify } from "./lib/youtube-aulas.mjs";
import { DATA_FILE } from "./lib/youtube-data.mjs";

const BATCH_SIZE = 500;
const UPDATE_CONCURRENCY = 10;

/** Compara a aula salva com a nova versão (datas pelo valor) */
function hasChanges(saved, row) {
  return Object.keys(row).some((key) => {
    const a = saved[key];
    const b = row[key];
    if (a instanceof Date || b instanceof Date) return a?.getTime?.() !== b?.getTime?.();
    return a !== b;
  });
}

const dateFormat = new Intl.DateTimeFormat("pt-BR", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "America/Sao_Paulo",
});

function describe(video, discipline) {
  const when = video.publishedAt ? ` em ${dateFormat.format(new Date(video.publishedAt))}` : "";
  const isSubject = !["aulas-gerais", "servidor-comunidade"].includes(discipline.slug);
  const subject = isSubject ? ` de ${discipline.name}` : "";

  if (video.kind === "live") {
    const what = discipline.slug === "servidor-comunidade" ? "Live" : `Aula ao vivo${subject}`;
    return `${what} transmitida${when} no canal da Craftsapiens no YouTube.`;
  }
  const what = video.kind === "curto" ? "Vídeo curto" : "Vídeo";
  return `${what}${subject} publicado${when} no canal da Craftsapiens no YouTube.`;
}

function buildLessons(videos) {
  const byDiscipline = new Map(DISCIPLINES.map((d) => [d.slug, []]));
  for (const video of videos) {
    for (const slug of classify(video)) {
      const list = byDiscipline.get(slug);
      if (!list) throw new Error(`Disciplina "${slug}" do vídeo ${video.id} não existe em DISCIPLINES`);
      list.push(video);
    }
  }

  const lessons = [];
  for (const discipline of DISCIPLINES) {
    // Ordem cronológica: a aula 1 é a mais antiga
    const list = byDiscipline
      .get(discipline.slug)
      .sort((a, b) => (a.publishedAt ?? "").localeCompare(b.publishedAt ?? ""));

    list.forEach((video, index) => {
      const title = displayTitle(video).slice(0, 200);
      const titleSlug = slugify(title).slice(0, 80).replace(/-+$/, "");
      lessons.push({
        id: `yt-${discipline.slug}-${video.id}`,
        disciplineSlug: discipline.slug,
        slug: `${titleSlug}-${video.id}`,
        title,
        description: describe(video, discipline),
        videoUrl: `https://www.youtube-nocookie.com/embed/${video.id}`,
        youtubeId: video.id,
        format: video.kind,
        publishedAt: video.publishedAt ? new Date(video.publishedAt) : null,
        duration: video.duration ? Math.max(1, Math.round(video.duration / 60)) : null,
        order: index + 1,
      });
    });
  }
  return lessons;
}

async function main() {
  try {
    console.log("Seed de Aulas — Disciplinas + vídeos do YouTube\n");

    const data = JSON.parse(await readFile(DATA_FILE, "utf8"));
    const videos = data.videos ?? [];
    if (videos.length === 0) {
      throw new Error(`Nenhum vídeo em ${DATA_FILE}. Rode "npm run aulas:youtube" primeiro.`);
    }
    const lessons = buildLessons(videos);
    const lessonsPerDiscipline = new Map();
    for (const l of lessons) {
      lessonsPerDiscipline.set(l.disciplineSlug, (lessonsPerDiscipline.get(l.disciplineSlug) ?? 0) + 1);
    }

    // 1. Disciplinas
    console.log(`1/3 — Inserindo ${DISCIPLINES.length} disciplinas...`);
    const disciplineIds = new Map();
    for (const [index, d] of DISCIPLINES.entries()) {
      const data = {
        name: d.name,
        description: d.description,
        shortDescription: d.shortDescription,
        icon: d.icon,
        color: d.color,
        area: d.area,
        order: index + 1,
        active: (lessonsPerDiscipline.get(d.slug) ?? 0) > 0,
      };
      const saved = await prisma.discipline.upsert({
        where: { slug: d.slug },
        update: data,
        create: { id: `disc_${d.slug.replace(/-/g, "_")}`, slug: d.slug, ...data },
      });
      // Se a disciplina já existia com outro id, as aulas apontam para o id real
      disciplineIds.set(d.slug, saved.id);
    }
    console.log("   Disciplinas OK");

    // 2. Aulas: insere as novas em lote e atualiza só as que mudaram
    console.log(`2/3 — Gravando ${lessons.length} aulas de ${videos.length} vídeos...`);
    const rows = lessons.map(({ disciplineSlug, ...lesson }) => ({
      ...lesson,
      disciplineId: disciplineIds.get(disciplineSlug),
      content: null,
      objectives: null,
      active: true,
    }));
    const existing = new Map(
      (
        await prisma.lesson.findMany({
          where: { id: { in: rows.map((r) => r.id) } },
          select: Object.fromEntries(Object.keys(rows[0]).map((key) => [key, true])),
        })
      ).map((row) => [row.id, row])
    );

    const toCreate = rows.filter((r) => !existing.has(r.id));
    const toUpdate = rows.filter((r) => existing.has(r.id) && hasChanges(existing.get(r.id), r));

    for (let i = 0; i < toCreate.length; i += BATCH_SIZE) {
      await prisma.lesson.createMany({ data: toCreate.slice(i, i + BATCH_SIZE) });
    }
    for (let i = 0; i < toUpdate.length; i += UPDATE_CONCURRENCY) {
      await Promise.all(
        toUpdate
          .slice(i, i + UPDATE_CONCURRENCY)
          .map(({ id, ...data }) => prisma.lesson.update({ where: { id }, data }))
      );
    }
    console.log(
      `   ${toCreate.length} novas, ${toUpdate.length} atualizadas, ${rows.length - toCreate.length - toUpdate.length} sem mudança`
    );

    // 3. Desativa o que saiu da lista (vídeos removidos, aulas e disciplinas antigas)
    console.log("3/3 — Desativando aulas e disciplinas fora da lista...");
    const oldLessons = await prisma.lesson.updateMany({
      where: { active: true, id: { notIn: lessons.map((l) => l.id) } },
      data: { active: false },
    });
    const oldDisciplines = await prisma.discipline.updateMany({
      where: { active: true, slug: { notIn: DISCIPLINES.map((d) => d.slug) } },
      data: { active: false },
    });
    console.log(`   ${oldLessons.count} aulas e ${oldDisciplines.count} disciplinas desativadas`);

    console.log("\nSeed concluído com sucesso!");
    for (const d of DISCIPLINES) {
      console.log(`   ${d.name}: ${lessonsPerDiscipline.get(d.slug) ?? 0}`);
    }
  } catch (error) {
    console.error("Erro no seed:", error);
    process.exitCode = 1;
  } finally {
    await disconnect();
  }
}

await main();
