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

export default function ParticleBackground() {
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
    let noiseOffset = 0;

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
          vx: (Math.random() - 0.5) * 0.45,
          vy: (Math.random() - 0.5) * 0.45 - 0.18,
          size: 1 + Math.random() * 3,
          r: channel === 0 ? 0 : channel === 1 ? 255 : 106,
          g: channel === 0 ? 184 : channel === 1 ? 0 : 0,
          b: channel === 0 ? 255 : channel === 1 ? 140 : 255,
          alpha: 0.25 + Math.random() * 0.55,
        };
      });
    };

    const drawLightning = () => {
      const streaks = canvas.width < 480 ? 5 : 9;
      for (let i = 0; i < streaks; i++) {
        const isCyan = i % 2 === 0;
        ctx.beginPath();
        ctx.strokeStyle = isCyan
          ? `rgba(0,184,255,${0.035 + (i % 3) * 0.018})`
          : `rgba(255,0,140,${0.035 + (i % 3) * 0.018})`;
        ctx.lineWidth = 0.7;
        let x = isCyan ? Math.random() * canvas.width * 0.55 : canvas.width * 0.45 + Math.random() * canvas.width * 0.55;
        let y = Math.random() * canvas.height;
        ctx.moveTo(x, y);
        for (let j = 0; j < 5; j++) {
          x += (Math.random() - 0.35) * 55;
          y += (Math.random() - 0.5) * 45;
          ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
    };

    const drawNoise = () => {
      noiseOffset += 0.4;
      const density = Math.floor((canvas.width * canvas.height) / 9000);
      for (let i = 0; i < density; i++) {
        const x = (Math.sin(noiseOffset + i * 1.7) * 0.5 + 0.5) * canvas.width;
        const y = (Math.cos(noiseOffset * 0.7 + i * 2.3) * 0.5 + 0.5) * canvas.height;
        const alpha = 0.015 + (i % 5) * 0.004;
        ctx.fillStyle = i % 3 === 0 ? `rgba(0,184,255,${alpha})` : i % 3 === 1 ? `rgba(255,0,140,${alpha})` : `rgba(106,0,255,${alpha})`;
        ctx.fillRect(x, y, 1, 1);
      }
    };

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      drawLightning();
      drawNoise();

      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 5);
        gradient.addColorStop(0, `rgba(${p.r},${p.g},${p.b},${p.alpha})`);
        gradient.addColorStop(0.4, `rgba(${p.r},${p.g},${p.b},${p.alpha * 0.3})`);
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

    const parent = canvas.parentElement;
    if (!parent) return;

    const observer = new ResizeObserver(() => {
      resize();
      initParticles();
    });
    observer.observe(parent);

    return () => {
      cancelAnimationFrame(animationId);
      observer.disconnect();
    };
  }, [reducedMotion]);

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden bg-[#030006]" aria-hidden="true">
      <div className="absolute -left-[15%] top-0 h-[85%] w-[65%] bg-[radial-gradient(circle,rgba(0,184,255,0.9)_0%,rgba(0,108,255,0.45)_28%,transparent_68%)] blur-3xl" />
      <div className="absolute -right-[15%] top-[2%] h-[85%] w-[65%] bg-[radial-gradient(circle,rgba(255,0,140,0.85)_0%,rgba(255,43,214,0.4)_28%,transparent_68%)] blur-3xl" />
      <div className="absolute left-1/2 top-0 h-[95%] w-[38%] -translate-x-1/2 bg-[radial-gradient(ellipse,rgba(106,0,255,0.7)_0%,rgba(106,0,255,0.25)_40%,transparent_70%)] blur-2xl" />
      <div className="absolute inset-x-[20%] top-0 h-full w-[60%] bg-[linear-gradient(180deg,rgba(106,0,255,0.18)_0%,transparent_45%,rgba(106,0,255,0.08)_100%)]" />
      {!reducedMotion && (
        <canvas
          ref={canvasRef}
          className="absolute inset-0 h-full w-full mix-blend-screen will-change-transform"
        />
      )}
    </div>
  );
}
