"use client";

import { useEffect, useRef, useState } from "react";
import { addToPlaylist, createPlaylist, loadPlaylists, type UserPlaylist } from "@/lib/playlists";
import type { Track } from "@/lib/types";
import { Icon, I } from "./ui";

export default function AddToPlaylist({ track }: { track: Track }) {
  const [open, setOpen] = useState(false);
  const [list, setList] = useState<UserPlaylist[]>([]);
  const [name, setName] = useState("");
  const box = useRef<HTMLDivElement>(null);

  const refresh = () => setList(loadPlaylists());

  useEffect(() => {
    if (!open) return;
    refresh();
    const onDoc = (e: MouseEvent) => {
      if (!box.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  return (
    <div className="relative" ref={box}>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        className="w-8 h-8 rounded-full text-mut hover:text-white hover:bg-white/10 flex items-center justify-center"
        title="Tambah ke playlist"
      >
        <Icon d={I.add} size={18} />
      </button>
      {open && (
        <div className="absolute right-0 bottom-full mb-1 z-50 w-56 rounded-xl bg-[#111] ring-1 ring-white/15 shadow-2xl p-2">
          <p className="px-2 py-1 text-[10px] uppercase tracking-[0.2em] text-mut">Playlist-mu</p>
          <div className="max-h-44 overflow-y-auto">
            {list.length === 0 && <p className="px-2 py-2 text-xs text-mut">Belum ada playlist.</p>}
            {list.map((p) => (
              <button
                key={p.id}
                onClick={(e) => {
                  e.stopPropagation();
                  addToPlaylist(p.id, track);
                  setOpen(false);
                }}
                className="w-full text-left px-2 py-1.5 rounded-lg text-sm hover:bg-white/10 truncate"
              >
                {p.name}
                <span className="text-mut text-[11px]"> · {p.tracks.length}</span>
              </button>
            ))}
          </div>
          <form
            className="mt-1 flex gap-1 border-t border-line pt-2"
            onSubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();
              const pl = createPlaylist(name || "Playlist baru", [track]);
              setName("");
              setOpen(false);
              void pl;
            }}
          >
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              placeholder="Playlist baru…"
              className="flex-1 min-w-0 bg-white/5 rounded-lg px-2 py-1 text-xs outline-none"
            />
            <button type="submit" className="text-xs font-semibold px-2 py-1 rounded-lg bg-white text-black">
              Buat
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
