"use client";

// Satu gelombang dari analyser (waktu nyata). Canvas selalu isi parent.
import { useEffect, useRef } from "react";
import { usePlayer } from "./PlayerProvider";

export default function Visualizer({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { analyser, playing, engine } = usePlayer();
  const anRef = useRef(analyser);
  const playRef = useRef(playing);
  anRef.current = analyser;
  playRef.current = playing && engine === "audio";

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true, desynchronized: true });
    if (!ctx) return;

    let raf = 0;
    let lastBeatAt = 0;
    let avgRms = 0.04;
    let wave = new Uint8Array(1024);
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const resize = () => {
      const r = canvas.getBoundingClientRect();
      const w = Math.max(2, Math.floor(r.width * dpr));
      const h = Math.max(2, Math.floor(r.height * dpr));
      if (canvas.width !== w) canvas.width = w;
      if (canvas.height !== h) canvas.height = h;
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const draw = () => {
      raf = requestAnimationFrame(draw);
      if (document.hidden) return;
      resize();

      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      const an = anRef.current || (window as any).__kainetAnalyser;
      let live = false;
      if (an && typeof an.getByteTimeDomainData === "function") {
        const n = an.fftSize || 1024;
        if (wave.length !== n) wave = new Uint8Array(n);
        try {
          an.getByteTimeDomainData(wave);
          live = true;
        } catch {
          live = false;
        }
      }
      if (!live) {
        if (wave.length !== 256) wave = new Uint8Array(256);
        wave.fill(128);
      }

      let sum = 0;
      for (let i = 0; i < wave.length; i++) {
        const v = (wave[i] - 128) / 128;
        sum += v * v;
      }
      const rms = Math.sqrt(sum / wave.length);
      avgRms = avgRms * 0.9 + rms * 0.1;
      const now = performance.now();
      if (live && playRef.current && rms > Math.max(0.07, avgRms * 1.5) && now - lastBeatAt > 200) {
        lastBeatAt = now;
        (window as any).__kainetBeat?.beatNow();
      }

      const mid = h * 0.5;
      const amp = h * 0.44;
      ctx.lineWidth = Math.max(2, h * 0.06);
      ctx.strokeStyle = live && playRef.current ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.28)";
      ctx.lineJoin = "round";
      ctx.lineCap = "round";
      ctx.beginPath();
      const n = wave.length;
      for (let i = 0; i < n; i++) {
        const x = (i / (n - 1)) * w;
        const s = (wave[i] - 128) / 128;
        const y = mid + s * amp;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    };

    raf = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      aria-hidden
      style={{ display: "block", width: "100%", height: "100%" }}
    />
  );
}
