import { describe, expect, it } from "vitest";
import sharp from "sharp";
import { PHOTO_HEIGHT, PHOTO_WIDTH, PhotoError, processProfilePhoto, profilePhotoUrl } from "@/lib/profile-photo";

async function sample(width: number, height: number, format: "jpeg" | "png" = "jpeg", exif = false): Promise<Buffer> {
  let img = sharp({ create: { width, height, channels: 3, background: { r: 40, g: 160, b: 80 } } });
  if (exif) img = img.withExif({ IFD0: { Copyright: "teste", ImageDescription: "foto com metadados" } });
  return format === "png" ? img.png().toBuffer() : img.jpeg().toBuffer();
}

describe("processProfilePhoto", () => {
  it("converte para WebP vertical 600x800", async () => {
    const out = await processProfilePhoto(await sample(1200, 900));
    const meta = await sharp(out.data).metadata();
    expect(meta.format).toBe("webp");
    expect([meta.width, meta.height]).toEqual([PHOTO_WIDTH, PHOTO_HEIGHT]);
  });

  it("descarta os metadados (EXIF) da imagem enviada", async () => {
    const input = await sample(800, 1000, "jpeg", true);
    expect((await sharp(input).metadata()).exif).toBeDefined();
    const out = await processProfilePhoto(input);
    expect((await sharp(out.data).metadata()).exif).toBeUndefined();
  });

  it("aceita PNG", async () => {
    const out = await processProfilePhoto(await sample(400, 600, "png"));
    expect(out.width).toBe(PHOTO_WIDTH);
  });

  it("recusa arquivos que não são imagem e imagens pequenas demais", async () => {
    await expect(processProfilePhoto(Buffer.from("isto não é uma imagem"))).rejects.toBeInstanceOf(PhotoError);
    await expect(processProfilePhoto(await sample(100, 150))).rejects.toBeInstanceOf(PhotoError);
    await expect(processProfilePhoto(Buffer.alloc(0))).rejects.toBeInstanceOf(PhotoError);
  });

  it("recusa formatos fora da lista", async () => {
    const gif = await sharp({ create: { width: 300, height: 300, channels: 3, background: "#fff" } }).gif().toBuffer();
    await expect(processProfilePhoto(gif)).rejects.toBeInstanceOf(PhotoError);
  });
});

describe("profilePhotoUrl", () => {
  it("leva a versão para o cache", () => {
    expect(profilePhotoUrl("abc", new Date("2026-10-19T12:00:00Z"))).toBe("/api/fotos/abc?v=1792411200000");
  });
});
