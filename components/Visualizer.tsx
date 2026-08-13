"use client";

// Visualizer cincin + bar — ikut frekuensi & beat. Ringan (pause saat tab hidden).
import { useEffect, useRef } from "react";
import { usePlayer } from "./PlayerProvider";

interface Props {
  variant?: "bar" | "ring";
  className?: string;
  demo?: boolean;
}

function synthFreq(out: Uint8Array, t: number) {
  for (let i = 0; i < out.length; i++) {
    out[i] = Math.max(
      0,
      Math.min(
        255,
        40 +
          100 * Math.abs(Math.sin(i * 0.06 + t * 2.1)) * (0.45 + 0.55 * Math.sin(t * 0.28)) +
          36 * Math.abs(Math.sin(i * 0.02 - t * 3.4))
      )
    );
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
    let avgFlux = 0.12;
    const prevBand = new Float32Array(28);

    const freq = new Uint8Array(512);
    const wave = new Uint8Array(512);
    const mobile = typeof window !== "undefined" && window.innerWidth < 768;
    const dpr = Math.min(window.devicePixelRatio || 1, mobile ? 1.25 : 1.75);

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
      // throttle ~36fps cukup, hemat CPU
      if (now - lastDraw < 28) return;
      lastDraw = now;

      const w = canvas.width;
      const h = canvas.height;
      const t = now / 1000;
      ctx.clearRect(0, 0, w, h);

      const an = analyser;
      if (!live || !an) {
        synthFreq(freq, t);
        for (let i = 0; i < wave.length; i++) {
          wave[i] = 128 + Math.sin(t * 9 + i * 0.05) * 30 * (playing ? 1 : 0.3);
        }
      } else {
        an.getByteFrequencyData(freq);
        an.getByteTimeDomainData(wave);
      }

      let flux = 0;
      for (let i = 1; i < 28; i++) {
        const v = freq[i] / 255;
        const d = v - prevBand[i];
        if (d > 0) flux += d;
        prevBand[i] = prevBand[i] * 0.55 + v * 0.45;
      }
      avgFlux = avgFlux * 0.9 + flux * 0.1;
      const thresh = live ? Math.max(0.14, avgFlux * 1.38) : 0.55;
      if (!demo && playing && flux > thresh && now - lastBeatAt > 170) {
        lastBeatAt = now;
        beatBoost = 1;
        (window as any).__kainetBeat?.beatNow();
      }
      beatBoost = Math.max(0, beatBoost - 0.055);
      const boost = 1 + beatBoost * 0.95;

      if (variant === "ring") {
        const cx = w / 2;
        const cy = h / 2;
        const R = Math.min(w, h) * (0.22 + beatBoost * 0.04);
        const N = mobile ? 48 : 64;
        ctx.save();
        ctx.translate(cx, cy);
        for (let i = 0; i < N; i++) {
          const idx = 2 + Math.floor(Math.pow(i / N, 1.15) * 180);
          const v = freq[idx] / 255;
          const len = (8 + v * Math.min(w, h) * 0.28) * boost;
          const a = (i / N) * Math.PI * 2 - Math.PI / 2;
          const x0 = Math.cos(a) * R;
          const y0 = Math.sin(a) * R;
          const x1 = Math.cos(a) * (R + len);
          const y1 = Math.sin(a) * (R + len);
          ctx.strokeStyle = `rgba(255,255,255,${0.35 + v * 0.65})`;
          ctx.lineWidth = Math.max(2, (Math.min(w, h) / N) * 1.6);
          ctx.lineCap = "round";
          ctx.beginPath();
          ctx.moveTo(x0, y0);
          ctx.lineTo(x1, y1);
          ctx.stroke();
        }
        ctx.beginPath();
        ctx.arc(0, 0, R * 0.55 * boost, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${0.08 + beatBoost * 0.2})`;
        ctx.fill();
        ctx.beginPath();
        ctx.arc(0, 0, 4 + beatBoost * 6, 0, Math.PI * 2);
        ctx.fillStyle = "#fff";
        ctx.fill();
        ctx.restore();
        return;
      }

      const N = mobile ? 40 : 56;
      const bw = w / N;
      const barW = Math.max(1, bw * 0.55);
      const maxH = h * 0.72;
      for (let i = 0; i < N; i++) {
        const idx = Math.floor(Math.pow(i / N, 1.45) * 200) + 1;
        const v = freq[idx] / 255;
        const bh = Math.max(2, v * maxH * boost);
        const x = i * bw + (bw - barW) / 2;
        const y = h - bh;
        ctx.fillStyle = `rgba(255,255,255,${0.25 + v * 0.75})`;
        ctx.beginPath();
        ctx.roundRect(x, y, barW, bh, barW / 2);
        ctx.fill();
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
