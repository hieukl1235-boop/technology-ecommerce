const express = require("express");
const router = express.Router();

const couponController = require("../../controllers/admin/couponController");

const {
  authenticate,
  authorizePermission,
} = require("../../middleware/authMiddleware");

// Danh sách mã giảm giá
router.get(
  "/",
  authenticate,
  authorizePermission("manage_discounts"),
  couponController.getAllCoupons,
);

// Chi tiết mã giảm giá
router.get(
  "/:id",
  authenticate,
  authorizePermission("manage_discounts"),
  couponController.getCouponById,
);

// Tạo mã giảm giá
router.post(
  "/",
  authenticate,
  authorizePermission("manage_discounts"),
  couponController.createCoupon,
);

// Cập nhật mã giảm giá
router.put(
  "/:id",
  authenticate,
  authorizePermission("manage_discounts"),
  couponController.updateCoupon,
);

// Bật / tắt mã giảm giá
router.patch(
  "/:id/status",
  authenticate,
  authorizePermission("manage_discounts"),
  couponController.updateCouponStatus,
);

module.exports = router;
