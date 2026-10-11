// =============================================================================
// Status do servidor Minecraft
// =============================================================================
// Consulta o servidor diretamente pelo protocolo Server List Ping (o mesmo que o
// cliente do Minecraft usa na lista de servidores), resolvendo o registro SRV
// do domínio. Se a consulta direta falhar, usa a API pública mcsrvstat.us.
// O resultado fica em cache por alguns segundos para não consultar o servidor
// a cada visita.
import net from "node:net";
import { promises as dns } from "node:dns";
import { SERVER_IP } from "@/lib/constants";

export interface MinecraftStatus {
  online: boolean;
  players: { online: number; max: number; sample: string[] };
  version: string;
  motd: string;
  /** Tempo de resposta da consulta direta, em ms (null quando veio da API pública) */
  latency: number | null;
  checkedAt: string;
}

const CACHE_MS = 15_000;
const TIMEOUT_MS = 5_000;
const MAX_RESPONSE_BYTES = 1024 * 1024;
const USER_AGENT = "CraftSapiens-Website/1.0 (+https://craftsapiens.com.br)";

let cache: { value: MinecraftStatus; expires: number } | undefined;
let inFlight: Promise<MinecraftStatus> | undefined;

export async function getMinecraftStatus(): Promise<MinecraftStatus> {
  if (cache && cache.expires > Date.now()) return cache.value;
  inFlight ??= fetchStatus().finally(() => {
    inFlight = undefined;
  });
  const value = await inFlight;
  cache = { value, expires: Date.now() + CACHE_MS };
  return value;
}

async function fetchStatus(): Promise<MinecraftStatus> {
  const host = process.env.MINECRAFT_SERVER_HOST || SERVER_IP;
  const configuredPort = process.env.MINECRAFT_SERVER_PORT
    ? Number(process.env.MINECRAFT_SERVER_PORT)
    : undefined;

  try {
    const target = await resolveTarget(host, configuredPort);
    const { response, latency } = await serverListPing(target.host, target.port, host);
    return fromPingResponse(response, latency);
  } catch (error) {
    console.warn(`[minecraft-status] Consulta direta falhou (${(error as Error).message}); usando mcsrvstat.us`);
  }

  try {
    return await fromMcsrvstat(host, configuredPort);
  } catch (error) {
    console.warn(`[minecraft-status] mcsrvstat.us falhou: ${(error as Error).message}`);
    return offline();
  }
}

/** Porta configurada > registro SRV (_minecraft._tcp) > porta padrão 25565 */
async function resolveTarget(host: string, port?: number): Promise<{ host: string; port: number }> {
  if (port) return { host, port };
  const records = await resolveSrv(`_minecraft._tcp.${host}`);
  records.sort((a, b) => a.priority - b.priority || b.weight - a.weight);
  if (records[0]) return { host: records[0].name, port: records[0].port };
  // Sem registro SRV: usa o próprio domínio na porta padrão
  return { host, port: 25565 };
}

// DNS públicos usados quando o resolvedor do sistema não responde a consultas SRV
const FALLBACK_DNS = ["1.1.1.1", "8.8.8.8"];
const NO_RECORD = new Set(["ENOTFOUND", "ENODATA"]);

async function resolveSrv(name: string): Promise<{ name: string; port: number; priority: number; weight: number }[]> {
  try {
    return await dns.resolveSrv(name);
  } catch (error) {
    // O domínio realmente não tem registro SRV: não adianta perguntar a outro DNS
    if (NO_RECORD.has((error as NodeJS.ErrnoException).code ?? "")) return [];
  }
  try {
    const resolver = new dns.Resolver({ timeout: 2_000, tries: 1 });
    resolver.setServers(FALLBACK_DNS);
    return await resolver.resolveSrv(name);
  } catch {
    return [];
  }
}

// --- Protocolo Server List Ping ----------------------------------------------

function varInt(value: number): Buffer {
  const bytes: number[] = [];
  let remaining = value >>> 0;
  do {
    let byte = remaining & 0x7f;
    remaining >>>= 7;
    if (remaining !== 0) byte |= 0x80;
    bytes.push(byte);
  } while (remaining !== 0);
  return Buffer.from(bytes);
}

function readVarInt(buffer: Buffer, offset: number): { value: number; size: number } | null {
  let value = 0;
  for (let i = 0; i < 5; i++) {
    if (offset + i >= buffer.length) return null;
    const byte = buffer[offset + i];
    value |= (byte & 0x7f) << (7 * i);
    if ((byte & 0x80) === 0) return { value, size: i + 1 };
  }
  throw new Error("VarInt inválido");
}

function mcString(text: string): Buffer {
  const bytes = Buffer.from(text, "utf8");
  return Buffer.concat([varInt(bytes.length), bytes]);
}

function packet(id: number, ...fields: Buffer[]): Buffer {
  const body = Buffer.concat([varInt(id), ...fields]);
  return Buffer.concat([varInt(body.length), body]);
}

function serverListPing(
  host: string,
  port: number,
  virtualHost: string
): Promise<{ response: PingResponse; latency: number }> {
  return new Promise((resolve, reject) => {
    const socket = net.createConnection({ host, port });
    const started = Date.now();
    let buffer = Buffer.alloc(0);

    const fail = (error: Error) => {
      socket.destroy();
      reject(error);
    };

    socket.setTimeout(TIMEOUT_MS, () => fail(new Error("tempo esgotado")));
    socket.once("error", fail);

    socket.once("connect", () => {
      const portField = Buffer.alloc(2);
      portField.writeUInt16BE(port);
      // Handshake (protocolo -1 = apenas consulta de status, próximo estado 1)
      const handshake = packet(0x00, varInt(-1), mcString(virtualHost), portField, varInt(1));
      const statusRequest = packet(0x00);
      socket.write(Buffer.concat([handshake, statusRequest]));
    });

    socket.on("data", (chunk) => {
      buffer = Buffer.concat([buffer, chunk]);
      try {
        const length = readVarInt(buffer, 0);
        if (!length) return;
        if (length.value > MAX_RESPONSE_BYTES) return fail(new Error("resposta grande demais"));
        if (buffer.length < length.size + length.value) return;

        let offset = length.size;
        const packetId = readVarInt(buffer, offset);
        if (!packetId || packetId.value !== 0x00) return fail(new Error("pacote inesperado"));
        offset += packetId.size;
        const jsonLength = readVarInt(buffer, offset);
        if (!jsonLength) return fail(new Error("resposta incompleta"));
        offset += jsonLength.size;

        const json = buffer.subarray(offset, offset + jsonLength.value).toString("utf8");
        const latency = Date.now() - started;
        socket.end();
        resolve({ response: JSON.parse(json) as PingResponse, latency });
      } catch (error) {
        fail(error as Error);
      }
    });
  });
}

// --- Conversão das respostas -------------------------------------------------

type ChatComponent = string | { text?: string; extra?: ChatComponent[] };

interface PingResponse {
  version?: { name?: string };
  players?: { online?: number; max?: number; sample?: { name?: string }[] };
  description?: ChatComponent;
}

const USERNAME = /^[A-Za-z0-9_]{3,16}$/;

/** Remove os códigos de formatação do Minecraft (ex.: §a, §l) */
function stripFormatting(text: string): string {
  return text.replace(/§[0-9a-fk-or]/gi, "").trim();
}

/** "Velocity 1.7.2-26.3" vira "1.7.2 – 26.3" (faixa de versões aceitas pelo proxy) */
function cleanVersion(text: string): string {
  const clean = stripFormatting(text).replace(/^(velocity|bungeecord|waterfall|paper|spigot)\s+/i, "");
  const range = clean.match(/^(\d+(?:\.\d+)*)-(\d+(?:\.\d+)*)$/);
  return range ? `${range[1]} – ${range[2]}` : clean;
}

function flattenChat(component: ChatComponent | undefined): string {
  if (!component) return "";
  if (typeof component === "string") return component;
  return (component.text ?? "") + (component.extra ?? []).map(flattenChat).join("");
}

function fromPingResponse(response: PingResponse, latency: number): MinecraftStatus {
  const motd = stripFormatting(flattenChat(response.description)).split("\n")[0]?.trim() ?? "";
  // Alguns servidores usam o "sample" para mostrar textos em vez de nomes: só nicks válidos entram
  const sample = (response.players?.sample ?? [])
    .map((player) => stripFormatting(player.name ?? ""))
    .filter((name) => USERNAME.test(name));

  return {
    online: true,
    players: {
      online: response.players?.online ?? 0,
      max: response.players?.max ?? 0,
      sample,
    },
    version: cleanVersion(response.version?.name ?? ""),
    motd,
    latency,
    checkedAt: new Date().toISOString(),
  };
}

async function fromMcsrvstat(host: string, port?: number): Promise<MinecraftStatus> {
  // Sem porta explícita, a API resolve o SRV do domínio sozinha
  const address = port ? `${host}:${port}` : host;
  const res = await fetch(`https://api.mcsrvstat.us/3/${address}`, {
    headers: { "User-Agent": USER_AGENT },
    cache: "no-store",
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);

  const data = await res.json();
  if (!data.online) return offline();

  const list: unknown[] = data.players?.list ?? [];
  return {
    online: true,
    players: {
      online: data.players?.online ?? 0,
      max: data.players?.max ?? 0,
      sample: list
        .map((player) => (typeof player === "string" ? player : (player as { name?: string }).name ?? ""))
        .filter((name) => USERNAME.test(name)),
    },
    version: cleanVersion(data.version ?? ""),
    motd: stripFormatting(data.motd?.clean?.[0] ?? ""),
    latency: null,
    checkedAt: new Date().toISOString(),
  };
}

function offline(): MinecraftStatus {
  return {
    online: false,
    players: { online: 0, max: 0, sample: [] },
    version: "",
    motd: "",
    latency: null,
    checkedAt: new Date().toISOString(),
  };
}
