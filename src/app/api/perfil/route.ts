import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 })
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      profile: true,
      nlogin: {
        select: {
          last_name: true,
          unique_id: true,
          last_seen: true,
          creation_date: true,
        },
      },
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

  return NextResponse.json({
    id: user.id,
    username: user.nlogin.last_name,
    email: user.email,
    role: user.role,
    birthDate: user.birthDate,
    createdAt: user.createdAt,
    deactivatedAt: user.deactivatedAt,
    nlogin: {
      uuid: user.nlogin.unique_id,
      lastSeen: user.nlogin.last_seen,
      creationDate: user.nlogin.creation_date,
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

  const body = await request.json()
  const { email, bio } = body

  if (email !== undefined) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "Email inválido." }, { status: 400 })
    }

    const existing = await prisma.user.findFirst({
      where: { email, id: { not: session.user.id } },
    })
    if (existing) {
      return NextResponse.json({ error: "Este email já está em uso." }, { status: 409 })
    }
  }

  if (bio !== undefined && bio.length > 500) {
    return NextResponse.json({ error: "Bio deve ter no máximo 500 caracteres." }, { status: 400 })
  }

  const updates: Record<string, unknown> = {}
  const profileUpdates: Record<string, unknown> = {}

  if (email !== undefined) updates.email = email
  if (bio !== undefined) profileUpdates.bio = bio

  if (Object.keys(updates).length > 0) {
    await prisma.user.update({
      where: { id: session.user.id },
      data: updates,
    })
  }

  if (Object.keys(profileUpdates).length > 0) {
    await prisma.profile.update({
      where: { userId: session.user.id },
      data: profileUpdates,
    })
  }

  return NextResponse.json({ success: true })
}
