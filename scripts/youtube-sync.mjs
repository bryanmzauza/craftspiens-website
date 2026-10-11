// Atualiza a lista de vídeos e lives públicos do canal da Craftsapiens no YouTube.
// Uso: npm run aulas:youtube  (depois: npm run db:seed:aulas)
//      npm run aulas:atualizar  (os dois em sequência; usado pela atualização automática)
//
// Requer o yt-dlp (https://github.com/yt-dlp/yt-dlp). Usa o comando da variável
// YTDLP se definida; senão tenta `yt-dlp` e, na falta dele, `uvx yt-dlp`.
//
// Grava scripts/data/youtube-videos.json, ou o arquivo de AULAS_YOUTUBE_FILE. Vídeos já
// conhecidos mantêm a data salva; só os novos são consultados um a um. Se a consulta
// falhar, o vídeo entra com a data da sincronização (marcada como aproximada) e é
// consultado de novo na próxima execução.
//
// Por segurança, nada é gravado se a lista vier com menos de 80% dos vídeos anteriores
// (ex.: erro no YouTube), o que desativaria aulas no seed. Para aceitar mesmo assim,
// rode com --forcar.

import { spawn } from "node:child_process";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname, relative } from "node:path";
import { DATA_FILE, REPO_DATA_FILE } from "./lib/youtube-data.mjs";

const CHANNEL_URL = "https://www.youtube.com/@craftsapiens";
const TABS = [
  { tab: "streams", kind: "live" },
  { tab: "videos", kind: "video" },
];
// Vídeos da aba "Vídeos" com até 3 minutos (shorts, chamadas e trechos)
const SHORT_MAX_SECONDS = 180;
// Lives acontecendo agora ou agendadas ainda não têm gravação
const SKIP_LIVE_STATUS = new Set(["is_live", "is_upcoming"]);
const MIN_RATIO = 0.8;
const CONCURRENCY = 6;

// Títulos em português (sem isso o YouTube pode devolver a tradução automática)
const BASE_ARGS = ["--no-warnings", "--extractor-args", "youtube:lang=pt"];

const force = process.argv.includes("--forcar");
let ytdlpCommand = null;

function run(command, args) {
  return new Promise((resolvePromise, reject) => {
    const child = spawn(command, args, { stdio: ["ignore", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => (stdout += chunk));
    child.stderr.on("data", (chunk) => (stderr += chunk));
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) resolvePromise(stdout);
      else reject(new Error(`${command} saiu com código ${code}: ${stderr.trim().split("\n").pop()}`));
    });
  });
}

async function resolveYtdlp() {
  const candidates = process.env.YTDLP
    ? [process.env.YTDLP.split(" ")]
    : [["yt-dlp"], ["uvx", "yt-dlp"]];

  for (const [command, ...prefix] of candidates) {
    try {
      await run(command, [...prefix, "--version"]);
      return { command, prefix };
    } catch {
      // tenta o próximo
    }
  }
  throw new Error("yt-dlp não encontrado. Instale o yt-dlp ou o uv, ou defina a variável YTDLP.");
}

function ytdlp(args) {
  return run(ytdlpCommand.command, [...ytdlpCommand.prefix, ...BASE_ARGS, ...args]);
}

async function listTab({ tab, kind }) {
  const output = await ytdlp(["--flat-playlist", "-J", `${CHANNEL_URL}/${tab}`]);
  const playlist = JSON.parse(output);
  const entries = (playlist.entries ?? []).filter((entry) => !SKIP_LIVE_STATUS.has(entry.live_status));
  if (entries.length === 0) throw new Error(`a aba "${tab}" veio vazia`);

  return entries.map((entry) => {
    const duration = typeof entry.duration === "number" ? Math.round(entry.duration) : null;
    const isShort = kind === "video" && duration !== null && duration <= SHORT_MAX_SECONDS;
    return {
      id: entry.id,
      title: entry.title,
      kind: isShort ? "curto" : kind,
      duration,
    };
  });
}

async function fetchPublishedAt(id) {
  const output = await ytdlp([
    "--skip-download",
    "--extractor-args",
    "youtube:player_skip=js",
    "--print",
    "%(timestamp)s",
    `https://www.youtube.com/watch?v=${id}`,
  ]);
  const timestamp = Number(output.trim());
  if (!Number.isFinite(timestamp) || timestamp <= 0) throw new Error("data ausente");
  return new Date(timestamp * 1000).toISOString();
}

/** Lista salva anteriormente; na primeira execução com AULAS_YOUTUBE_FILE, parte do arquivo do repositório */
async function loadExisting() {
  for (const file of [DATA_FILE, REPO_DATA_FILE]) {
    try {
      const data = JSON.parse(await readFile(file, "utf8"));
      return new Map((data.videos ?? []).map((v) => [v.id, v]));
    } catch {
      // arquivo ainda não existe
    }
  }
  return new Map();
}

async function main() {
  ytdlpCommand = await resolveYtdlp();
  console.log(`Usando: ${[ytdlpCommand.command, ...ytdlpCommand.prefix].join(" ")}\n`);

  const existing = await loadExisting();
  const videos = [];
  const seen = new Set();

  for (const tab of TABS) {
    console.log(`Listando ${CHANNEL_URL}/${tab.tab}...`);
    const entries = await listTab(tab);
    console.log(`   ${entries.length} itens`);
    for (const entry of entries) {
      if (seen.has(entry.id)) continue;
      seen.add(entry.id);
      const saved = existing.get(entry.id);
      videos.push({
        ...entry,
        publishedAt: saved?.publishedAt ?? null,
        ...(saved?.approximateDate ? { approximateDate: true } : {}),
      });
    }
  }

  if (!force && existing.size > 0 && videos.length < existing.size * MIN_RATIO) {
    throw new Error(
      `a lista veio com ${videos.length} vídeos, contra ${existing.size} na anterior. ` +
        "Nada foi gravado. Se a redução for real, rode de novo com --forcar."
    );
  }

  const missing = videos.filter((v) => !v.publishedAt || v.approximateDate);
  if (missing.length > 0) {
    console.log(`\nBuscando a data de ${missing.length} vídeos...`);
    const now = new Date().toISOString();
    let done = 0;
    let failed = 0;
    const queue = [...missing];
    await Promise.all(
      Array.from({ length: CONCURRENCY }, async () => {
        while (queue.length > 0) {
          const video = queue.shift();
          try {
            video.publishedAt = await fetchPublishedAt(video.id);
            delete video.approximateDate;
          } catch (error) {
            failed++;
            video.publishedAt ??= now;
            video.approximateDate = true;
            console.warn(`   Aviso: data aproximada para ${video.id} (${error.message})`);
          }
          done++;
          if (done % 50 === 0) console.log(`   ${done}/${missing.length}`);
        }
      })
    );
    if (failed > 0) console.log(`   ${failed} vídeos com data aproximada; serão consultados de novo na próxima execução`);
  }

  videos.sort((a, b) => (b.publishedAt ?? "").localeCompare(a.publishedAt ?? ""));

  const added = videos.filter((v) => !existing.has(v.id)).length;
  const removed = [...existing.keys()].filter((id) => !seen.has(id)).length;

  await mkdir(dirname(DATA_FILE), { recursive: true });
  await writeFile(
    DATA_FILE,
    JSON.stringify({ channel: CHANNEL_URL, updatedAt: new Date().toISOString(), videos }, null, 2) + "\n"
  );

  console.log(`\n${videos.length} vídeos salvos em ${relative(process.cwd(), DATA_FILE) || DATA_FILE}`);
  console.log(`   ${added} novos, ${removed} removidos ou não mais públicos`);
}

main().catch((error) => {
  console.error("Erro:", error.message);
  process.exitCode = 1;
});
