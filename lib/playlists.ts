// Playlist lokal (localStorage) — tanpa akun.
import type { Track } from "./types";

export interface UserPlaylist {
  id: string;
  name: string;
  tracks: Track[];
  createdAt: number;
  updatedAt: number;
}

const KEY = "ms:playlists";

function uid() {
  return "pl_" + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

export function loadPlaylists(): UserPlaylist[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

export function savePlaylists(list: UserPlaylist[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
    window.dispatchEvent(new CustomEvent("ms:playlists"));
  } catch {}
}

export function createPlaylist(name: string, tracks: Track[] = []): UserPlaylist {
  const list = loadPlaylists();
  const pl: UserPlaylist = {
    id: uid(),
    name: name.trim() || "Playlist baru",
    tracks,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  savePlaylists([pl, ...list]);
  return pl;
}

export function renamePlaylist(id: string, name: string) {
  savePlaylists(
    loadPlaylists().map((p) =>
      p.id === id ? { ...p, name: name.trim() || p.name, updatedAt: Date.now() } : p
    )
  );
}

export function deletePlaylist(id: string) {
  savePlaylists(loadPlaylists().filter((p) => p.id !== id));
}

export function addToPlaylist(id: string, track: Track) {
  savePlaylists(
    loadPlaylists().map((p) => {
      if (p.id !== id) return p;
      if (track.id && p.tracks.some((t) => t.id === track.id)) return p;
      return { ...p, tracks: [...p.tracks, track], updatedAt: Date.now() };
    })
  );
}

export function removeFromPlaylist(id: string, index: number) {
  savePlaylists(
    loadPlaylists().map((p) => {
      if (p.id !== id) return p;
      const tracks = p.tracks.slice();
      tracks.splice(index, 1);
      return { ...p, tracks, updatedAt: Date.now() };
    })
  );
}
