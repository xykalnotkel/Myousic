// kainet-scraper (patched) — index
const { search, SearchType } = require("./search");
const { getPlaylist, getAlbum, getArtist } = require("./musiclists");
const { retrieveSuggestions } = require("./suggestions");
const P = require("./parse");

module.exports = {
  search,
  SearchType,
  getPlaylist,
  getAlbum,
  getArtist,
  retrieveSuggestions,
  parseDuration: P.duration,
};
