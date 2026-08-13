// Fallback pemutar: YouTube IFrame API.
// Request berasal dari IP user (bukan Vercel), jadi lolos bot-check
// yang memblokir InnerTube dari datacenter. Visualizer pakai spektrum sintetis.

export type YtHandle = {
  load: (videoId: string) => Promise<void>;
  play: () => void;
  pause: () => void;
  seek: (t: number) => void;
  setVolume: (v: number) => void;
  setMuted: (m: boolean) => void;
  getCurrentTime: () => number;
  getDuration: () => number;
  destroy: () => void;
};

type Handlers = {
  onPlay: () => void;
  onPause: () => void;
  onEnded: () => void;
  onError: (msg: string) => void;
};

declare global {
  interface Window {
    YT?: any;
    onYouTubeIframeAPIReady?: () => void;
  }
}

let apiPromise: Promise<void> | null = null;

function loadApi(): Promise<void> {
  if (typeof window === "undefined") return Promise.reject(new Error("ssr"));
  if (window.YT?.Player) return Promise.resolve();
  if (apiPromise) return apiPromise;
  apiPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector('script[src*="youtube.com/iframe_api"]');
    const done = () => {
      if (window.YT?.Player) resolve();
      else reject(new Error("YouTube IFrame API gagal dimuat"));
    };
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      try {
        prev?.();
      } catch {}
      done();
    };
    if (!existing) {
      const s = document.createElement("script");
      s.src = "https://www.youtube.com/iframe_api";
      s.async = true;
      s.onerror = () => reject(new Error("Gagal memuat YouTube IFrame API"));
      document.head.appendChild(s);
    }
    // kalau script sudah ada dan YT sudah siap
    if (window.YT?.Player) resolve();
  });
  return apiPromise;
}

const ERR: Record<number, string> = {
  2: "Video id tidak valid",
  5: "Pemutar HTML5 YouTube error",
  100: "Video tidak ditemukan atau privat",
  101: "Pemilik video menonaktifkan embed",
  150: "Pemilik video menonaktifkan embed",
};

export function createYtHandle(h: Handlers): YtHandle {
  let player: any = null;
  let host: HTMLDivElement | null = null;
  let ready = false;
  let readyWait: Array<() => void> = [];
  let pending: { resolve: () => void; reject: (e: Error) => void } | null = null;

  const whenReady = () =>
    ready && player
      ? Promise.resolve()
      : new Promise<void>((res) => readyWait.push(res));

  const fail = (msg: string) => {
    h.onError(msg);
    pending?.reject(new Error(msg));
    pending = null;
  };

  return {
    async load(videoId: string) {
      await loadApi();
      if (!player) {
        host = document.createElement("div");
        host.id = "myousic-yt-host";
        host.setAttribute("aria-hidden", "true");
        // Harus tetap di viewport — YouTube pause kalau player di luar layar.
        host.style.cssText =
          "position:fixed;right:10px;bottom:10px;width:42px;height:42px;opacity:0.02;overflow:hidden;pointer-events:none;z-index:1;border-radius:8px";
        document.body.appendChild(host);
        const mount = document.createElement("div");
        host.appendChild(mount);
        player = new window.YT.Player(mount, {
          width: 42,
          height: 42,
          videoId,
          host: "https://www.youtube.com",
          playerVars: {
            autoplay: 1,
            controls: 0,
            disablekb: 1,
            fs: 0,
            modestbranding: 1,
            playsinline: 1,
            rel: 0,
            origin: window.location.origin,
          },
          events: {
            onReady: () => {
              ready = true;
              readyWait.splice(0).forEach((fn) => fn());
              try {
                player.playVideo();
              } catch {}
            },
            onStateChange: (e: any) => {
              const YT = window.YT;
              if (!YT) return;
              if (e.data === YT.PlayerState.PLAYING) {
                pending?.resolve();
                pending = null;
                h.onPlay();
              } else if (e.data === YT.PlayerState.PAUSED) h.onPause();
              else if (e.data === YT.PlayerState.ENDED) h.onEnded();
            },
            onError: (e: any) => {
              fail(ERR[e?.data] || `YouTube error ${e?.data ?? ""}`);
            },
          },
        });
        await whenReady();
        return new Promise<void>((resolve, reject) => {
          pending = { resolve, reject };
          try {
            player.playVideo();
          } catch {}
          window.setTimeout(() => {
            if (pending) {
              // sudah play atau masih buffering — anggap sukses biar UI tidak menggantung
              pending.resolve();
              pending = null;
            }
          }, 8000);
        });
      }
      await whenReady();
      return new Promise<void>((resolve, reject) => {
        pending = { resolve, reject };
        player.loadVideoById(videoId);
        try {
          player.playVideo();
        } catch {}
        window.setTimeout(() => {
          if (pending) {
            pending.resolve();
            pending = null;
          }
        }, 8000);
      });
    },
    play() {
      try {
        player?.playVideo();
      } catch {}
    },
    pause() {
      try {
        player?.pauseVideo();
      } catch {}
    },
    seek(t: number) {
      try {
        player?.seekTo(t, true);
      } catch {}
    },
    setVolume(v: number) {
      try {
        player?.setVolume(Math.round(Math.min(1, Math.max(0, v)) * 100));
      } catch {}
    },
    setMuted(m: boolean) {
      try {
        if (m) player?.mute();
        else player?.unMute();
      } catch {}
    },
    getCurrentTime() {
      try {
        return player?.getCurrentTime?.() || 0;
      } catch {
        return 0;
      }
    },
    getDuration() {
      try {
        return player?.getDuration?.() || 0;
      } catch {
        return 0;
      }
    },
    destroy() {
      try {
        player?.destroy?.();
      } catch {}
      player = null;
      ready = false;
      host?.remove();
      host = null;
    },
  };
}
