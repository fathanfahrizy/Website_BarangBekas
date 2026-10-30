const express = require("express");
const conversationController = require("../controllers/conversationController");
const { requireAuth } = require("../middlewares/auth");
const { handleRoute } = require("../utils/helpers");

const router = express.Router();

router.get(
  "/conversations",
  requireAuth,
  handleRoute(conversationController.getConversations),
);
router.get(
  "/conversations/:id/messages",
  requireAuth,
  handleRoute(conversationController.getMessages),
);
router.post(
  "/conversations",
  requireAuth,
  handleRoute(conversationController.createConversation),
);
router.post(
  "/conversations/:id/messages",
  requireAuth,
  handleRoute(conversationController.sendMessage),
);

module.exports = router;
