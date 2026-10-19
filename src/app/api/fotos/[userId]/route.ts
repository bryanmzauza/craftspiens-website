import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/fotos/[userId]?v=<versão> — foto de perfil pública (WebP 600x800)
// Com a versão na URL, a resposta pode ficar em cache por um ano: uma foto nova
// gera outra URL. Sem a versão, cache curto.
export async function GET(request: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params;
  if (!/^[a-z0-9]{10,40}$/i.test(userId)) {
    return new Response("Não encontrada", { status: 404 });
  }

  const photo = await prisma.userPhoto.findFirst({
    where: { userId, user: { deactivatedAt: null } },
    select: { data: true, mime: true, updatedAt: true },
  });
  if (!photo) {
    return new Response("Não encontrada", { status: 404, headers: { "Cache-Control": "public, max-age=60" } });
  }

  const versioned = request.nextUrl.searchParams.get("v") === String(photo.updatedAt.getTime());
  return new Response(new Uint8Array(photo.data), {
    headers: {
      "Content-Type": photo.mime,
      "Content-Length": String(photo.data.length),
      "Cache-Control": versioned ? "public, max-age=31536000, immutable" : "public, max-age=300",
      "Last-Modified": photo.updatedAt.toUTCString(),
      "Content-Disposition": "inline",
    },
  });
}
