import { handlers } from "@/lib/auth"
import { NextResponse } from "next/server"
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit"
import { headers } from "next/headers"

export const { GET } = handlers

export async function POST(request: Request) {
  const url = new URL(request.url)
  const isSignIn = url.pathname.endsWith("/callback/credentials")

  if (isSignIn) {
    const headersList = await headers()
    const ip = headersList.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown"
    const rateCheck = checkRateLimit(`login:${ip}`, RATE_LIMITS.login)

    if (!rateCheck.success) {
      const retryAfter = Math.ceil((rateCheck.resetAt - Date.now()) / 1000)
      return NextResponse.json(
        { error: "Muitas tentativas de login. Tente novamente mais tarde." },
        { status: 429, headers: { "Retry-After": String(retryAfter) } }
      )
    }
  }

  return handlers.POST(request)
}
