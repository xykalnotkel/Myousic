"use client";

import { useState } from "react";
import { pickThumb, sizedThumb } from "@/lib/thumbs";

// ---------- Ikon (Material-style 24×24, fill — pasti tampil) ----------
export function Icon({
  d,
  size = 22,
  className,
}: {
  d: string;
  size?: number;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="currentColor"
      className={`fill-current shrink-0 ${className ?? ""}`}
      aria-hidden
      style={{ display: "block", flexShrink: 0 }}
    >
      <path d={d} fillRule="evenodd" clipRule="evenodd" />
    </svg>
  );
}

export const I = {
  play: "M8 5v14l11-7z",
  pause: "M6 19h4V5H6v14zm8-14v14h4V5h-4z",
  next: "M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z",
  prev: "M6 6h2v12H6zm3.5 6l8.5 6V6z",
  shuffle:
    "M10.59 9.17L5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41l-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z",
  repeat:
    "M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z",
  repeatOne:
    "M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4zM13 15V9h-1l-2 1v1h1.5v4H13z",
  volume:
    "M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z",
  mute: "M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z",
  search:
    "M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z",
  trending: "M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6z",
  user: "M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z",
  home: "M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z",
  close:
    "M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z",
  queue:
    "M15 6H3v2h12V6zm0 4H3v2h12v-2zM3 16h8v-2H3v2zM17 6v8.18c-.31-.11-.65-.18-1-.18-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3V8h3V6h-5z",
  music:
    "M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z",
  arrowDown: "M16.59 8.59L12 13.17 7.41 8.59 6 10l6 6 6-6z",
  playlist:
    "M4 10h12v2H4zm0-4h12v2H4zm0 8h8v2H4zm10 0v6l5-3z",
  add: "M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z",
  fx: "M7 18h2V6H7v12zm4 4h2V2h-2v20zm-8-8h2v-4H3v4zm12 4h2V10h-2v8zm4-8h2V8h-2v2z",
  library:
    "M20 2H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 5h-3v5.5c0 1.38-1.12 2.5-2.5 2.5S10 13.88 10 12.5s1.12-2.5 2.5-2.5c.57 0 1.08.19 1.5.51V5h4v2zM4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6z",
  chevronL: "M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z",
  chevronR: "M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z",
  expand: "M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z",
};

const FALLBACK_ARTS = [
  "/illustrations/hero-vinyl.jpg",
  "/illustrations/hero-headphone.jpg",
  "/illustrations/hero-stage.jpg",
  "/illustrations/hero-wave.jpg",
  "/illustrations/hero-rinjani.jpg",
  "/illustrations/vinyl-wave.webp",
  "/illustrations/headphone-peaks.webp",
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
  priority = false,
  circle = false,
}: {
  src?: string;
  title?: string;
  size?: number;
  className?: string;
  rounded?: string;
  sizeClass?: string;
  priority?: boolean;
  circle?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const shape = circle ? "rounded-full" : rounded;
  const px = sizeClass ? 240 : size <= 56 ? 120 : size <= 120 ? 240 : 480;
  const url = !failed ? sizedThumb(src, px) : undefined;
  const fb = fallbackArt(title);

  return (
    <div
      className={`${shape} bg-elev shrink-0 overflow-hidden relative flex items-center justify-center ${sizeClass ?? ""} ${className}`}
      style={sizeClass ? undefined : { width: size, height: size }}
    >
      {!loaded && <div className="absolute inset-0 skeleton" />}
      <img
        src={url || fb}
        alt={title}
        width={size}
        height={size}
        decoding="async"
        loading={priority ? "eager" : "lazy"}
        fetchPriority={priority ? "high" : "low"}
        ref={(el) => {
          if (el?.complete && el.naturalWidth > 0) setLoaded(true);
        }}
        onLoad={() => setLoaded(true)}
        onError={() => {
          if (!failed) setFailed(true);
        }}
        className={`w-full h-full object-cover ${!url ? "opacity-70" : ""}`}
      />
    </div>
  );
}

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

export function useThumb(t?: string[]): string | undefined {
  return pickThumb(t, 240);
}
