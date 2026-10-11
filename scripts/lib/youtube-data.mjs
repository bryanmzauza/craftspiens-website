// Caminho do arquivo com a lista de vídeos do canal (gerado por scripts/youtube-sync.mjs).
//
// Por padrão é scripts/data/youtube-videos.json, versionado no repositório. Em produção,
// a atualização automática grava em outro lugar (variável AULAS_YOUTUBE_FILE) para não
// alterar arquivos do repositório e travar o `git pull` do deploy.

import "dotenv/config";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

/** Arquivo versionado no repositório */
export const REPO_DATA_FILE = resolve(root, "scripts/data/youtube-videos.json");

/** Arquivo usado pelo sync e pelo seed */
export const DATA_FILE = process.env.AULAS_YOUTUBE_FILE
  ? resolve(root, process.env.AULAS_YOUTUBE_FILE)
  : REPO_DATA_FILE;
