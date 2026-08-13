import { Suspense } from "react";
import Link from "next/link";
import SearchInput from "@/components/SearchInput";
import TrackList from "@/components/TrackList";
import { Cover, Icon, I } from "@/components/ui";
import { search, SearchType } from "@/lib/scraper/search";
import { bestThumb, fmtCount } from "@/lib/types";
import type { SearchTypeKey } from "@/lib/types";

export const dynamic = "force-dynamic";

const TABS: { key: SearchTypeKey; label: string }[] = [
  { key: "songs", label: "Lagu" },
  { key: "videos", label: "Video" },
  { key: "albums", label: "Album" },
  { key: "playlists", label: "Playlist" },
  { key: "artists", label: "Artis" },
];

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; type?: string }>;
}) {
  const sp = await searchParams;
  const q = sp.q?.trim() ?? "";
  const rawType = (sp.type ?? "songs") as SearchTypeKey;
  const type: SearchTypeKey = TABS.some((t) => t.key === rawType) ? rawType : "songs";

  let results: any[] = [];
  let error: string | null = null;

  if (q) {
    try {
      results = await search(type, q);
    } catch (e: any) {
      error = e?.message || "Terjadi kesalahan saat mencari";
    }
  }

  const mkHref = (t: string) => {
    const p = new URLSearchParams();
    if (q) p.set("q", q);
    p.set("type", t);
    return `/search?${p.toString()}`;
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight mb-5">Cari</h1>
        <Suspense>
          <SearchInput />
        </Suspense>
      </div>

      {q && (
        <>
          {/* tabs */}
          <div className="flex gap-2 mb-7 flex-wrap">
            {TABS.map((t) => {
              const active = t.key === type;
              return (
                <Link
                  key={t.key}
                  href={mkHref(t.key)}
                  className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${
                    active
                      ? "bg-white text-black"
                      : "bg-white/[0.06] text-mut hover:text-white hover:bg-white/[0.1]"
                  }`}
                >
                  {t.label}
                </Link>
              );
            })}
          </div>

          {error ? (
            <div className="text-mut text-sm">⚠ {error}</div>
          ) : results.length === 0 ? (
            <div className="text-mut text-sm py-16 text-center">
              Tidak ada hasil untuk “{q}” — coba kata kunci lain.
            </div>
          ) : type === "songs" || type === "videos" ? (
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
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {results.map((r, i) => {
                const href =
                  type === "albums"
                    ? `/album/${r.browseId}`
                    : type === "playlists"
                    ? `/playlist/${r.browseId}`
                    : `/search?q=${encodeURIComponent(r.title ?? "")}&type=artists`;
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
                    href={href}
                    className="card-lift rounded-xl bg-panel ring-1 ring-line p-3"
                  >
                    <Cover
                      src={bestThumb(r.thumbnails)}
                      title={r.title}
                      size={200}
                      className="w-full aspect-square rounded-lg"
                    />
                    <p className="mt-3 text-sm font-semibold truncate">{r.title}</p>
                    <p className="text-xs text-mut mt-0.5 truncate">{sub}</p>
                  </Link>
                );
              })}
            </div>
          )}
        </>
      )}

      {!q && (
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
