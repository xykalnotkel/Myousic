"use client";

// Lirik otomatis ber-progres: baris aktif menyala & auto-scroll mengikuti lagu
import { useEffect, useMemo, useRef, useState } from "react";
import { usePlayer } from "./PlayerProvider";

interface LyricLine {
  startMs: number;
  endMs: number;
  text: string;
}
interface LyricsData {
  lines: LyricLine[];
  source?: string;
}

type State = "load" | "ok" | "none" | "err";

export default function LyricsPanel() {
  const { current, currentTime } = usePlayer();
  const [state, setState] = useState<State>("load");
  const [data, setData] = useState<LyricsData | null>(null);
  const lineRefs = useRef<(HTMLParagraphElement | null)[]>([]);

  useEffect(() => {
    const id = current?.id;
    let cancel = false;
    if (!id) {
      setState("none");
      return;
    }
    setState("load");
    setData(null);
    const qs = new URLSearchParams();
    if (current?.title) qs.set("title", current.title);
    if (current?.artist) qs.set("artist", current.artist);
    fetch(`/api/lyrics/${encodeURIComponent(id)}?${qs.toString()}`)
      .then((r) => r.json())
      .then((d) => {
        if (cancel) return;
        if (d?.lines?.length) {
          setData(d);
          setState("ok");
        } else {
          setState("none");
        }
      })
      .catch(() => {
        if (!cancel) setState("err");
      });
    return () => {
      cancel = true;
    };
  }, [current?.id, current?.title, current?.artist]);

  const activeIdx = useMemo(() => {
    if (!data) return -1;
    const t = currentTime * 1000;
    let idx = -1;
    for (let i = 0; i < data.lines.length; i++) {
      if (t >= data.lines[i].startMs) idx = i;
      else break;
    }
    return idx;
  }, [data, currentTime]);

  // auto-scroll ke baris aktif
  useEffect(() => {
    if (activeIdx >= 0) {
      lineRefs.current[activeIdx]?.scrollIntoView({ block: "center", behavior: "smooth" });
    }
  }, [activeIdx]);

  if (state === "load") {
    return (
      <div className="space-y-3 py-4">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="skeleton h-5 w-[40%]" style={{ width: `${45 + ((i * 13) % 40)}%` }} />
        ))}
      </div>
    );
  }
  if (state === "err") {
    return (
      <div className="py-16 text-center text-mut text-sm">
        Gagal memuat lirik. Periksa koneksi.
      </div>
    );
  }
  if (state === "none" || !data) {
    return (
      <div className="py-16 text-center text-mut">
        <p className="text-3xl mb-3 opacity-40">♪</p>
        <p className="text-sm">Lirik tidak tersedia untuk lagu ini</p>
      </div>
    );
  }

  // progres baris aktif (0-100%)
  const lineProgress = (() => {
    if (activeIdx < 0) return 0;
    const line = data.lines[activeIdx];
    const next = data.lines[activeIdx + 1];
    const span = (next ? next.startMs : line.endMs) - line.startMs;
    if (span <= 0) return 0;
    return Math.min(100, Math.max(0, ((currentTime * 1000 - line.startMs) / span) * 100));
  })();

  return (
    <div className="relative">
      <div className="h-[44vh] overflow-y-auto pr-2 py-2">
        {data.lines.map((l, i) => {
          const active = i === activeIdx;
          const past = i < activeIdx;
          return (
            <p
              key={i}
              ref={(el) => {
                lineRefs.current[i] = el;
              }}
              className={`transition-all duration-300 py-1.5 leading-snug ${
                active
                  ? "text-white text-lg font-bold"
                  : past
                  ? "text-[#5c5c5c] text-base"
                  : "text-[#8a8a8a] text-base"
              }`}
            >
              {l.text}
              {active && (
                <span className="block mt-1 h-[2px] w-full bg-white/10 overflow-hidden rounded-full">
                  <span
                    className="block h-full bg-white transition-[width] duration-100"
                    style={{ width: `${lineProgress}%` }}
                  />
                </span>
              )}
            </p>
          );
        })}
      </div>
      {data.source && (
        <p className="absolute -top-1 right-0 text-[10px] text-mut/70">{data.source}</p>
      )}
    </div>
  );
}
