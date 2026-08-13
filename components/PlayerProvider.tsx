"use client";

// Konteks pemutar: queue, kontrol, audio element, Web Audio (analyser untuk visualizer & beat)
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
  const posRef = useRef(0); // posisi di urutan shuffle
  const lastBeatRef = useRef(0);
  const indexRef = useRef(-1);
  const queueRef = useRef<Track[]>([]);
  indexRef.current = index;
  queueRef.current = queue;

  // init audio element + web audio
  useEffect(() => {
    const audio = new Audio();
    audio.preload = "auto";
    audio.crossOrigin = "anonymous";
    audioRef.current = audio;
    (window as any).__kainetAudio = audio; // untuk keyboard shortcut & debug

    audio.addEventListener("timeupdate", () => setCurrentTime(audio.currentTime));
    audio.addEventListener("durationchange", () => setDuration(audio.duration || 0));
    audio.addEventListener("play", () => setPlaying(true));
    audio.addEventListener("pause", () => setPlaying(false));
    audio.addEventListener("waiting", () => setLoading(true));
    audio.addEventListener("playing", () => setLoading(false));
    audio.addEventListener("error", () => {
      setLoading(false);
      const src = audio.currentSrc || audio.src;
      let msg = "Gagal memuat stream audio";
      const aerr = (audio as any).error;
      if (aerr) {
        if (aerr.code === 4) msg = "Tidak ada sumber audio yang didukung";
        else if (aerr.message) msg = aerr.message;
      }
      setError(`${msg}. Gunakan tombol Lewati.`);
      // API stream mengembalikan JSON error (bukan audio) — ambil pesannya
      if (src && src.includes("/api/stream/")) {
        fetch(src, { headers: { Range: "bytes=0-400" } })
          .then(async (r) => {
            const ct = r.headers.get("content-type") || "";
            if (ct.includes("json")) {
              const j = await r.json().catch(() => null);
              if (j?.error) setError(`${j.error}. Gunakan tombol Lewati.`);
            }
          })
          .catch(() => {});
      }
    });
    audio.addEventListener("ended", () => {
      // dilewati ke next (auto)
      const ctx = CtxHolder.get();
      ctx?.next(true);
    });

    // pulihkan preferensi
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
    };
  }, []);

  // holder agar 'ended' listener bisa akses next() tanpa re-register
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
    try {
      localStorage.setItem("km:vol", String(volume));
    } catch {}
  }, [volume]);
  useEffect(() => {
    if (audioRef.current) audioRef.current.muted = muted;
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

  // pastikan audio context dibuat/resume saat ada interaksi
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

  // set sumber stream untuk track
  const loadTrack = useCallback(
    async (tr: Track) => {
      const audio = audioRef.current!;
      ensureCtx();
      setError(null);
      if (!tr?.id) {
        setError("Lagu ini tidak punya video id");
        return;
      }
      setLoading(true);
      try {
        audio.crossOrigin = "anonymous";
        audio.src = `/api/stream/${encodeURIComponent(tr.id)}`;
        audio.load();
        await audio.play();
      } catch (e: any) {
        if (e?.name === "AbortError") return;
        setError(e?.message || "Gagal memutar");
        setLoading(false);
      }
    },
    [ensureCtx]
  );

  const playAt = useCallback(
    (i: number) => {
      const q = queueRef.current;
      if (!q[i]) return;
      setIndex(i);
      // urutan shuffle di-reset
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
    const audio = audioRef.current;
    if (!audio || !audio.src) return;
    ensureCtx();
    if (audio.paused) audio.play().catch(() => {});
    else audio.pause();
  }, [ensureCtx]);

  const next = useCallback(
    (auto = false) => {
      const q = queueRef.current;
      if (!q.length) return;
      const audio = audioRef.current;
      if (repeat === "one" && auto) {
        if (audio) {
          audio.currentTime = 0;
          audio.play().catch(() => {});
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
            // off & auto → berhenti
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
    const audio = audioRef.current;
    if (audio && audio.currentTime > 3) {
      audio.currentTime = 0;
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

  // beat ticker: dipicu dari canvas (agar komponen lain bisa ikut pulse)
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
