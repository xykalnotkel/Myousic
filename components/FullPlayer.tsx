"use client";

import { useEffect, useState } from "react";
import { usePlayer } from "./PlayerProvider";
import Visualizer from "./Visualizer";
import LyricsPanel from "./Lyrics";
import FxPanel from "./FxPanel";
import { Cover, Icon, I } from "./ui";
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
    const prevOv = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOv;
      document.documentElement.style.overflow = "";
    };
  }, [onClose]);

  const art = bestThumb(current?.thumbnails);
  const pct = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div
      className="fixed inset-0 z-50 bg-[#050505] flex flex-col overflow-hidden"
      style={{
        width: "100%",
        maxWidth: "100vw",
        height: "100dvh",
        touchAction: "pan-y",
        overscrollBehavior: "none",
      }}
    >
      {art && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            backgroundImage: `url(${art})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            filter: "blur(40px) brightness(0.35)",
            transform: "scale(1.2)",
          }}
        />
      )}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/50 via-[#050505]/80 to-[#050505]" />

      <header className="relative z-10 shrink-0 flex items-center gap-3 px-3 pt-3 pb-2">
        <button
          onClick={onClose}
          className="w-10 h-10 shrink-0 rounded-full bg-white/10 flex items-center justify-center"
          title="Tutup"
        >
          <Icon d={I.arrowDown} size={22} />
        </button>
        <Cover src={art} title={current?.title} size={48} rounded="rounded-lg" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold truncate">{current?.title ?? "—"}</p>
          <p className="text-xs text-mut truncate">{current?.artist ?? current?.album ?? "—"}</p>
        </div>
      </header>

      <div className="relative z-10 shrink-0 px-4">
        <div className="h-14 w-full">
          <Visualizer />
        </div>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-[11px] tabular-nums text-mut w-9 text-right shrink-0">{fmtDur(currentTime)}</span>
          <input
            type="range"
            min={0}
            max={duration || 0}
            step={0.1}
            value={Math.min(currentTime, duration || 0)}
            onChange={(e) => seek(Number(e.target.value))}
            className="knob flex-1 min-w-0"
            style={{ ["--fill" as any]: `${pct}%` }}
          />
          <span className="text-[11px] tabular-nums text-mut w-9 shrink-0">{fmtDur(duration)}</span>
        </div>
        <div className="flex items-center justify-between mt-2 px-2">
          <button onClick={toggleShuffle} className={shuffle ? "text-white" : "text-mut"} title="Acak">
            <Icon d={I.shuffle} size={18} />
          </button>
          <button onClick={prev} className="text-white" title="Sebelumnya">
            <Icon d={I.prev} size={28} />
          </button>
          <button
            onClick={toggle}
            className="w-14 h-14 rounded-full bg-white text-black flex items-center justify-center active:scale-95"
          >
            {playing ? <Icon d={I.pause} size={26} /> : <Icon d={I.play} size={26} className="ml-0.5" />}
          </button>
          <button onClick={() => next()} className="text-white" title="Berikutnya">
            <Icon d={I.next} size={28} />
          </button>
          <button onClick={cycleRepeat} className={repeat !== "off" ? "text-white" : "text-mut"} title="Ulangi">
            <Icon d={repeat === "one" ? I.repeatOne : I.repeat} size={18} />
          </button>
        </div>
        <div className="flex gap-1 bg-white/[0.06] rounded-full p-1 mt-3 mb-1">
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
              className={`flex-1 py-1.5 rounded-full text-xs font-semibold ${
                tab === t.id ? "bg-white text-black" : "text-mut"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="relative z-10 flex-1 min-h-0 overflow-hidden">
        {tab === "lyr" && <LyricsPanel />}
        {tab === "fx" && (
          <div className="h-full overflow-y-auto px-4 py-3">
            <FxPanel />
          </div>
        )}
        {tab === "queue" && (
          <div className="h-full overflow-y-auto px-3 py-2">
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
  );
}
