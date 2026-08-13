"use client";

import { bestThumb } from "@/lib/types";

// ---------- Ikon (inline SVG, monokrom) ----------
export function Icon({ d, size = 22, className }: { d: string; size?: number; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="currentColor"
      className={className}
      aria-hidden
    >
      <path d={d} />
    </svg>
  );
}

export const I = {
  play: "M8 5.14v13.72c0 .9.98 1.44 1.74.96l10.4-6.86a1.14 1.14 0 0 0 0-1.92L9.74 4.18A1.14 1.14 0 0 0 8 5.14z",
  pause:
    "M7 5.5A1.5 1.5 0 0 1 8.5 4h1A1.5 1.5 0 0 1 11 5.5v13A1.5 1.5 0 0 1 9.5 20h-1A1.5 1.5 0 0 1 7 18.5v-13zm6 0A1.5 1.5 0 0 1 14.5 4h1A1.5 1.5 0 0 1 17 5.5v13a1.5 1.5 0 0 1-1.5 1.5h-1a1.5 1.5 0 0 1-1.5-1.5v-13z",
  next: "M6 5.5v13a1 1 0 0 0 1.53.85l10.2-6.5a1 1 0 0 0 0-1.7L7.53 4.65A1 1 0 0 0 6 5.5zM19 4a1 1 0 0 1 1 1v14a1 1 0 1 1-2 0V5a1 1 0 0 1 1-1z",
  prev: "M18 5.5v13a1 1 0 0 1-1.53.85l-10.2-6.5a1 1 0 0 1 0-1.7l10.2-6.5A1 1 0 0 1 18 5.5zM5 4a1 1 0 0 0-1 1v14a1 1 0 1 0 2 0V5a1 1 0 0 0-1-1z",
  shuffle:
    "M3 6.5A1.5 1.5 0 0 1 4.5 5h2.1c.8 0 1.57.32 2.14.89l3.06 3.06a1 1 0 0 1-1.41 1.42L7.32 7.3a.5.5 0 0 0-.36-.15h-2.1A.35.35 0 0 1 4.5 6.8h-1.5zM3 17.5a1.5 1.5 0 0 0 1.5 1.5h2.1c.4 0 .78-.16 1.06-.44l7.47-7.47a.5.5 0 0 1 .36-.15h2.51a.5.5 0 0 1 .35.85l-1.5 1.5a.5.5 0 0 1-.7 0l-.8-.8-3.63 3.63-1.5 1.5a2.5 2.5 0 0 1-1.77.73h-2.6A1.5 1.5 0 0 1 3 17.5zm18-11a1.5 1.5 0 0 0-1.5-1.5h-2.1c-.4 0-.78.16-1.06.44l-1.94 1.94a1 1 0 0 0 1.41 1.42l1.5-1.5a.5.5 0 0 1 .35-.15h2.1a.5.5 0 0 1 .35.85l-1.5 1.5a.5.5 0 0 1-.71 0l-.8-.8-1.44 1.44a1 1 0 0 0 1.41 1.42l1.94-1.94c.28-.28.66-.44 1.06-.44h.09a1.5 1.5 0 0 0 1.2-.6z",
  repeat: "M7 7.5h10a1 1 0 0 1 1 1v3a1 1 0 1 0 2 0v-3a3 3 0 0 0-3-3H7V3.8a.6.6 0 0 0-.98-.47l-3.4 2.8a.6.6 0 0 0 0 .94l3.4 2.8a.6.6 0 0 0 .98-.47V7.5zM17 16.5H7a1 1 0 0 1-1-1v-3a1 1 0 1 0-2 0v3a3 3 0 0 0 3 3h10v1.7a.6.6 0 0 0 .98.47l3.4-2.8a.6.6 0 0 0 0-.94l-3.4-2.8a.6.6 0 0 0-.98.47v1.9z",
  repeatOne:
    "M7 7.5h8.5a1 1 0 0 1 1 1v3a1 1 0 1 0 2 0v-3a3 3 0 0 0-3-3H7V3.8a.6.6 0 0 0-.98-.47l-3.4 2.8a.6.6 0 0 0 0 .94l3.4 2.8a.6.6 0 0 0 .98-.47V7.5zM17 16.5h-8.5a1 1 0 0 1-1-1v-3a1 1 0 1 0-2 0v3a3 3 0 0 0 3 3H17v1.7a.6.6 0 0 0 .98.47l3.4-2.8a.6.6 0 0 0 0-.94l-3.4-2.8a.6.6 0 0 0-.98.47v1.9zM11 10.5a1 1 0 0 1 1 1v3a1 1 0 1 1-2 0v-1.3l-.6.4a1 1 0 0 1-1.05-1.7l1.8-1.2a1 1 0 0 1 .85-.2z",
  volume: "M3.5 9.5v5h2.8l3.9 3.2a.6.6 0 0 0 .98-.47V6.77a.6.6 0 0 0-.98-.47l-3.9 3.2h-2.8zM16.7 7.3a1 1 0 0 1 1.4 0A5.9 5.9 0 0 1 20 12a5.9 5.9 0 0 1-1.9 4.7 1 1 0 0 1-1.32-1.5A3.9 3.9 0 0 0 18 12c0-1.13-.45-2.2-1.3-3.2a1 1 0 0 1 0-1.5z",
  mute: "M3.5 9.5v5h2.8l3.9 3.2a.6.6 0 0 0 .98-.47v-10.5a.6.6 0 0 0-.98-.47l-3.9 3.2h-2.8zM16.4 8.6a1 1 0 0 1 1.4 0l1.2 1.2 1.2-1.2a1 1 0 1 1 1.4 1.4l-1.2 1.2 1.2 1.2a1 1 0 0 1-1.4 1.4l-1.2-1.2-1.2 1.2a1 1 0 0 1-1.4-1.4l1.2-1.2-1.2-1.2a1 1 0 0 1 0-1.4z",
  search:
    "M10.5 4a6.5 6.5 0 1 0 4.02 11.55l4.24 4.24a1 1 0 0 0 1.41-1.41l-4.24-4.24A6.5 6.5 0 0 0 10.5 4zm0 2a4.5 4.5 0 1 1 0 9 4.5 4.5 0 0 1 0-9z",
  trending:
    "M4 20v-9h4v9H4zm6 0V5h4v15h-4zm6 0v-12h4v12h-4z",
  user:
    "M12 11.5a4.75 4.75 0 1 0 0-9.5 4.75 4.75 0 0 0 0 9.5zm0 2c-5.4 0-9.5 2.8-9.5 6.4V22h19v-2.1c0-3.6-4.1-6.4-9.5-6.4z",
  home: "M12 3.6a1.6 1.6 0 0 1 1.1.44l6.6 6.3a1.6 1.6 0 0 1 .5 1.15V19a1.6 1.6 0 0 1-1.6 1.6h-3.4a1 1 0 0 1-1-1v-4.2a.8.8 0 0 0-.8-.8h-2.8a.8.8 0 0 0-.8.8V19.6a1 1 0 0 1-1 1H5.4A1.6 1.6 0 0 1 3.8 19v-7.51a1.6 1.6 0 0 1 .5-1.15l6.6-6.3a1.6 1.6 0 0 1 1.1-.44z",
  close: "M6.4 5.3a1 1 0 0 0-1.4 1.4L10.6 12l-5.6 5.3a1 1 0 1 0 1.4 1.4l5.6-5.3 5.6 5.3a1 1 0 0 0 1.4-1.4L13.4 12l5.6-5.3a1 1 0 0 0-1.4-1.4L12 10.6 6.4 5.3z",
  queue: "M4 6h10a1 1 0 1 0 0-2H4a1 1 0 1 0 0 2zm0 4h10a1 1 0 1 0 0-2H4a1 1 0 1 0 0 2zm0 4h6a1 1 0 1 0 0-2H4a1 1 0 1 0 0 2zm13.5-2.3a1 1 0 0 1 1.5.87v6.86a1 1 0 0 1-1.5.87l-5.4-3.4a1 1 0 0 1 0-1.74l5.4-3.43z",
  music: "M9 3.6a1 1 0 0 1 .79-.98l8-1.8a1 1 0 0 1 1.2.98v11.5a3 3 0 0 1 .6-.07c1.9 0 3.4 1.3 3.4 3s-1.5 3-3.4 3-3.4-1.3-3.4-3V6.7l-6 1.35v8.28a3 3 0 0 1 .6-.07c1.9 0 3.4 1.3 3.4 3s-1.5 3-3.4 3-3.4-1.3-3.4-3V3.6z",
  arrowDown: "M12 4a1 1 0 0 1 1 1v12.6l5.3-5.3a1 1 0 1 1 1.4 1.4l-7 7a1 1 0 0 1-1.4 0l-7-7a1 1 0 1 1 1.4-1.4l5.3 5.3V5a1 1 0 0 1 1-1z",
};

// ---------- Cover art ----------
const FALLBACK_ARTS = [
  "/illustrations/vinyl-wave.webp",
  "/illustrations/headphone-peaks.webp",
  "/illustrations/cassette-garden.webp",
  "/illustrations/speaker-notes.webp",
  "/illustrations/turntable-orbit.webp",
  "/illustrations/radio-galaxy.webp",
  "/illustrations/piano-skyline.webp",
  "/illustrations/mic-bloom.webp",
];

function fallbackArt(title: string): string {
  let h = 0;
  for (let i = 0; i < title.length; i++) h = (h * 31 + title.charCodeAt(i)) >>> 0;
  return FALLBACK_ARTS[h % FALLBACK_ARTS.length];
}

export function Cover({
  src,
  title = "?",
  size = 48,
  className = "",
  rounded = "rounded-lg",
  sizeClass,
}: {
  src?: string;
  title?: string;
  size?: number;
  className?: string;
  rounded?: string;
  sizeClass?: string;
}) {
  return (
    <div
      className={`${rounded} bg-elev shrink-0 overflow-hidden relative flex items-center justify-center ${sizeClass ?? ""} ${className}`}
      style={sizeClass ? undefined : { width: size, height: size }}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={title} className="w-full h-full object-cover" loading="lazy" />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={fallbackArt(title)}
          alt=""
          className="w-full h-full object-cover opacity-70 bg-gradient-to-br from-[#151515] to-[#0a0a0a]"
          loading="lazy"
        />
      )}
    </div>
  );
}

// ---------- Equalizer animasi ----------
export function Equalizer({ size = 14, active = false }: { size?: number; active?: boolean }) {
  return (
    <div className={`flex items-end gap-[2px] ${active ? "" : "eq-paused"}`} style={{ height: size }}>
      {[0.9, 0.6, 1.1, 0.7].map((d, i) => (
        <span
          key={i}
          className="eq-bar w-[3px] bg-white rounded-full"
          style={{ height: size, animationDelay: `${i * 0.12}s`, animationDuration: `${0.8 + d * 0.35}s` }}
        />
      ))}
    </div>
  );
}

// ---------- Format angka ----------
export function useThumb(t?: string[]): string | undefined {
  return bestThumb(t);
}
