require("dotenv").config();

const app = require("./src/app");
const pool = require("./src/config/database");
const { cleanupExpiredListings } = require("./src/services/cleanupService");

const port = Number(process.env.PORT || 3000);
const host = process.env.HOST || "localhost";

pool
  .query("SELECT 1")
  .then(() => cleanupExpiredListings())
  .then(() => {
    // Jalankan pembersihan berkala setiap 1 jam
    setInterval(() => {
      cleanupExpiredListings().catch((error) =>
        console.error("Pembersihan barang terjual gagal:", error),
      );
    }, 60 * 60 * 1000).unref();

    app.listen(port, host, () => {
      console.log(`====================================================`);
      console.log(` PasarKampus Gunadarma aktif!`);
      console.log(` Local:   http://localhost:${port}`);
      if (host !== "localhost") {
        console.log(` Network: http://${host}:${port}`);
      }
      console.log(`====================================================`);
    });
  })
  .catch((error) => {
    console.error(
      "Tidak dapat terhubung ke PostgreSQL. Pastikan PostgreSQL berjalan dan jalankan database/schema.sql.",
      error,
    );
    process.exitCode = 1;
  });
