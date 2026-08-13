"use client";

// Karaoke: mask putih per kata, kecepatan mengikuti timestamp penyanyi.
import { useEffect, useMemo, useRef, useState } from "react";
import { usePlayer } from "./PlayerProvider";

interface LyricWord {
  text: string;
  startMs: number;
  endMs: number;
}
interface LyricLine {
  startMs: number;
  endMs: number;
  text: string;
  words?: LyricWord[];
}
interface LyricsData {
  lines: LyricLine[];
  source?: string;
}

function splitWords(line: LyricLine): LyricWord[] {
  if (line.words?.length) return line.words;
  const parts = line.text.split(/\s+/).filter(Boolean);
  if (!parts.length) return [{ text: line.text, startMs: line.startMs, endMs: line.endMs }];
  const total = parts.reduce((n, w) => n + Math.max(1, w.length), 0);
  const span = Math.max(350, line.endMs - line.startMs);
  let t = line.startMs;
  return parts.map((w) => {
    const dur = (Math.max(1, w.length) / total) * span;
    const word = { text: w, startMs: t, endMs: t + dur };
    t += dur;
    return word;
  });
}

function readClock(): number {
  const api = (window as any).__myousic;
  if (api?.getTime) return api.getTime();
  const a = (window as any).__kainetAudio;
  if (a && isFinite(a.currentTime)) return a.currentTime;
  return 0;
}

export default function LyricsPanel() {
  const { current } = usePlayer();
  const [state, setState] = useState<"idle" | "ok" | "none">("idle");
  const [data, setData] = useState<LyricsData | null>(null);
  const [activeIdx, setActiveIdx] = useState(-1);
  const lineRefs = useRef<(HTMLParagraphElement | null)[]>([]);
  const wrapRef = useRef<HTMLDivElement>(null);
  const activeIdxRef = useRef(-1);

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
        } else setState("none");
      })
      .catch(() => {
        if (!cancel) setState("none");
      });
    return () => {
      cancel = true;
    };
  }, [current?.id, current?.title, current?.artist]);

  const prepared = useMemo(
    () => (data ? data.lines.map((l) => ({ ...l, words: splitWords(l) })) : []),
    [data]
  );

  useEffect(() => {
    if (!prepared.length) return;
    let raf = 0;
    const tick = () => {
      raf = requestAnimationFrame(tick);
      const ms = readClock() * 1000;
      let idx = -1;
      for (let i = 0; i < prepared.length; i++) {
        if (ms >= prepared[i].startMs) idx = i;
        else break;
      }
      if (idx !== activeIdxRef.current) {
        activeIdxRef.current = idx;
        setActiveIdx(idx);
      }
      const root = wrapRef.current;
      if (!root || idx < 0) return;
      const line = prepared[idx];
      const words = line.words || [];
      const nodes = root.querySelectorAll<HTMLElement>(`[data-ln="${idx}"] [data-w]`);
      nodes.forEach((el, wi) => {
        const w = words[wi];
        if (!w) return;
        let k = 0;
        if (ms >= w.endMs) k = 100;
        else if (ms <= w.startMs) k = 0;
        else k = ((ms - w.startMs) / Math.max(40, w.endMs - w.startMs)) * 100;
        el.style.setProperty("--k", `${k}%`);
      });
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [prepared]);

  useEffect(() => {
    if (activeIdx < 0) return;
    lineRefs.current[activeIdx]?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [activeIdx]);

  if (state !== "ok" || !prepared.length) {
    return (
      <div className="h-full flex items-center justify-center text-mut">
        <p className="text-sm">{state === "idle" ? "" : "Lirik tidak tersedia"}</p>
      </div>
    );
  }

  return (
    <div ref={wrapRef} className="h-full overflow-y-auto overflow-x-hidden no-scrollbar px-3 py-10">
      {prepared.map((l, i) => {
        const active = i === activeIdx;
        const past = i < activeIdx;
        return (
          <p
            key={i}
            data-ln={i}
            ref={(el) => {
              lineRefs.current[i] = el;
            }}
            className={`text-center leading-[1.55] py-2.5 ${
              active ? "text-[22px] font-semibold" : past ? "text-[16px]" : "text-[16px]"
            }`}
          >
            {(l.words || []).map((w, wi) => (
              <span
                key={wi}
                data-w={wi}
                className="k-word"
                style={{
                  ["--k" as any]: past ? "100%" : "0%",
                  color: active ? undefined : past ? "rgba(255,255,255,0.38)" : "rgba(255,255,255,0.2)",
                }}
              >
                {w.text}
                {active && <i>{w.text}</i>}
              </span>
            ))}
          </p>
        );
      })}
    </div>
  );
}
