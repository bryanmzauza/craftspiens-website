"use client";

import { useCallback, useEffect, useRef } from "react";

interface Particle {
  x: number;
  y: number;
  size: number;
  speed: number;
  opacity: number;
  type: "block" | "orb" | "star" | "dust";
  color: string;
  rotation: number;
  rotationSpeed: number;
  oscillation: { amplitude: number; frequency: number; offset: number };
  layer: 1 | 2 | 3;
  pulsePhase: number;
  baseY: number;
}

const COLORS = {
  block: ["#4CAF50", "#8B6914", "#6D6D6D"],
  orb: ["#81C784", "#FFD700"],
  star: ["#FFFFFF"],
  dust: ["#A0A0A0"],
};

function createParticle(
  canvasWidth: number,
  canvasHeight: number,
  type: Particle["type"]
): Particle {
  const colors = COLORS[type];
  const color = colors[Math.floor(Math.random() * colors.length)];
  const layer = (Math.floor(Math.random() * 3) + 1) as 1 | 2 | 3;

  const sizeMap = { block: 6 + Math.random() * 6, orb: 4 + Math.random() * 4, star: 1.5 + Math.random() * 2.5, dust: 1 + Math.random() * 2 };
  const speedMap = { block: 0.2 + Math.random() * 0.4, orb: 0.3 + Math.random() * 0.5, star: 0.1 + Math.random() * 0.2, dust: 0.1 + Math.random() * 0.3 };
  const opacityMap = { block: 0.15 + Math.random() * 0.2, orb: 0.2 + Math.random() * 0.25, star: 0.3 + Math.random() * 0.5, dust: 0.08 + Math.random() * 0.12 };

  const layerMultiplier = layer === 1 ? 0.5 : layer === 2 ? 1 : 1.5;
  const y = Math.random() * canvasHeight;

  return {
    x: Math.random() * canvasWidth,
    y,
    baseY: y,
    size: sizeMap[type] * layerMultiplier,
    speed: speedMap[type] * layerMultiplier,
    opacity: opacityMap[type] * (layer === 1 ? 0.6 : layer === 2 ? 0.8 : 1),
    type,
    color,
    rotation: Math.random() * 360,
    rotationSpeed: (Math.random() - 0.5) * 2,
    oscillation: {
      amplitude: 20 + Math.random() * 30,
      frequency: 0.005 + Math.random() * 0.02,
      offset: Math.random() * Math.PI * 2,
    },
    layer,
    pulsePhase: Math.random() * Math.PI * 2,
  };
}

function initParticles(w: number, h: number, count: number): Particle[] {
  const distribution = { block: 0.3, orb: 0.15, star: 0.35, dust: 0.2 };
  const particles: Particle[] = [];
  const types: Particle["type"][] = ["block", "orb", "star", "dust"];

  for (const type of types) {
    const n = Math.round(count * distribution[type]);
    for (let i = 0; i < n; i++) {
      particles.push(createParticle(w, h, type));
    }
  }
  return particles;
}

export function AnimatedBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animFrameRef = useRef<number>(0);
  const timeRef = useRef(0);

  const draw = useCallback((ctx: CanvasRenderingContext2D, w: number, h: number) => {
    timeRef.current++;
    ctx.clearRect(0, 0, w, h);

    for (const p of particlesRef.current) {
      const xOffset = Math.sin(timeRef.current * p.oscillation.frequency + p.oscillation.offset) * p.oscillation.amplitude;

      p.y -= p.speed;
      if (p.y + p.size < 0) {
        p.y = h + p.size;
        p.x = Math.random() * w;
      }

      const drawX = p.x + xOffset;

      ctx.save();
      ctx.globalAlpha = p.opacity;

      if (p.type === "block") {
        ctx.translate(drawX + p.size / 2, p.y + p.size / 2);
        ctx.rotate(((p.rotation += p.rotationSpeed) * Math.PI) / 180);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
      } else if (p.type === "orb") {
        const pulse = 0.8 + 0.4 * Math.sin(timeRef.current * 0.03 + p.pulsePhase);
        const r = (p.size / 2) * pulse;
        const gradient = ctx.createRadialGradient(drawX, p.y, 0, drawX, p.y, r * 2);
        gradient.addColorStop(0, p.color);
        gradient.addColorStop(1, "transparent");
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(drawX, p.y, r * 2, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.type === "star") {
        const flicker = 0.5 + 0.5 * Math.sin(timeRef.current * 0.05 + p.pulsePhase);
        ctx.globalAlpha = p.opacity * flicker;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(drawX, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(drawX, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const isMobile = window.innerWidth < 768;
    const maxParticles = isMobile ? 25 : 55;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      particlesRef.current = initParticles(canvas.width, canvas.height, maxParticles);
    };

    resize();

    let resizeTimer: ReturnType<typeof setTimeout>;
    const handleResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(resize, 200);
    };
    window.addEventListener("resize", handleResize);

    const handleVisibility = () => {
      if (document.hidden) {
        cancelAnimationFrame(animFrameRef.current);
      } else {
        loop();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);

    const loop = () => {
      draw(ctx, canvas.width, canvas.height);
      animFrameRef.current = requestAnimationFrame(loop);
    };
    loop();

    return () => {
      cancelAnimationFrame(animFrameRef.current);
      window.removeEventListener("resize", handleResize);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [draw]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0"
      style={{
        background: "linear-gradient(180deg, #1A1A2E 0%, #16213E 50%, #0F3460 100%)",
      }}
    />
  );
}
