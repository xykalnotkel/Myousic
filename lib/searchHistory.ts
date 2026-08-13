const KEY = "ms:search-hist";
const MAX = 12;

export function loadSearchHistory(): string[] {
  try {
    const raw = localStorage.getItem(KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}

export function pushSearchHistory(q: string) {
  const s = q.trim();
  if (s.length < 2) return;
  const prev = loadSearchHistory().filter((x) => x.toLowerCase() !== s.toLowerCase());
  const next = [s, ...prev].slice(0, MAX);
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {}
}

export function removeSearchHistory(q: string) {
  const next = loadSearchHistory().filter((x) => x !== q);
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {}
}

export function clearSearchHistory() {
  try {
    localStorage.removeItem(KEY);
  } catch {}
}
