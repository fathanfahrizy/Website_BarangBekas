const { allowedNpmPrefixes } = require("../constants/gunadarma");

/**
 * Validasi nomor pokok mahasiswa (NPM) Universitas Gunadarma
 * Aturan:
 * 1. Tepat 8 digit angka
 * 2. 3 digit pertama merupakan kode jurusan yang terdaftar di allowedNpmPrefixes
 * 3. 2 digit berikutnya adalah 2 digit tahun masuk (2000 + xx), tidak boleh melebihi tahun sekarang
 * 4. 3 digit terakhir adalah nomor urut mahasiswa, tidak boleh '000'
 */
function validateNpm(npm) {
  const cleanNpm = String(npm || "").trim();

  if (!/^\d{8}$/.test(cleanNpm)) {
    return "NPM harus terdiri dari tepat 8 digit angka.";
  }

  const prefix = cleanNpm.slice(0, 3);
  if (!allowedNpmPrefixes.has(prefix)) {
    return "Kode program studi pada NPM tidak terdaftar di Universitas Gunadarma.";
  }

  const year = 2000 + Number(cleanNpm.slice(3, 5));
  const currentYear = new Date().getFullYear();
  if (year > currentYear) {
    return "Tahun masuk pada NPM tidak valid (melebihi tahun berjalan).";
  }

  const sequence = Number(cleanNpm.slice(5));
  if (sequence === 0) {
    return "Tiga digit terakhir NPM tidak boleh 000.";
  }

  return null;
}

module.exports = {
  validateNpm,
};
