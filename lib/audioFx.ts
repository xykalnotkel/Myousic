// Impulse response sintetis untuk reverb + tipe parameter mesin suara.

export interface AudioFx {
  /** 0–1 campuran ruang */
  reverb: number;
  /** 0–1 kehalusan (kompresor + smoothing analyser) */
  smooth: number;
  /** -1…1 low-shelf bass */
  bass: number;
}

export const DEFAULT_FX: AudioFx = { reverb: 0.18, smooth: 0.45, bass: 0 };

export function loadFx(): AudioFx {
  try {
    const raw = localStorage.getItem("ms:fx");
    if (!raw) return { ...DEFAULT_FX };
    const j = JSON.parse(raw);
    return {
      reverb: clamp01(j.reverb ?? DEFAULT_FX.reverb),
      smooth: clamp01(j.smooth ?? DEFAULT_FX.smooth),
      bass: Math.max(-1, Math.min(1, Number(j.bass ?? 0))),
    };
  } catch {
    return { ...DEFAULT_FX };
  }
}

export function saveFx(fx: AudioFx) {
  try {
    localStorage.setItem("ms:fx", JSON.stringify(fx));
  } catch {}
}

function clamp01(n: number) {
  return Math.max(0, Math.min(1, Number(n) || 0));
}

/** IR pendek (ruang studio) — tanpa file eksternal. */
export function makeImpulse(ctx: AudioContext, seconds = 1.8, decay = 2.4): AudioBuffer {
  const rate = ctx.sampleRate;
  const len = Math.max(1, Math.floor(rate * seconds));
  const buf = ctx.createBuffer(2, len, rate);
  for (let c = 0; c < 2; c++) {
    const data = buf.getChannelData(c);
    for (let i = 0; i < len; i++) {
      const t = i / len;
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - t, decay);
    }
  }
  return buf;
}
