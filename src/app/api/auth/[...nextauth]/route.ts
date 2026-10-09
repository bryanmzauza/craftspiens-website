import { handlers } from "@/lib/auth"
import { NextResponse, type NextRequest } from "next/server"
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit"
import { getClientIp } from "@/lib/client-ip"
import { siteUrl } from "@/lib/env"

export const { GET } = handlers

export async function POST(request: NextRequest) {
  const isSignIn = request.nextUrl.pathname.endsWith("/callback/credentials")

  if (isSignIn) {
    const ip = getClientIp(request.headers)
    const form = await request.clone().formData().catch(() => null)
    const identifier = String(form?.get("username") ?? "").trim().toLowerCase()

    // Limite por IP e por conta: trocar de IP não libera mais tentativas na mesma conta
    const checks = await Promise.all([
      checkRateLimit(`login-ip:${ip}`, RATE_LIMITS.loginIp),
      identifier ? checkRateLimit(`login-user:${identifier}`, RATE_LIMITS.loginUser) : null,
    ])
    const blocked = checks.find((check) => check && !check.success)

    if (blocked) {
      const retryAfter = Math.max(Math.ceil((blocked.resetAt - Date.now()) / 1000), 1)
      // O signIn() do next-auth espera um JSON com `url`; o código é lido pela tela de login
      return NextResponse.json(
        { url: `${siteUrl()}/login?error=CredentialsSignin&code=rate_limited` },
        { status: 429, headers: { "Retry-After": String(retryAfter) } }
      )
    }
  }

  return handlers.POST(request)
}
