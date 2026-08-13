"use client";

import { usePlayer } from "./PlayerProvider";
import { Cover, Icon, I } from "./ui";
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
      className="shrink-0 w-[132px] sm:w-40 text-left"
    >
      <div className="relative rounded-xl overflow-hidden ring-1 ring-white/10">
        <Cover src={pickThumb(t.thumbnails, 240)} title={t.title} className="w-full" rounded="rounded-none" />
        <span className="absolute bottom-2 right-2 w-8 h-8 rounded-full bg-white text-black flex items-center justify-center shadow-lg">
          {on && playing ? <Icon d={I.pause} size={14} /> : <Icon d={I.play} size={14} className="ml-0.5" />}
        </span>
      </div>
      <p className={`mt-2 text-[13px] font-semibold truncate ${on ? "text-white" : "text-soft"}`}>{t.title}</p>
      <p className="text-[11px] text-mut truncate">{t.artist || "Lagu"}</p>
    </button>
  );
}
