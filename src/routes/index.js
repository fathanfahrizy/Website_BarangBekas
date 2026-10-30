const express = require("express");
const authRoutes = require("./authRoutes");
const categoryRoutes = require("./categoryRoutes");
const listingRoutes = require("./listingRoutes");
const conversationRoutes = require("./conversationRoutes");

const router = express.Router();

router.use(authRoutes);
router.use(categoryRoutes);
router.use(listingRoutes);
router.use(conversationRoutes);

module.exports = router;
