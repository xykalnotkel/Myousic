"use client";

// Konteks pemutar: queue, kontrol, audio element, Web Audio (analyser untuk visualizer & beat)
// Fallback: YouTube IFrame (IP user) kalau InnerTube di Vercel kena bot-check.
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { ReactNode } from "react";
import type { Track } from "@/lib/types";
import { createYtHandle, type YtHandle } from "@/lib/ytPlayer";

interface PlayerCtx {
  queue: Track[];
  index: number;
  current: Track | null;
  playing: boolean;
  loading: boolean;
  error: string | null;
  currentTime: number;
  duration: number;
  volume: number;
  muted: boolean;
  shuffle: boolean;
  repeat: "off" | "all" | "one";
  playContext: (tracks: Track[], startIndex?: number) => void;
  playAt: (i: number) => void;
  toggle: () => void;
  next: (auto?: boolean) => void;
  prev: () => void;
  seek: (t: number) => void;
  setVolume: (v: number) => void;
  toggleMute: () => void;
  toggleShuffle: () => void;
  cycleRepeat: () => void;
  analyser: AnalyserNode | null;
  beatVersion: number;
  fullOpen: boolean;
  openFull: () => void;
  closeFull: () => void;
}

const Ctx = createContext<PlayerCtx | null>(null);

export function usePlayer() {
  const c = useContext(Ctx);
  if (!c) throw new Error("usePlayer di luar PlayerProvider");
  return c;
}

function shuffledIndexes(len: number): number[] {
  const arr = Array.from({ length: len }, (_, i) => i);
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function PlayerProvider({ children }: { children: ReactNode }) {
  const [queue, setQueue] = useState<Track[]>([]);
  const [index, setIndex] = useState(-1);
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(0.8);
  const [muted, setMuted] = useState(false);
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState<"off" | "all" | "one">("off");
  const [beatVersion, setBeatVersion] = useState(0);
  const [fullOpen, setFullOpen] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const orderRef = useRef<number[]>([]);
  const posRef = useRef(0);
  const lastBeatRef = useRef(0);
  const indexRef = useRef(-1);
  const queueRef = useRef<Track[]>([]);
  const engineRef = useRef<"audio" | "yt">("audio");
  const ytRef = useRef<YtHandle | null>(null);
  const genRef = useRef(0);
  const volumeRef = useRef(0.8);
  const mutedRef = useRef(false);
  indexRef.current = index;
  queueRef.current = queue;
  volumeRef.current = volume;
  mutedRef.current = muted;

  // init audio element + web audio
  useEffect(() => {
    const audio = new Audio();
    audio.preload = "auto";
    audio.crossOrigin = "anonymous";
    audioRef.current = audio;
    (window as any).__kainetAudio = audio;

    audio.addEventListener("timeupdate", () => {
      if (engineRef.current === "audio") setCurrentTime(audio.currentTime);
    });
    audio.addEventListener("durationchange", () => {
      if (engineRef.current === "audio") setDuration(audio.duration || 0);
    });
    audio.addEventListener("play", () => {
      if (engineRef.current === "audio") setPlaying(true);
    });
    audio.addEventListener("pause", () => {
      if (engineRef.current === "audio") setPlaying(false);
    });
    audio.addEventListener("waiting", () => {
      if (engineRef.current === "audio") setLoading(true);
    });
    audio.addEventListener("playing", () => {
      if (engineRef.current === "audio") setLoading(false);
    });
    audio.addEventListener("error", () => {
      if (engineRef.current !== "audio") return;
      setLoading(false);
      const src = audio.currentSrc || audio.src;
      let msg = "Gagal memuat stream audio";
      const aerr = (audio as any).error;
      if (aerr) {
        if (aerr.code === 4) msg = "Tidak ada sumber audio yang didukung";
        else if (aerr.message) msg = aerr.message;
      }
      setError(`${msg}. Mencoba pemutar YouTube…`);
      if (src && src.includes("/api/stream/")) {
        fetch(src, { headers: { Range: "bytes=0-400" } })
          .then(async (r) => {
            const ct = r.headers.get("content-type") || "";
            if (ct.includes("json")) {
              const j = await r.json().catch(() => null);
              if (j?.error) setError(`${j.error}. Mencoba pemutar YouTube…`);
            }
          })
          .catch(() => {});
      }
    });
    audio.addEventListener("ended", () => {
      if (engineRef.current !== "audio") return;
      CtxHolder.get()?.next(true);
    });

    try {
      const v = localStorage.getItem("km:vol");
      if (v != null) setVolumeState(Number(v));
      const m = localStorage.getItem("km:mute");
      if (m === "1") setMuted(true);
      const s = localStorage.getItem("km:shuffle");
      if (s === "1") setShuffle(true);
      const r = localStorage.getItem("km:repeat") as "off" | "all" | "one" | null;
      if (r) setRepeat(r);
    } catch {}

    return () => {
      audio.pause();
      audio.src = "";
      audio.remove();
      ctxRef.current?.close().catch(() => {});
      ytRef.current?.destroy();
      ytRef.current = null;
    };
  }, []);

  const CtxHolder = useMemo(
    () => ({
      get: () => apiRef.current,
    }),
    []
  );
  const apiRef = useRef<any>(null);

  useEffect(() => {
    setVolumeState((v) => {
      if (audioRef.current) audioRef.current.volume = v;
      return v;
    });
  }, []);
  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
    ytRef.current?.setVolume(volume);
    try {
      localStorage.setItem("km:vol", String(volume));
    } catch {}
  }, [volume]);
  useEffect(() => {
    if (audioRef.current) audioRef.current.muted = muted;
    ytRef.current?.setMuted(muted);
    try {
      localStorage.setItem("km:mute", muted ? "1" : "0");
    } catch {}
  }, [muted]);
  useEffect(() => {
    try {
      localStorage.setItem("km:shuffle", shuffle ? "1" : "0");
      localStorage.setItem("km:repeat", repeat);
    } catch {}
  }, [shuffle, repeat]);

  // poll posisi untuk engine YouTube
  useEffect(() => {
    const id = window.setInterval(() => {
      if (engineRef.current !== "yt" || !ytRef.current) return;
      setCurrentTime(ytRef.current.getCurrentTime());
      setDuration(ytRef.current.getDuration());
    }, 250);
    return () => window.clearInterval(id);
  }, []);

  const ensureCtx = useCallback(() => {
    if (!ctxRef.current) {
      const AC =
        (window as any).AudioContext || (window as any).webkitAudioContext;
      const ac = new AC();
      const src = ac.createMediaElementSource(audioRef.current!);
      const an = ac.createAnalyser();
      an.fftSize = 1024;
      an.smoothingTimeConstant = 0.78;
      src.connect(an);
      an.connect(ac.destination);
      ctxRef.current = ac;
      analyserRef.current = an;
    }
    if (ctxRef.current && ctxRef.current.state === "suspended") ctxRef.current.resume();
  }, []);

  const ensureYt = useCallback(() => {
    if (ytRef.current) return ytRef.current;
    const handle = createYtHandle({
      onPlay: () => {
        if (engineRef.current === "yt") {
          setPlaying(true);
          setLoading(false);
        }
      },
      onPause: () => {
        if (engineRef.current === "yt") setPlaying(false);
      },
      onEnded: () => {
        if (engineRef.current === "yt") CtxHolder.get()?.next(true);
      },
      onError: (msg) => {
        if (engineRef.current === "yt") {
          setLoading(false);
          setError(`${msg}. Gunakan tombol Lewati.`);
        }
      },
    });
    ytRef.current = handle;
    return handle;
  }, []);

  const loadTrack = useCallback(
    async (tr: Track) => {
      const audio = audioRef.current!;
      const gen = ++genRef.current;
      ensureCtx();
      setError(null);
      setCurrentTime(0);
      setDuration(0);
      if (!tr?.id) {
        setError("Lagu ini tidak punya video id");
        return;
      }
      setLoading(true);

      const q = [tr.title, tr.artist].filter(Boolean).join(" ");
      const streamPath = `/api/stream/${encodeURIComponent(tr.id)}${q ? `?q=${encodeURIComponent(q)}` : ""}`;

      // 1) YouTube IFrame dulu — request dari IP user, lolos bot-check Vercel
      try {
        engineRef.current = "yt";
        try {
          audio.pause();
          audio.removeAttribute("src");
          audio.load();
        } catch {}
        const yt = ensureYt();
        yt.setVolume(volumeRef.current);
        yt.setMuted(mutedRef.current);
        await yt.load(tr.id);
        if (gen !== genRef.current) return;
        setLoading(false);
        setError(null);
        return;
      } catch (e: any) {
        if (gen !== genRef.current) return;
        // lanjut ke proxy stream
      }

      // 2) fallback: proxy InnerTube (kadang masih lolos untuk video non-Topic)
      try {
        engineRef.current = "audio";
        ytRef.current?.pause();
        audio.crossOrigin = "anonymous";
        audio.src = streamPath;
        audio.load();
        await audio.play();
        if (gen !== genRef.current) return;
      } catch (e: any) {
        if (e?.name === "AbortError") return;
        if (gen !== genRef.current) return;
        setError(e?.message || "Gagal memutar. Gunakan tombol Lewati.");
        setLoading(false);
      }
    },
    [ensureCtx, ensureYt]
  );

  const playAt = useCallback(
    (i: number) => {
      const q = queueRef.current;
      if (!q[i]) return;
      setIndex(i);
      orderRef.current = shuffledIndexes(q.length);
      posRef.current = orderRef.current.indexOf(i);
      loadTrack(q[i]);
    },
    [loadTrack]
  );

  const playContext = useCallback(
    (tracks: Track[], startIndex = 0) => {
      const valid = tracks.filter((t) => t?.id);
      if (!valid.length) return;
      setQueue(valid);
      orderRef.current = shuffledIndexes(valid.length);
      posRef.current = startIndex < valid.length ? startIndex : 0;
      setIndex(startIndex < valid.length ? startIndex : 0);
      loadTrack(valid[startIndex < valid.length ? startIndex : 0]);
    },
    [loadTrack]
  );

  const toggle = useCallback(() => {
    if (engineRef.current === "yt" && ytRef.current) {
      if (playing) ytRef.current.pause();
      else ytRef.current.play();
      return;
    }
    const audio = audioRef.current;
    if (!audio || !audio.src) return;
    ensureCtx();
    if (audio.paused) audio.play().catch(() => {});
    else audio.pause();
  }, [ensureCtx, playing]);

  const next = useCallback(
    (auto = false) => {
      const q = queueRef.current;
      if (!q.length) return;
      if (repeat === "one" && auto) {
        if (engineRef.current === "yt") {
          ytRef.current?.seek(0);
          ytRef.current?.play();
        } else {
          const audio = audioRef.current;
          if (audio) {
            audio.currentTime = 0;
            audio.play().catch(() => {});
          }
        }
        return;
      }
      let ni: number;
      if (shuffle && orderRef.current.length) {
        posRef.current += 1;
        if (posRef.current >= orderRef.current.length) {
          if (repeat === "all" || !auto) {
            orderRef.current = shuffledIndexes(q.length);
            posRef.current = 0;
          } else {
            setPlaying(false);
            return;
          }
        }
        ni = orderRef.current[posRef.current];
      } else {
        ni = indexRef.current + 1;
        if (ni >= q.length) {
          if (repeat === "all") ni = 0;
          else if (auto) {
            setPlaying(false);
            return;
          } else ni = 0;
        }
      }
      setIndex(ni);
      loadTrack(q[ni]);
    },
    [shuffle, repeat, loadTrack]
  );

  const prev = useCallback(() => {
    const t =
      engineRef.current === "yt"
        ? ytRef.current?.getCurrentTime() || 0
        : audioRef.current?.currentTime || 0;
    if (t > 3) {
      if (engineRef.current === "yt") ytRef.current?.seek(0);
      else if (audioRef.current) audioRef.current.currentTime = 0;
      return;
    }
    const q = queueRef.current;
    if (!q.length) return;
    let pi: number;
    if (shuffle && orderRef.current.length) {
      posRef.current -= 1;
      if (posRef.current < 0) {
        orderRef.current = shuffledIndexes(q.length);
        posRef.current = orderRef.current.length - 1;
      }
      pi = orderRef.current[posRef.current];
    } else {
      pi = indexRef.current - 1;
      if (pi < 0) pi = q.length - 1;
    }
    setIndex(pi);
    loadTrack(q[pi]);
  }, [shuffle, loadTrack]);

  const seek = useCallback((t: number) => {
    if (engineRef.current === "yt" && ytRef.current) {
      ytRef.current.seek(t);
      setCurrentTime(t);
      return;
    }
    const audio = audioRef.current;
    if (audio && isFinite(audio.duration)) {
      audio.currentTime = t;
      setCurrentTime(t);
    }
  }, []);

  const setVolume = useCallback((v: number) => {
    setVolumeState(Math.min(1, Math.max(0, v)));
    if (v > 0 && muted) setMuted(false);
  }, [muted]);

  const toggleMute = useCallback(() => setMuted((m) => !m), []);
  const toggleShuffle = useCallback(() => setShuffle((s) => !s), []);
  const cycleRepeat = useCallback(
    () => setRepeat((r) => (r === "off" ? "all" : r === "all" ? "one" : "off")),
    []
  );

  const value: PlayerCtx = {
    queue,
    index,
    current: index >= 0 ? queue[index] ?? null : null,
    playing,
    loading,
    error,
    currentTime,
    duration,
    volume,
    muted,
    shuffle,
    repeat,
    playContext,
    playAt,
    toggle,
    next,
    prev,
    seek,
    setVolume,
    toggleMute,
    toggleShuffle,
    cycleRepeat,
    analyser: analyserRef.current,
    beatVersion,
    fullOpen,
    openFull: () => setFullOpen(true),
    closeFull: () => setFullOpen(false),
  };

  apiRef.current = value;

  useEffect(() => {
    const onBeat = () => setBeatVersion((b) => b + 1);
    window.addEventListener("kainet:beat", onBeat);
    (window as any).__kainetBeat = {
      getBeat: () => lastBeatRef.current,
      beatNow: () => {
        lastBeatRef.current = performance.now();
        window.dispatchEvent(new CustomEvent("kainet:beat"));
      },
    };
    return () => window.removeEventListener("kainet:beat", onBeat);
  }, []);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
