"use client";

import { useEffect, useState } from "react";
import { usePlayer } from "./PlayerProvider";
import Visualizer from "./Visualizer";
import LyricsPanel from "./Lyrics";
import FxPanel from "./FxPanel";
import { Icon, I } from "./ui";
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
      className="fixed inset-0 z-50 bg-[#050505] flex flex-col"
      style={{
        width: "100vw",
        maxWidth: "100%",
        height: "100%",
        overflow: "hidden",
        touchAction: "pan-y",
        overscrollBehavior: "none",
      }}
    >
      <header className="shrink-0 flex items-center gap-2 px-3 pt-3 pb-1">
        <button
          onClick={onClose}
          className="w-10 h-10 shrink-0 rounded-full bg-white/10 flex items-center justify-center"
        >
          <Icon d={I.arrowDown} size={22} />
        </button>
        <p className="flex-1 text-center text-[10px] uppercase tracking-[0.3em] text-mut">Now Playing</p>
        <span className="w-10" />
      </header>

      <div className="shrink-0 flex flex-col items-center px-4 pt-1">
        <div
          className="rounded-2xl overflow-hidden bg-[#111] ring-1 ring-white/10"
          style={{
            width: "min(46vw, 176px)",
            height: "min(46vw, 176px)",
            minWidth: 120,
            minHeight: 120,
          }}
        >
          {art ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={art}
              alt={current?.title ?? ""}
              className="cover-img"
              style={{ width: "100%", height: "100%", objectFit: "cover", maxWidth: "none", display: "block" }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-white/20">
              <Icon d={I.music} size={56} />
            </div>
          )}
        </div>
        <h2 className="mt-3 text-base font-extrabold text-center truncate max-w-full px-2">
          {current?.title ?? "—"}
        </h2>
        <p className="text-xs text-mut text-center truncate max-w-full px-2">
          {current?.artist ?? current?.album ?? "—"}
        </p>
      </div>

      <div className="shrink-0 px-4 mt-2">
        <div style={{ height: 48, width: "100%" }}>
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
        <div className="flex items-center justify-between mt-2 px-1">
          <button onClick={toggleShuffle} className={shuffle ? "text-white" : "text-mut"}>
            <Icon d={I.shuffle} size={18} />
          </button>
          <button onClick={prev} className="text-white">
            <Icon d={I.prev} size={28} />
          </button>
          <button
            onClick={toggle}
            className="w-14 h-14 rounded-full bg-white text-black flex items-center justify-center"
          >
            {playing ? <Icon d={I.pause} size={26} /> : <Icon d={I.play} size={26} className="ml-0.5" />}
          </button>
          <button onClick={() => next()} className="text-white">
            <Icon d={I.next} size={28} />
          </button>
          <button onClick={cycleRepeat} className={repeat !== "off" ? "text-white" : "text-mut"}>
            <Icon d={repeat === "one" ? I.repeatOne : I.repeat} size={18} />
          </button>
        </div>
        <div className="flex gap-1 bg-white/[0.06] rounded-full p-1 mt-3">
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

      <div className="flex-1 min-h-0 overflow-hidden mt-1">
        {tab === "lyr" && <LyricsPanel />}
        {tab === "fx" && (
          <div className="h-full overflow-y-auto px-4 py-3">
            <FxPanel />
          </div>
        )}
        {tab === "queue" && (
          <div className="h-full overflow-y-auto px-3 py-2">
            {queue.map((t, i) => {
              const thumb = bestThumb(t.thumbnails);
              return (
                <button
                  key={`${t.id}-${i}`}
                  onClick={() => playAt(i)}
                  className={`w-full flex items-center gap-3 px-2 py-2 rounded-xl text-left ${
                    i === index ? "bg-white/10" : ""
                  }`}
                >
                  <div
                    className="rounded-md overflow-hidden bg-[#111] shrink-0"
                    style={{ width: 40, height: 40, minWidth: 40, minHeight: 40 }}
                  >
                    {thumb ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={thumb}
                        alt=""
                        className="cover-img"
                        style={{ width: "100%", height: "100%", objectFit: "cover", maxWidth: "none", display: "block" }}
                      />
                    ) : null}
                  </div>
                  <span className="min-w-0 flex-1">
                    <span className={`block truncate text-sm ${i === index ? "font-semibold" : "text-soft"}`}>
                      {t.title}
                    </span>
                    <span className="block truncate text-xs text-mut">{t.artist}</span>
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
