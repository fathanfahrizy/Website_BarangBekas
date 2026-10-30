const path = require("node:path");
const fs = require("node:fs");
const crypto = require("node:crypto");
const multer = require("multer");

const uploadDir = path.resolve(__dirname, "../../uploads");
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, callback) => callback(null, uploadDir),
  filename: (_req, file, callback) => {
    const extensions = {
      "image/jpeg": ".jpg",
      "image/png": ".png",
      "image/webp": ".webp",
    };
    const ext = extensions[file.mimetype] || path.extname(file.originalname);
    callback(null, `${crypto.randomUUID()}${ext}`);
  },
});

const imageUpload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024, files: 4 }, // Maksimal 5MB per foto, maks 4 foto
  fileFilter: (_req, file, callback) => {
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.mimetype)) {
      callback(new Error("Foto harus berformat JPG, PNG, atau WebP."));
      return;
    }
    callback(null, true);
  },
});

module.exports = {
  imageUpload,
  uploadDir,
};
