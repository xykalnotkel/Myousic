// Kurasi konten: lagu trending & artis Indonesia
export interface CuratedSong {
  artist: string;
  title: string;
}

export const TRENDING_SONGS: CuratedSong[] = [
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
  { artist: "Yura Yunita", title: "Harus Bahagia" },
  { artist: "Fiersa Besari", title: "Waktu yang Salah" },
  { artist: "Sheila On 7", title: "Dan" },
  { artist: "Last Child", title: "Duka" },
];

export interface IndoArtistSeed {
  name: string;
  /** query pencarian yang lebih spesifik (hindari homonim barat) */
  query: string;
  /** channel YT Music kalau sudah diketahui */
  browseId?: string;
}

export const INDO_ARTISTS: IndoArtistSeed[] = [
  { name: "Tulus", query: "Tulus", browseId: "UC_DHlXllTSMB8pTC38_leFg" },
  { name: "Raisa", query: "Raisa Andriana", browseId: "UCbbaUGg_hwl2u5R511BTMWw" },
  { name: "Noah", query: "Noah Peterpan Indonesia" },
  { name: "Dewa 19", query: "Dewa 19", browseId: "UCn0hl0XZ3bFREX2SCBZK3Pw" },
  { name: "Isyana Sarasvati", query: "Isyana Sarasvati", browseId: "UCbQDCZPk4_r-4_tIxTHyGVQ" },
  { name: "Pamungkas", query: "Pamungkas", browseId: "UCKsVGAgYj1seH6HLXr61ZJg" },
  { name: "Nadin Amizah", query: "Nadin Amizah", browseId: "UCZhZaUHxvz-cxWFhYaWKmtw" },
  { name: "Hindia", query: "Hindia", browseId: "UCzhVLh7xVyH3MpqO_KY6SYg" },
  { name: "Bernadya", query: "Bernadya" },
  { name: "Sal Priadi", query: "Sal Priadi" },
  { name: "Mahalini", query: "Mahalini Raharja" },
  { name: "Rizky Febian", query: "Rizky Febian" },
  { name: "Fiersa Besari", query: "Fiersa Besari" },
  { name: "Juicy Luicy", query: "Juicy Luicy" },
  { name: "Yura Yunita", query: "Yura Yunita" },
  { name: "Sheila On 7", query: "Sheila On 7" },
  { name: "Afgan", query: "Afgan Syahreza" },
  { name: "Lyodra", query: "Lyodra Ginting" },
  { name: "Tiara Andini", query: "Tiara Andini" },
  { name: "Ardhito Pramono", query: "Ardhito Pramono" },
  { name: "Kunto Aji", query: "Kunto Aji" },
  { name: ".Feast", query: "Feast band Indonesia" },
  { name: "Reality Club", query: "Reality Club" },
  { name: "Fourtwnty", query: "Fourtwnty" },
];
