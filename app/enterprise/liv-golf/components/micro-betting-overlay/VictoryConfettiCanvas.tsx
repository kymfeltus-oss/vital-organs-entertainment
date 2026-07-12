"use client";

import React, { useEffect, useRef } from "react";

type Particle = {
  x: number;
  y: number;
  radius: number;
  color: string;
  rotation: number;
  rotationSpeed: number;
  speedX: number;
  speedY: number;
  opacity: number;
  type: "coin" | "confetti";
};

export type VictoryConfettiCanvasProps = {
  isActive: boolean;
};

export const VictoryConfettiCanvas = React.memo(function VictoryConfettiCanvas({
  isActive,
}: VictoryConfettiCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!isActive) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId = 0;
    const particles: Particle[] = [];
    const colors = ["#CCFF00", "#FFFFFF", "#222222", "#FFD700", "#FFA500"];

    const resizeCanvas = () => {
      const rect = canvas.parentElement?.getBoundingClientRect();
      canvas.width = rect?.width ?? 340;
      canvas.height = rect?.height ?? 400;
    };

    resizeCanvas();

    const resizeObserver =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(() => resizeCanvas())
        : null;

    if (resizeObserver && canvas.parentElement) {
      resizeObserver.observe(canvas.parentElement);
    }

    const spawnBurst = (originX: number) => {
      for (let i = 0; i < 45; i += 1) {
        particles.push({
          x: originX,
          y: canvas.height,
          radius: Math.random() * 4 + 3,
          color: colors[Math.floor(Math.random() * colors.length)] ?? "#CCFF00",
          rotation: Math.random() * Math.PI * 2,
          rotationSpeed: (Math.random() - 0.5) * 0.2,
          speedX: (originX === 0 ? 1 : -1) * (Math.random() * 6 + 4) + (Math.random() - 0.5) * 3,
          speedY: -(Math.random() * 12 + 8),
          opacity: 1,
          type: Math.random() > 0.4 ? "confetti" : "coin",
        });
      }
    };

    spawnBurst(0);
    spawnBurst(canvas.width);

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (let i = particles.length - 1; i >= 0; i -= 1) {
        const particle = particles[i];
        if (!particle) continue;

        particle.x += particle.speedX;
        particle.y += particle.speedY;
        particle.speedY += 0.35;
        particle.speedX *= 0.98;
        particle.rotation += particle.rotationSpeed;

        ctx.save();
        ctx.globalAlpha = particle.opacity;
        ctx.translate(particle.x, particle.y);
        ctx.rotate(particle.rotation);

        if (particle.type === "coin") {
          ctx.beginPath();
          ctx.arc(0, 0, particle.radius, 0, Math.PI * 2);
          ctx.fillStyle = "#FFD700";
          ctx.fill();
          ctx.strokeStyle = "#B8860B";
          ctx.lineWidth = 1.5;
          ctx.stroke();

          ctx.fillStyle = "#B8860B";
          ctx.font = `bold ${particle.radius}px sans-serif`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText("T", 0, 0);
        } else {
          ctx.fillStyle = particle.color;
          ctx.fillRect(-particle.radius, -particle.radius / 2, particle.radius * 2, particle.radius);
        }

        ctx.restore();

        if (particle.speedY > 0) {
          particle.opacity -= 0.015;
        }

        if (particle.opacity <= 0 || particle.y > canvas.height) {
          particles.splice(i, 1);
        }
      }

      if (particles.length > 0) {
        animationFrameId = requestAnimationFrame(render);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver?.disconnect();
    };
  }, [isActive]);

  if (!isActive) return null;

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="pointer-events-none absolute inset-0 z-50 rounded-2xl"
      style={{ mixBlendMode: "screen" }}
    />
  );
});

VictoryConfettiCanvas.displayName = "VictoryConfettiCanvas";
