// Daftar prefix 3 digit NPM program studi Universitas Gunadarma yang valid
const allowedNpmPrefixes = new Set([
  "101", // Sistem Informasi (S1 - FIKTI)
  "504", // Informatika (S1 - FIKTI)
  "111", // Manajemen Informatika (D3 - FIKTI)
  "102", // Manajemen (S1 - FE)
  "202", // Akuntansi (S1 - FE)
  "206", // Ekonomi Syariah (S1 - FE)
  "112", // Manajemen Pemasaran (D3 - FE)
  "212", // Akuntansi (D3 - FE)
  "514", // Teknik Elektro (S1 - FTI)
  "524", // Teknik Mesin (S1 - FTI)
  "304", // Teknik Industri (S1 - FTI)
  "501", // Teknik Komputer (D3 - FTI)
  "204", // Teknik Sipil (S1 - FTSP)
  "214", // Arsitektur (S1 - FTSP)
  "105", // Psikologi (S1 - FPS)
  "108", // Sastra Inggris / Ilmu Komunikasi (S1 - FPS)
  "702", // Farmasi (S1 - FIKES)
  "404", // Agroteknologi (S1 - FIKES)
  "712", // Kedokteran (S1 - FIKES)
]);

// Label kondisi barang bekas
const conditionLabels = {
  needs_repair: "Perlu perbaikan",
  fair: "Layak",
  good: "Bagus",
  like_new: "Seperti baru",
};

// Opsi lokasi kampus untuk meetup / COD
const CAMPUS_LOCATIONS = [
  "Kampus D (Margonda, Depok)",
  "Kampus E (Kelapa Dua, Depok)",
  "Kampus G (Laboratorium Kelapa Dua)",
  "Kampus H (Simatupang, Jakarta Selatan)",
  "Kampus J (Kalimalang, Bekasi)",
  "Kampus K (Karawaci, Tangerang)",
  "Kampus A (Kenari, Jakarta Pusat)",
  "Kampus B (Salemba Bluntas)",
  "Kampus C (Salemba Tengah)",
];

module.exports = {
  allowedNpmPrefixes,
  conditionLabels,
  CAMPUS_LOCATIONS,
};
