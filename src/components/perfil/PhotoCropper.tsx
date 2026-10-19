"use client";

// Recorte da foto de perfil no navegador: a pessoa arrasta a imagem e ajusta o
// zoom dentro de uma moldura vertical (3:4). O resultado é gerado num canvas
// (900x1200, JPEG), o que também reduz o arquivo antes do envio.

import { useEffect, useRef, useState } from "react";
import { ZoomIn, ZoomOut } from "lucide-react";
import { PHOTO_UPLOAD_HEIGHT, PHOTO_UPLOAD_WIDTH } from "@/lib/profile-photo-rules";

const FRAME_W = 240;
const FRAME_H = 320;
const MAX_ZOOM = 3;

export type CropExporter = () => Promise<Blob | null>;

interface PhotoCropperProps {
  /** URL local da imagem escolhida (URL.createObjectURL) */
  src: string;
  /** Recebe a função que gera o recorte final, usada pelo botão Salvar da página */
  exportRef: React.RefObject<CropExporter | null>;
}

export function PhotoCropper({ src, exportRef }: PhotoCropperProps) {
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [natural, setNatural] = useState<{ w: number; h: number } | null>(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const drag = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);

  // Escala que cobre a moldura inteira com zoom 1
  const base = natural ? Math.max(FRAME_W / natural.w, FRAME_H / natural.h) : 1;
  const scale = base * zoom;
  const dispW = natural ? natural.w * scale : FRAME_W;
  const dispH = natural ? natural.h * scale : FRAME_H;

  // A imagem nunca deixa espaço vazio na moldura
  function clamp(x: number, y: number, w = dispW, h = dispH) {
    const maxX = (w - FRAME_W) / 2;
    const maxY = (h - FRAME_H) / 2;
    return { x: Math.min(maxX, Math.max(-maxX, x)), y: Math.min(maxY, Math.max(-maxY, y)) };
  }

  function changeZoom(next: number) {
    if (!natural) return;
    const z = Math.min(MAX_ZOOM, Math.max(1, next));
    const s = base * z;
    setZoom(z);
    setOffset((o) => clamp(o.x, o.y, natural.w * s, natural.h * s));
  }

  // Entrega ao componente pai a função que gera o recorte com o enquadramento atual
  useEffect(() => {
    exportRef.current = async () => {
      const img = imgRef.current;
      const n = natural;
      const s = scale;
      const o = offset;
      if (!img || !n) return null;
      const canvas = document.createElement("canvas");
      canvas.width = PHOTO_UPLOAD_WIDTH;
      canvas.height = PHOTO_UPLOAD_HEIGHT;
      const ctx = canvas.getContext("2d");
      if (!ctx) return null;
      const k = PHOTO_UPLOAD_WIDTH / FRAME_W;
      const w = n.w * s * k;
      const h = n.h * s * k;
      const x = (PHOTO_UPLOAD_WIDTH - w) / 2 + o.x * k;
      const y = (PHOTO_UPLOAD_HEIGHT - h) / 2 + o.y * k;
      ctx.fillStyle = "#16213E";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(img, x, y, w, h);
      return new Promise((resolve) => canvas.toBlob((blob) => resolve(blob), "image/jpeg", 0.9));
    };
  }, [exportRef, natural, scale, offset]);

  return (
    <div className="flex flex-col items-center gap-3">
      <div
        className="relative cursor-grab touch-none overflow-hidden rounded-xl border border-white/20 bg-bg-card active:cursor-grabbing"
        style={{ width: FRAME_W, height: FRAME_H }}
        onPointerDown={(e) => {
          (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
          drag.current = { x: e.clientX, y: e.clientY, ox: offset.x, oy: offset.y };
        }}
        onPointerMove={(e) => {
          if (!drag.current) return;
          setOffset(clamp(drag.current.ox + e.clientX - drag.current.x, drag.current.oy + e.clientY - drag.current.y));
        }}
        onPointerUp={() => (drag.current = null)}
        onPointerCancel={() => (drag.current = null)}
        onWheel={(e) => changeZoom(zoom - e.deltaY * 0.0015)}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- imagem local escolhida pela pessoa */}
        <img
          ref={imgRef}
          src={src}
          alt="Pré-visualização do recorte"
          draggable={false}
          onLoad={(e) => {
            const el = e.currentTarget;
            setNatural({ w: el.naturalWidth, h: el.naturalHeight });
            setZoom(1);
            setOffset({ x: 0, y: 0 });
          }}
          className="pointer-events-none absolute left-1/2 top-1/2 max-w-none select-none"
          style={{ width: dispW, height: dispH, transform: `translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px))` }}
        />
      </div>
      <div className="flex w-full max-w-[240px] items-center gap-2">
        <button type="button" onClick={() => changeZoom(zoom - 0.25)} aria-label="Diminuir zoom" className="text-[#A0A0A0] hover:text-white">
          <ZoomOut size={16} />
        </button>
        <input
          type="range"
          min={1}
          max={MAX_ZOOM}
          step={0.01}
          value={zoom}
          onChange={(e) => changeZoom(Number(e.target.value))}
          aria-label="Zoom"
          className="flex-1 accent-green-cs"
        />
        <button type="button" onClick={() => changeZoom(zoom + 0.25)} aria-label="Aumentar zoom" className="text-[#A0A0A0] hover:text-white">
          <ZoomIn size={16} />
        </button>
      </div>
      <p className="text-center text-xs text-[#A0A0A0]">Arraste para enquadrar e use o zoom.</p>
    </div>
  );
}
