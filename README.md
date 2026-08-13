# Myousic 🐍🎵

**Pemutar musik hitam-putih ala Spotify** dengan **visualizer ular morphing** yang menari mengikuti beat.
Dibangun dengan **Next.js 16** di atas YouTube Music — memakai `kainet-scraper` (versi patched) untuk metadata dan InnerTube untuk audio.

## ✨ Fitur

- 🔍 **Pencarian** lagu, video, album, playlist & artis (tab filter + debounce)
- ▶️ **Pemutar lengkap**: play/pause, next/prev, seek, volume, mute, shuffle, repeat (off/all/one), antrian
- 🎤 **Lirik otomatis ber-progres** — lirik ber-timestamp dari YouTube Music; baris aktif menyala, **auto-scroll** mengikuti lagu, dengan progress bar per baris (tab "Lirik" di Now Playing)
- 🐍 **Visualizer ular morphing** — seekor ular cahaya yang tubuhnya bergelombang, berubah wujud (morph), mengerut-mengembang mengikuti frekuensi; **mata & lidah menyala saat beat** (deteksi energi bass via Web Audio API)
- 🖼️ **Cover album multi-style** — 6 gaya: Asli, Mono (hitam-putih), Glow (blur menyala), Gelombang (mask pita bergelombang), Scanline, Piksel; bisa diganti dengan tombol ‹ › dan tersimpan di localStorage
- 🇮🇩 **Artis Indonesia di beranda** — kartu artis Tanah Air populer (Tulus, Raisa, Noah, dll.) + halaman artis lengkap (lagu populer, album, single)
- 🔥 **Trending Indonesia** (`/trending`) — daftar lagu yang sedang ramai: campuran lokal & internasional (Sal Priadi, Bernadya, Lady Gaga, Sabrina Carpenter…) dicocokkan otomatis ke YouTube Music
- 🎨 **8 ilustrasi vector flat unik** (`/illustrations/*.webp`) — line-art putih transparan (tanpa background, WEBP HD) buatan AI: vinyl-wave, headphone-peaks, cassette-garden, speaker-notes, turntable-orbit, radio-galaxy, piano-skyline, mic-bloom — dipakai di hero, banner trending, halaman 404/error, & fallback cover
- 🧭 **Sidebar desktop 4 menu**: Beranda, Cari, Trending, Artis (bottom-nav mobile 5 item)
- 💧 **Player bar melayang (floating)** — bar bawah berbentuk kartu mengambang dengan jarak standar dari tepi layar, dengan strip visualizer di atasnya
- 📱 **Responsif penuh**: mobile memakai **bottom nav** (Beranda / Now Playing / Cari) + header atas; desktop memakai **sidebar** kiri
- 🎨 **UI monokrom**: hitam murni + putih, kartu hover-lift, equalizer animasi, skeleton loading
- 💨 **Blur style (bukan glassmorphism)**: blob cahaya blur + cover art di-blur sebagai backdrop
- ⌨️ **Keyboard**: `Space` play/pause · `←/→` ±5 detik · `↑/↓` volume · `M` mute · `Esc` tutup

## 🚀 Menjalankan lokal

```bash
npm install
npm run dev        # http://localhost:3000
```

Production:

```bash
npm run build && npm start
```

## ▲ Deploy ke Vercel

Opsi A — **lewat dashboard** (paling mudah):
1. Push proyek ini ke GitHub
2. Di [vercel.com](https://vercel.com) → *Add New → Project* → import repo
3. Framework otomatis terdeteksi: **Next.js** → *Deploy*

Opsi B — **lewat CLI**:

```bash
npm i -g vercel
vercel login
vercel --prod
```

Tidak perlu environment variable apa pun. Catatan:
- Route API `/api/stream/[videoId]` memakai **Node.js runtime** (streaming) — sudah di-set otomatis
- Outbound request ke YouTube/InnerTube diizinkan dari fungsi serverless Vercel
- `next build` sudah lolos di CI (Turbopack)

## 🏗️ Arsitektur

```
app/
  page.tsx               → beranda (rekomendasi + hero ular + Artis Indonesia)
  search/page.tsx        → pencarian + tab tipe
  album/[id]/page.tsx    → detail album
  playlist/[id]/page.tsx → detail playlist
  artist/[id]/page.tsx   → detail artis (lagu populer, album, single)
  api/stream/[videoId]/  → proxy stream audio (Range/seek, Node runtime)
  api/lyrics/[videoId]/  → lirik ber-timestamp (client ANDROID_MUSIC)
components/
  PlayerProvider.tsx     → state pemutar + Web Audio (analyser)
  PlayerBar.tsx          → bar pemutar melayang (desktop 3 kolom / mobile compact)
  MobileNav.tsx          → bottom nav mobile
  FullPlayer.tsx         → Now Playing: cover multi-style + tabs (Visualizer/Lirik/Antrian)
  Lyrics.tsx             → lirik ber-progres (auto-scroll + highlight)
  Visualizer.tsx         → canvas: bar frekuensi & ular morphing + deteksi beat
  TrackList.tsx          → daftar lagu responsif
lib/
  scraper/               → kainet-scraper patched (search/album/playlist/artist/lyrics)
  stream.ts              → ambil URL stream via InnerTube (client ANDROID)
  brand.ts               → nama & tagline (ganti merek di satu tempat)
```

## ⚠️ Catatan teknis

- API tidak resmi (scraping InnerTube) — gunakan wajar.
- Format stream yang didapat: progressive mp4 (audio + video 360p) karena YouTube membatasi format audio-only tanpa login/po_token — browser hanya memutar audio-nya. Untuk kualitas lebih tinggi perlu po_token.
- Lisensi kode scraping: GPL-3.0 (mengikuti kainet-scraper asli).
