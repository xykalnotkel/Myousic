"use client";

// Pencarian client-side: debounce + abort + hasil lama dipertahankan saat loading (tanpa glitch)
import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import TrackList from "@/components/TrackList";
import { Cover, Icon, I } from "@/components/ui";
import { bestThumb, fmtCount } from "@/lib/types";
import type { SearchTypeKey, SearchResultItem } from "@/lib/types";

const TABS: { key: SearchTypeKey; label: string }[] = [
  { key: "songs", label: "Lagu" },
  { key: "videos", label: "Video" },
  { key: "albums", label: "Album" },
  { key: "playlists", label: "Playlist" },
  { key: "artists", label: "Artis" },
];

function SearchPageInner() {
  const router = useRouter();
  const params = useSearchParams();
  const initialQ = params.get("q") ?? "";

  const [q, setQ] = useState(initialQ);
  const [debounced, setDebounced] = useState(initialQ);
  const [type, setType] = useState<SearchTypeKey>(
    (TABS.some((t) => t.key === (params.get("type") as any)) ? params.get("type") : "songs") as SearchTypeKey
  );
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const reqIdRef = useRef(0);

  // debounce input
  useEffect(() => {
    const t = setTimeout(() => setDebounced(q.trim()), 400);
    return () => clearTimeout(t);
  }, [q]);

  // sinkron URL (tanpa reload — hanya biar link bisa di-share)
  useEffect(() => {
    const p = new URLSearchParams();
    if (debounced) p.set("q", debounced);
    p.set("type", type);
    router.replace(`/search?${p.toString()}`, { scroll: false });
  }, [debounced, type, router]);

  // fetch hasil
  useEffect(() => {
    const query = debounced;
    if (!query) {
      setResults([]);
      setError(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    const id = ++reqIdRef.current;
    if (abortRef.current) abortRef.current.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    fetch(`/api/search?q=${encodeURIComponent(query)}&type=${type}`, { signal: ctrl.signal })
      .then((r) => r.json())
      .then((d) => {
        if (reqIdRef.current !== id) return; // respons basi
        if (d.error) setError(d.error);
        else setResults(d.results ?? []);
      })
      .catch((e) => {
        if (e?.name === "AbortError") return;
        if (reqIdRef.current === id) setError("Pencarian gagal. Coba lagi.");
      })
      .finally(() => {
        if (reqIdRef.current === id) setLoading(false);
      });
  }, [debounced, type]);

  const gridHref = (r: any) =>
    type === "albums"
      ? `/album/${r.browseId}`
      : type === "playlists"
      ? `/playlist/${r.browseId}`
      : type === "artists"
      ? `/artist/${r.browseId}`
      : `/search?q=${encodeURIComponent(r.title ?? "")}&type=${type}`;

  const showEmpty = !debounced;
  const showNoResult = debounced && !loading && !error && results.length === 0;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight mb-5">Cari</h1>
        <div className="relative max-w-2xl w-full group">
          <Icon
            d={I.search}
            size={20}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-mut group-focus-within:text-white transition-colors"
          />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Cari lagu, album, playlist, artis…"
            className="w-full bg-white/[0.05] hover:bg-white/[0.08] focus:bg-white/[0.1] ring-1 ring-transparent focus:ring-white/30 rounded-full pl-12 pr-12 py-3.5 text-[15px] outline-none transition-all placeholder:text-[#6a6a6a]"
            autoFocus
          />
          {q && (
            <button
              onClick={() => setQ("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
              aria-label="Hapus"
            >
              <Icon d={I.close} size={14} />
            </button>
          )}
        </div>
      </div>

      {!showEmpty && (
        <>
          {/* tabs */}
          <div className="flex gap-2 mb-7 flex-wrap">
            {TABS.map((t) => {
              const active = t.key === type;
              return (
                <button
                  key={t.key}
                  onClick={() => setType(t.key)}
                  className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${
                    active
                      ? "bg-white text-black"
                      : "bg-white/[0.06] text-mut hover:text-white hover:bg-white/[0.1]"
                  }`}
                >
                  {t.label}
                </button>
              );
            })}
          </div>

          {/* indikator loading tipis (hasil lama tetap tampil) */}
          {loading && (
            <div className="mb-4 flex items-center gap-2 text-xs text-mut">
              <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Mencari…
            </div>
          )}

          {error ? (
            <div className="text-mut text-sm">⚠ {error}</div>
          ) : showNoResult ? (
            <div className="text-mut text-sm py-16 text-center">
              Tidak ada hasil untuk “{debounced}” — coba kata kunci lain.
            </div>
          ) : (type === "songs" || type === "videos") && results.length > 0 ? (
            <TrackList
              tracks={results.map((r) => ({
                id: r.id,
                title: r.title,
                artist: r.artist,
                duration: r.duration,
                durationText: r.durationText,
                thumbnails: r.thumbnails,
                plays: r.plays,
                views: r.views,
              }))}
            />
          ) : results.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {results.map((r, i) => {
                const sub =
                  type === "albums"
                    ? `${r.artist ?? ""} · ${r.year ?? ""}`
                    : type === "playlists"
                    ? `${r.author ?? ""} · ${r.views ? fmtCount(r.views) + " tayangan" : ""}`
                    : r.subscribers
                    ? `${r.subscribers} pendengar`
                    : "Artis";
                return (
                  <Link
                    key={`${r.browseId || r.id}-${i}`}
                    href={gridHref(r)}
                    className="card-lift rounded-xl bg-panel ring-1 ring-line p-3"
                  >
                    <Cover
                      src={bestThumb(r.thumbnails)}
                      title={r.title}
                      circle={type === "artists"}
                      sizeClass={type === "artists" ? "w-full aspect-square" : "w-full aspect-square"}
                      rounded={type === "artists" ? "rounded-full" : "rounded-lg"}
                    />
                    <p className="mt-3 text-sm font-semibold truncate">{r.title}</p>
                    <p className="text-xs text-mut mt-0.5 truncate">{sub}</p>
                  </Link>
                );
              })}
            </div>
          ) : null}
        </>
      )}

      {showEmpty && (
        <div className="py-16 text-center text-mut">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/illustrations/headphone-peaks.webp"
            alt=""
            aria-hidden
            className="w-48 mx-auto mb-5 opacity-90"
          />
          <p className="text-lg font-semibold text-soft">Temukan musikmu</p>
          <p className="text-sm mt-1">Ketik di kotak pencarian untuk mulai menjelajah.</p>
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="skeleton h-40 rounded-2xl" />}>
      <SearchPageInner />
    </Suspense>
  );
}
