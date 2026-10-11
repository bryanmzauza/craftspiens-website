// =============================================================================
// Identidade do Minecraft a partir de uma conta Microsoft
// =============================================================================
// Fluxo oficial usado pelos launchers:
//   token Microsoft (escopo XboxLive.signin)
//     -> Xbox Live (user token)
//     -> XSTS para o Xbox Live: XUID e gamertag (identificam o jogador Bedrock)
//     -> XSTS para o Minecraft -> login na API do Minecraft -> perfil Java (UUID e nick)
//
// A etapa do Java exige que o app do Azure seja aprovado pela Mojang para a API
// do Minecraft. Sem essa aprovação (ou se a conta não tiver o Java), só a
// identidade Bedrock é retornada.

const TIMEOUT_MS = 10_000;

export interface MinecraftIdentity {
  /** Xbox User ID (decimal), sempre presente */
  xuid: string;
  gamertag: string;
  /** UUID da conta Java original, sem hífens (igual ao mojang_id do nLogin) */
  javaUuid: string | null;
  javaName: string | null;
  /** UUID do Floodgate para o Bedrock, sem hífens (igual ao bedrock_id do nLogin) */
  bedrockUuid: string;
  /** E-mail da conta Microsoft, quando a Microsoft garante que ele foi verificado */
  microsoftEmail?: string | null;
}

// Tenant das contas pessoais da Microsoft (Outlook, Hotmail, Xbox)
const MSA_TENANT_ID = "9188040d-6c67-4c5b-b112-36a304b66dad";
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * E-mail verificado da conta Microsoft, lido do id_token devolvido pelo endpoint
 * de token (o Auth.js já validou emissor, público e validade).
 * A Microsoft não envia "email_verified". Contas pessoais (tenant MSA) só têm
 * e-mails confirmados na criação da conta; fora disso, vale a declaração
 * opcional xms_edov ("domínio do e-mail verificado").
 */
export function verifiedEmailFromIdToken(idToken: string | undefined): string | null {
  if (!idToken) return null;
  try {
    const payload = JSON.parse(Buffer.from(idToken.split(".")[1] ?? "", "base64url").toString("utf8")) as {
      email?: unknown;
      tid?: unknown;
      xms_edov?: unknown;
    };
    const email = typeof payload.email === "string" ? payload.email.trim().toLowerCase() : "";
    if (!EMAIL_REGEX.test(email) || email.length > 255) return null;
    const verified = payload.tid === MSA_TENANT_ID || payload.xms_edov === true || payload.xms_edov === "1";
    return verified ? email : null;
  } catch {
    return null;
  }
}

interface XboxTokenResponse {
  Token: string;
  DisplayClaims: { xui: { uhs: string; xid?: string; gtg?: string }[] };
}

async function postJson<T>(url: string, body: unknown, headers: Record<string, string> = {}): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json", ...headers },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`${url} respondeu ${res.status}${text ? `: ${text.slice(0, 200)}` : ""}`);
  }
  return res.json() as Promise<T>;
}

function xsts(userToken: string, relyingParty: string) {
  return postJson<XboxTokenResponse>("https://xsts.auth.xboxlive.com/xsts/authorize", {
    Properties: { SandboxId: "RETAIL", UserTokens: [userToken] },
    RelyingParty: relyingParty,
    TokenType: "JWT",
  });
}

/** UUID que o Floodgate gera para um jogador Bedrock: 16 zeros + XUID em hexadecimal */
export function floodgateUuid(xuid: string): string {
  return BigInt(xuid).toString(16).padStart(32, "0");
}

export async function resolveMinecraftIdentity(microsoftAccessToken: string): Promise<MinecraftIdentity> {
  // 1. Xbox Live
  const xbl = await postJson<XboxTokenResponse>("https://user.auth.xboxlive.com/user/authenticate", {
    Properties: {
      AuthMethod: "RPS",
      SiteName: "user.auth.xboxlive.com",
      RpsTicket: `d=${microsoftAccessToken}`,
    },
    RelyingParty: "http://auth.xboxlive.com",
    TokenType: "JWT",
  });

  // 2. XSTS do Xbox Live: XUID e gamertag
  const xboxXsts = await xsts(xbl.Token, "http://xboxlive.com");
  const claims = xboxXsts.DisplayClaims.xui[0];
  if (!claims?.xid) throw new Error("A conta Microsoft não tem perfil Xbox");

  const identity: MinecraftIdentity = {
    xuid: claims.xid,
    gamertag: claims.gtg ?? "",
    javaUuid: null,
    javaName: null,
    bedrockUuid: floodgateUuid(claims.xid),
  };

  // 3. Minecraft Java (opcional: depende da aprovação da Mojang e de a conta ter o Java)
  try {
    const mcXsts = await xsts(xbl.Token, "rp://api.minecraftservices.com/");
    const userHash = mcXsts.DisplayClaims.xui[0]?.uhs;
    const mcLogin = await postJson<{ access_token: string }>(
      "https://api.minecraftservices.com/authentication/login_with_xbox",
      { identityToken: `XBL3.0 x=${userHash};${mcXsts.Token}` }
    );

    const profileRes = await fetch("https://api.minecraftservices.com/minecraft/profile", {
      headers: { Authorization: `Bearer ${mcLogin.access_token}` },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (profileRes.ok) {
      const profile = (await profileRes.json()) as { id: string; name: string };
      identity.javaUuid = profile.id.replace(/-/g, "").toLowerCase();
      identity.javaName = profile.name;
    }
    // 404: a conta não tem o Minecraft Java; segue só com o Bedrock
  } catch (error) {
    console.warn(`[minecraft-auth] Perfil Java indisponível: ${(error as Error).message}`);
  }

  return identity;
}
