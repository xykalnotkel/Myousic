# Myousic

Pemutar musik monokrom bergaya Spotify dengan visualizer ular morphing yang bereaksi terhadap beat. Dibangun dengan Next.js 16 di atas ekosistem YouTube Music.

[![License](https://img.shields.io/badge/License-GPL--3.0-4caf50?style=flat-square&logo=gnu&logoColor=white)](LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js%2016-black?style=flat-square&logo=nextdotjs&logoColor=white)](https://nextjs.org)
[![React](https://img.shields.io/badge/React%2019-61dafb?style=flat-square&logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript%205-3178c6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS%204-38bdf8?style=flat-square&logo=tailwindcss&logoColor=black)](https://tailwindcss.com)
[![Node.js](https://img.shields.io/badge/Node.js%2020%2B-339933?style=flat-square&logo=nodedotjs&logoColor=white)](https://nodejs.org)
[![Deploy](https://img.shields.io/badge/Deploy%20on%20Vercel-000000?style=flat-square&logo=vercel&logoColor=white)](https://vercel.com)
[![Web Audio API](https://img.shields.io/badge/Web%20Audio%20API-8b5cf6?style=flat-square&logo=webgl&logoColor=white)](https://developer.mozilla.org/docs/Web/API/Web_Audio_API)

---

## Tentang Proyek

Myousic adalah aplikasi web pemutar musik dengan konsep visual monokrom (hitam-putih) dan pengalaman interaktif: visualizer gelombang suara berbentuk ular morphing, lirik otomatis yang ber-progres mengikuti lagu, hingga daftar lagu trending Indonesia.

Aplikasi ini **tidak menyimpan, mengunduh, atau meng-host konten apa pun**. Seluruh musik, lirik, sampul, dan metadata yang tampil berasal dari YouTube / YouTube Music dan dimiliki oleh pemilik hak cipta masing-masing. Myousic hanya menampilkan tautan ke konten yang sudah tersedia publik di platform tersebut.

## Fitur

- **Pencarian** lagu, video, album, playlist, dan artis — dengan tab filter dan debounce otomatis
- **Pemutar lengkap**: play/pause, next/prev, seek, volume, mute, shuffle, repeat (off/all/one), antrian
- **Lirik otomatis ber-progres** — lirik ber-timestamp dari YouTube Music; baris aktif menyala, auto-scroll mengikuti lagu, dengan progress bar per baris (tab Lirik di Now Playing)
- **Visualizer ular morphing** — seekor ular cahaya yang tubuhnya bergelombang, berubah wujud (morph), dan mengembang-mengempis mengikuti frekuensi; mata dan lidah menyala saat beat (deteksi energi bass via Web Audio API)
- **Cover album multi-style** — 6 gaya: Asli, Mono, Glow, Gelombang, Scanline, Piksel; dapat diganti dan tersimpan di localStorage
- **Artis Indonesia** — kartu artis Tanah Air populer di beranda, plus halaman artis lengkap (lagu populer, album, single)
- **Trending Indonesia** — daftar lagu yang sedang ramai diputar, campuran lokal dan internasional, dicocokkan otomatis ke YouTube Music
- **Ilustrasi vector flat unik** — 8 aset line-art putih transparan (WEBP HD) yang dipakai di hero, banner, halaman 404/error, dan fallback cover
- **Player bar melayang (floating)** — bar pemutar berbentuk kartu mengambang dengan jarak standar dari tepi layar
- **Responsif penuh** — mobile memakai bottom navigation (Beranda, Trending, Now Playing, Artis, Cari); desktop memakai sidebar
- **UI monokrom** — hitam murni dan putih, kartu hover-lift, equalizer animasi, skeleton loading
- **Blur style** (bukan glassmorphism) — blob cahaya blur pada latar serta cover art yang di-blur sebagai backdrop
- **Keyboard shortcuts** — Space untuk play/pause, panah kiri/kanan maju-mundur 5 detik, panah atas/bawah volume, M untuk mute, Esc untuk menutup

## Teknologi

| Bagian | Teknologi |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack) |
| UI | React 19, TypeScript, Tailwind CSS v4 |
| Audio | Web Audio API (AnalyserNode) + HTMLAudioElement |
| Backend | Route Handlers serverless (Node.js runtime) |
| Sumber data | Endpoint publik InnerTube YouTube / YouTube Music (scraping) |

## Menjalankan Secara Lokal

```bash
npm install
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000).

Build produksi:

```bash
npm run build
npm start
```

## Deploy ke Vercel

Myousic adalah aplikasi full-stack dalam satu deploy — backend (proxy stream, lirik, scraping) dan frontend berjalan bersama di fungsi serverless Vercel.

1. Push proyek ini ke GitHub.
2. Di [vercel.com](https://vercel.com), pilih *Add New > Project* dan import repository.
3. Framework otomatis terdeteksi sebagai Next.js — langsung *Deploy*.
4. Tidak diperlukan environment variable.

Melalui CLI:

```bash
npm i -g vercel
vercel login
vercel --prod
```

Catatan: plan Hobby Vercel mencakup sekitar 100 GB bandwidth per bulan (ribuan pemutaran lagu), cukup untuk penggunaan personal atau demo. Untuk trafik publik yang besar, pertimbangkan pindah ke VPS atau menambah cache.

## Arsitektur

```
app/
  page.tsx                 Beranda (rekomendasi, artis Indonesia, banner trending)
  search/page.tsx          Pencarian + tab tipe
  trending/page.tsx        Daftar lagu trending Indonesia
  artists/page.tsx         Daftar artis populer
  album/[id]/page.tsx      Detail album
  playlist/[id]/page.tsx   Detail playlist
  artist/[id]/page.tsx     Detail artis
  api/stream/[videoId]/    Proxy stream audio (mendukung HTTP Range / seek)
  api/lyrics/[videoId]/    Lirik ber-timestamp
components/
  PlayerProvider.tsx       State pemutar + Web Audio (analyser)
  PlayerBar.tsx            Bar pemutar melayang (desktop/mobile)
  MobileNav.tsx            Bottom navigation mobile
  FullPlayer.tsx           Now Playing: cover multi-style + tab Visualizer/Lirik/Antrian
  Lyrics.tsx               Lirik ber-progres (auto-scroll + highlight)
  Visualizer.tsx           Canvas: bar frekuensi dan ular morphing + deteksi beat
lib/
  scraper/                 Modul scraping (search, album, playlist, artist, lyrics)
  stream.ts                Pengambilan URL stream via InnerTube (client ANDROID)
  data.ts                  Kurasi daftar trending dan artis
  brand.ts                 Nama dan tagline (ganti merek di satu tempat)
public/illustrations/      8 ilustrasi vector flat (WEBP transparan)
```

## Metode Pengambilan Data (Scraping)

Myousic **bukan aplikasi resmi** dan **tidak berafiliasi** dengan Google, YouTube, atau YouTube Music.

- Seluruh data diambil dengan cara **scraping endpoint publik InnerTube** yang digunakan oleh aplikasi YouTube Music itu sendiri — bukan melalui API resmi berlisensi.
- Endpoint tersebut membutuhkan key publik yang sudah tersedia di halaman situs YouTube Music, dan client version yang diekstrak secara dinamis agar selalu mengikuti versi terbaru.
- Aplikasi ini tidak memintas DRM, tidak meminta login, dan tidak mengakses akun atau data privat pengguna mana pun.
- Audio diputar dengan melakukan proxy terhadap stream publik YouTube; tidak ada konten yang diunduh permanen oleh server maupun disimpan di database.

Oleh karena itu:

- Ketersediaan dan stabilitas fitur **tidak dijamin** — struktur endpoint dapat berubah sewaktu-waktu tanpa pemberitahuan.
- Gunakan aplikasi ini untuk **keperluan pribadi dan edukasi** dengan bijak dan wajar.
- Dilarang menggunakan aplikasi ini untuk mengunduh massal, mengarsipkan, mendistribusikan ulang, atau mengkomersialkan konten yang ditampilkan.

## Ketentuan Layanan (Terms of Service)

Dengan menggunakan Myousic, Anda menyetujui hal-hal berikut:

1. **Kepemilikan konten** — Semua musik, video, lirik, sampul album, dan metadata adalah milik artis, label, penerbit, atau Google/YouTube yang berhak. Myousic tidak mengklaim kepemilikan atas konten apa pun.
2. **Sumber konten** — Konten ditampilkan berdasarkan ketersediaan publik di YouTube Music. Myousic hanya menyediakan akses pemutaran; tidak ada file media yang disimpan di server Myousic.
3. **Penggunaan wajar** — Aplikasi ditujukan untuk penggunaan pribadi, non-komersial, dan edukasi. Pengguna bertanggung jawab penuh atas cara mereka menggunakan aplikasi ini, termasuk kepatuhan terhadap Ketentuan Layanan YouTube.
4. **Batasan layanan** — Layanan dapat berubah, terganggu, atau dihentikan tanpa pemberitahuan. Myousic tidak bertanggung jawab atas kerugian yang timbul dari penggunaan atau ketidaktersediaan layanan.
5. **Tidak ada jaminan** — Aplikasi disediakan "sebagaimana adanya" tanpa jaminan apa pun, tersurat maupun tersirat.
6. **Penghapusan konten** — Jika Anda adalah pemegang hak cipta dan tidak ingin karya Anda muncul dalam rekomendasi atau hasil pencarian Myousic, ajukan permintaan melalui halaman issue repository ini; tautan ke konten Anda akan dihapus dari daftar yang dikurasi.

## Lisensi

Proyek ini dilisensikan di bawah **GNU General Public License v3.0** — karena Myousic menggabungkan kode `kainet-scraper` (lisensi GPL-3.0) yang telah diperbaiki/dipatch, seluruh proyek tunduk pada ketentuan GPL-3.0. Silakan lihat file [LICENSE](LICENSE) untuk teks lengkap.

Ringkasan GPL-3.0:

- Boleh menggunakan, memodifikasi, dan mendistribusikan ulang.
- Setiap karya turunan **wajib** dilisensikan dengan GPL-3.0 juga (copyleft).
- Kode sumber karya turunan **wajib** disediakan.
- Tidak ada jaminan; penggunaan sepenuhnya tanggung jawab pengguna.

## Kredit dan Atribusi

- **[kainet-scraper](https://github.com/thedaviddelta/kainet-scraper)** oleh TheDavidDelta — dasar modul scraping (GPL-3.0), diperbaiki agar kompatibel dengan struktur YouTube Music terkini.
- **[ytmusicapi](https://github.com/sigma67/ytmusicapi)** — referensi format parameter pencarian dan teknik pengambilan lirik.
- **YouTube / YouTube Music** — penyedia konten. Myousic tidak berafiliasi dengan Google LLC.

---

Dibuat dengan pendekatan open-source: transparan tentang metode, jujur tentang sumber konten, dan aman secara legal.
