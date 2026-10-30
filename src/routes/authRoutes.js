const express = require("express");
const authController = require("../controllers/authController");
const { requireAuth } = require("../middlewares/auth");
const { authLimiter } = require("../middlewares/rateLimiter");
const { imageUpload } = require("../middlewares/upload");
const { handleRoute } = require("../utils/helpers");

const router = express.Router();

router.get("/me", handleRoute(authController.getMe));
router.post("/register", authLimiter, handleRoute(authController.register));
router.post("/login", authLimiter, handleRoute(authController.login));
router.post("/logout", requireAuth, authController.logout);
router.put(
  "/profile",
  requireAuth,
  imageUpload.single("avatar"),
  handleRoute(authController.updateProfile),
);

module.exports = router;
