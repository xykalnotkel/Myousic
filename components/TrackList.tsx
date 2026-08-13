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
    <div className="rounded-xl bg-white/[0.02] ring-1 ring-line overflow-hidden">
      <div className="grid grid-cols-[32px_1fr_2fr_1fr_96px] items-center gap-3 px-4 py-2.5 text-[11px] uppercase tracking-[0.2em] text-mut border-b border-line hidden sm:grid">
        <span>#</span>
        <span>Judul</span>
        <span>Artis / Album</span>
        <span className="hidden md:block">Info</span>
        <span className="text-right">Durasi</span>
      </div>

      {tracks.map((t, i) => {
        const isCurrent = current?.id === t.id && !!current?.id;
        return (
          <div
            key={`${t.id}-${i}`}
            className={`group grid grid-cols-[24px_minmax(0,1fr)_auto] sm:grid-cols-[32px_1fr_2fr_1fr_96px] items-center gap-3 px-3 sm:px-4 py-2 transition-colors ${
              isCurrent ? "bg-white/[0.07]" : "hover:bg-white/[0.04]"
            }`}
          >
            <button
              onClick={() => playContext(tracks, i)}
              className="w-5 text-sm tabular-nums text-mut flex items-center justify-center"
              title="Putar"
            >
              {isCurrent && playing ? (
                <Equalizer size={14} active />
              ) : (
                <>
                  <span className="group-hover:hidden">{i + 1}</span>
                  <span className="hidden group-hover:flex text-white">
                    <Icon d={I.play} size={15} />
                  </span>
                </>
              )}
            </button>
            <button onClick={() => playContext(tracks, i)} className="flex items-center gap-3 min-w-0 text-left">
              <Cover src={pickThumb(t.thumbnails, 80)} title={t.title} size={40} className="opacity-90" />
              <span className="min-w-0">
                <span className={`block truncate text-sm ${isCurrent ? "text-white font-semibold" : "text-soft"}`}>
                  {t.title}
                </span>
                <span className="block sm:hidden truncate text-xs text-mut">{t.artist || "—"}</span>
              </span>
            </button>
            <button onClick={() => playContext(tracks, i)} className="hidden sm:block truncate text-sm text-mut text-left">
              {t.artist || "—"}
            </button>
            <span className="hidden md:block truncate text-xs text-mut">
              {t.album || (t.views != null ? `${fmtDur(t.duration)}` : "")}
            </span>
            <span className="flex items-center justify-end gap-0.5">
              <AddToPlaylist track={t} />
              <span className="text-sm tabular-nums text-mut w-10 text-right">
                {t.durationText || fmtDur(t.duration)}
              </span>
            </span>
          </div>
        );
      })}
    </div>
  );
}
