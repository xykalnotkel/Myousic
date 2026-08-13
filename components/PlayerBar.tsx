"use client";

import { useEffect, useRef, useState } from "react";
import { usePlayer } from "./PlayerProvider";
import Visualizer from "./Visualizer";
import FullPlayer from "./FullPlayer";
import MobileNav from "./MobileNav";
import { Cover, Icon, I } from "./ui";
import SoundSheet from "./SoundSheet";
import { bestThumb, fmtDur } from "@/lib/types";

export default function PlayerBar() {
  const {
    current,
    playing,
    loading,
    error,
    toggle,
    next,
    prev,
    volume,
    setVolume,
    muted,
    toggleMute,
    shuffle,
    toggleShuffle,
    repeat,
    cycleRepeat,
    queue,
    index,
    fullOpen,
    closeFull,
    openFull,
    currentTime,
    duration,
    seek,
  } = usePlayer();
  const [soundOpen, setSoundOpen] = useState(false);
  const artRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onBeat = () => {
      const el = artRef.current;
      if (!el) return;
      el.classList.remove("beat-pulse");
      void el.offsetWidth;
      el.classList.add("beat-pulse");
    };
    window.addEventListener("kainet:beat", onBeat);
    return () => window.removeEventListener("kainet:beat", onBeat);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (e.code === "Space") {
        e.preventDefault();
        toggle();
      } else if (e.code === "KeyM") toggleMute();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [toggle, toggleMute]);

  const art = bestThumb(current?.thumbnails);
  const hasTrack = !!current?.id;
  const pct = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <>
      {!fullOpen && (
        <div className="fixed bottom-0 left-0 right-0 z-40 md:bottom-4 md:px-4 pointer-events-none">
          <div className="pointer-events-auto mx-auto max-w-[1500px] bg-black/95 md:rounded-2xl md:ring-1 md:ring-white/10 overflow-hidden">
            {error && (
              <div className="px-3 py-1.5 text-[11px] text-white/80 flex items-center justify-between bg-white/5">
                <span className="truncate pr-2">{error}</span>
                <button onClick={() => next()} className="underline shrink-0">
                  Lewati
                </button>
              </div>
            )}

            <button
              type="button"
              aria-hidden
              className="block w-full h-[3px] bg-white/10"
              onClick={() => hasTrack && openFull()}
            >
              <span className="block h-full bg-white" style={{ width: `${pct}%` }} />
            </button>

            {/* mobile mini */}
            <div className="md:hidden flex items-center gap-2.5 px-3 py-2">
              <button
                onClick={() => hasTrack && openFull()}
                className="flex items-center gap-2.5 min-w-0 flex-1 text-left"
              >
                <div ref={artRef} className="shrink-0 rounded-md overflow-hidden">
                  <Cover src={art} title={current?.title} size={42} rounded="rounded-md" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-semibold truncate">{current?.title ?? "Pilih lagu"}</p>
                  <p className="text-[11px] text-mut truncate">{current?.artist || "Myousic"}</p>
                </div>
              </button>
              <button onClick={toggle} disabled={!hasTrack} className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center disabled:opacity-30">
                {loading ? (
                  <span className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                ) : playing ? (
                  <Icon d={I.pause} size={18} />
                ) : (
                  <Icon d={I.play} size={18} className="ml-0.5" />
                )}
              </button>
              <button onClick={() => next()} className="w-10 h-10 flex items-center justify-center text-white">
                <Icon d={I.next} size={22} />
              </button>
            </div>

            {/* desktop */}
            <div className="hidden md:grid grid-cols-[1fr_auto_1fr] items-center gap-4 px-4 py-2.5">
              <button
                onClick={() => hasTrack && openFull()}
                className="flex items-center gap-3 min-w-0 text-left"
              >
                <Cover src={art} title={current?.title} size={48} rounded="rounded-md" />
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate">{current?.title ?? "Tidak ada lagu"}</p>
                  <p className="text-xs text-mut truncate">{current?.artist || "Pilih lagu untuk mulai"}</p>
                </div>
              </button>
              <div className="flex flex-col items-center gap-1 w-[min(52vw,520px)]">
                <div className="flex items-center gap-5">
                  <button onClick={toggleShuffle} className={shuffle ? "text-white" : "text-mut"}>
                    <Icon d={I.shuffle} size={18} />
                  </button>
                  <button onClick={prev} className="text-mut hover:text-white">
                    <Icon d={I.prev} size={22} />
                  </button>
                  <button
                    onClick={toggle}
                    disabled={!hasTrack}
                    className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center disabled:opacity-30"
                  >
                    {playing ? <Icon d={I.pause} size={20} /> : <Icon d={I.play} size={20} className="ml-0.5" />}
                  </button>
                  <button onClick={() => next()} className="text-mut hover:text-white">
                    <Icon d={I.next} size={22} />
                  </button>
                  <button onClick={cycleRepeat} className={repeat !== "off" ? "text-white" : "text-mut"}>
                    <Icon d={repeat === "one" ? I.repeatOne : I.repeat} size={18} />
                  </button>
                </div>
                <div className="flex items-center gap-2 w-full">
                  <span className="text-[11px] tabular-nums text-mut w-9 text-right">{fmtDur(currentTime)}</span>
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
                  <span className="text-[11px] tabular-nums text-mut w-9">{fmtDur(duration)}</span>
                </div>
              </div>
              <div className="flex items-center justify-end gap-2">
                <div className="relative w-28 h-8 hidden lg:block">
                  <Visualizer className="absolute inset-0 w-full h-full opacity-70" />
                </div>
                <button onClick={() => setSoundOpen((v) => !v)} className={soundOpen ? "text-white" : "text-mut"}>
                  <Icon d={I.fx} size={18} />
                </button>
                <button onClick={toggleMute} className="text-mut">
                  <Icon d={muted || volume === 0 ? I.mute : I.volume} size={20} />
                </button>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  value={muted ? 0 : volume}
                  onChange={(e) => setVolume(Number(e.target.value))}
                  className="knob w-24"
                  style={{ ["--fill" as any]: `${(muted ? 0 : volume) * 100}%` }}
                />
              </div>
            </div>

            {soundOpen && <SoundSheet onClose={() => setSoundOpen(false)} />}
            <MobileNav />
          </div>
        </div>
      )}

      {fullOpen && <FullPlayer queue={queue} index={index} onClose={closeFull} />}
    </>
  );
}
