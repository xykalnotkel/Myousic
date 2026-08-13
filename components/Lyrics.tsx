"use client";

// Lirik polos: baris aktif memutih halus. Tanpa skeleton, tanpa bar progres.
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

type State = "idle" | "ok" | "none";

export default function LyricsPanel() {
  const { current, currentTime } = usePlayer();
  const [state, setState] = useState<State>("idle");
  const [data, setData] = useState<LyricsData | null>(null);
  const lineRefs = useRef<(HTMLParagraphElement | null)[]>([]);

  useEffect(() => {
    const id = current?.id;
    let cancel = false;
    if (!id) {
      setState("none");
      setData(null);
      return;
    }
    setState("idle");
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
        if (!cancel) setState("none");
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

  useEffect(() => {
    if (activeIdx >= 0) {
      lineRefs.current[activeIdx]?.scrollIntoView({ block: "center", behavior: "smooth" });
    }
  }, [activeIdx]);

  if (state !== "ok" || !data) {
    return (
      <div className="py-20 text-center text-mut">
        <p className="text-3xl mb-3 opacity-30">♪</p>
        <p className="text-sm">{state === "idle" ? " " : "Lirik tidak tersedia"}</p>
      </div>
    );
  }

  return (
    <div className="h-[46vh] overflow-y-auto no-scrollbar px-1 py-8">
      {data.lines.map((l, i) => {
        const active = i === activeIdx;
        const past = i < activeIdx;
        return (
          <p
            key={i}
            ref={(el) => {
              lineRefs.current[i] = el;
            }}
            className={`text-center leading-snug py-2.5 transition-colors duration-700 ease-out ${
              active
                ? "text-white text-[22px] sm:text-[26px] font-semibold"
                : past
                ? "text-white/35 text-[16px] sm:text-[17px]"
                : "text-white/25 text-[16px] sm:text-[17px]"
            }`}
          >
            {l.text}
          </p>
        );
      })}
    </div>
  );
}
