// Regras da foto de perfil compartilhadas entre o navegador e o servidor.
// (O processamento com sharp fica em src/lib/profile-photo.ts, só no servidor.)

/** Foto vertical, 3:4 */
export const PHOTO_WIDTH = 600;
export const PHOTO_HEIGHT = 800;
/** Tamanho máximo do arquivo aceito pela API. O navegador reduz a imagem antes
 *  de enviar, porque o nginx da entrada limita o corpo da requisição a 2 MB. */
export const PHOTO_MAX_BYTES = 5 * 1024 * 1024;
/** Maior arquivo que a pessoa pode escolher (o recorte no navegador reduz o tamanho) */
export const PHOTO_PICK_MAX_BYTES = 20 * 1024 * 1024;
export const PHOTO_ACCEPT = "image/jpeg,image/png,image/webp";
/** Tamanho em que o navegador gera o recorte antes de enviar */
export const PHOTO_UPLOAD_WIDTH = 900;
export const PHOTO_UPLOAD_HEIGHT = 1200;
