"use client";

import { usePlayer } from "./PlayerProvider";
import { Cover, Icon, I, Equalizer } from "./ui";
import AddToPlaylist from "./AddToPlaylist";
import { pickThumb } from "@/lib/thumbs";
import { fmtDur } from "@/lib/types";
import type { Track } from "@/lib/types";

export default function TrackList({ tracks }: { tracks: Track[] }) {
  const { playContext, current, playing } = usePlayer();
  if (!tracks.length) return null;

  return (
    <div className="rounded-2xl bg-white/[0.03] ring-1 ring-white/8 overflow-hidden divide-y divide-white/5">
      {tracks.map((t, i) => {
        const isCurrent = current?.id === t.id && !!current?.id;
        return (
          <div
            key={`${t.id}-${i}`}
            className={`flex items-center gap-3 px-3 py-2.5 ${isCurrent ? "bg-white/[0.06]" : ""}`}
          >
            <button
              onClick={() => playContext(tracks, i)}
              className="w-6 shrink-0 text-[12px] tabular-nums text-mut flex items-center justify-center"
            >
              {isCurrent && playing ? <Equalizer size={12} active /> : i + 1}
            </button>
            <button onClick={() => playContext(tracks, i)} className="flex items-center gap-3 min-w-0 flex-1 text-left">
              <Cover src={pickThumb(t.thumbnails, 80)} title={t.title} size={44} rounded="rounded-md" />
              <span className="min-w-0">
                <span className={`block truncate text-sm ${isCurrent ? "font-semibold" : "text-soft"}`}>{t.title}</span>
                <span className="block truncate text-xs text-mut">{t.artist || "—"}</span>
              </span>
            </button>
            <span className="flex items-center gap-0.5 shrink-0">
              <AddToPlaylist track={t} />
              <span className="text-xs tabular-nums text-mut w-10 text-right hidden sm:block">
                {t.durationText || fmtDur(t.duration)}
              </span>
              <button
                onClick={() => playContext(tracks, i)}
                className="w-9 h-9 rounded-full bg-white text-black flex items-center justify-center sm:hidden"
              >
                <Icon d={isCurrent && playing ? I.pause : I.play} size={14} className={isCurrent && playing ? "" : "ml-0.5"} />
              </button>
            </span>
          </div>
        );
      })}
    </div>
  );
}
