const path = require("node:path");
const express = require("express");
const helmet = require("helmet");
const multer = require("multer");

const sessionConfig = require("./config/session");
const { uploadDir } = require("./middlewares/upload");
const apiRoutes = require("./routes");

const app = express();

// Keamanan & parsing
app.disable("x-powered-by");
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: "same-site" },
  }),
);
app.use(express.json({ limit: "20kb" }));
app.use(express.urlencoded({ extended: false, limit: "20kb" }));

// Session management
app.use(sessionConfig);

// Static assets (uploads & frontend)
app.use("/uploads", express.static(uploadDir, { maxAge: "1d", dotfiles: "deny" }));
app.use(express.static(path.resolve(__dirname, "../public")));

// API Endpoints
app.use("/api", apiRoutes);

// Global Error Handler
app.use((error, _req, res, _next) => {
  if (error instanceof multer.MulterError) {
    const message =
      error.code === "LIMIT_FILE_SIZE"
        ? "Ukuran foto maksimal 5 MB."
        : "Jumlah foto maksimal 4.";
    return res.status(400).json({ error: message });
  }

  if (error.message === "Foto harus berformat JPG, PNG, atau WebP.") {
    return res.status(400).json({ error: error.message });
  }

  console.error("Internal Server Error:", error);
  res.status(500).json({
    error: "Terjadi kesalahan pada server. Silakan coba lagi.",
  });
});

module.exports = app;
