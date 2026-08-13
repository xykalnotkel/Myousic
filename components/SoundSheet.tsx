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
      <div className="flex justify-between text-[11px] mb-1">
        <span className="font-semibold">{label}</span>
        <span className="text-mut tabular-nums">{hint}</span>
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

export default function SoundSheet({ onClose }: { onClose: () => void }) {
  const { fx, setFx, engine, volume, setVolume, muted, toggleMute } = usePlayer();
  return (
    <div className="border-t border-line bg-black/95 px-4 py-3">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-extrabold tracking-tight">Atur suara</p>
        <button onClick={onClose} className="text-[11px] text-mut underline">
          Tutup
        </button>
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        <Row
          label="Volume"
          value={muted ? 0 : volume}
          min={0}
          max={1}
          step={0.01}
          onChange={setVolume}
          hint={muted ? "mute" : `${Math.round(volume * 100)}%`}
        />
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
      <div className="mt-2 flex items-center justify-between">
        <button onClick={toggleMute} className="text-[11px] text-mut underline">
          {muted ? "Nyalakan" : "Bisukan"}
        </button>
        <span className="text-[10px] text-mut">
          {engine === "audio" ? "Efek penuh aktif" : "Volume aktif · efek penuh menyala setelah stream siap"}
        </span>
      </div>
    </div>
  );
}
