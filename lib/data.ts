// Kurasi konten: lagu trending (Indonesia + Barat) & daftar artis
export interface CuratedSong {
  artist: string;
  title: string;
}

// Lagu yang sedang trend di Indonesia (campuran artis lokal & internasional)
export const TRENDING_SONGS: CuratedSong[] = [
  // --- Indonesia ---
  { artist: "Sal Priadi", title: "Gala Bunga Matahari" },
  { artist: "Bernadya", title: "Satu Bulan" },
  { artist: "Mahalini", title: "Sial" },
  { artist: "Nadin Amizah", title: "Rayuan Perempuan Gila" },
  { artist: "Hindia", title: "Evaluasi" },
  { artist: "Tulus", title: "Hati-Hati di Jalan" },
  { artist: "Rizky Febian & Mahalini", title: "Bermuara" },
  { artist: "Noah", title: "Separuh Aku" },
  { artist: "Raisa", title: "Kali Kedua" },
  { artist: "Juicy Luicy", title: "Lantas" },
  { artist: "Dewa 19", title: "Pupus" },
  { artist: "Pamungkas", title: "To the Bone" },
  // --- Barat ---
  { artist: "Lady Gaga & Bruno Mars", title: "Die With A Smile" },
  { artist: "Billie Eilish", title: "Birds of a Feather" },
  { artist: "Sabrina Carpenter", title: "Espresso" },
  { artist: "The Weeknd", title: "São Paulo" },
  { artist: "Kendrick Lamar", title: "Not Like Us" },
  { artist: "Post Malone", title: "I Had Some Help" },
  { artist: "Gracie Abrams", title: "That's So True" },
  { artist: "Benson Boone", title: "Beautiful Things" },
];

// Artis populer untuk halaman /artists (Indonesia + internasional)
export const POPULAR_ARTISTS: { name: string; origin: "Indonesia" | "Internasional" }[] = [
  { name: "Tulus", origin: "Indonesia" },
  { name: "Raisa", origin: "Indonesia" },
  { name: "Mahalini", origin: "Indonesia" },
  { name: "Nadin Amizah", origin: "Indonesia" },
  { name: "Hindia", origin: "Indonesia" },
  { name: "Sal Priadi", origin: "Indonesia" },
  { name: "Bernadya", origin: "Indonesia" },
  { name: "Noah", origin: "Indonesia" },
  { name: "Dewa 19", origin: "Indonesia" },
  { name: "Isyana Sarasvati", origin: "Indonesia" },
  { name: "Pamungkas", origin: "Indonesia" },
  { name: "Rizky Febian", origin: "Indonesia" },
  { name: "Queen", origin: "Internasional" },
  { name: "Coldplay", origin: "Internasional" },
  { name: "Billie Eilish", origin: "Internasional" },
  { name: "Taylor Swift", origin: "Internasional" },
  { name: "Bruno Mars", origin: "Internasional" },
  { name: "The Weeknd", origin: "Internasional" },
  { name: "Ariana Grande", origin: "Internasional" },
  { name: "Ed Sheeran", origin: "Internasional" },
];
