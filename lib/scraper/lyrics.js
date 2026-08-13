// Lirik otomatis ber-timestamp dari YouTube Music
// Alur: endpoint "next" (WEB_REMIX) → browseId lirik (MPLYt...) → endpoint "browse"
//       dengan client ANDROID_MUSIC → timedLyricsData (start/end ms per baris)

const KEY_MUSIC = "AIzaSyC9XL3ZjWddXya6X74dJoCTL-WEYFDNX30";
const KEY_ANDROID = "AIzaSyA8eiZmM1FaDVjRy-df2KTyQ_vz_yYM39w";
const UA_WEB =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36";
const UA_MUSIC_ANDROID = "com.google.android.apps.youtube.music/7.01.51 (Linux; U; Android 14; en_US)";

const cache = new Map();

async function post(endpoint, key, body, ua, origin, base = "https://www.youtube.com") {
  const res = await fetch(`${base}/youtubei/v1/${endpoint}?alt=json&key=${key}`, {
      method: "POST",
      headers: {
        "User-Agent": ua,
        Origin: origin,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(15000),
    }
  );
  if (!res.ok) throw new Error(`lyrics HTTP ${res.status}`);
  return res.json();
}

// cari semua nilai objek dengan kunci tertentu (deep)
function deepFind(obj, key, out = []) {
  if (!obj || typeof obj !== "object") return out;
  if (obj[key]) out.push(obj[key]);
  for (const v of Object.values(obj)) {
    if (Array.isArray(v)) v.forEach((x) => deepFind(x, key, out));
    else if (v && typeof v === "object") deepFind(v, key, out);
  }
  return out;
}

async function getLyricsBrowseId(videoId) {
  const data = await post(
    "next",
    KEY_MUSIC,
    {
      context: {
        client: { clientName: "WEB_REMIX", clientVersion: "1.20260810.01.02", hl: "id", gl: "ID" },
      },
      videoId,
      isAudioOnly: true,
    },
    UA_WEB,
    "https://music.youtube.com",
    "https://music.youtube.com"
  );
  // cari tabRenderer lirik: browseId diawali MPLYt (atau pageType MUSIC_PAGE_TYPE_TRACK_LYRICS)
  const tabs = deepFind(data, "tabRenderer");
  for (const t of tabs) {
    const ep = t.endpoint?.browseEndpoint;
    const browseId = ep?.browseId;
    const pageType = ep?.browseEndpointContextSupportedConfigs?.browseEndpointContextMusicConfig?.pageType ?? "";
    if ((browseId && browseId.startsWith("MPLYt")) || /TRACK_LYRICS/.test(pageType)) {
      if (browseId) return browseId;
    }
  }
  return null;
}

function parseLrc(lrc) {
  const lines = [];
  for (const raw of String(lrc).split(/\r?\n/)) {
    const stamps = [...String(raw).matchAll(/\[(\d{1,2}):(\d{2})(?:\.(\d{1,3}))?\]([^\[]*)/g)];
    if (!stamps.length) continue;
    const toMs = (m) => (+m[1] * 60 + +m[2]) * 1000 + (+(m[3] || "0").padEnd(3, "0"));
    if (stamps.length > 1) {
      const words = [];
      for (let i = 0; i < stamps.length; i++) {
        const text = stamps[i][4].trim();
        if (!text) continue;
        const startMs = toMs(stamps[i]);
        const endMs = stamps[i + 1] ? toMs(stamps[i + 1]) : startMs + 700;
        words.push({ text, startMs, endMs });
      }
      if (words.length) {
        lines.push({
          startMs: words[0].startMs,
          endMs: words[words.length - 1].endMs,
          text: words.map((w) => w.text).join(" "),
          words,
        });
      }
      continue;
    }
    const text = stamps[0][4].trim();
    if (!text) continue;
    const ms = toMs(stamps[0]);
    lines.push({ startMs: ms, endMs: ms + 5000, text });
  }
  for (let i = 0; i < lines.length - 1; i++) {
    if (!lines[i].words) lines[i].endMs = lines[i + 1].startMs;
  }
  return lines;
}

function plainToLines(text) {
  return String(text)
    .split(/\r?\n/)
    .map((t) => t.trim())
    .filter(Boolean)
    .map((t, i) => ({ startMs: i * 4000, endMs: i * 4000 + 4000, text: t }));
}

async function getLyricsLrclib(title, artist) {
  if (!title) return null;
  const q = [artist, title].filter(Boolean).join(" ");
  try {
    const r = await fetch(`https://lrclib.net/api/search?q=${encodeURIComponent(q)}`, {
      signal: AbortSignal.timeout(12000),
      headers: { "User-Agent": "Myousic/1.0" },
    });
    if (!r.ok) return null;
    const arr = await r.json();
    if (!Array.isArray(arr) || !arr.length) return null;
    const hit = arr.find((x) => x.syncedLyrics) || arr.find((x) => x.plainLyrics) || arr[0];
    if (hit?.syncedLyrics) {
      const lines = parseLrc(hit.syncedLyrics);
      if (lines.length) return { lines, source: "lrclib" };
    }
    if (hit?.plainLyrics) {
      const lines = plainToLines(hit.plainLyrics);
      if (lines.length) return { lines, source: "lrclib" };
    }
  } catch (e) {
    console.error("lrclib:", e?.message);
  }
  return null;
}

async function getLyricsYt(videoId) {
  if (!videoId) return null;
  const browseId = await getLyricsBrowseId(videoId);
  if (!browseId) return null;
  const data = await post(
    "browse",
    KEY_ANDROID,
    {
      context: {
        client: { clientName: "ANDROID_MUSIC", clientVersion: "7.01.51", hl: "id", gl: "ID" },
      },
      browseId,
    },
    UA_MUSIC_ANDROID,
    "https://www.youtube.com"
  );
  const model = deepFind(data, "timedLyricsModel")[0];
  const ld = model?.lyricsData;
  if (!ld?.timedLyricsData?.length) return null;
  const lines = ld.timedLyricsData
    .map((l) => {
      const startMs = Number(l.cueRange?.startTimeMilliseconds);
      const endMs = Number(l.cueRange?.endTimeMilliseconds);
      const text = (l.lyricLine ?? "").trim();
      if (!text || isNaN(startMs)) return null;
      return {
        startMs,
        endMs: isNaN(endMs) || endMs < startMs ? startMs + 6000 : endMs,
        text,
      };
    })
    .filter(Boolean);
  if (!lines.length) return null;
  return { lines, source: ld.sourceMessage || "YouTube Music" };
}

function decodeXml(s) {
  return String(s || "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

async function getCaptions(videoId) {
  if (!videoId) return null;
  const data = await post(
    "player",
    KEY_MUSIC,
    {
      context: {
        client: { clientName: "WEB", clientVersion: "2.20260810.00.00", hl: "id", gl: "ID" },
      },
      videoId,
    },
    UA_WEB,
    "https://www.youtube.com",
    "https://www.youtube.com"
  );
  const tracks = data?.captions?.playerCaptionsTracklistRenderer?.captionTracks || [];
  if (!tracks.length) return null;
  const pref = ["sas", "id", "jv", "su", "en"];
  let track = null;
  for (const lang of pref) {
    track = tracks.find((t) => String(t.languageCode || "").toLowerCase().startsWith(lang));
    if (track) break;
  }
  if (!track) track = tracks.find((t) => t.kind === "asr") || tracks[0];
  const base = track.baseUrl;
  if (!base) return null;
  const url = base.includes("fmt=") ? base : `${base}&fmt=srv3`;
  const xml = await fetch(url, { signal: AbortSignal.timeout(12000), headers: { "User-Agent": UA_WEB } }).then((r) =>
    r.text()
  );
  const lines = [];
  const re = /<p\b[^>]*\bt="(\d+)"[^>]*(?:\bd="(\d+)")?[^>]*>([\s\S]*?)<\/p>/gi;
  let m;
  while ((m = re.exec(xml))) {
    const startMs = Number(m[1]);
    const dur = Number(m[2] || 4000);
    const body = m[3];
    const segs = [...body.matchAll(/<s\b[^>]*\bt="(\d+)"[^>]*>([\s\S]*?)<\/s>/gi)];
    if (segs.length) {
      const words = [];
      for (let i = 0; i < segs.length; i++) {
        const text = decodeXml(segs[i][2]);
        if (!text) continue;
        const ws = startMs + Number(segs[i][1] || 0);
        const we = segs[i + 1] ? startMs + Number(segs[i + 1][1] || 0) : startMs + (isNaN(dur) ? 4000 : dur);
        words.push({ text, startMs: ws, endMs: we });
      }
      if (words.length) {
        lines.push({
          startMs: words[0].startMs,
          endMs: words[words.length - 1].endMs,
          text: words.map((w) => w.text).join(" "),
          words,
        });
        continue;
      }
    }
    const text = decodeXml(body);
    if (!text) continue;
    lines.push({ startMs, endMs: startMs + (isNaN(dur) ? 4000 : dur), text });
  }
  if (!lines.length) return null;
  for (let i = 0; i < lines.length - 1; i++) {
    if (lines[i].endMs > lines[i + 1].startMs) lines[i].endMs = lines[i + 1].startMs;
  }
  return { lines, source: `caption ${track.languageCode || ""}`.trim() };
}

/**
 * @returns {{lines: {startMs:number, endMs:number, text:string}[], source?:string} | null}
 */
async function getLyrics(videoId, title, artist) {
  const key = videoId || `${artist || ""}|${title || ""}`;
  if (!key) return null;
  if (cache.has(key)) return cache.get(key);

  let result = null;
  try {
    if (videoId) result = await getLyricsYt(videoId);
  } catch (e) {
    console.error("getLyrics YT:", e?.message);
  }
  if (!result && videoId) {
    try {
      result = await getCaptions(videoId);
    } catch (e) {
      console.error("captions:", e?.message);
    }
  }
  if (!result) result = await getLyricsLrclib(title, artist);
  cache.set(key, result);
  return result;
}

module.exports = { getLyrics };
