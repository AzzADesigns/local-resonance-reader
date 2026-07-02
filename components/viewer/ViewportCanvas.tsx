"use client";

import { useRef, useEffect } from "react";

interface ViewportCanvasProps {
  id: string;
  label: string;
  orientation: string;
  className?: string;
}

export default function ViewportCanvas({ id, label, orientation, className = "" }: ViewportCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const rect = parent.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.scale(dpr, dpr);
        ctx.fillStyle = "#0a0a0a";
        ctx.fillRect(0, 0, rect.width, rect.height);
      }
    };

    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  return (
    <div className={`relative bg-[#080808] overflow-hidden group ${className}`}>
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        id={id}
      />
      <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/60 text-[10px] font-medium text-muted backdrop-blur-sm border border-white/5">
        {label}
      </div>
      <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/60 text-[10px] text-muted backdrop-blur-sm border border-white/5">
        {orientation}
      </div>
    </div>
  );
}
