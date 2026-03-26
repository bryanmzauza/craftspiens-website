import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const VALID_NOTIF_VALUES = ["email", "site", "off"]
const VALID_NOTIF_SIMPLE = ["email", "off"]

export async function PUT(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 })
  }

  const body = await request.json()
  const {
    perfilPublico,
    mostrarTempoOnline,
    mostrarAtividade,
    notifForumRespostas,
    notifLembretesAulas,
    notifNovidades,
    notifResumoSemanal,
  } = body

  const updates: Record<string, unknown> = {}

  if (typeof perfilPublico === "boolean") updates.perfilPublico = perfilPublico
  if (typeof mostrarTempoOnline === "boolean") updates.mostrarTempoOnline = mostrarTempoOnline
  if (typeof mostrarAtividade === "boolean") updates.mostrarAtividade = mostrarAtividade

  if (notifForumRespostas !== undefined) {
    if (!VALID_NOTIF_VALUES.includes(notifForumRespostas)) {
      return NextResponse.json({ error: "Valor inválido para notificação de respostas." }, { status: 400 })
    }
    updates.notifForumRespostas = notifForumRespostas
  }

  if (notifLembretesAulas !== undefined) {
    if (!VALID_NOTIF_VALUES.includes(notifLembretesAulas)) {
      return NextResponse.json({ error: "Valor inválido para notificação de lembretes." }, { status: 400 })
    }
    updates.notifLembretesAulas = notifLembretesAulas
  }

  if (notifNovidades !== undefined) {
    if (!VALID_NOTIF_SIMPLE.includes(notifNovidades)) {
      return NextResponse.json({ error: "Valor inválido para notificação de novidades." }, { status: 400 })
    }
    updates.notifNovidades = notifNovidades
  }

  if (notifResumoSemanal !== undefined) {
    if (!VALID_NOTIF_SIMPLE.includes(notifResumoSemanal)) {
      return NextResponse.json({ error: "Valor inválido para notificação de resumo." }, { status: 400 })
    }
    updates.notifResumoSemanal = notifResumoSemanal
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "Nenhuma alteração informada." }, { status: 400 })
  }

  await prisma.profile.update({
    where: { userId: session.user.id },
    data: updates,
  })

  return NextResponse.json({ success: true })
}
