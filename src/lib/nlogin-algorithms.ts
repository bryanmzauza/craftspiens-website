/**
 * Algoritmos de hash do nLogin (Minecraft plugin).
 * Portado de https://github.com/nickuc-com/nLogin-Web
 *
 * Suporta: BCrypt, SHA256, SHA512, AuthMe, Argon2
 */
import { createHash, randomBytes, timingSafeEqual } from "crypto";
import bcrypt from "bcryptjs";

// ─── Tipos ───────────────────────────────────────────────────────────────────

type Algorithm = {
  name: string;
  hash(password: string): Promise<string>;
  verify(password: string, hashedPassword: string): Promise<boolean>;
};

// ─── Utilitário de comparação segura para strings ────────────────────────────

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  return timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

// ─── BCrypt ──────────────────────────────────────────────────────────────────

const BCRYPT_COST = 14;

const bcryptAlgorithm: Algorithm = {
  name: "BCrypt",
  async hash(password) {
    return bcrypt.hash(password, BCRYPT_COST);
  },
  async verify(password, hashedPassword) {
    return bcrypt.compare(password, hashedPassword);
  },
};

// ─── SHA256 (formato nLogin: $SHA256$hash$salt) ─────────────────────────────

const SALT_CHARS_UPPER = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

function generateSaltUpper(length: number): string {
  const bytes = randomBytes(length);
  let salt = "";
  for (let i = 0; i < length; i++) {
    salt += SALT_CHARS_UPPER[bytes[i] % SALT_CHARS_UPPER.length];
  }
  return salt;
}

const sha256Algorithm: Algorithm = {
  name: "SHA256",
  async hash(password) {
    const salt = generateSaltUpper(24);
    const inner = createHash("sha256").update(password).digest("hex");
    const outer = createHash("sha256").update(inner + salt).digest("hex");
    return `$SHA256$${outer}$${salt}`;
  },
  async verify(password, hashedPassword) {
    const parts = hashedPassword.split("$").filter(Boolean);
    // parts[0] = "SHA256", parts[1] = hash, parts[2] = salt
    if (parts.length === 3) {
      // new format: $SHA256$hash$salt
      const salt = parts[2];
      const inner = createHash("sha256").update(password).digest("hex");
      const expected = createHash("sha256").update(inner + salt).digest("hex");
      return safeEqual(parts[1], expected);
    }
    if (parts.length === 2) {
      // old format: $SHA256$hash@salt
      const saltParts = hashedPassword.split("@");
      if (saltParts.length !== 2) return false;
      const salt = saltParts[1];
      const inner = createHash("sha256").update(password).digest("hex");
      const expected = createHash("sha256").update(inner + salt).digest("hex");
      return safeEqual(expected + "@" + salt, parts[1] + "@" + salt);
    }
    return false;
  },
};

// ─── SHA512 (formato nLogin: $SHA512$hash$salt) ─────────────────────────────

const sha512Algorithm: Algorithm = {
  name: "SHA512",
  async hash(password) {
    const salt = generateSaltUpper(24);
    const inner = createHash("sha512").update(password).digest("hex");
    const outer = createHash("sha512").update(inner + salt).digest("hex");
    return `$SHA512$${outer}$${salt}`;
  },
  async verify(password, hashedPassword) {
    const parts = hashedPassword.split("$").filter(Boolean);
    // parts[0] = "SHA512", parts[1] = hash, parts[2] = salt
    if (parts.length === 3) {
      // new format: $SHA512$hash$salt
      const salt = parts[2];
      const inner = createHash("sha512").update(password).digest("hex");
      const expected = createHash("sha512").update(inner + salt).digest("hex");
      return safeEqual(parts[1], expected);
    }
    if (parts.length === 2) {
      // old format: $SHA512$hash@salt
      const saltParts = hashedPassword.split("@");
      if (saltParts.length !== 2) return false;
      const salt = saltParts[1];
      const inner = createHash("sha512").update(password).digest("hex");
      const expected = createHash("sha512").update(inner + salt).digest("hex");
      return safeEqual(expected + "@" + salt, parts[1] + "@" + salt);
    }
    return false;
  },
};

// ─── AuthMe (formato: $SHA$salt$hash ou $SHA$salt$hash$AUTHME) ──────────────

const AUTHME_SALT_CHARS = "0123456789abcdef";

function generateSaltHex(length: number): string {
  const bytes = randomBytes(length);
  let salt = "";
  for (let i = 0; i < length; i++) {
    salt += AUTHME_SALT_CHARS[bytes[i] % AUTHME_SALT_CHARS.length];
  }
  return salt;
}

const authMeAlgorithm: Algorithm = {
  name: "AuthMe",
  async hash(password) {
    const salt = generateSaltHex(16);
    const inner = createHash("sha256").update(password).digest("hex");
    const outer = createHash("sha256").update(inner + salt).digest("hex");
    return `$SHA$${salt}$${outer}$AUTHME`;
  },
  async verify(password, hashedPassword) {
    // formato: $SHA$salt$hash ou $SHA$salt$hash$AUTHME
    const parts = hashedPassword.split("$").filter(Boolean);
    // parts[0] = "SHA", parts[1] = salt, parts[2] = hash, parts[3]? = "AUTHME"
    if (parts.length !== 3 && parts.length !== 4) return false;
    const salt = parts[1];
    const storedHash = parts[2];
    const inner = createHash("sha256").update(password).digest("hex");
    const expected = createHash("sha256").update(inner + salt).digest("hex");
    return safeEqual(storedHash, expected);
  },
};

// ─── Argon2 (carregado dinamicamente; opcional) ─────────────────────────────

let argon2Module: typeof import("argon2") | null = null;
let argon2LoadAttempted = false;

async function getArgon2(): Promise<typeof import("argon2") | null> {
  if (argon2LoadAttempted) return argon2Module;
  argon2LoadAttempted = true;
  try {
    argon2Module = await import("argon2");
  } catch {
    argon2Module = null;
  }
  return argon2Module;
}

const argon2Algorithm: Algorithm = {
  name: "Argon2",
  async hash(password) {
    const argon2 = await getArgon2();
    if (!argon2) throw new Error("Pacote 'argon2' não instalado. Execute: npm install argon2");
    return argon2.hash(password, {
      type: 2, // argon2id
      memoryCost: 65536,
      timeCost: 10,
      parallelism: 1,
    });
  },
  async verify(password, hashedPassword) {
    const argon2 = await getArgon2();
    if (!argon2) throw new Error("Pacote 'argon2' não instalado. Execute: npm install argon2");
    return argon2.verify(hashedPassword, password);
  },
};

// ─── Detecção de algoritmo ──────────────────────────────────────────────────

export function detectAlgorithm(hashedPassword: string): Algorithm | null {
  const dollarIndex = hashedPassword.indexOf("$");
  if (dollarIndex === -1) return null;

  const algo = hashedPassword.split("$").filter(Boolean)[0]?.toUpperCase() ?? "";

  switch (algo) {
    case "2":
    case "2A":
    case "2B":
    case "2Y":
      return bcryptAlgorithm;
    case "SHA256":
      return sha256Algorithm;
    case "SHA512":
      return sha512Algorithm;
    case "SHA":
      return authMeAlgorithm;
    case "ARGON2I":
    case "ARGON2ID":
    case "ARGON2D":
      return argon2Algorithm;
    default:
      return null;
  }
}

// ─── Exports públicos ───────────────────────────────────────────────────────

/**
 * Verifica a senha contra o hash, detectando automaticamente o algoritmo.
 * Compatível com todos os formatos do plugin nLogin.
 */
export async function nloginVerifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  const algorithm = detectAlgorithm(hashedPassword);
  if (!algorithm) {
    console.warn(
      `[nLogin] Algoritmo de hash não reconhecido: ${hashedPassword.substring(0, 10)}...`
    );
    return false;
  }
  return algorithm.verify(password, hashedPassword);
}

/**
 * Gera um hash de senha usando BCrypt (padrão do nLogin).
 * Para usar outro algoritmo, passe o nome: "bcrypt" | "sha256" | "sha512" | "authme" | "argon2"
 */
export async function nloginHashPassword(
  password: string,
  algorithmName: "bcrypt" | "sha256" | "sha512" | "authme" | "argon2" = "bcrypt"
): Promise<string> {
  const algorithms: Record<string, Algorithm> = {
    bcrypt: bcryptAlgorithm,
    sha256: sha256Algorithm,
    sha512: sha512Algorithm,
    authme: authMeAlgorithm,
    argon2: argon2Algorithm,
  };
  const algo = algorithms[algorithmName];
  if (!algo) throw new Error(`Algoritmo desconhecido: ${algorithmName}`);
  return algo.hash(password);
}
