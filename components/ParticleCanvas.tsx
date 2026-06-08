"use client";

import { useEffect, useRef } from "react";
import { getParticleBudget } from "@/lib/responsive";
import { useReducedMotion } from "@/lib/useReducedMotion";

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  r: number;
  g: number;
  b: number;
  alpha: number;
};

export default function ParticleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (reducedMotion) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId = 0;
    let particles: Particle[] = [];

    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      canvas.width = parent.clientWidth;
      canvas.height = parent.clientHeight;
    };

    const initParticles = () => {
      const count = getParticleBudget(canvas.width, false);
      particles = Array.from({ length: count }, (_, i) => {
        const channel = i % 3;
        return {
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * 0.5,
          vy: (Math.random() - 0.5) * 0.5 - 0.25,
          size: 1 + Math.random() * 3.5,
          r: channel === 0 ? 0 : channel === 1 ? 255 : 106,
          g: channel === 0 ? 184 : channel === 1 ? 0 : 0,
          b: channel === 0 ? 255 : channel === 1 ? 140 : 255,
          alpha: 0.3 + Math.random() * 0.6,
        };
      });
    };

    const drawLightning = () => {
      const streaks = canvas.width < 480 ? 4 : 8;
      for (let i = 0; i < streaks; i++) {
        const isCyan = i % 2 === 0;
        ctx.beginPath();
        ctx.strokeStyle = isCyan
          ? `rgba(0,184,255,${0.04 + (i % 3) * 0.02})`
          : `rgba(255,0,140,${0.04 + (i % 3) * 0.02})`;
        ctx.lineWidth = 0.8;
        let x = Math.random() * canvas.width * 0.5;
        let y = Math.random() * canvas.height;
        ctx.moveTo(x, y);
        for (let j = 0; j < 4; j++) {
          x += (Math.random() - 0.3) * 60;
          y += (Math.random() - 0.5) * 50;
          ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
    };

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      drawLightning();

      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 5);
        gradient.addColorStop(0, `rgba(${p.r},${p.g},${p.b},${p.alpha})`);
        gradient.addColorStop(0.4, `rgba(${p.r},${p.g},${p.b},${p.alpha * 0.35})`);
        gradient.addColorStop(1, `rgba(${p.r},${p.g},${p.b},0)`);

        ctx.beginPath();
        ctx.fillStyle = gradient;
        ctx.arc(p.x, p.y, p.size * 2.5, 0, Math.PI * 2);
        ctx.fill();
      }

      animationId = requestAnimationFrame(draw);
    };

    resize();
    initParticles();
    draw();

    const observer = new ResizeObserver(() => {
      resize();
      initParticles();
    });
    observer.observe(canvas.parentElement!);

    return () => {
      cancelAnimationFrame(animationId);
      observer.disconnect();
    };
  }, [reducedMotion]);

  if (reducedMotion) return null;

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute inset-0 h-full w-full mix-blend-screen will-change-transform"
      aria-hidden="true"
    />
  );
}
