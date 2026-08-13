// kainet-scraper (patched) — retrieveSuggestions (homepage)
const { request } = require("./request");
const P = require("./parse");

async function retrieveSuggestions() {
  const data = await request("browse", {});
  const sections =
    P.nav(data, ["contents", "singleColumnBrowseResultsRenderer", "tabs", "0", "tabRenderer", "content", "sectionListRenderer", "contents"], []) ?? [];
  const items = [];
  for (const s of sections) {
    const carousel = s.musicCarouselShelfRenderer ?? s.musicImmersiveCarouselShelfRenderer;
    for (const c of carousel?.contents ?? []) {
      const two = c.musicTwoRowItemRenderer;
      if (!two) continue;
      const browseId = P.deepFindEndpoint(two, "browseEndpoint")?.browseId;
      if (!browseId) continue;
      items.push(
        P.clean({
          type: "playlist",
          id: undefined,
          browseId,
          title: two.title?.runs?.[0]?.text,
          thumbnails: P.nav(two, ["thumbnailRenderer", "musicThumbnailRenderer", "thumbnail", "thumbnails"], [])
            .map(t => t?.url)
            .filter(Boolean),
        })
      );
    }
  }
  return items;
}

module.exports = { retrieveSuggestions };
