"use client";

// Satu gelombang waktu nyata dari analyser. Tanpa analyser = garis datar, bukan palsu.
import { useEffect, useRef } from "react";
import { usePlayer } from "./PlayerProvider";

export default function Visualizer({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { analyser, playing, engine } = usePlayer();
  const live = !!analyser && engine === "audio";

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    let raf = 0;
    let lastDraw = 0;
    let lastBeatAt = 0;
    let avgRms = 0.04;
    const wave = new Uint8Array(1024);
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
      if (now - lastDraw < 32) return;
      lastDraw = now;

      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      const an = analyser;
      if (live && an) {
        if (wave.length !== an.fftSize) {
          // analyser fftSize 1024
        }
        an.getByteTimeDomainData(wave);
      } else {
        wave.fill(128);
      }

      let sum = 0;
      for (let i = 0; i < wave.length; i++) {
        const v = (wave[i] - 128) / 128;
        sum += v * v;
      }
      const rms = Math.sqrt(sum / wave.length);
      avgRms = avgRms * 0.88 + rms * 0.12;
      if (live && playing && rms > Math.max(0.08, avgRms * 1.55) && now - lastBeatAt > 220) {
        lastBeatAt = now;
        (window as any).__kainetBeat?.beatNow();
      }

      const mid = h * 0.5;
      const amp = h * 0.42;
      ctx.lineWidth = Math.max(1.6, h * 0.055);
      ctx.strokeStyle = live && playing ? "rgba(255,255,255,0.92)" : "rgba(255,255,255,0.28)";
      ctx.lineJoin = "round";
      ctx.lineCap = "round";
      ctx.beginPath();
      const step = Math.max(1, Math.floor(wave.length / Math.max(64, w)));
      let x = 0;
      for (let i = 0; i < wave.length; i += step) {
        const s = (wave[i] - 128) / 128;
        const y = mid + s * amp;
        if (i === 0) ctx.moveTo(0, y);
        else ctx.lineTo(x, y);
        x = (i / (wave.length - 1)) * w;
      }
      ctx.lineTo(w, mid);
      ctx.stroke();
    };

    raf = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [analyser, playing, live]);

  return <canvas ref={canvasRef} className={className} aria-hidden />;
}
