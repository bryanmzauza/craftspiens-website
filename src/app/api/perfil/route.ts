import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getNloginById } from "@/lib/nlogin"
import { checkRateLimit, rateLimitResponse, RATE_LIMITS } from "@/lib/rate-limit"
import { isPlaceholderEmail } from "@/lib/email-verification"
import { maskCpf } from "@/lib/cpf"
import { getPlayerRank } from "@/lib/luckperms"
import { getPlayerSkin, getSeniority } from "@/lib/player-profile"

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

  // Dados do servidor: skin, cargo no LuckPerms e tempo desde o registro no nLogin.
  // Uma falha aqui não derruba o perfil; a tela usa os valores padrão.
  const [skin, rank] = nlogin
    ? await Promise.all([
        getPlayerSkin(nlogin).catch(() => null),
        getPlayerRank(nlogin.unique_id).catch((error) => {
          console.error("[perfil] Erro ao ler o cargo no LuckPerms:", error)
          return null
        }),
      ])
    : [null, null]

  return NextResponse.json({
    id: user.id,
    username: nlogin?.last_name ?? user.displayName ?? "Aluno",
    hasNick: !!nlogin,
    email: user.email,
    emailConfirmed: !!user.emailVerifiedAt && !isPlaceholderEmail(user.email),
    payerCpf: user.payerCpf ? maskCpf(user.payerCpf) : null,
    role: user.role,
    birthDate: user.birthDate,
    createdAt: user.createdAt,
    deactivatedAt: user.deactivatedAt,
    skin,
    rank,
    seniority: nlogin ? getSeniority(nlogin.creation_date) : null,
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
  const { bio } = body

  // A troca de e-mail é feita com confirmação por código (/confirmar-email?alterar=1)
  if (body.email !== undefined) {
    return NextResponse.json(
      { error: "Para alterar o e-mail, use a opção Alterar e-mail, que envia um código de confirmação." },
      { status: 400 }
    )
  }
  if (bio !== undefined && (typeof bio !== "string" || bio.length > 500)) {
    return NextResponse.json({ error: "Bio deve ter no máximo 500 caracteres." }, { status: 400 })
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
