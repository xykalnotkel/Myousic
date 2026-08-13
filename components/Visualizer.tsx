"use client";

// Visualizer ringkas: 18 bar + 1 garis gelombang. Pause saat tab hidden.
import { useEffect, useRef } from "react";
import { usePlayer } from "./PlayerProvider";

interface Props {
  variant?: "bar" | "ring";
  className?: string;
  demo?: boolean;
}

function synthFreq(out: Uint8Array, t: number) {
  for (let i = 0; i < out.length; i++) {
    out[i] = 48 + 70 * Math.abs(Math.sin(i * 0.08 + t * 1.6));
  }
}

export default function Visualizer({ variant = "bar", className, demo = false }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { analyser, playing, engine } = usePlayer();
  const live = !demo && !!analyser && engine === "audio";

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    let raf = 0;
    let beatBoost = 0;
    let lastBeatAt = 0;
    let lastDraw = 0;
    let avgFlux = 0.1;
    const prevBand = new Float32Array(16);
    const freq = new Uint8Array(256);
    const wave = new Uint8Array(256);
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);

    const resize = () => {
      const r = canvas.getBoundingClientRect();
      canvas.width = Math.max(1, Math.floor(r.width * dpr));
      canvas.height = Math.max(1, Math.floor(r.height * dpr));
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const draw = (now: number) => {
      raf = requestAnimationFrame(draw);
      if (document.hidden) return;
      if (now - lastDraw < 33) return;
      lastDraw = now;

      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      const an = analyser;
      if (!live || !an) {
        synthFreq(freq, now / 1000);
        for (let i = 0; i < wave.length; i++) {
          wave[i] = 128 + Math.sin(now / 180 + i * 0.08) * 22 * (playing ? 1 : 0.25);
        }
      } else {
        an.getByteFrequencyData(freq);
        an.getByteTimeDomainData(wave);
      }

      let flux = 0;
      for (let i = 1; i < 16; i++) {
        const v = freq[i] / 255;
        if (v - prevBand[i] > 0) flux += v - prevBand[i];
        prevBand[i] = prevBand[i] * 0.5 + v * 0.5;
      }
      avgFlux = avgFlux * 0.88 + flux * 0.12;
      if (!demo && playing && live && flux > Math.max(0.16, avgFlux * 1.4) && now - lastBeatAt > 200) {
        lastBeatAt = now;
        beatBoost = 1;
        (window as any).__kainetBeat?.beatNow();
      }
      beatBoost = Math.max(0, beatBoost - 0.06);
      const boost = 1 + beatBoost * 0.45;

      const N = variant === "ring" ? 20 : 16;
      const bw = w / N;
      const barW = Math.max(3, bw * 0.42);
      const maxH = h * (variant === "ring" ? 0.62 : 0.78);
      for (let i = 0; i < N; i++) {
        const idx = 1 + Math.floor((i / N) * 48);
        const v = freq[idx] / 255;
        const bh = Math.max(3, v * maxH * boost);
        const x = i * bw + (bw - barW) / 2;
        const y = h - bh;
        ctx.fillStyle = `rgba(255,255,255,${0.35 + v * 0.55})`;
        ctx.beginPath();
        ctx.roundRect(x, y, barW, bh, barW / 2);
        ctx.fill();
      }

      if (variant === "ring") {
        ctx.beginPath();
        ctx.lineWidth = Math.max(1.5, h * 0.03);
        ctx.strokeStyle = "rgba(255,255,255,0.75)";
        const mid = h * 0.32;
        for (let x = 0; x < w; x += 2) {
          const s = (wave[Math.floor((x / w) * wave.length)] - 128) / 128;
          const y = mid + s * h * 0.18 * boost;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
    };
    raf = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [analyser, variant, playing, demo, live]);

  return <canvas ref={canvasRef} className={className} aria-hidden />;
}
