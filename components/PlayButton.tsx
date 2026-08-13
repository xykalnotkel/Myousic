"use client";

import { usePlayer } from "./PlayerProvider";
import { Icon, I } from "./ui";
import type { Track } from "@/lib/types";

export default function PlayButton({ tracks, label = "Putar" }: { tracks: Track[]; label?: string }) {
  const { playContext } = usePlayer();
  if (!tracks.length) return null;
  return (
    <button
      onClick={() => playContext(tracks, 0)}
      className="inline-flex items-center gap-2 bg-white text-black font-bold px-5 py-2.5 rounded-full hover:scale-[1.03] active:scale-[0.98] transition-transform"
    >
      <Icon d={I.play} size={16} />
      {label}
    </button>
  );
}
