// Executado uma vez quando o servidor Next.js sobe.
// Em produção, valida as variáveis de ambiente e impede o servidor de iniciar
// com configuração incompleta. Em desenvolvimento, apenas avisa.
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  if (process.env.NEXT_PHASE === "phase-production-build") return;

  const { getEnv } = await import("./lib/env");

  try {
    getEnv();
  } catch (error) {
    if (process.env.NODE_ENV === "production") throw error;
    console.warn(`[env] ${(error as Error).message}`);
  }
}
