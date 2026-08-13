"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  deletePlaylist,
  loadPlaylists,
  removeFromPlaylist,
  renamePlaylist,
  type UserPlaylist,
} from "@/lib/playlists";
import TrackList from "@/components/TrackList";
import { Cover, Icon, I } from "@/components/ui";
import { pickThumb } from "@/lib/thumbs";
import { usePlayer } from "@/components/PlayerProvider";

export default function PlaylistDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { playContext } = usePlayer();
  const [pl, setPl] = useState<UserPlaylist | null>(null);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");

  const refresh = () => {
    const found = loadPlaylists().find((p) => p.id === id) ?? null;
    setPl(found);
    if (found) setName(found.name);
  };

  useEffect(() => {
    refresh();
    const on = () => refresh();
    window.addEventListener("ms:playlists", on);
    return () => window.removeEventListener("ms:playlists", on);
  }, [id]);

  if (!pl) {
    return (
      <div className="py-20 text-center text-mut">
        Playlist tidak ditemukan.{" "}
        <button onClick={() => router.push("/playlists")} className="underline">
          Kembali
        </button>
      </div>
    );
  }

  const art = pickThumb(pl.tracks[0]?.thumbnails, 320);

  return (
    <div>
      <div className="relative overflow-hidden rounded-3xl ring-1 ring-line mb-8">
        {art && (
          <div
            aria-hidden
            className="absolute inset-0"
            style={{
              backgroundImage: `url(${art})`,
              backgroundSize: "cover",
              filter: "blur(70px) brightness(0.35)",
              transform: "scale(1.4)",
            }}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-[#050505]" />
        <div className="relative p-6 md:p-10 flex flex-col md:flex-row items-center md:items-end gap-8">
          <Cover src={art} title={pl.name} size={200} rounded="rounded-2xl" />
          <div className="text-center md:text-left flex-1">
            <p className="text-[11px] uppercase tracking-[0.35em] text-soft mb-2">Playlist kamu</p>
            {editing ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  renamePlaylist(pl.id, name);
                  setEditing(false);
                  refresh();
                }}
                className="flex gap-2"
              >
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="bg-white/10 rounded-lg px-3 py-1 text-2xl font-extrabold outline-none"
                  autoFocus
                />
                <button className="text-sm underline">Simpan</button>
              </form>
            ) : (
              <h1 className="text-3xl md:text-5xl font-extrabold tracking-tighter text-glow">{pl.name}</h1>
            )}
            <p className="text-mut mt-3 text-sm">{pl.tracks.length} lagu</p>
            <div className="mt-5 flex flex-wrap gap-2 justify-center md:justify-start">
              <button
                onClick={() => playContext(pl.tracks, 0)}
                disabled={!pl.tracks.length}
                className="inline-flex items-center gap-2 bg-white text-black font-bold px-5 py-2.5 rounded-full disabled:opacity-40"
              >
                <Icon d={I.play} size={16} /> Putar semua
              </button>
              <button onClick={() => setEditing((v) => !v)} className="px-4 py-2.5 rounded-full bg-white/10 text-sm">
                Ganti nama
              </button>
              <button
                onClick={() => {
                  if (confirm("Hapus playlist ini?")) {
                    deletePlaylist(pl.id);
                    router.push("/playlists");
                  }
                }}
                className="px-4 py-2.5 rounded-full bg-white/10 text-sm text-mut"
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      </div>

      <TrackList tracks={pl.tracks} />

      {pl.tracks.length > 0 && (
        <div className="mt-4 space-y-1">
          {pl.tracks.map((t, i) => (
            <div key={`${t.id}-${i}`} className="flex justify-end">
              <button
                onClick={() => {
                  removeFromPlaylist(pl.id, i);
                  refresh();
                }}
                className="text-[11px] text-mut hover:text-white underline"
              >
                Hapus “{t.title}” dari playlist
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
