const express = require("express");
const router = express.Router();
const CouponController = require("../../controllers/user/couponController");

router.post("/apply", CouponController.applyCoupon);
router.get("/available", CouponController.getAvailableCoupons);

module.exports = router;
