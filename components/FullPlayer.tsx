"use client";

import { useEffect, useRef, useState } from "react";
import { usePlayer } from "./PlayerProvider";
import Visualizer from "./Visualizer";
import LyricsPanel from "./Lyrics";
import FxPanel from "./FxPanel";
import { Cover, Icon, I, Equalizer } from "./ui";
import { bestThumb, fmtDur } from "@/lib/types";
import type { Track } from "@/lib/types";

// ---------- gaya cover ----------
const WAVE_SVG = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' preserveAspectRatio='none'><path d='M0,30 C9,12 22,46 36,26 C50,6 64,42 78,22 C88,12 96,18 100,26 L100,74 C90,90 76,56 62,76 C48,96 34,60 20,80 C10,94 2,86 0,74 Z' fill='white'/></svg>`;
const WAVE_MASK = `url("data:image/svg+xml,${encodeURIComponent(WAVE_SVG)}")`;

const COVER_STYLES: {
  id: string;
  label: string;
  filter?: string;
  mask?: string;
  zoom?: boolean;
  overlay?: "scan" | "grid" | "dots";
}[] = [
  { id: "asli", label: "Asli" },
  { id: "mono", label: "Mono", filter: "grayscale(1) contrast(1.35) brightness(1.05)" },
  { id: "glow", label: "Glow", filter: "blur(7px) saturate(0.3) brightness(1.45)", zoom: true },
  { id: "wave", label: "Gelombang", mask: WAVE_MASK },
  { id: "scan", label: "Scanline", filter: "contrast(1.25)", overlay: "scan" },
  { id: "grid", label: "Piksel", filter: "contrast(1.2) saturate(0.9)", overlay: "grid" },
];

function CoverArt({
  src,
  title,
  styleIdx,
}: {
  src?: string;
  title?: string;
  styleIdx: number;
}) {
  const style = COVER_STYLES[styleIdx] ?? COVER_STYLES[0];
  return (
    <div className="relative w-56 h-56 sm:w-80 sm:h-80 rounded-2xl overflow-hidden ring-1 ring-white/10 shadow-[0_0_90px_rgba(255,255,255,0.08)] bg-elev">
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={title ?? ""}
          className={`w-full h-full object-cover transition-all duration-500 ${style.zoom ? "scale-110" : ""}`}
          style={{
            filter: style.filter,
            WebkitMaskImage: style.mask,
            maskImage: style.mask,
            maskSize: "100% 100%",
            WebkitMaskSize: "100% 100%",
          }}
        />
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-[#1c1c1c] to-[#0a0a0a] flex items-center justify-center">
          <Icon d={I.music} size={110} className="text-[#2c2c2c]" />
        </div>
      )}
      {style.overlay === "scan" && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "repeating-linear-gradient(0deg, transparent 0px, transparent 3px, rgba(0,0,0,0.45) 3px, rgba(0,0,0,0.45) 4px)",
          }}
        />
      )}
      {style.overlay === "grid" && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "repeating-linear-gradient(0deg, rgba(0,0,0,0.35) 0 2px, transparent 2px 16px), repeating-linear-gradient(90deg, rgba(0,0,0,0.35) 0 2px, transparent 2px 16px)",
          }}
        />
      )}
    </div>
  );
}

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
  const [tab, setTab] = useState<"viz" | "lyr" | "queue" | "fx">("viz");
  const touchY = useRef<number | null>(null);
  const [styleIdx, setStyleIdx] = useState(0);
  const artWrapRef = useRef<HTMLDivElement>(null);

  // muat gaya cover tersimpan
  useEffect(() => {
    try {
      const s = localStorage.getItem("ms:coverstyle");
      if (s != null) setStyleIdx(Number(s) % COVER_STYLES.length);
    } catch {}
  }, []);

  useEffect(() => {
    const onBeat = () => {
      const el = artWrapRef.current;
      if (el) {
        el.classList.remove("beat-pulse", "beat-ring");
        void el.offsetWidth;
        el.classList.add("beat-pulse", "beat-ring");
      }
    };
    window.addEventListener("kainet:beat", onBeat);
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("kainet:beat", onBeat);
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  const art = bestThumb(current?.thumbnails);
  const pct = duration > 0 ? (currentTime / duration) * 100 : 0;
  const cycleStyle = (dir: number) => {
    setStyleIdx((i) => {
      const ni = (i + dir + COVER_STYLES.length) % COVER_STYLES.length;
      try {
        localStorage.setItem("ms:coverstyle", String(ni));
      } catch {}
      return ni;
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-[#040404] overflow-y-auto"
      onTouchStart={(e) => {
        touchY.current = e.touches[0]?.clientY ?? null;
      }}
      onTouchEnd={(e) => {
        const start = touchY.current;
        touchY.current = null;
        const y = e.changedTouches[0]?.clientY;
        if (start != null && y != null && y - start > 90) onClose();
      }}
    >
      <div className="min-h-full relative">
        {/* blur backdrop dari cover art (mengikuti gaya) */}
        {art && (
          <div
            aria-hidden
            className="absolute inset-0 overflow-hidden"
            style={{
              backgroundImage: `url(${art})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              filter:
                COVER_STYLES[styleIdx]?.id === "mono"
                  ? "blur(90px) grayscale(1) brightness(0.3)"
                  : "blur(90px) saturate(0.2) brightness(0.35)",
              transform: "scale(1.4)",
              opacity: 0.5,
            }}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#040404]/60 to-[#040404]" />

        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-6">
          {/* header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2 text-mut">
              <Equalizer size={14} active={playing} />
              <span className="text-xs uppercase tracking-[0.25em]">Now Playing</span>
              <span className="text-[10px] tracking-normal normal-case opacity-70">
                {engine === "audio" ? "· gelombang nyata" : "· YouTube"}
              </span>
            </div>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
              title="Tutup (Esc)"
            >
              <Icon d={I.close} size={18} />
            </button>
          </div>

          <div className="grid lg:grid-cols-[auto_1fr] gap-10 items-start">
            {/* kiri: cover + info + kontrol */}
            <div className="flex flex-col items-center gap-5 mx-auto lg:mx-0">
              <div ref={artWrapRef} className="rounded-2xl">
                <CoverArt src={art} title={current?.title} styleIdx={styleIdx} />
              </div>

              {/* pemilih gaya cover */}
              <div className="flex items-center gap-3 text-mut">
                <button
                  onClick={() => cycleStyle(-1)}
                  className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/25 flex items-center justify-center transition-colors"
                  title="Gaya sebelumnya"
                >
                  <Icon d={I.prev} size={13} />
                </button>
                <span className="text-[11px] uppercase tracking-[0.25em] min-w-[90px] text-center">
                  {COVER_STYLES[styleIdx]?.label}
                </span>
                <button
                  onClick={() => cycleStyle(1)}
                  className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/25 flex items-center justify-center transition-colors"
                  title="Gaya berikutnya"
                >
                  <Icon d={I.next} size={13} />
                </button>
              </div>

              <div className="text-center">
                <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-glow">
                  {current?.title ?? "—"}
                </h2>
                <p className="text-mut mt-1 text-sm">{current?.artist ?? current?.album ?? "—"}</p>
              </div>

              {/* kontrol besar */}
              <div className="flex items-center gap-5 sm:gap-6">
                <button
                  onClick={toggleShuffle}
                  className={shuffle ? "text-white" : "text-mut hover:text-white transition-colors"}
                  title="Acak"
                >
                  <Icon d={I.shuffle} size={20} />
                </button>
                <button onClick={prev} className="text-mut hover:text-white transition-colors" title="Sebelumnya">
                  <Icon d={I.prev} size={28} />
                </button>
                <button
                  onClick={toggle}
                  className="w-16 h-16 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 active:scale-95 transition-transform"
                >
                  {playing ? <Icon d={I.pause} size={28} /> : <Icon d={I.play} size={28} className="ml-1" />}
                </button>
                <button onClick={() => next()} className="text-mut hover:text-white transition-colors" title="Berikutnya">
                  <Icon d={I.next} size={28} />
                </button>
                <button
                  onClick={cycleRepeat}
                  className={repeat !== "off" ? "text-white" : "text-mut hover:text-white transition-colors"}
                  title={`Ulangi: ${repeat}`}
                >
                  <Icon d={repeat === "one" ? I.repeatOne : I.repeat} size={20} />
                </button>
              </div>

              {/* gelombang + seek */}
              <div className="w-full max-w-md">
                <div className="relative h-10 mb-1 rounded-lg overflow-hidden bg-white/[0.03]">
                  <Visualizer variant="bar" className="absolute inset-0 w-full h-full" />
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs tabular-nums text-mut">{fmtDur(currentTime)}</span>
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
                  <span className="text-xs tabular-nums text-mut">{fmtDur(duration)}</span>
                </div>
              </div>
            </div>

            {/* kanan: tabs */}
            <div className="w-full">
              {/* tab bar */}
              <div className="flex gap-1.5 mb-4 bg-white/[0.04] rounded-full p-1 w-fit">
                {(
                  [
                    { id: "viz", label: "Visualizer" },
                    { id: "lyr", label: "Lirik" },
                    { id: "fx", label: "Suara" },
                    { id: "queue", label: "Antrian" },
                  ] as const
                ).map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setTab(t.id)}
                    className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                      tab === t.id ? "bg-white text-black" : "text-mut hover:text-white"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {tab === "viz" && (
                <div className="h-56 sm:h-72 rounded-xl bg-white/[0.03] ring-1 ring-line overflow-hidden relative mb-6">
                  <Visualizer variant="ring" className="absolute inset-0 w-full h-full" />
                  <div className="absolute bottom-3 left-4 text-[10px] uppercase tracking-[0.3em] text-mut">
                    Spektrum — mengikuti beat
                  </div>
                </div>
              )}

              {tab === "fx" && (
                <div className="mb-6">
                  <FxPanel />
                </div>
              )}

              {tab === "lyr" && (
                <div className="rounded-xl bg-white/[0.03] ring-1 ring-line px-4 py-3 mb-6 relative">
                  <LyricsPanel />
                </div>
              )}

              {tab === "queue" && (
                <div className="mb-6">
                  <h3 className="text-xs uppercase tracking-[0.25em] text-mut mb-2 flex items-center gap-2">
                    <Icon d={I.queue} size={14} /> Antrian · {queue.length} lagu
                  </h3>
                  <div className="space-y-1 max-h-[46vh] overflow-y-auto pr-1">
                    {queue.map((t, i) => (
                      <button
                        key={`${t.id}-${i}`}
                        onClick={() => playAt(i)}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                          i === index ? "bg-white/10" : "hover:bg-white/5"
                        }`}
                      >
                        <span className="w-5 text-right text-xs tabular-nums text-mut shrink-0">
                          {i === index && playing ? <Equalizer size={12} active /> : i + 1}
                        </span>
                        <Cover src={bestThumb(t.thumbnails)} title={t.title} size={36} />
                        <span className="min-w-0 flex-1">
                          <span
                            className={`block truncate text-sm ${i === index ? "text-white font-semibold" : "text-soft"}`}
                          >
                            {t.title}
                          </span>
                          <span className="block truncate text-xs text-mut">{t.artist}</span>
                        </span>
                        <span className="text-xs tabular-nums text-mut shrink-0">
                          {t.durationText || fmtDur(t.duration)}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
