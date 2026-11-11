const express = require("express");
const router = express.Router();
const bannerController = require("../../controllers/admin/bannerController");
const {
  authenticate,
  authorizePermission,
} = require("../../middleware/authMiddleware");
const upload = require("../../middleware/upload"); // Middleware multer của bạn

router.get("/", bannerController.getActiveBanners);
router.get(
  "/all",authenticate,
  authorizePermission("manage_banners"),
  bannerController.getAllBanners,
);
router.post(
  "/",
  authenticate,
  authorizePermission("manage_banners"),
  upload.single("image"),
  bannerController.createBanner,
);
router.put(
  "/:id",
  authenticate,
  authorizePermission("manage_banners"),
  upload.single("image"),
  bannerController.updateBanner,
);
router.patch(
  "/:id/status",
  authenticate,
  authorizePermission("manage_banners"),
  bannerController.updateStatus,
);
router.delete(
  "/:id",
  authenticate,
  authorizePermission("manage_banners"),
  bannerController.deleteBanner,
);

module.exports = router;

