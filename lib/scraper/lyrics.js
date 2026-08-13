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
        client: { clientName: "WEB_REMIX", clientVersion: "1.20260810.01.02", hl: "en", gl: "US" },
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

/**
 * Ambil lirik ber-timestamp untuk sebuah video.
 * @returns {{lines: {startMs:number, endMs:number, text:string}[], source?:string} | null}
 */
async function getLyrics(videoId) {
  if (!videoId) return null;
  const hit = cache.get(videoId);
  if (hit) return hit;

  try {
    const browseId = await getLyricsBrowseId(videoId);
    if (!browseId) {
      cache.set(videoId, null);
      return null;
    }

    const data = await post(
      "browse",
      KEY_ANDROID,
      {
        context: {
          client: { clientName: "ANDROID_MUSIC", clientVersion: "7.01.51", hl: "en", gl: "US" },
        },
        browseId,
      },
      UA_MUSIC_ANDROID,
      "https://www.youtube.com"
    );

    const model = deepFind(data, "timedLyricsModel")[0];
    const ld = model?.lyricsData;
    if (!ld?.timedLyricsData?.length) {
      cache.set(videoId, null);
      return null;
    }

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

    if (!lines.length) {
      cache.set(videoId, null);
      return null;
    }

    const result = { lines, source: ld.sourceMessage };
    cache.set(videoId, result);
    return result;
  } catch (e) {
    console.error("getLyrics error:", e?.message);
    cache.set(videoId, null);
    return null;
  }
}

module.exports = { getLyrics };
