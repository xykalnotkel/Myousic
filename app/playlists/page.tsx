"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  createPlaylist,
  deletePlaylist,
  loadPlaylists,
  type UserPlaylist,
} from "@/lib/playlists";
import { Cover, Icon, I } from "@/components/ui";
import { pickThumb } from "@/lib/thumbs";

export default function PlaylistsPage() {
  const [list, setList] = useState<UserPlaylist[]>([]);
  const [name, setName] = useState("");

  const refresh = () => setList(loadPlaylists());
  useEffect(() => {
    refresh();
    const on = () => refresh();
    window.addEventListener("ms:playlists", on);
    return () => window.removeEventListener("ms:playlists", on);
  }, []);

  return (
    <div>
      <div className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Playlist</h1>
          <p className="text-mut text-sm mt-1">Disimpan di perangkatmu. Tambah lagu dari daftar putar lewat tombol +.</p>
        </div>
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            createPlaylist(name || "Playlist baru");
            setName("");
            refresh();
          }}
        >
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nama playlist…"
            className="bg-white/5 ring-1 ring-line rounded-full px-4 py-2 text-sm outline-none focus:ring-white/30"
          />
          <button type="submit" className="bg-white text-black font-semibold text-sm px-4 py-2 rounded-full">
            Buat
          </button>
        </form>
      </div>

      {list.length === 0 ? (
        <div className="py-16 text-center text-mut">
          <Icon d={I.playlist} size={48} className="mx-auto mb-3 opacity-40" />
          <p className="text-soft font-semibold">Belum ada playlist</p>
          <p className="text-sm mt-1">Buat satu, lalu tambah lagu dari hasil pencarian.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {list.map((p) => (
            <div key={p.id} className="relative group">
              <Link href={`/playlists/${p.id}`} className="card-lift block rounded-xl bg-panel ring-1 ring-line p-3">
                <Cover
                  src={pickThumb(p.tracks[0]?.thumbnails, 240)}
                  title={p.name}
                  size={200}
                  className="w-full aspect-square"
                />
                <p className="mt-3 text-sm font-semibold truncate">{p.name}</p>
                <p className="text-xs text-mut">{p.tracks.length} lagu</p>
              </Link>
              <button
                onClick={() => {
                  if (confirm(`Hapus “${p.name}”?`)) {
                    deletePlaylist(p.id);
                    refresh();
                  }
                }}
                className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/70 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center"
                title="Hapus"
              >
                <Icon d={I.close} size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
