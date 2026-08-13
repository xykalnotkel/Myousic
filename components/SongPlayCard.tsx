"use client";

import { usePlayer } from "./PlayerProvider";
import { Cover } from "./ui";
import { pickThumb } from "@/lib/thumbs";
import type { Track } from "@/lib/types";

export default function SongPlayCard({ tracks, index }: { tracks: Track[]; index: number }) {
  const { playContext, current, playing } = usePlayer();
  const t = tracks[index];
  if (!t) return null;
  const on = current?.id === t.id;
  return (
    <button
      onClick={() => playContext(tracks, index)}
      className="card-lift shrink-0 w-36 sm:w-40 rounded-xl bg-panel ring-1 ring-line p-2.5 text-left overflow-hidden"
    >
      <Cover src={pickThumb(t.thumbnails, 240)} title={t.title} className="w-full" rounded="rounded-lg" />
      <p className={`mt-2.5 text-sm font-semibold truncate ${on ? "text-white" : ""}`}>{t.title}</p>
      <p className="text-[11px] text-mut truncate">{on && playing ? "Sedang diputar" : t.artist || "Lagu"}</p>
    </button>
  );
}
