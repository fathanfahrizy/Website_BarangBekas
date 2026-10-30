const path = require("node:path");
const fs = require("node:fs");
const pool = require("../config/database");
const { uploadDir } = require("../middlewares/upload");

/**
 * Menghapus iklan yang sudah terjual lebih dari 3 hari beserta file fotonya dari disk.
 */
async function cleanupExpiredListings() {
  try {
    const oldImages = await pool.query(
      `SELECT li.url FROM listing_images li
       JOIN listings l ON l.id = li.listing_id
       WHERE l.status = 'sold' AND l.sold_at <= now() - interval '3 days'`,
    );

    await pool.query(
      "DELETE FROM listings WHERE status = 'sold' AND sold_at <= now() - interval '3 days'",
    );

    for (const image of oldImages.rows) {
      const filename = path.basename(image.url);
      try {
        await fs.promises.unlink(path.join(uploadDir, filename));
      } catch (error) {
        if (error.code !== "ENOENT") {
          console.error("Gagal menghapus foto barang terjual:", error);
        }
      }
    }
  } catch (error) {
    console.error("Error saat proses pembersihan barang terjual:", error);
  }
}

module.exports = {
  cleanupExpiredListings,
};
