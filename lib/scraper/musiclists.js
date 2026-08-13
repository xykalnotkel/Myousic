// kainet-scraper (patched) — getPlaylist & getAlbum
const { request } = require("./request");
const P = require("./parse");

// lokasi header & tracks pada respons browse versi 2026
function browseSections(data) {
  return (
    P.nav(data, ["contents", "twoColumnBrowseResultsRenderer", "tabs", "0", "tabRenderer", "content", "sectionListRenderer", "contents"], []) ??
    []
  );
}
function browseSecondarySections(data) {
  return (
    P.nav(data, ["contents", "twoColumnBrowseResultsRenderer", "secondaryContents", "sectionListRenderer", "contents"], []) ??
    []
  );
}
function headerInfo(data) {
  const h = browseSections(data).find(s => s.musicResponsiveHeaderRenderer)?.musicResponsiveHeaderRenderer;
  if (!h) return null;
  return {
    title: h.title?.runs?.map(r => r.text).join("") ?? "",
    subtitle: h.subtitle?.runs?.map(r => r.text).join(""),
    secondSubtitle: h.secondSubtitle?.runs?.map(r => r.text).join(""),
    strapline: h.straplineTextOne?.runs?.map(r => r.text).join(""),
  };
}

// track di playlist/album: col0=judul, col1=artis, col2=plays, fixedCol0=durasi
function scrapeTrack(lr) {
  return {
    type: "song",
    id: P.deepFindEndpoint(lr, "watchEndpoint")?.videoId,
    title: P.itemTitle(lr),
    artist: P.itemCol1(lr) || undefined,
    album: undefined,
    plays: P.parseBigNum(P.itemCol2(lr)),
    duration: P.duration.fromText(P.nav(lr, ["fixedColumns", "0", "musicResponsiveListItemFixedColumnRenderer", "text", "runs", "0", "text"])),
    durationText: P.nav(lr, ["fixedColumns", "0", "musicResponsiveListItemFixedColumnRenderer", "text", "runs", "0", "text"]),
    thumbnails: P.itemThumbnails(lr),
  };
}

async function getPlaylist(browseId) {
  const data = await request("browse", { browseId });
  const info = headerInfo(data);
  const shelf = browseSecondarySections(data).find(s => s.musicPlaylistShelfRenderer)?.musicPlaylistShelfRenderer;
  const tracks = (shelf?.contents ?? [])
    .map(c => c.musicResponsiveListItemRenderer)
    .filter(Boolean)
    .map(scrapeTrack)
    .filter(t => t.id && t.title)
    .map(P.clean);
  if (!info || !info.title) return null;
  return P.clean({
    type: "playlist",
    id: undefined,
    browseId,
    title: info.title,
    trackCount: tracks.length || undefined,
    tracks,
    thumbnails: undefined,
  });
}

async function getAlbum(browseId) {
  const data = await request("browse", { browseId });
  const info = headerInfo(data);
  const shelf = browseSecondarySections(data).find(s => s.musicShelfRenderer)?.musicShelfRenderer;
  const tracks = (shelf?.contents ?? [])
    .map(c => c.musicResponsiveListItemRenderer)
    .filter(Boolean)
    .map(scrapeTrack)
    .filter(t => t.id && t.title)
    .map(P.clean);
  if (!info || !info.title) return null;
  // subtitle: "Album • 2017", secondSubtitle: "14 songs • 55 minutes"
  const subRuns = (info.subtitle ?? "").split(" • ");
  const year = subRuns[1];
  const artist = info.strapline || subRuns[2];
  return P.clean({
    type: "album",
    id: P.deepFindEndpoint(data, "watchPlaylistEndpoint")?.playlistId,
    browseId,
    title: info.title,
    artist,
    year,
    tracks,
  });
}

// ---------- ARTIS ----------
function artistSections(data) {
  const two = P.nav(data, ["contents", "twoColumnBrowseResultsRenderer", "tabs", "0", "tabRenderer", "content", "sectionListRenderer", "contents"], []);
  if (two && two.length) return two;
  const one = P.nav(data, ["contents", "singleColumnBrowseResultsRenderer", "tabs", "0", "tabRenderer", "content", "sectionListRenderer", "contents"], []);
  if (one && one.length) return one;
  return [];
}

function scrapeArtistTrack(lr) {
  return P.clean({
    type: "song",
    id: P.deepFindEndpoint(lr, "watchEndpoint")?.videoId,
    title: P.itemTitle(lr),
    artist: P.itemCol1(lr) || undefined,
    album: P.itemCol3(lr) || undefined,
    plays: P.parseBigNum(P.itemCol2(lr)),
    duration: P.duration.fromText(P.nav(lr, ["fixedColumns", "0", "musicResponsiveListItemFixedColumnRenderer", "text", "runs", "0", "text"])),
    durationText: P.nav(lr, ["fixedColumns", "0", "musicResponsiveListItemFixedColumnRenderer", "text", "runs", "0", "text"]),
    thumbnails: P.itemThumbnails(lr),
  });
}

function scrapeCarouselAlbum(item) {
  return P.clean({
    type: "album",
    browseId: P.deepFindEndpoint(item, "browseEndpoint")?.browseId,
    title: item?.musicTwoRowItemRenderer?.title?.runs?.[0]?.text,
    year: item?.musicTwoRowItemRenderer?.subtitle?.runs?.map(r => r.text).join(""),
    thumbnails: P.nav(item, ["musicTwoRowItemRenderer", "thumbnailRenderer", "musicThumbnailRenderer", "thumbnail", "thumbnails"], [])
      .map(t => t?.url)
      .filter(Boolean),
  });
}

async function getArtist(browseId) {
  const data = await request("browse", { browseId });
  const sections = artistSections(data);

  // header immersive: nama + subscriber
  const header =
    P.nav(data, ["header", "musicImmersiveHeaderRenderer"], null) ??
    sections.find(s => s.musicResponsiveHeaderRenderer)?.musicResponsiveHeaderRenderer ??
    null;
  if (!header) return null;

  const title = header.title?.runs?.map(r => r.text).join("") ?? "";
  if (!title) return null;

  let subscribers =
    P.nav(header, ["subscriptionButton", "subscribeButtonRenderer", "subscriberCountText", "runs", "0", "text"]) ??
    P.nav(header, ["subtitle", "runs"], [])
      .map(r => r.text)
      .join("")
      .replace(/^Artist\s*•\s*/i, "");
  if (!subscribers) subscribers = undefined;

  // lagu top
  const shelf = sections.find(s => s.musicShelfRenderer)?.musicShelfRenderer;
  const topTracks = (shelf?.contents ?? [])
    .map(c => c.musicResponsiveListItemRenderer)
    .filter(Boolean)
    .map(scrapeArtistTrack)
    .filter(t => t.id && t.title);

  // album & single dari carousel
  const albums = [];
  for (const s of sections) {
    const car = s.musicCarouselShelfRenderer;
    if (!car) continue;
    const carTitle = car.header?.musicCarouselShelfBasicHeaderRenderer?.title?.runs?.map(r => r.text).join("") ?? "";
    if (!/album|single|ep/i.test(carTitle)) continue;
    for (const c of car.contents ?? []) {
      const a = scrapeCarouselAlbum(c);
      if (a.browseId && a.title) albums.push({ ...a, kind: /single|ep/i.test(carTitle) ? "single" : "album" });
    }
  }

  const thumbnails =
    P.nav(header, ["thumbnail", "musicThumbnailRenderer", "thumbnail", "thumbnails"], [])
      .map(t => t?.url)
      .filter(Boolean) ?? [];

  return P.clean({
    type: "artist",
    browseId,
    title,
    subscribers,
    thumbnails,
    topTracks,
    albums,
  });
}

module.exports = { getPlaylist, getAlbum, getArtist };
