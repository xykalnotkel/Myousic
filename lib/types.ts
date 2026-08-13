// Tipe data bersama (disesuaikan output lib/kainet)
export interface Track {
  id?: string;
  type?: string;
  title?: string;
  artist?: string;
  album?: string;
  duration?: number;
  durationText?: string;
  plays?: number;
  views?: number;
  thumbnails?: string[];
  browseId?: string;
}

export interface AlbumInfo {
  type: string;
  browseId?: string;
  title?: string;
  artist?: string;
  year?: string;
  tracks: Track[];
}

export interface PlaylistInfo {
  type: string;
  browseId?: string;
  title?: string;
  trackCount?: number;
  tracks: Track[];
}

export interface ArtistInfo {
  type: string;
  browseId?: string;
  title?: string;
  subscribers?: string;
  thumbnails?: string[];
}

export interface SuggestionItem {
  type: string;
  browseId?: string;
  title?: string;
  thumbnails?: string[];
}

export type SearchTypeKey = "songs" | "videos" | "albums" | "playlists" | "artists";

export interface SearchResultItem extends Track, Partial<ArtistInfo> {
  type: string;
  browseId?: string;
  trackCount?: number;
  year?: string;
  subscribers?: string;
}

export function fmtDur(sec?: number): string {
  if (sec == null || isNaN(sec)) return "—";
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  const mm = String(m).padStart(2, "0");
  const ss = String(s).padStart(2, "0");
  return h > 0 ? `${h}:${mm}:${ss}` : `${m}:${ss}`;
}

export function fmtCount(n?: number): string {
  if (n == null) return "";
  if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(1).replace(/\.0$/, "") + "B";
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "jt";
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, "") + "rb";
  return String(n);
}

export function bestThumb(thumbnails?: string[]): string | undefined {
  if (!thumbnails?.length) return undefined;
  return thumbnails[thumbnails.length - 1] ?? thumbnails[0];
}
