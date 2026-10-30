const express = require("express");
const listingController = require("../controllers/listingController");
const { requireAuth } = require("../middlewares/auth");
const { imageUpload } = require("../middlewares/upload");
const { handleRoute } = require("../utils/helpers");

const router = express.Router();

router.get("/listings", handleRoute(listingController.getListings));
router.get("/listings/:id", handleRoute(listingController.getListingById));
router.post(
  "/listings",
  requireAuth,
  imageUpload.array("images", 4),
  handleRoute(listingController.createListing),
);
router.patch(
  "/listings/:id/status",
  requireAuth,
  handleRoute(listingController.updateListingStatus),
);

module.exports = router;
