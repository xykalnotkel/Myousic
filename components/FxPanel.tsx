"use client";

import { usePlayer } from "./PlayerProvider";

function Row({
  label,
  value,
  min,
  max,
  step,
  onChange,
  hint,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (n: number) => void;
  hint?: string;
}) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <label className="block">
      <div className="flex justify-between text-xs mb-1.5">
        <span className="font-semibold">{label}</span>
        <span className="text-mut tabular-nums">{hint ?? value.toFixed(2)}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="knob w-full"
        style={{ ["--fill" as any]: `${pct}%` }}
      />
    </label>
  );
}

export default function FxPanel() {
  const { fx, setFx, engine } = usePlayer();
  return (
    <div className="rounded-xl bg-white/[0.03] ring-1 ring-line p-4 space-y-5">
      <div>
        <h3 className="text-sm font-extrabold tracking-tight">Mesin suara</h3>
        <p className="text-[11px] text-mut mt-0.5">
          {engine === "audio"
            ? "Stream aktif — reverb & bass langsung ke audio."
            : "Sedang pakai YouTube. Efek menyala otomatis begitu stream siap."}
        </p>
      </div>
      <Row
        label="Kehalusan"
        value={fx.smooth}
        min={0}
        max={1}
        step={0.01}
        onChange={(smooth) => setFx({ smooth })}
        hint={`${Math.round(fx.smooth * 100)}%`}
      />
      <Row
        label="Reverb"
        value={fx.reverb}
        min={0}
        max={1}
        step={0.01}
        onChange={(reverb) => setFx({ reverb })}
        hint={`${Math.round(fx.reverb * 100)}%`}
      />
      <Row
        label="Bass"
        value={fx.bass}
        min={-1}
        max={1}
        step={0.01}
        onChange={(bass) => setFx({ bass })}
        hint={fx.bass === 0 ? "netral" : `${fx.bass > 0 ? "+" : ""}${Math.round(fx.bass * 12)} dB`}
      />
    </div>
  );
}
