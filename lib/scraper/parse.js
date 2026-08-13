// kainet-scraper (patched) — helper parser
// Struktur YouTube Music 2026: itemSectionRenderer per item, musicCardShelfRenderer utk top result.

// --- navigasi aman ---
const nav = (obj, path, fallback) => {
  let cur = obj;
  for (const key of path) {
    if (cur == null) return fallback;
    cur = cur[key];
  }
  return cur == null ? fallback : cur;
};

// cari videoId 11 karakter di mana saja (playlistItemData, watchEndpoint, overlay)
function findVideoId(obj, depth = 0) {
  if (!obj || typeof obj !== "object" || depth > 10) return null;
  if (typeof obj.videoId === "string" && /^[A-Za-z0-9_-]{11}$/.test(obj.videoId)) return obj.videoId;
  if (typeof obj.playlistItemData?.videoId === "string") return obj.playlistItemData.videoId;
  for (const v of Object.values(obj)) {
    if (!v || typeof v !== "object") continue;
    const r = findVideoId(v, depth + 1);
    if (r) return r;
  }
  return null;
}
function deepFindEndpoint(obj, type) {
  if (!obj || typeof obj !== "object") return null;
  if (obj.navigationEndpoint && obj.navigationEndpoint[type]) return obj.navigationEndpoint[type];
  for (const v of Object.values(obj)) {
    if (Array.isArray(v)) {
      for (const x of v) {
        const r = deepFindEndpoint(x, type);
        if (r) return r;
      }
    } else {
      const r = deepFindEndpoint(v, type);
      if (r) return r;
    }
  }
  return null;
}

// --- teks dari flexColumns ---
const getRuns = (cols, colIndex) => {
  const col = cols?.[colIndex];
  return col?.musicResponsiveListItemFlexColumnRenderer?.text?.runs ?? [];
};
const colText = (cols, colIndex) => getRuns(cols, colIndex).map(r => r.text).join("");
const runText = (cols, colIndex, runIndex) => {
  const runs = getRuns(cols, colIndex);
  const i = runIndex >= 0 ? runIndex : runs.length + runIndex;
  return runs[i]?.text;
};

// --- field umum item hasil pencarian ---
const itemTitle = (lr) => colText(lr?.flexColumns, 0);
const itemCol1 = (lr) => colText(lr?.flexColumns, 1);
const itemCol2 = (lr) => colText(lr?.flexColumns, 2);
const itemCol3 = (lr) => colText(lr?.flexColumns, 3);
const itemThumbnails = (lr) =>
  nav(lr, ["thumbnail", "musicThumbnailRenderer", "thumbnail", "thumbnails"], [])
    .map(t => t?.url)
    .filter(Boolean);

// --- durasi ---
const duration = {
  fromText: (text) => {
    const parts = text?.split(":");
    if (!parts || parts.length < 2 || parts.length > 3) return undefined;
    if (parts.length === 3) return +parts[0] * 3600 + +parts[1] * 60 + +parts[2];
    return +parts[0] * 60 + +parts[1];
  },
  toText: (secs) => {
    if ((!secs && secs !== 0) || secs < 0) return undefined;
    const hours = Math.floor(secs / 3600);
    const mins = Math.floor((secs % 3600) / 60);
    const s = Math.floor(secs % 60);
    const parts = [];
    if (hours) parts.push(String(hours).padStart(2, "0"));
    parts.push(String(mins).padStart(2, "0"));
    parts.push(String(s).padStart(2, "0"));
    return parts.join(":");
  },
  toDetail: (secs) => {
    if ((!secs && secs !== 0) || secs < 0) return undefined;
    const hours = Math.floor(secs / 3600);
    const mins = Math.floor((secs % 3600) / 60);
    return hours > 0
      ? `${hours} hour${hours !== 1 ? "s" : ""} & ${mins} minute${mins !== 1 ? "s" : ""}`
      : `${mins} minute${mins !== 1 ? "s" : ""}`;
  },
};

// --- angka ---
const parseBigNum = (text) => {
  const m = text?.match(/([\d]+([.,][\d]+)?)\s?([KMBkmb])?/);
  if (!m || Number.isNaN(+m[1])) return undefined;
  const mult = { K: 1e3, M: 1e6, B: 1e9 }[m[3]?.toUpperCase()] ?? 1;
  return Math.round(parseFloat(m[1]) * mult);
};

// --- buang field undefined ---
const clean = (obj) => Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined));

// --- filter item valid ---
const valid = (item) => {
  if (item.type === "song" || item.type === "video") return !!item.id && !!item.title;
  if (item.type === "album" || item.type === "playlist") return !!item.browseId && !!item.title;
  if (item.type === "artist") return !!item.browseId && !!item.title;
  return false;
};

module.exports = { nav, deepFindEndpoint, findVideoId, getRuns, colText, runText, itemTitle, itemCol1, itemCol2, itemCol3, itemThumbnails, duration, parseBigNum, clean, valid };
