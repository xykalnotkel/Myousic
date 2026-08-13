// Jalur ytdl: youtubei.js (decipher + client IOS/ANDROID) + scrape halaman watch.
// InnerTube mentah dari IP Vercel sering kosong; ytdl masih bisa kasih URL audio.

import type { StreamSource } from "./stream";

const IOS_UA =
  "com.google.ios.youtube/20.11.6 (iPhone16,2; U; CPU iOS 18_3_2 like Mac OS X;)";
const WEB_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";

let tubePromise: Promise<any> | null = null;

async function getTube() {
  if (!tubePromise) {
    tubePromise = (async () => {
      const { Innertube } = await import("youtubei.js");
      return Innertube.create({
        lang: "id",
        location: "ID",
        generate_session_locally: true,
        retrieve_player: true,
      });
    })().catch((e) => {
      tubePromise = null;
      throw e;
    });
  }
  return tubePromise;
}

function pickFromFormats(list: any[], ua: string, client: string): StreamSource | null {
  const withUrl = list.filter((f) => typeof f?.url === "string" && f.url.startsWith("http"));
  if (!withUrl.length) return null;

  const score = (f: any) => {
    const mime = String(f.mime_type || f.mimeType || "");
    const itag = Number(f.itag) || 0;
    if (itag === 140) return 500;
    if (mime.startsWith("audio/mp4")) return 400;
    if (itag === 251 || mime.startsWith("audio/webm")) return 300;
    if (mime.startsWith("audio/")) return 250;
    if (itag === 18) return 150;
    if (mime.includes("mp4a") || mime.includes("audio/mp4")) return 140;
    return 1;
  };

  const fmt = withUrl.slice().sort((a, b) => score(b) - score(a))[0];
  const mimeRaw = String(fmt.mime_type || fmt.mimeType || "audio/mp4");
  const mime = mimeRaw.split(";")[0].trim();
  const itag = fmt.itag ? Number(fmt.itag) : undefined;
  const outMime =
    mime.startsWith("audio/") ? mime : itag === 18 || mime.startsWith("video/mp4") ? "audio/mp4" : mime;

  return {
    url: String(fmt.url),
    mime: outMime,
    length: fmt.content_length ? Number(fmt.content_length) : undefined,
    itag,
    client,
    ua,
  };
}

async function fromYoutubei(videoId: string): Promise<StreamSource | null> {
  const yt = await getTube();
  for (const client of ["IOS", "ANDROID"] as const) {
    try {
      const info = await yt.getBasicInfo(videoId, { client });
      const sd = info?.streaming_data;
      const all = [...(sd?.adaptive_formats || []), ...(sd?.formats || [])];
      const src = pickFromFormats(all, client === "IOS" ? IOS_UA : WEB_UA, `ytdl-${client}`);
      if (src) return src;
    } catch {
      /* coba client berikutnya */
    }
  }
  return null;
}

function extractJson(html: string, key: string): any | null {
  const needle = key + " = ";
  const i = html.indexOf(needle);
  if (i < 0) return null;
  const start = html.indexOf("{", i);
  if (start < 0) return null;
  let depth = 0;
  for (let p = start; p < html.length; p++) {
    const c = html[p];
    if (c === "{") depth++;
    else if (c === "}") {
      depth--;
      if (depth === 0) {
        try {
          return JSON.parse(html.slice(start, p + 1));
        } catch {
          return null;
        }
      }
    }
  }
  return null;
}

async function fromWatchPage(videoId: string): Promise<StreamSource | null> {
  const res = await fetch(`https://www.youtube.com/watch?v=${videoId}&hl=id&gl=ID&has_verified=1`, {
    headers: {
      "User-Agent": WEB_UA,
      "Accept-Language": "id-ID,id;q=0.9,en;q=0.8",
      Cookie: "CONSENT=YES+1",
    },
    signal: AbortSignal.timeout(12000),
    cache: "no-store",
  });
  if (!res.ok) return null;
  const html = await res.text();
  const pr =
    extractJson(html, "ytInitialPlayerResponse") ||
    extractJson(html, "var ytInitialPlayerResponse");
  if (!pr) return null;
  const sd = pr.streamingData || {};
  const all = [...(sd.adaptiveFormats || []), ...(sd.formats || [])];
  const mapped = all.map((f: any) => ({
    ...f,
    url: f.url,
    mime_type: f.mimeType,
    content_length: f.contentLength,
  }));
  return pickFromFormats(mapped, WEB_UA, "ytdl-watch");
}

export async function getYtdlSource(videoId: string): Promise<StreamSource> {
  const errors: string[] = [];
  try {
    const src = await fromYoutubei(videoId);
    if (src) return src;
    errors.push("youtubei kosong");
  } catch (e: any) {
    errors.push(`youtubei ${e?.message || "error"}`);
  }
  try {
    const src = await fromWatchPage(videoId);
    if (src) return src;
    errors.push("watch kosong");
  } catch (e: any) {
    errors.push(`watch ${e?.message || "error"}`);
  }
  throw new Error(`ytdl gagal: ${errors.join(" · ")}`);
}
