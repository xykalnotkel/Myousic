// kainet-scraper (patched) — search
const { request } = require("./request");
const P = require("./parse");

const SearchType = {
  SONGS: "songs",
  VIDEOS: "videos",
  ALBUMS: "albums",
  PLAYLISTS: "playlists",
  ARTISTS: "artists",
};

// parameter filter protobuf (format terbaru, sesuai ytmusicapi)
const searchParams = {
  songs: "EgWKAQIIAWoMEA4QChADEAQQCRAF",
  videos: "EgWKAQIQAWoMEA4QChADEAQQCRAF",
  albums: "EgWKAQIYAWoMEA4QChADEAQQCRAF",
  playlists: "Eg-KAQwIABAAGAAgACgBMABqChAEEAMQCRAFEAo=",
  artists: "EgWKAQIgAWoMEA4QChADEAQQCRAF",
};

// ambil semua musicResponsiveListItemRenderer dari seluruh section
function collectListItems(data) {
  const sections =
    P.nav(data, ["contents", "tabbedSearchResultsRenderer", "tabs", "0", "tabRenderer", "content", "sectionListRenderer", "contents"], []) ??
    [];
  const items = [];
  for (const s of sections) {
    // itemSectionRenderer: satu item per section (struktur baru)
    for (const c of s?.itemSectionRenderer?.contents ?? []) {
      if (c.musicResponsiveListItemRenderer) items.push(c.musicResponsiveListItemRenderer);
    }
    // musicShelfRenderer: struktur lama, masih dipakai beberapa endpoint
    for (const c of s?.musicShelfRenderer?.contents ?? []) {
      if (c.musicResponsiveListItemRenderer) items.push(c.musicResponsiveListItemRenderer);
    }
  }
  return items;
}

function detectType(lr, requestedType) {
  const col1 = P.itemCol1(lr).toLowerCase();
  if (col1.startsWith("song")) return "song";
  if (col1.startsWith("video")) return "video";
  if (col1.startsWith("album")) return "album";
  if (col1.startsWith("playlist")) return "playlist";
  if (col1.startsWith("artist")) return "artist";
  // petunjuk tipe dari request: lagu/video sama-sama punya watchEndpoint,
  // jadi gunakan tipe yang diminta pengguna
  const watchId = lr?.playlistItemData?.videoId ?? P.deepFindEndpoint(lr, "watchEndpoint")?.videoId;
  if (watchId) {
    if (requestedType === "videos") return "video";
    return "song";
  }
  // fallback: berdasarkan browseId pada run TITLE (kolom 0), lalu root item
  const titleNav = lr?.flexColumns?.[0]?.musicResponsiveListItemFlexColumnRenderer?.text?.runs?.[0]?.navigationEndpoint;
  const browseId = titleNav?.browseEndpoint?.browseId ?? lr?.navigationEndpoint?.browseEndpoint?.browseId ?? "";
  if (browseId.startsWith("MPRE")) return "album";
  if (browseId.startsWith("VL") || browseId.startsWith("RD")) return "playlist";
  if (browseId.startsWith("UC")) return "artist";
  return null;
}

// parse kolom1 yang formatnya "A • B • C" atau ["Song", "A", "B"]
function col1Parts(lr) {
  return P.itemCol1(lr).split(" • ").filter(Boolean);
}

const scrape = {
  song: (lr) => {
    const parts = col1Parts(lr);
    // layout baru: [artist, album, duration] | layout lama: [Song, artist, (plays)]
    const isLabel = ["song", "video"].includes(parts[0]?.toLowerCase());
    const artist = isLabel ? parts[1] : parts[0];
    const last = parts[parts.length - 1];
    const isDuration = /^\d+:\d{2}$/.test(last || "");
    const album = isLabel ? undefined : (parts.length >= 2 && !isDuration ? parts[1] : undefined);
    return {
      type: "song",
      id: lr?.playlistItemData?.videoId ?? P.deepFindEndpoint(lr, "watchEndpoint")?.videoId,
      title: P.itemTitle(lr),
      artist,
      album,
      plays: P.parseBigNum(P.itemCol2(lr)),
      duration: isDuration ? P.duration.fromText(last) : undefined,
      durationText: isDuration ? last : undefined,
      thumbnails: P.itemThumbnails(lr),
    };
  },
  video: (lr) => {
    const parts = col1Parts(lr);
    const isLabel = ["song", "video"].includes(parts[0]?.toLowerCase());
    const artist = isLabel ? parts[1] : parts[0];
    const last = parts[parts.length - 1];
    const isDuration = /^\d+:\d{2}$/.test(last || "");
    const viewsPart = parts.find(p => /views|plays/i.test(p));
    return {
      type: "video",
      id: lr?.playlistItemData?.videoId ?? P.deepFindEndpoint(lr, "watchEndpoint")?.videoId,
      title: P.itemTitle(lr),
      artist,
      views: P.parseBigNum(viewsPart || P.itemCol2(lr)),
      duration: isDuration ? P.duration.fromText(last) : undefined,
      durationText: isDuration ? last : undefined,
      thumbnails: P.itemThumbnails(lr),
    };
  },
  album: (lr) => {
    const parts = col1Parts(lr); // [Album, artist, year]
    return {
      type: "album",
      id: undefined,
      browseId: P.deepFindEndpoint(lr, "browseEndpoint")?.browseId,
      title: P.itemTitle(lr),
      artist: parts[1],
      year: parts[2] || undefined,
      thumbnails: P.itemThumbnails(lr),
    };
  },
  playlist: (lr) => {
    const parts = col1Parts(lr); // [author, "78M views"]
    const last = parts[parts.length - 1];
    return {
      type: "playlist",
      id: undefined,
      browseId: P.deepFindEndpoint(lr, "browseEndpoint")?.browseId ?? lr?.navigationEndpoint?.browseEndpoint?.browseId,
      title: P.itemTitle(lr),
      author: parts[0],
      trackCount: /^\d+/.test(last || "") && !last.includes("views") ? +last.match(/^\d+/)[0] : undefined,
      views: /views/i.test(last || "") ? P.parseBigNum(last) : undefined,
      thumbnails: P.itemThumbnails(lr),
    };
  },
  artist: (lr) => {
    const sub = (lr?.subtitle?.runs?.map(r => r.text).join("") ?? P.itemCol1(lr))
      .replace(/^Artist\s*•\s*/i, "")
      .replace(/\s*(monthly audience|subscribers|subscriber)\s*$/i, "");
    return {
      type: "artist",
      browseId: P.deepFindEndpoint(lr, "browseEndpoint")?.browseId,
      title: P.itemTitle(lr),
      subscribers: sub || undefined,
      thumbnails: P.itemThumbnails(lr),
    };
  },
};

async function search(type, query) {
  const data = await request("search", { params: searchParams[type], query });
  const items = collectListItems(data);
  const results = [];
  const wanted = type.replace(/s$/, "");
  for (const lr of items) {
    const t = detectType(lr, type) ?? wanted;
    const parsed = scrape[t]?.(lr);
    if (parsed && P.valid(parsed)) results.push(P.clean(parsed));
  }
  // jaring pengaman: hanya kembalikan tipe yang diminta (server kadang campur)
  return results.filter(r => r.type === wanted);
}

module.exports = { search, SearchType };
