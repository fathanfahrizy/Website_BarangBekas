const { rateLimit } = require("express-rate-limit");

/**
 * Pembatas request untuk mencegah serangan brute force pada endpoint login & register
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 menit
  limit: 20, // Maks 20 percobaan per window
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: {
    error: "Terlalu banyak percobaan. Coba lagi dalam beberapa menit.",
  },
});

module.exports = {
  authLimiter,
};
