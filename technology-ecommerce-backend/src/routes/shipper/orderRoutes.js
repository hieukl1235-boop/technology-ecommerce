const express = require("express");

const router = express.Router();
const OrderController = require("../../controllers/admin/orderController");
const authMiddleware = require("../../middleware/authMiddleware");
const upload = require("../../middleware/upload")

router.get("/", authMiddleware.authenticate, OrderController.getShipperOrders);
router.patch(
  "/:orderCode/complete",
  authMiddleware.authenticate,
  upload.single("proof_image"),
  OrderController.completeOrder,
);
router.patch("/:orderCode/fail", authMiddleware.authenticate, OrderController.failOrder);
module.exports = router;