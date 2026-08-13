"use client";

import { useEffect, useState } from "react";
import { usePlayer } from "./PlayerProvider";
import Visualizer from "./Visualizer";
import LyricsPanel from "./Lyrics";
import FxPanel from "./FxPanel";
import { Cover, Icon, I, Equalizer } from "./ui";
import { bestThumb, fmtDur } from "@/lib/types";
import type { Track } from "@/lib/types";

export default function FullPlayer({
  queue,
  index,
  onClose,
}: {
  queue: Track[];
  index: number;
  onClose: () => void;
}) {
  const {
    current,
    playing,
    engine,
    toggle,
    next,
    prev,
    seek,
    currentTime,
    duration,
    repeat,
    cycleRepeat,
    shuffle,
    toggleShuffle,
    playAt,
  } = usePlayer();
  const [tab, setTab] = useState<"lyr" | "queue" | "fx">("lyr");

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      document.documentElement.style.overflow = "";
    };
  }, [onClose]);

  const art = bestThumb(current?.thumbnails);
  const pct = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div
      className="fixed inset-0 z-50 bg-[#050505] overflow-x-hidden overflow-y-auto overscroll-none"
      style={{ touchAction: "pan-y", width: "100%", maxWidth: "100vw" }}
    >
      {art && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage: `url(${art})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            filter: "blur(48px) saturate(0.4) brightness(0.28)",
            transform: "scale(1.18)",
          }}
        />
      )}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/40 via-[#050505]/75 to-[#050505]" />

      <div className="relative z-10 min-h-full max-w-lg mx-auto px-5 pt-4 pb-10 flex flex-col">
        <div className="flex items-center justify-between">
          <button
            onClick={onClose}
            className="w-10 h-10 -ml-1 rounded-full bg-white/10 flex items-center justify-center"
            title="Tutup"
          >
            <Icon d={I.arrowDown} size={22} />
          </button>
          <div className="text-center">
            <p className="text-[10px] uppercase tracking-[0.32em] text-mut">Now Playing</p>
            <p className="text-[10px] text-white/40 mt-0.5">
              {engine === "audio" ? "gelombang nyata" : "YouTube"}
            </p>
          </div>
          <div className="w-10 h-10 flex items-center justify-center">
            <Equalizer size={14} active={playing} />
          </div>
        </div>

        <div className="flex flex-col items-center mt-6">
          <div className="w-[min(58vw,220px)] h-[min(58vw,220px)] rounded-3xl overflow-hidden ring-1 ring-white/10 shadow-[0_20px_80px_rgba(0,0,0,0.55)]">
            {art ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={art} alt={current?.title ?? ""} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-elev flex items-center justify-center">
                <Icon d={I.music} size={72} className="text-white/15" />
              </div>
            )}
          </div>

          <h2 className="mt-5 text-[22px] sm:text-2xl font-extrabold tracking-tight text-center leading-tight px-2">
            {current?.title ?? "—"}
          </h2>
          <p className="mt-1 text-sm text-mut text-center">{current?.artist ?? current?.album ?? "—"}</p>
        </div>

        <div className="mt-5">
          <div className="h-12 rounded-xl overflow-hidden">
            <Visualizer className="w-full h-full" />
          </div>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-[11px] tabular-nums text-mut w-9 text-right">{fmtDur(currentTime)}</span>
            <input
              type="range"
              min={0}
              max={duration || 0}
              step={0.1}
              value={Math.min(currentTime, duration || 0)}
              onChange={(e) => seek(Number(e.target.value))}
              className="knob flex-1"
              style={{ ["--fill" as any]: `${pct}%` }}
            />
            <span className="text-[11px] tabular-nums text-mut w-9">{fmtDur(duration)}</span>
          </div>
        </div>

        <div className="flex items-center justify-center gap-7 mt-5">
          <button
            onClick={toggleShuffle}
            className={shuffle ? "text-white" : "text-mut"}
            title="Acak"
          >
            <Icon d={I.shuffle} size={20} />
          </button>
          <button onClick={prev} className="text-white" title="Sebelumnya">
            <Icon d={I.prev} size={30} />
          </button>
          <button
            onClick={toggle}
            className="w-[68px] h-[68px] rounded-full bg-white text-black flex items-center justify-center active:scale-95 transition-transform"
          >
            {playing ? <Icon d={I.pause} size={30} /> : <Icon d={I.play} size={30} className="ml-1" />}
          </button>
          <button onClick={() => next()} className="text-white" title="Berikutnya">
            <Icon d={I.next} size={30} />
          </button>
          <button
            onClick={cycleRepeat}
            className={repeat !== "off" ? "text-white" : "text-mut"}
            title={`Ulangi: ${repeat}`}
          >
            <Icon d={repeat === "one" ? I.repeatOne : I.repeat} size={20} />
          </button>
        </div>

        <div className="mt-7 flex gap-1 bg-white/[0.05] rounded-full p-1">
          {(
            [
              { id: "lyr", label: "Lirik" },
              { id: "queue", label: "Antrian" },
              { id: "fx", label: "Suara" },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 py-2 rounded-full text-xs font-semibold transition-colors ${
                tab === t.id ? "bg-white text-black" : "text-mut"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="mt-2 flex-1">
          {tab === "lyr" && <LyricsPanel />}
          {tab === "fx" && (
            <div className="pt-3">
              <FxPanel />
            </div>
          )}
          {tab === "queue" && (
            <div className="pt-3 space-y-1 max-h-[46vh] overflow-y-auto">
              {queue.map((t, i) => (
                <button
                  key={`${t.id}-${i}`}
                  onClick={() => playAt(i)}
                  className={`w-full flex items-center gap-3 px-2 py-2 rounded-xl text-left ${
                    i === index ? "bg-white/10" : ""
                  }`}
                >
                  <Cover src={bestThumb(t.thumbnails)} title={t.title} size={40} />
                  <span className="min-w-0 flex-1">
                    <span className={`block truncate text-sm ${i === index ? "font-semibold" : "text-soft"}`}>
                      {t.title}
                    </span>
                    <span className="block truncate text-xs text-mut">{t.artist}</span>
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
