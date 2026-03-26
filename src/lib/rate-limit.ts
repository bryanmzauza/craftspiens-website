type RateLimitEntry = {
  count: number
  resetAt: number
}

const store = new Map<string, RateLimitEntry>()

// Limpa entradas expiradas periodicamente (a cada 5 min)
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now()
    for (const [key, entry] of store) {
      if (now > entry.resetAt) {
        store.delete(key)
      }
    }
  }, 5 * 60 * 1000)
}

type RateLimitConfig = {
  maxAttempts: number
  windowMs: number
}

type RateLimitResult = {
  success: boolean
  remaining: number
  resetAt: number
}

export function checkRateLimit(
  key: string,
  config: RateLimitConfig
): RateLimitResult {
  const now = Date.now()
  const entry = store.get(key)

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + config.windowMs })
    return { success: true, remaining: config.maxAttempts - 1, resetAt: now + config.windowMs }
  }

  if (entry.count >= config.maxAttempts) {
    return { success: false, remaining: 0, resetAt: entry.resetAt }
  }

  entry.count++
  return { success: true, remaining: config.maxAttempts - entry.count, resetAt: entry.resetAt }
}

// Presets conforme docs/paginas/07-auth.md, 08-contato.md e 06-comunidade.md
export const RATE_LIMITS = {
  login: { maxAttempts: 5, windowMs: 15 * 60 * 1000 },          // 5 tentativas / 15 min
  contact: { maxAttempts: 3, windowMs: 60 * 60 * 1000 },         // 3 envios / 1 hora
  register: { maxAttempts: 3, windowMs: 60 * 60 * 1000 },        // 3 registros / 1 hora
  passwordChange: { maxAttempts: 5, windowMs: 15 * 60 * 1000 },  // 5 tentativas / 15 min
  passwordReset: { maxAttempts: 3, windowMs: 60 * 60 * 1000 },   // 3 solicitações / 1 hora
  newsletter: { maxAttempts: 3, windowMs: 60 * 60 * 1000 },      // 3 inscrições / 1 hora
  forumTopic: { maxAttempts: 5, windowMs: 60 * 60 * 1000 },      // 5 tópicos / 1 hora (RN-FORUM-05)
  forumComment: { maxAttempts: 10, windowMs: 15 * 60 * 1000 },   // 10 comentários / 15 min
} as const
