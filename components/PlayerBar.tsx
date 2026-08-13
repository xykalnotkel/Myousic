"use client";

import { useEffect, useRef, useState } from "react";
import { usePlayer } from "./PlayerProvider";
import Visualizer from "./Visualizer";
import FullPlayer from "./FullPlayer";
import { Cover, Icon, I, Equalizer } from "./ui";
import { bestThumb, fmtDur } from "@/lib/types";

function TimeBar() {
  const { currentTime, duration, seek } = usePlayer();
  const pct = duration > 0 ? (currentTime / duration) * 100 : 0;
  return (
    <div className="flex items-center gap-2 w-full">
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
        aria-label="Posisi lagu"
      />
      <span className="text-[11px] tabular-nums text-mut w-9 shrink-0">{fmtDur(duration)}</span>
    </div>
  );
}

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
  } = usePlayer();
  const artRef = useRef<HTMLDivElement>(null);

  // beat → pulse pada cover (jangan remount — itu bikin gambar/ikon hilang)
  useEffect(() => {
    const onBeat = () => {
      const el = artRef.current;
      if (el) {
        el.classList.remove("beat-pulse");
        void el.offsetWidth;
        el.classList.add("beat-pulse");
      }
    };
    window.addEventListener("kainet:beat", onBeat);
    return () => window.removeEventListener("kainet:beat", onBeat);
  }, []);

  // keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (e.code === "Space") {
        e.preventDefault();
        toggle();
      } else if (e.code === "ArrowRight" && !e.shiftKey) {
        const a = (window as any).__kainetAudio;
        if (a && isFinite(a.duration)) a.currentTime = Math.min(a.duration, a.currentTime + 5);
      } else if (e.code === "ArrowLeft") {
        const a = (window as any).__kainetAudio;
        if (a && isFinite(a.duration)) a.currentTime = Math.max(0, a.currentTime - 5);
      } else if (e.code === "ArrowUp") {
        e.preventDefault();
        setVolume(Math.min(1, volume + 0.05));
      } else if (e.code === "ArrowDown") {
        e.preventDefault();
        setVolume(Math.max(0, volume - 0.05));
      } else if (e.code === "KeyM") {
        toggleMute();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [toggle, volume, setVolume, toggleMute]);

  const art = bestThumb(current?.thumbnails);
  const hasTrack = !!current?.id;

  return (
    <>
      {/* bar melayang — di atas bottom nav di mobile, di atas tepi bawah di desktop */}
      <div className="fixed bottom-[78px] md:bottom-4 left-0 right-0 z-40 pointer-events-none px-2.5 sm:px-4">
        <div className="pointer-events-auto mx-auto max-w-[1500px] rounded-2xl overflow-hidden ring-1 ring-white/10 bg-black/90 backdrop-blur-md shadow-[0_16px_60px_rgba(0,0,0,0.7)]">
          {error && (
            <div className="mx-4 mt-2 px-3 py-1.5 rounded-md bg-white/10 text-xs text-white flex items-center justify-between">
              <span>⚠ {error}</span>
              <button onClick={() => next()} className="underline underline-offset-2 text-soft">
                Lewati
              </button>
            </div>
          )}

          {/* strip visualizer di atas bar */}
          <div className="relative h-9 bg-gradient-to-t from-black via-black/70 to-transparent">
            <Visualizer variant="bar" className="absolute inset-0 w-full h-full opacity-90" />
          </div>

          {/* ===== LAYOUT DESKTOP ===== */}
          <div className="hidden md:grid grid-cols-[1fr_auto_1fr] items-center gap-4 px-4 py-2.5 max-w-[1600px] mx-auto w-full">
            {/* kiri: info lagu */}
            <button
              onClick={() => hasTrack && openFull()}
              className={`flex items-center gap-3 min-w-0 text-left group ${hasTrack ? "cursor-pointer" : "cursor-default"}`}
              title={hasTrack ? "Buka Now Playing" : ""}
            >
              <div
                ref={artRef}
                className="relative shrink-0 rounded-md overflow-hidden ring-1 ring-white/10"
              >
                <Cover src={art} title={current?.title} size={52} rounded="rounded-md" />
                {playing && (
                  <div className="absolute bottom-1 right-1 bg-black/70 rounded px-1 py-0.5">
                    <Equalizer size={10} active />
                  </div>
                )}
                {loading && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold truncate">
                  {current?.title ?? "Tidak ada lagu"}
                </p>
                <p className="text-xs text-mut truncate">
                  {current?.artist || current?.album || "Pilih lagu untuk mulai mendengar"}
                </p>
              </div>
            </button>

            {/* tengah: kontrol + progress */}
            <div className="flex flex-col items-center gap-1.5 w-[min(52vw,560px)]">
              <div className="flex items-center gap-5">
                <button
                  onClick={toggleShuffle}
                  className={`transition-colors ${shuffle ? "text-white" : "text-mut hover:text-white"}`}
                  title="Acak"
                >
                  <Icon d={I.shuffle} size={18} />
                </button>
                <button onClick={prev} className="text-mut hover:text-white transition-colors" title="Sebelumnya">
                  <Icon d={I.prev} size={22} />
                </button>
                <button
                  onClick={toggle}
                  disabled={!hasTrack}
                  className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 active:scale-95 transition-transform disabled:opacity-40 disabled:hover:scale-100"
                  title={playing ? "Jeda (Spasi)" : "Putar (Spasi)"}
                >
                  {playing ? <Icon d={I.pause} size={20} /> : <Icon d={I.play} size={20} className="ml-0.5" />}
                </button>
                <button onClick={() => next()} className="text-mut hover:text-white transition-colors" title="Berikutnya">
                  <Icon d={I.next} size={22} />
                </button>
                <button
                  onClick={cycleRepeat}
                  className={`transition-colors relative ${repeat !== "off" ? "text-white" : "text-mut hover:text-white"}`}
                  title={`Ulangi: ${repeat}`}
                >
                  <Icon d={repeat === "one" ? I.repeatOne : I.repeat} size={18} />
                  {repeat === "one" && (
                    <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-0.5 h-0.5 rounded-full bg-white" />
                  )}
                </button>
              </div>
              <TimeBar />
            </div>

            {/* kanan: volume */}
            <div className="flex items-center justify-end gap-2 min-w-[140px]">
                <button
                onClick={openFull}
                className="text-mut hover:text-white transition-colors"
                title="Mesin suara / layar penuh"
                disabled={!hasTrack}
              >
                <Icon d={I.fx} size={18} />
              </button>
              <button onClick={toggleMute} className="text-mut hover:text-white transition-colors" title="Bisukan (M)">
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
                aria-label="Volume"
              />
            </div>
          </div>

          {/* ===== LAYOUT MOBILE ===== */}
          <div className="md:hidden px-3 pt-1.5 pb-2.5">
            <TimeBar />
            <div className="mt-1.5 flex items-center justify-between gap-2">
              <button
                onClick={() => hasTrack && openFull()}
                className={`flex items-center gap-2.5 min-w-0 text-left ${hasTrack ? "cursor-pointer" : "cursor-default"}`}
                title={hasTrack ? "Buka Now Playing" : ""}
              >
                <div
                  ref={artRef}
                  className="relative shrink-0 rounded-md overflow-hidden ring-1 ring-white/10"
                >
                  <Cover src={art} title={current?.title} size={44} rounded="rounded-md" />
                  {playing && (
                    <div className="absolute bottom-0.5 right-0.5 bg-black/70 rounded px-0.5 py-0.5">
                      <Equalizer size={8} active />
                    </div>
                  )}
                  {loading && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-semibold truncate">{current?.title ?? "Tidak ada lagu"}</p>
                  <p className="text-[11px] text-mut truncate">
                    {current?.artist || current?.album || "Pilih lagu untuk mulai mendengar"}
                  </p>
                </div>
              </button>
              <div className="flex items-center gap-4 shrink-0">
                <button onClick={prev} className="text-mut active:text-white transition-colors" title="Sebelumnya">
                  <Icon d={I.prev} size={20} />
                </button>
                <button
                  onClick={toggle}
                  disabled={!hasTrack}
                  className="w-9 h-9 rounded-full bg-white text-black flex items-center justify-center active:scale-95 transition-transform disabled:opacity-40"
                  title={playing ? "Jeda" : "Putar"}
                >
                  {playing ? <Icon d={I.pause} size={17} /> : <Icon d={I.play} size={17} className="ml-0.5" />}
                </button>
                <button onClick={() => next()} className="text-mut active:text-white transition-colors" title="Berikutnya">
                  <Icon d={I.next} size={20} />
                </button>
              </div>
            </div>
          </div>
          </div>
      </div>

      {fullOpen && <FullPlayer queue={queue} index={index} onClose={closeFull} />}
    </>
  );
}
