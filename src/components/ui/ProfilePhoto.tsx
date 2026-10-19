// Foto de perfil: a imagem enviada pelo jogador ou, sem ela, o rosto da skin.
// "retrato" mostra a foto vertical (3:4); "quadrado" recorta a parte de cima,
// para avatares pequenos (listas, comentários). Sem brilho.
//
// Com `frame`, a foto ganha a moldura do cartão do autor: borda grossa na cor
// do cargo e uma aba escura com o nome do cargo sobre a borda de baixo.

interface ProfilePhotoProps {
  /** URL da foto enviada (/api/fotos/...), se houver */
  photo?: string | null;
  /** Identificador da skin no mc-heads.net, usado quando não há foto */
  skinId?: string | null;
  /** Nome usado na inicial e no texto alternativo */
  name: string;
  /** Largura em pixels; a altura sai do formato */
  width: number;
  shape?: "retrato" | "quadrado";
  /** Cor da borda fina (equipe nas listas); sem ela, borda neutra */
  accent?: string | null;
  /** Moldura do cartão: borda grossa na cor do cargo e aba com o nome */
  frame?: { color: string; label?: string | null } | null;
  className?: string;
  alt?: string;
}

export function ProfilePhoto({
  photo,
  skinId,
  name,
  width,
  shape = "quadrado",
  accent,
  frame,
  className = "",
  alt = "",
}: ProfilePhotoProps) {
  const height = shape === "retrato" ? Math.round((width * 4) / 3) : width;
  const radius = width >= 64 ? "rounded-xl" : "rounded-lg";
  const borderWidth = frame ? (width >= 120 ? 5 : 3) : 1;
  // Rosto da skin em dobro do tamanho exibido, para ficar nítido
  const skinPx = Math.min(512, Math.max(16, Math.round(Math.max(width, height) * 2)));
  const src = photo ?? (skinId ? `https://mc-heads.net/avatar/${encodeURIComponent(skinId)}/${skinPx}` : null);
  const borderColor = frame?.color ?? accent ?? null;

  return (
    <div className={`relative shrink-0 ${className}`} style={{ width, height }}>
      <div
        className={`h-full w-full overflow-hidden bg-bg-card ${radius} ${borderColor ? "" : "border-white/10"}`}
        style={{ borderStyle: "solid", borderWidth, ...(borderColor ? { borderColor } : {}) }}
      >
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element -- foto servida pela própria API ou skin externa
          <img
            src={src}
            alt={alt}
            loading="lazy"
            draggable={false}
            className={`h-full w-full object-cover ${photo ? "object-[50%_30%]" : "[image-rendering:pixelated]"}`}
          />
        ) : (
          <span
            className="flex h-full w-full items-center justify-center font-bold text-white"
            style={{ fontSize: Math.max(10, width / 2.4) }}
            aria-hidden="true"
          >
            {name[0]?.toUpperCase()}
          </span>
        )}
      </div>

      {frame?.label && (
        <span
          className="absolute bottom-0 left-1/2 -translate-x-1/2 whitespace-nowrap bg-[#12122a] px-5 pb-1 pt-1.5 text-center text-xs font-extrabold uppercase tracking-wider text-white"
          style={{
            minWidth: Math.round(width * 0.55),
            // Aba com as laterais inclinadas, apoiada na borda de baixo
            clipPath: "polygon(12% 0, 88% 0, 100% 100%, 0 100%)",
            borderTop: `2px solid ${frame.color}`,
          }}
        >
          {frame.label}
        </span>
      )}
    </div>
  );
}
