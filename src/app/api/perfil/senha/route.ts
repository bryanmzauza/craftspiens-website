import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma, prismaMariaDb } from "@/lib/prisma"
import { verifyPassword, hashPassword, updateNloginPassword } from "@/lib/nlogin"
import { checkRateLimit, rateLimitResponse, RATE_LIMITS } from "@/lib/rate-limit"

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 })
  }

  // Limite por conta (e não por IP), para não ser burlado trocando de IP
  const rateCheck = await checkRateLimit(`password:${session.user.id}`, RATE_LIMITS.passwordChange)

  if (!rateCheck.success) {
    return rateLimitResponse(rateCheck, "Muitas tentativas. Tente novamente mais tarde.")
  }

  const body = await request.json().catch(() => ({}))
  const { currentPassword, newPassword } = body

  if (
    typeof currentPassword !== "string" ||
    typeof newPassword !== "string" ||
    !currentPassword ||
    !newPassword
  ) {
    return NextResponse.json(
      { error: "Senha atual e nova senha são obrigatórias." },
      { status: 400 }
    )
  }

  if (
    newPassword.length < 8 ||
    newPassword.length > 128 ||
    !/[a-zA-Z]/.test(newPassword) ||
    !/\d/.test(newPassword)
  ) {
    return NextResponse.json(
      { error: "Nova senha deve ter mínimo 8 caracteres, com ao menos 1 letra e 1 número." },
      { status: 400 }
    )
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, nloginId: true },
  })

  if (!user) {
    return NextResponse.json({ error: "Erro ao verificar conta." }, { status: 400 })
  }

  const nlogin = await prismaMariaDb.nlogin.findFirst({
    where: { id: user.nloginId },
    select: { id: true, password: true },
  })

  if (!nlogin?.password) {
    return NextResponse.json({ error: "Erro ao verificar conta." }, { status: 400 })
  }

  const valid = await verifyPassword(currentPassword, nlogin.password)
  if (!valid) {
    return NextResponse.json({ error: "Senha atual incorreta." }, { status: 403 })
  }

  const newHash = await hashPassword(newPassword)
  await updateNloginPassword(nlogin.id, newHash)

  // Encerra as outras sessões e invalida links de recuperação pendentes
  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: { sessionVersion: { increment: 1 } },
    }),
    prisma.passwordResetToken.updateMany({
      where: { userId: user.id, usedAt: null },
      data: { usedAt: new Date() },
    }),
  ])

  return NextResponse.json({ success: true })
}
