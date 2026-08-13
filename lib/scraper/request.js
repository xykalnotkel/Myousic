// kainet-scraper (patched) — request layer
// Mengambil clientVersion terbaru dari situs, lalu request ke InnerTube API.

const FALLBACK_VERSION = "1.20260810.01.02";
const API_KEY = "AIzaSyC9XL3ZjWddXya6X74dJoCTL-WEYFDNX30"; // key publik dari ytcfg situs YT Music
const BASE = "https://music.youtube.com/youtubei/v1";
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36";

let cachedVersion = null;
let versionPromise = null;

async function fetchClientVersion() {
  if (cachedVersion) return cachedVersion;
  if (!versionPromise) {
    versionPromise = (async () => {
      try {
        const res = await fetch("https://music.youtube.com", {
          headers: { "User-Agent": UA, "Accept-Language": "en-US,en;q=0.9" },
        });
        const html = await res.text();
        const m = html.match(/INNERTUBE_CLIENT_VERSION["']?\s*[:=]\s*["']([^"']+)["']/);
        if (m && m[1]) {
          cachedVersion = m[1];
          return cachedVersion;
        }
      } catch (_) {
        /* fallback */
      }
      return FALLBACK_VERSION;
    })();
  }
  return versionPromise;
}

async function request(endpoint, data = {}, retries = 3) {
  const version = await fetchClientVersion();
  const body = {
    context: {
      client: {
        clientName: "WEB_REMIX",
        clientVersion: version,
        hl: "en",
        gl: "US",
      },
    },
    ...data,
  };
  const url = `${BASE}/${endpoint}?alt=json&key=${API_KEY}`;
  let lastErr;
  for (let i = 0; i <= retries; i++) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "User-Agent": UA,
          Origin: "https://music.youtube.com",
          Referer: "https://music.youtube.com",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(20000),
      });
      if (!res.ok) {
        const err = await res.text().catch(() => "");
        throw new Error(`HTTP ${res.status}: ${err.slice(0, 200)}`);
      }
      const json = await res.json();
      if (json.error) throw new Error(JSON.stringify(json.error));
      return json;
    } catch (e) {
      lastErr = e;
      // retry dengan cache version di-reset (mungkin versi basi)
      if (i === 0) {
        cachedVersion = null;
        versionPromise = null;
        await fetchClientVersion();
      }
    }
  }
  throw lastErr;
}

module.exports = { request, fetchClientVersion };
