import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, rateLimitResponse, RATE_LIMITS } from "@/lib/rate-limit";
import { PHOTO_MAX_BYTES, PHOTO_MIME, PhotoError, processProfilePhoto, profilePhotoUrl } from "@/lib/profile-photo";

// POST /api/perfil/foto — envia ou troca a foto de perfil (multipart, campo "foto")
// O proxy já exige e-mail confirmado para escritas em /api/perfil.
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const rl = await checkRateLimit(`profile-photo:${session.user.id}`, RATE_LIMITS.profilePhoto);
  if (!rl.success) {
    return rateLimitResponse(rl, "Muitas trocas de foto seguidas. Tente novamente mais tarde.");
  }

  // Recusa cedo pelo tamanho declarado, antes de ler o corpo
  const declared = Number(request.headers.get("content-length") ?? 0);
  if (declared > PHOTO_MAX_BYTES + 64 * 1024) {
    return NextResponse.json({ error: "A foto deve ter no máximo 5 MB." }, { status: 413 });
  }

  let file: File | null = null;
  try {
    const form = await request.formData();
    const value = form.get("foto");
    file = value instanceof File ? value : null;
  } catch {
    return NextResponse.json({ error: "Envio inválido." }, { status: 400 });
  }
  if (!file) {
    return NextResponse.json({ error: "Escolha uma imagem para enviar." }, { status: 400 });
  }
  if (file.size > PHOTO_MAX_BYTES) {
    return NextResponse.json({ error: "A foto deve ter no máximo 5 MB." }, { status: 413 });
  }

  let photo;
  try {
    photo = await processProfilePhoto(Buffer.from(await file.arrayBuffer()));
  } catch (error) {
    if (error instanceof PhotoError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error("[perfil/foto] Erro ao processar a imagem:", error);
    return NextResponse.json({ error: "Não foi possível processar a imagem." }, { status: 500 });
  }

  const saved = await prisma.userPhoto.upsert({
    where: { userId: session.user.id },
    create: {
      userId: session.user.id,
      data: new Uint8Array(photo.data),
      mime: PHOTO_MIME,
      width: photo.width,
      height: photo.height,
      size: photo.data.length,
    },
    update: { data: new Uint8Array(photo.data), mime: PHOTO_MIME, width: photo.width, height: photo.height, size: photo.data.length },
    select: { updatedAt: true },
  });

  return NextResponse.json({ success: true, photo: profilePhotoUrl(session.user.id, saved.updatedAt) });
}

// DELETE /api/perfil/foto — remove a foto; o site volta a usar a skin do jogo
export async function DELETE() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }
  await prisma.userPhoto.deleteMany({ where: { userId: session.user.id } });
  return NextResponse.json({ success: true, photo: null });
}
