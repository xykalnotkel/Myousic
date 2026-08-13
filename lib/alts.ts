// Cari video alternatif kalau id asli tidak bisa diputar.

export async function findAltIds(title?: string, artist?: string, exclude?: string): Promise<string[]> {
  const q = [title, artist].filter(Boolean).join(" ").trim();
  if (!q) return [];
  try {
    const r = await fetch(`/api/search?q=${encodeURIComponent(q)}&type=videos`, { cache: "no-store" });
    const d = await r.json();
    const ids: string[] = [];
    for (const x of d.results ?? []) {
      const id = (x as { id?: string }).id;
      if (typeof id === "string" && id.length === 11 && id !== exclude && !ids.includes(id)) {
        ids.push(id);
      }
    }
    return ids.slice(0, 6);
  } catch {
    return [];
  }
}
