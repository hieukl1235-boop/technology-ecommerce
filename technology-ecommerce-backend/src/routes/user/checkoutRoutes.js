const express = require("express");
const router = express.Router();
const CheckoutController = require("../../controllers/user/checkoutController");

// Đường dẫn API: POST /api/checkout/items
router.post("/items", CheckoutController.getCheckoutItems);

module.exports = router;
