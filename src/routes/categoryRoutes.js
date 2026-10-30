const express = require("express");
const categoryController = require("../controllers/categoryController");
const { handleRoute } = require("../utils/helpers");

const router = express.Router();

router.get("/categories", handleRoute(categoryController.getCategories));

module.exports = router;
