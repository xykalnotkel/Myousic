// Visualizer: bar frekuensi (bar) + ular morphing (snake), reaktif terhadap beat
"use client";

import { useEffect, useRef } from "react";
import { usePlayer } from "./PlayerProvider";

interface Props {
  variant?: "bar" | "snake";
  className?: string;
  /** true = pakai spektrum sintetis (untuk dekorasi tanpa audio) */
  demo?: boolean;
}

// spektrum sintetis agar ular tetap hidup walau tidak ada audio
function synthFreq(out: Uint8Array, t: number) {
  for (let i = 0; i < out.length; i++) {
    out[i] = Math.max(
      0,
      Math.min(
        255,
        46 +
          92 * Math.abs(Math.sin(i * 0.055 + t * 1.9)) * (0.5 + 0.5 * Math.sin(t * 0.23)) +
          32 * Math.abs(Math.sin(i * 0.017 - t * 3.1))
      )
    );
  }
}

// ---------------- ular morphing ----------------
function drawSnake(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  freq: Uint8Array,
  t: number,
  playing: boolean,
  boost: number
) {
  const N = 150;
  const cy = h / 2;

  // energi bass → besar goyangan & kecepatan morph
  let bass = 0;
  for (let i = 1; i < 12; i++) bass += freq[i];
  bass = bass / (11 * 255);

  const energy = playing ? 1 : 0.45;
  // pose morphing: 0..1, berubah pelan-terus (ulat berganti wujud)
  const pose = 0.5 + 0.5 * Math.sin(t * 0.24 + Math.sin(t * 0.08) * 2.4);

  const amp =
    Math.min(h * 0.26, w * 0.09) * (0.5 + bass * 1.25) * (0.75 + 0.25 * energy) * boost + 5;
  const k = 2 + pose * 1.8; // jumlah gelombang berubah → morph
  const ph = t * (1.4 + bass * 1.7);

  // titik sumbu badan
  const pts: { x: number; y: number }[] = [];
  for (let i = 0; i <= N; i++) {
    const u = i / N;
    const f = freq[Math.min(360, Math.floor(Math.pow(u, 1.35) * 360) + 1)] / 255;
    const x = u * w + Math.sin(u * Math.PI * 2 + t * 0.5) * w * 0.02 * energy;
    const y =
      cy +
      Math.sin(u * Math.PI * 2 * k + ph) * amp * (0.72 + f * 0.55) +
      Math.sin(u * Math.PI * 6 + t * 1.9) * amp * 0.14 +
      Math.cos(u * Math.PI * 2 + t * 0.7) * amp * 0.1 * pose;
    pts.push({ x, y });
  }

  // ketebalan badan tiap titik (morphing thickness)
  const baseR = Math.max(3, Math.min(w, h) * 0.028);
  const radii = pts.map((_, i) => {
    const u = i / N;
    const f = freq[Math.min(360, Math.floor(Math.pow(u, 1.1) * 360) + 1)] / 255;
    const r =
      baseR *
      (0.55 + f * 1.3) *
      (0.8 + 0.2 * Math.sin(u * 9 + t * 4)) *
      (0.6 + 0.4 * energy) *
      boost;
    return Math.max(1.6, r);
  });

  // normal → tepi kiri & kanan (ribbon)
  const left: { x: number; y: number }[] = [];
  const right: { x: number; y: number }[] = [];
  const normals: { nx: number; ny: number }[] = [];
  for (let i = 0; i <= N; i++) {
    const p1 = pts[Math.min(N, i + 1)];
    const p0 = pts[Math.max(0, i - 1)];
    let nx = -(p1.y - p0.y);
    let ny = p1.x - p0.x;
    const l = Math.hypot(nx, ny) || 1;
    nx /= l;
    ny /= l;
    normals.push({ nx, ny });
    left.push({ x: pts[i].x - nx * radii[i], y: pts[i].y - ny * radii[i] });
    right.push({ x: pts[i].x + nx * radii[i], y: pts[i].y + ny * radii[i] });
  }

  const bodyPath = () => {
    ctx.beginPath();
    ctx.moveTo(left[0].x, left[0].y);
    for (let i = 1; i <= N; i++) ctx.lineTo(left[i].x, left[i].y);
    for (let i = N; i >= 0; i--) ctx.lineTo(right[i].x, right[i].y);
    ctx.closePath();
  };

  // lapisan glow (tanpa shadowBlur agar ringan)
  ctx.globalAlpha = 0.1 * (0.6 + boost * 0.8);
  ctx.fillStyle = "#fff";
  bodyPath();
  ctx.fill();

  // badan utama
  const grad = ctx.createLinearGradient(0, cy - amp * 1.5, 0, cy + amp * 1.5);
  grad.addColorStop(0, "rgba(255,255,255,0.92)");
  grad.addColorStop(0.5, "rgba(255,255,255,0.55)");
  grad.addColorStop(1, "rgba(255,255,255,0.92)");
  ctx.globalAlpha = 1;
  ctx.fillStyle = grad;
  bodyPath();
  ctx.fill();

  // garis punggung (spine highlight)
  ctx.globalAlpha = 0.45 + boost * 0.4;
  ctx.strokeStyle = "#fff";
  ctx.lineWidth = Math.max(1, baseR * 0.32);
  ctx.beginPath();
  pts.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
  ctx.stroke();

  // sisik: goresan kecil tegak lurus badan, ikut frekuensi
  ctx.globalAlpha = 0.2 + boost * 0.15;
  ctx.strokeStyle = "#fff";
  ctx.lineWidth = 1.3;
  for (let i = 6; i <= N - 6; i += 7) {
    const u = i / N;
    const f = freq[Math.min(360, Math.floor(Math.pow(u, 1.1) * 360) + 1)] / 255;
    const s = radii[i] * (0.7 + f);
    const { nx, ny } = normals[i];
    ctx.beginPath();
    ctx.moveTo(pts[i].x - nx * s, pts[i].y - ny * s);
    ctx.lineTo(pts[i].x + nx * s * 0.55, pts[i].y + ny * s * 0.55);
    ctx.stroke();
  }

  // ---------- kepala ----------
  const head = pts[N];
  const hdx = head.x - pts[N - 1].x;
  const hdy = head.y - pts[N - 1].y;
  const hl = Math.hypot(hdx, hdy) || 1;
  const hx = hdx / hl;
  const hy = hdy / hl;
  const hr = radii[N] * 1.4 * (1 + boost * 0.2);

  // aura kepala saat beat
  if (boost > 0.3) {
    ctx.globalAlpha = 0.25 * boost;
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(head.x, head.y, hr * (1.7 + boost), 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.arc(head.x, head.y, hr, 0, Math.PI * 2);
  ctx.fill();

  // mata (membesar saat beat)
  const eyeOff = hr * 0.42;
  const eyeR = hr * (0.3 + boost * 0.28);
  for (const s of [1, -1]) {
    const ex = head.x - hx * hr * 0.22 - hy * s * eyeOff;
    const ey = head.y - hy * hr * 0.22 + hx * s * eyeOff;
    ctx.fillStyle = "#050505";
    ctx.beginPath();
    ctx.arc(ex, ey, Math.max(1.2, eyeR), 0, Math.PI * 2);
    ctx.fill();
  }

  // lidah (julur saat beat)
  const flick = Math.sin(t * 6.2) > 0.55 ? 1 : 0;
  const tl = hr * (0.7 + 1.9 * flick * boost);
  ctx.strokeStyle = "rgba(255,255,255,0.85)";
  ctx.lineWidth = 1.5;
  const bx = head.x + hx * hr * 0.85;
  const by = head.y + hy * hr * 0.85;
  const tipX = head.x + hx * (hr * 0.85 + tl);
  const tipY = head.y + hy * (hr * 0.85 + tl);
  ctx.beginPath();
  ctx.moveTo(bx, by);
  ctx.lineTo(tipX, tipY);
  ctx.stroke();
  // lidah bercabang
  ctx.beginPath();
  ctx.moveTo(tipX, tipY);
  ctx.lineTo(tipX - hy * tl * 0.38, tipY + hx * tl * 0.38);
  ctx.moveTo(tipX, tipY);
  ctx.lineTo(tipX + hy * tl * 0.38, tipY - hx * tl * 0.38);
  ctx.stroke();

  ctx.globalAlpha = 1;
}

export default function Visualizer({ variant = "bar", className, demo = false }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { analyser, playing, engine } = usePlayer();
  const live = !demo && !!analyser && engine === "audio";

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let beatBoost = 0;
    let prevBass = 0;
    let lastBeatAt = 0;

    const freq = new Uint8Array(1024);
    const wave = new Uint8Array(1024);
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const resize = () => {
      const r = canvas.getBoundingClientRect();
      canvas.width = Math.max(1, Math.floor(r.width * dpr));
      canvas.height = Math.max(1, Math.floor(r.height * dpr));
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const draw = () => {
      raf = requestAnimationFrame(draw);
      const w = canvas.width;
      const h = canvas.height;
      const t = performance.now() / 1000;
      ctx.clearRect(0, 0, w, h);

      const an = analyser;
      if (!live || !an) {
        synthFreq(freq, t);
        for (let i = 0; i < wave.length; i++) {
          wave[i] = 128 + Math.sin(t * 8 + i * 0.04) * 28 * (playing ? 1 : 0.35);
        }
      } else {
        an.getByteFrequencyData(freq);
        an.getByteTimeDomainData(wave);
      }

      // deteksi beat dari energi bass (lebih peka kalau analyser hidup)
      let bass = 0;
      for (let i = 1; i < 14; i++) bass += freq[i];
      bass = bass / (13 * 255);
      const env = Math.max(bass, prevBass * 0.86);
      const now = performance.now();
      const thresh = live ? 0.42 : 0.55;
      if (!demo && an && playing && bass > thresh && bass > env * 1.02 && now - lastBeatAt > 220) {
        lastBeatAt = now;
        beatBoost = 1;
        (window as any).__kainetBeat?.beatNow();
      }
      prevBass = env;
      beatBoost = Math.max(0, beatBoost - 0.035);
      const boost = 1 + beatBoost * 0.55;

      if (variant === "snake") {
        drawSnake(ctx, w, h, freq, t, playing && !demo, boost);
        return;
      }

      // ---- BAR + gelombang waktu (nyata kalau stream/analyser hidup) ----
      const N = 72;
      const bw = w / N;
      const barW = Math.max(1, bw * 0.58);
      const maxH = h * 0.7;
      for (let i = 0; i < N; i++) {
        const idx = Math.floor(Math.pow(i / N, 1.55) * 380) + 1;
        const v = freq[idx] / 255;
        const bh = Math.max(2, v * maxH * boost * (1 + Math.sin(i * 0.9) * 0.1));
        const x = i * bw + (bw - barW) / 2;
        const y = h - bh;
        const grad = ctx.createLinearGradient(0, y, 0, h);
        grad.addColorStop(0, "rgba(255,255,255,0.95)");
        grad.addColorStop(1, "rgba(255,255,255,0.12)");
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.roundRect(x, y, barW, bh, barW / 2);
        ctx.fill();
      }

      ctx.beginPath();
      ctx.lineWidth = Math.max(1.4, h * 0.04);
      ctx.strokeStyle = "rgba(255,255,255,0.88)";
      const mid = h * 0.36;
      const amp = h * 0.26 * boost;
      for (let x = 0; x < w; x++) {
        const wi = Math.floor((x / w) * wave.length);
        const s = (wave[wi] - 128) / 128;
        const y = mid + s * amp;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    };
    draw();

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [analyser, variant, playing, demo, live]);

  return <canvas ref={canvasRef} className={className} aria-hidden />;
}
