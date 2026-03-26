import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { verifyPassword, hashPassword, updateNloginPassword } from "@/lib/nlogin"
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit"
import { headers } from "next/headers"

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 })
  }

  const headersList = await headers()
  const ip = headersList.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown"
  const rateLimitKey = `password:${ip}:${session.user.id}`
  const rateCheck = checkRateLimit(rateLimitKey, RATE_LIMITS.passwordChange)

  if (!rateCheck.success) {
    const retryAfter = Math.ceil((rateCheck.resetAt - Date.now()) / 1000)
    return NextResponse.json(
      { error: "Muitas tentativas. Tente novamente mais tarde." },
      { status: 429, headers: { "Retry-After": String(retryAfter) } }
    )
  }

  const body = await request.json()
  const { currentPassword, newPassword } = body

  if (!currentPassword || !newPassword) {
    return NextResponse.json(
      { error: "Senha atual e nova senha são obrigatórias." },
      { status: 400 }
    )
  }

  if (newPassword.length < 8 || !/[a-zA-Z]/.test(newPassword) || !/\d/.test(newPassword)) {
    return NextResponse.json(
      { error: "Nova senha deve ter mínimo 8 caracteres, com ao menos 1 letra e 1 número." },
      { status: 400 }
    )
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { nlogin: { select: { id: true, password: true } } },
  })

  if (!user?.nlogin?.password) {
    return NextResponse.json({ error: "Erro ao verificar conta." }, { status: 400 })
  }

  const valid = await verifyPassword(currentPassword, user.nlogin.password)
  if (!valid) {
    return NextResponse.json({ error: "Senha atual incorreta." }, { status: 403 })
  }

  const newHash = await hashPassword(newPassword)
  await updateNloginPassword(user.nlogin.id, newHash)

  return NextResponse.json({ success: true })
}
