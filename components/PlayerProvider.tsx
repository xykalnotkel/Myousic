"use client";

// Pemutar: HTMLAudio + Web Audio (FX/visualizer) + fallback YouTube IFrame.
// Stream dipasang di belakang iframe supaya suara cepat, gelombang jadi nyata
// begitu URL audio siap.
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
import { DEFAULT_FX, loadFx, makeImpulse, saveFx, type AudioFx } from "@/lib/audioFx";
import { pickThumb } from "@/lib/thumbs";
import { findAltIds } from "@/lib/alts";

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
  engine: "audio" | "yt";
  fx: AudioFx;
  setFx: (p: Partial<AudioFx>) => void;
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
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);
  const [engine, setEngine] = useState<"audio" | "yt">("audio");
  const [fx, setFxState] = useState<AudioFx>(DEFAULT_FX);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const fxNodes = useRef<{
    dry: GainNode;
    wet: GainNode;
    bass: BiquadFilterNode;
    comp: DynamicsCompressorNode;
    conv: ConvolverNode;
  } | null>(null);
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
  const fxRef = useRef<AudioFx>(DEFAULT_FX);
  const wantPlayRef = useRef(false);
  indexRef.current = index;
  queueRef.current = queue;
  volumeRef.current = volume;
  mutedRef.current = muted;
  engineRef.current = engine;
  fxRef.current = fx;

  useEffect(() => {
    const audio = new Audio();
    audio.preload = "auto";
    audio.crossOrigin = "anonymous";
    audio.setAttribute("playsinline", "true");
    (audio as any).playsInline = true;
    audioRef.current = audio;
    (window as any).__kainetAudio = audio;

    audio.addEventListener("timeupdate", () => {
      if (engineRef.current === "audio") setCurrentTime(audio.currentTime);
    });
    audio.addEventListener("durationchange", () => {
      if (engineRef.current === "audio") setDuration(audio.duration || 0);
    });
    audio.addEventListener("play", () => {
      if (engineRef.current === "audio") {
        wantPlayRef.current = true;
        setPlaying(true);
      }
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
      setFxState(loadFx());
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

  const CtxHolder = useMemo(() => ({ get: () => apiRef.current }), []);
  const apiRef = useRef<any>(null);

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

  const applyFx = useCallback((next: AudioFx) => {
    const n = fxNodes.current;
    const an = analyserRef.current;
    if (!n) return;
    n.wet.gain.value = next.reverb;
    n.dry.gain.value = 1 - next.reverb * 0.65;
    n.bass.gain.value = next.bass * 14;
    n.comp.threshold.value = -8 - next.smooth * 18;
    n.comp.ratio.value = 2 + next.smooth * 6;
    if (an) an.smoothingTimeConstant = 0.35 + next.smooth * 0.5;
  }, []);

  useEffect(() => {
    applyFx(fx);
    saveFx(fx);
  }, [fx, applyFx]);

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
      const AC = (window as any).AudioContext || (window as any).webkitAudioContext;
      const ac = new AC();
      const src = ac.createMediaElementSource(audioRef.current!);
      const an = ac.createAnalyser();
      an.fftSize = 1024;
      an.smoothingTimeConstant = 0.55;
      const bass = ac.createBiquadFilter();
      bass.type = "lowshelf";
      bass.frequency.value = 180;
      const dry = ac.createGain();
      const wet = ac.createGain();
      const conv = ac.createConvolver();
      conv.buffer = makeImpulse(ac);
      const comp = ac.createDynamicsCompressor();
      comp.knee.value = 12;
      comp.attack.value = 0.008;
      comp.release.value = 0.22;

      src.connect(an);
      src.connect(bass);
      bass.connect(dry);
      bass.connect(conv);
      conv.connect(wet);
      dry.connect(comp);
      wet.connect(comp);
      comp.connect(ac.destination);

      fxNodes.current = { dry, wet, bass, comp, conv };
      ctxRef.current = ac;
      analyserRef.current = an;
      setAnalyser(an);
      applyFx(fxRef.current);
    }
    if (ctxRef.current && ctxRef.current.state === "suspended") ctxRef.current.resume();
  }, [applyFx]);

  const ensureYt = useCallback(() => {
    if (ytRef.current) return ytRef.current;
    const handle = createYtHandle({
      onPlay: () => {
        if (engineRef.current === "yt") {
          wantPlayRef.current = true;
          setPlaying(true);
          setLoading(false);
          ytRef.current?.setVolume(volumeRef.current);
        }
      },
      onPause: () => {
        if (engineRef.current === "yt") {
          setPlaying(false);
          // YouTube sering pause sendiri saat tab hidden — nyalakan lagi
          if (wantPlayRef.current && document.hidden) {
            window.setTimeout(() => {
              if (wantPlayRef.current && engineRef.current === "yt") ytRef.current?.play();
            }, 250);
          }
        }
      },
      onEnded: () => {
        if (engineRef.current === "yt") CtxHolder.get()?.next(true);
      },
      onError: (_msg) => {
        /* jangan tampilkan — loadTrack yang fallback */
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
      wantPlayRef.current = true;

      const tryYt = async (id: string) => {
        setEngine("yt");
        engineRef.current = "yt";
        const yt = ensureYt();
        yt.setVolume(volumeRef.current);
        yt.setMuted(mutedRef.current);
        await yt.load(id);
        setLoading(false);
        setError(null);
      };

      const tryStream = (id: string) =>
        new Promise<boolean>((resolve) => {
          const src = `/api/stream/${encodeURIComponent(id)}${q ? `?q=${encodeURIComponent(q)}` : ""}`;
          const ok = () => {
            cleanup();
            resolve(true);
          };
          const bad = () => {
            cleanup();
            resolve(false);
          };
          const cleanup = () => {
            audio.removeEventListener("canplay", ok);
            audio.removeEventListener("playing", ok);
            audio.removeEventListener("error", bad);
          };
          try {
            audio.crossOrigin = "anonymous";
            audio.src = src;
            audio.volume = volumeRef.current;
            audio.muted = mutedRef.current;
            audio.addEventListener("canplay", ok);
            audio.addEventListener("playing", ok);
            audio.addEventListener("error", bad);
            audio.load();
            audio.play().catch(() => {});
          } catch {
            resolve(false);
            return;
          }
          window.setTimeout(bad, 7000);
        });

      const adoptStream = async () => {
        engineRef.current = "audio";
        setEngine("audio");
        try {
          ytRef.current?.pause();
        } catch {}
        await audio.play().catch(() => {});
        setLoading(false);
        setError(null);
        setPlaying(true);
      };

      const playId = async (id: string) => {
        const streamP = tryStream(id);
        try {
          await tryYt(id);
          streamP.then((ok) => {
            if (ok && gen === genRef.current) void adoptStream();
          });
          return true;
        } catch {
          const streamed = await streamP;
          if (!streamed || gen !== genRef.current) return false;
          await adoptStream();
          return true;
        }
      };

      let ok = await playId(tr.id);
      if (!ok && gen === genRef.current) {
        setError("Embed ditolak — mencari versi lain…");
        const alts = await findAltIds(tr.title, tr.artist, tr.id);
        for (const id of alts) {
          if (gen !== genRef.current) return;
          ok = await playId(id);
          if (ok) break;
        }
      }

      if (gen !== genRef.current) return;
      if (ok) {
        setError(null);
        setLoading(false);
        // upgrade ke stream (FX + visualizer nyata) kalau iframe yang menang
        if (engineRef.current === "yt") {
          tryStream(tr.id).then(async (streamed) => {
            if (!streamed || gen !== genRef.current) return;
            const t = ytRef.current?.getCurrentTime() || 0;
            engineRef.current = "audio";
            setEngine("audio");
            try {
              ytRef.current?.pause();
            } catch {}
            if (t > 0.4) {
              try {
                audio.currentTime = t;
              } catch {}
            }
            await audio.play().catch(() => {});
          });
        }
      } else {
        setLoading(false);
        setError("Lagu ini tidak bisa diputar (embed & stream ditolak). Coba Lewati atau cari judul resmi/lirik.");
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
      void (async () => {
        const resolved: Track[] = [];
        for (const t of tracks) {
          if (t?.id && /^[A-Za-z0-9_-]{11}$/.test(t.id)) {
            resolved.push(t);
            continue;
          }
          const qq = [t?.title, t?.artist].filter(Boolean).join(" ");
          if (!qq) continue;
          try {
            const r = await fetch(`/api/search?q=${encodeURIComponent(qq)}&type=songs`, { cache: "no-store" });
            const d = await r.json();
            const first = (d.results || []).find((x: { id?: string }) => x.id);
            if (first?.id) {
              resolved.push({
                ...t,
                id: first.id,
                thumbnails: t.thumbnails?.length ? t.thumbnails : first.thumbnails,
                artist: t.artist || first.artist,
              });
            }
          } catch {}
        }
        if (!resolved.length) {
          setError("Tidak ada lagu yang bisa diputar dari daftar ini. Coba cari judulnya.");
          return;
        }
        const si = Math.min(startIndex, resolved.length - 1);
        setQueue(resolved);
        orderRef.current = shuffledIndexes(resolved.length);
        posRef.current = si;
        setIndex(si);
        loadTrack(resolved[si]);
      })();
    },
    [loadTrack]
  );

  const toggle = useCallback(() => {
    if (engineRef.current === "yt" && ytRef.current) {
      if (playing) {
        wantPlayRef.current = false;
        ytRef.current.pause();
      } else {
        wantPlayRef.current = true;
        ytRef.current.play();
      }
      return;
    }
    const audio = audioRef.current;
    if (!audio || !audio.src) return;
    ensureCtx();
    if (audio.paused) {
      wantPlayRef.current = true;
      audio.play().catch(() => {});
    } else {
      wantPlayRef.current = false;
      audio.pause();
    }
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

  const setVolume = useCallback(
    (v: number) => {
      const nv = Math.min(1, Math.max(0, v));
      setVolumeState(nv);
      volumeRef.current = nv;
      if (audioRef.current) audioRef.current.volume = nv;
      ytRef.current?.setVolume(nv);
      if (nv > 0 && muted) setMuted(false);
    },
    [muted]
  );

  const toggleMute = useCallback(() => setMuted((m) => !m), []);
  const toggleShuffle = useCallback(() => setShuffle((s) => !s), []);
  const cycleRepeat = useCallback(
    () => setRepeat((r) => (r === "off" ? "all" : r === "all" ? "one" : "off")),
    []
  );
  const setFx = useCallback((p: Partial<AudioFx>) => {
    setFxState((prev) => ({ ...prev, ...p }));
  }, []);

  const current = index >= 0 ? queue[index] ?? null : null;

  // Media Session — kontrol dari lockscreen / notifikasi (background play)
  useEffect(() => {
    if (typeof navigator === "undefined" || !("mediaSession" in navigator)) return;
    const ms = navigator.mediaSession;
    if (!current?.title) {
      ms.metadata = null;
      return;
    }
    const art = pickThumb(current.thumbnails, 320);
    try {
      ms.metadata = new MediaMetadata({
        title: current.title || "Myousic",
        artist: current.artist || "",
        album: current.album || "Myousic",
        artwork: art
          ? [
              { src: art, sizes: "256x256", type: "image/jpeg" },
              { src: art, sizes: "512x512", type: "image/jpeg" },
            ]
          : [],
      });
    } catch {}
    ms.playbackState = playing ? "playing" : "paused";
    const bind = (name: MediaSessionAction, fn: () => void) => {
      try {
        ms.setActionHandler(name, fn);
      } catch {}
    };
    bind("play", () => apiRef.current?.toggle());
    bind("pause", () => apiRef.current?.toggle());
    bind("previoustrack", () => apiRef.current?.prev());
    bind("nexttrack", () => apiRef.current?.next());
    bind("seekbackward", () => apiRef.current?.seek(Math.max(0, (apiRef.current?.currentTime || 0) - 10)));
    bind("seekforward", () => apiRef.current?.seek((apiRef.current?.currentTime || 0) + 10));
    try {
      if (duration > 0) {
        ms.setPositionState({ duration, playbackRate: 1, position: Math.min(currentTime, duration) });
      }
    } catch {}
  }, [current, playing, duration, currentTime]);

  const value: PlayerCtx = {
    queue,
    index,
    current,
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
    analyser,
    beatVersion,
    fullOpen,
    openFull: () => setFullOpen(true),
    closeFull: () => setFullOpen(false),
    engine,
    fx,
    setFx,
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
