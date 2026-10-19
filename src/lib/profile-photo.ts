// =============================================================================
// Foto de perfil: processamento da imagem enviada pelo jogador
// =============================================================================
// A foto é vertical (3:4). Toda imagem enviada é decodificada e regravada no
// servidor: isso confere que é mesmo uma imagem, corrige a rotação da câmera e
// apaga os metadados (EXIF), que podem trazer a localização GPS de onde a foto
// foi tirada. A plataforma é usada por menores, então isso não é opcional.
//
// Fica guardada no PostgreSQL (tabela user_photos), coberta pelo backup diário,
// e é servida por GET /api/fotos/[userId]. Sem foto, o site usa a skin do jogo.
import sharp from "sharp";
import { PHOTO_HEIGHT, PHOTO_MAX_BYTES, PHOTO_WIDTH } from "@/lib/profile-photo-rules";

export { PHOTO_HEIGHT, PHOTO_MAX_BYTES, PHOTO_WIDTH };
/** Formatos aceitos no envio (conferidos pelo conteúdo, não pela extensão) */
export const PHOTO_INPUT_FORMATS = ["jpeg", "png", "webp"] as const;
export const PHOTO_MIME = "image/webp";
// Proteção contra imagens com dimensões absurdas (bomba de descompressão)
const MAX_INPUT_PIXELS = 40_000_000;
const MIN_SIDE = 200;

export class PhotoError extends Error {}

export interface ProcessedPhoto {
  data: Buffer;
  width: number;
  height: number;
}

/** Valida e converte a imagem enviada em WebP 600x800, sem metadados */
export async function processProfilePhoto(input: Buffer): Promise<ProcessedPhoto> {
  if (input.length === 0) throw new PhotoError("Arquivo vazio.");
  if (input.length > PHOTO_MAX_BYTES) throw new PhotoError("A foto deve ter no máximo 5 MB.");

  let meta: sharp.Metadata;
  try {
    meta = await sharp(input, { limitInputPixels: MAX_INPUT_PIXELS }).metadata();
  } catch {
    throw new PhotoError("Não foi possível ler a imagem. Envie um arquivo JPG, PNG ou WebP.");
  }
  if (!meta.format || !(PHOTO_INPUT_FORMATS as readonly string[]).includes(meta.format)) {
    throw new PhotoError("Formato não aceito. Envie um arquivo JPG, PNG ou WebP.");
  }
  // Imagens animadas viram a primeira imagem; dimensões muito pequenas ficam ruins
  if ((meta.width ?? 0) < MIN_SIDE || (meta.height ?? 0) < MIN_SIDE) {
    throw new PhotoError(`A foto precisa ter pelo menos ${MIN_SIDE} x ${MIN_SIDE} pixels.`);
  }

  try {
    const data = await sharp(input, { limitInputPixels: MAX_INPUT_PIXELS, animated: false })
      .rotate() // aplica a orientação da câmera antes de descartar o EXIF
      .resize(PHOTO_WIDTH, PHOTO_HEIGHT, { fit: "cover", position: "attention" })
      .webp({ quality: 82 })
      .toBuffer(); // sem withMetadata(): a saída não leva EXIF, GPS nem perfil da câmera
    return { data, width: PHOTO_WIDTH, height: PHOTO_HEIGHT };
  } catch {
    throw new PhotoError("Não foi possível processar a imagem. Tente outro arquivo.");
  }
}

/** Endereço público da foto; a versão na URL deixa o navegador e a Cloudflare guardarem em cache */
export function profilePhotoUrl(userId: string, updatedAt: Date | string): string {
  return `/api/fotos/${userId}?v=${new Date(updatedAt).getTime()}`;
}
