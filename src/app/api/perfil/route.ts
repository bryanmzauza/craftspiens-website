import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getNloginById, verifyPassword } from "@/lib/nlogin"
import { Prisma } from "@/generated/prisma-pg"
import { checkRateLimit, rateLimitResponse, RATE_LIMITS } from "@/lib/rate-limit"
import { sendEmailChangedNotice } from "@/lib/email"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 })
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      profile: true,
      _count: {
        select: {
          orders: true,
          posts: true,
          comments: true,
        },
      },
    },
  })

  if (!user) {
    return NextResponse.json({ error: "Usuário não encontrado." }, { status: 404 })
  }

  const nlogin = await getNloginById(user.nloginId)

  return NextResponse.json({
    id: user.id,
    username: nlogin?.last_name ?? "Unknown",
    email: user.email,
    role: user.role,
    birthDate: user.birthDate,
    createdAt: user.createdAt,
    deactivatedAt: user.deactivatedAt,
    nlogin: {
      uuid: nlogin?.unique_id ?? null,
      lastSeen: nlogin?.last_seen ?? null,
      creationDate: nlogin?.creation_date ?? null,
    },
    profile: user.profile ? {
      bio: user.profile.bio,
      avatar: user.profile.avatar,
      sapiensCoins: user.profile.sapiensCoins,
      xp: user.profile.xp,
      playtimeMinutes: user.profile.playtimeMinutes,
      aulasConcluidas: user.profile.aulasConcluidas,
      rankingPosition: user.profile.rankingPosition,
      perfilPublico: user.profile.perfilPublico,
      mostrarTempoOnline: user.profile.mostrarTempoOnline,
      mostrarAtividade: user.profile.mostrarAtividade,
      notifForumRespostas: user.profile.notifForumRespostas,
      notifLembretesAulas: user.profile.notifLembretesAulas,
      notifNovidades: user.profile.notifNovidades,
      notifResumoSemanal: user.profile.notifResumoSemanal,
    } : null,
    stats: {
      orders: user._count.orders,
      posts: user._count.posts,
      comments: user._count.comments,
    },
  })
}

export async function PUT(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 })
  }

  const rateCheck = await checkRateLimit(`profile-update:${session.user.id}`, RATE_LIMITS.profileUpdate)
  if (!rateCheck.success) {
    return rateLimitResponse(rateCheck, "Muitas alterações seguidas. Tente novamente mais tarde.")
  }

  const body = await request.json().catch(() => null)
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Requisição inválida." }, { status: 400 })
  }
  const { bio, currentPassword } = body

  if (body.email !== undefined && typeof body.email !== "string") {
    return NextResponse.json({ error: "Email inválido." }, { status: 400 })
  }
  if (bio !== undefined && (typeof bio !== "string" || bio.length > 500)) {
    return NextResponse.json({ error: "Bio deve ter no máximo 500 caracteres." }, { status: 400 })
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { email: true, nloginId: true },
  })
  if (!user) {
    return NextResponse.json({ error: "Usuário não encontrado." }, { status: 404 })
  }

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : undefined
  const emailChanged = email !== undefined && email !== user.email

  if (emailChanged) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "Email inválido." }, { status: 400 })
    }

    // Trocar o email permite recuperar a senha por ele: exige a senha atual
    if (typeof currentPassword !== "string" || !currentPassword) {
      return NextResponse.json(
        { error: "Informe sua senha atual para alterar o email." },
        { status: 400 }
      )
    }
    const nlogin = await getNloginById(user.nloginId)
    if (!nlogin?.password || !(await verifyPassword(currentPassword, nlogin.password))) {
      return NextResponse.json({ error: "Senha atual incorreta." }, { status: 403 })
    }

    try {
      await prisma.user.update({
        where: { id: session.user.id },
        data: { email },
      })
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        return NextResponse.json({ error: "Este email já está em uso." }, { status: 409 })
      }
      throw error
    }

    // Avisa o endereço antigo (fire-and-forget)
    sendEmailChangedNotice(user.email, nlogin.last_name, email).catch((err) =>
      console.error("Erro ao enviar aviso de troca de email:", err)
    )
  }

  const profileUpdates: Record<string, unknown> = {}
  if (bio !== undefined) profileUpdates.bio = bio

  if (Object.keys(profileUpdates).length > 0) {
    await prisma.profile.update({
      where: { userId: session.user.id },
      data: profileUpdates,
    })
  }

  return NextResponse.json({ success: true })
}
