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

function norm(s) {
  return String(s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function scoreItem(item, query) {
  const q = norm(query);
  const title = norm(item.title);
  const artist = norm(item.artist);
  const hay = `${title} ${artist}`.trim();
  if (!q) return 0;
  if (title === q || hay === q) return 100;
  if (title.startsWith(q)) return 92;
  if (title.includes(q)) return 86;
  if (q.includes(title) && title.length > 3) return 80;
  if (hay.includes(q)) return 74;
  const qt = q.split(" ").filter((t) => t.length > 1);
  if (!qt.length) return 0;
  let hits = 0;
  for (const t of qt) if (hay.includes(t)) hits++;
  return (hits / qt.length) * 62;
}

function rankResults(results, query) {
  return results
    .map((r, i) => ({ r, i, s: scoreItem(r, query) }))
    .sort((a, b) => b.s - a.s || a.i - b.i)
    .map((x) => x.r);
}

function parseCardShelf(card) {
  if (!card) return null;
  const title = (card.title?.runs || []).map((r) => r.text).join("").trim();
  const videoId =
    card.onTap?.watchEndpoint?.videoId ||
    P.deepFindEndpoint(card, "watchEndpoint")?.videoId ||
    P.findVideoId(card);
  const thumbs = P.nav(card, ["thumbnail", "musicThumbnailRenderer", "thumbnail", "thumbnails"], [])
    .map((t) => t?.url)
    .filter(Boolean);
  const parts = (card.subtitle?.runs || [])
    .map((r) => r.text)
    .join("")
    .split(" • ")
    .map((s) => s.trim())
    .filter(Boolean);
  let type = "song";
  let artist;
  const head = (parts[0] || "").toLowerCase();
  if (head.startsWith("video")) {
    type = "video";
    artist = parts[1];
  } else if (head.startsWith("song") || head.startsWith("lagu")) {
    artist = parts[1];
  } else {
    artist = parts[0];
  }
  if (!title) return null;
  if (videoId) return { type, id: videoId, title, artist, thumbnails: thumbs };
  const browseId = P.deepFindEndpoint(card, "browseEndpoint")?.browseId;
  if (browseId) {
    if (browseId.startsWith("UC")) return { type: "artist", browseId, title, thumbnails: thumbs };
    if (browseId.startsWith("MPRE")) return { type: "album", browseId, title, artist, thumbnails: thumbs };
    return { type: "playlist", browseId, title, thumbnails: thumbs };
  }
  return null;
}

// ambil semua musicResponsiveListItemRenderer + top result card
function collectListItems(data) {
  const sections =
    P.nav(data, ["contents", "tabbedSearchResultsRenderer", "tabs", "0", "tabRenderer", "content", "sectionListRenderer", "contents"], []) ??
    [];
  const items = [];
  const cards = [];
  for (const s of sections) {
    if (s?.musicCardShelfRenderer) cards.push(s.musicCardShelfRenderer);
    for (const c of s?.itemSectionRenderer?.contents ?? []) {
      if (c.musicCardShelfRenderer) cards.push(c.musicCardShelfRenderer);
      if (c.musicResponsiveListItemRenderer) items.push(c.musicResponsiveListItemRenderer);
    }
    for (const c of s?.musicShelfRenderer?.contents ?? []) {
      if (c.musicResponsiveListItemRenderer) items.push(c.musicResponsiveListItemRenderer);
    }
  }
  return { items, cards };
}

function detectType(lr, requestedType) {
  const col1 = P.itemCol1(lr).toLowerCase();
  if (col1.startsWith("song") || col1.startsWith("lagu")) return "song";
  if (col1.startsWith("video")) return "video";
  if (col1.startsWith("album")) return "album";
  if (col1.startsWith("playlist")) return "playlist";
  if (col1.startsWith("artist") || col1.startsWith("artis")) return "artist";
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
    const isLabel = ["song", "video", "lagu"].includes(parts[0]?.toLowerCase());
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
  const bag = collectListItems(data);
  const items = bag.items || [];
  const cards = bag.cards || [];
  const results = [];
  const wanted = type.replace(/s$/, "");
  const seen = new Set();

  for (const card of cards) {
    const parsed = parseCardShelf(card);
    if (!parsed || !P.valid(parsed)) continue;
    if (parsed.type !== wanted) continue;
    const key = parsed.id || parsed.browseId;
    if (key && seen.has(key)) continue;
    if (key) seen.add(key);
    results.push(P.clean(parsed));
  }

  for (const lr of items) {
    const t = detectType(lr, type) ?? wanted;
    const parsed = scrape[t]?.(lr);
    if (!parsed || !P.valid(parsed)) continue;
    if (parsed.type !== wanted) continue;
    const key = parsed.id || parsed.browseId;
    if (key && seen.has(key)) continue;
    if (key) seen.add(key);
    results.push(P.clean(parsed));
  }

  return rankResults(results, query);
}

module.exports = { search, SearchType };
