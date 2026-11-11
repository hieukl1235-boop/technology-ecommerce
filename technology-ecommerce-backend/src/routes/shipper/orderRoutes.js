const express = require("express");

const router = express.Router();
const OrderController = require("../../controllers/admin/orderController");
const authMiddleware = require("../../middleware/authMiddleware");
const upload = require("../../middleware/upload");

router.get(
  "/",
  authMiddleware.authenticate,
  authMiddleware.authorizePermission("manage_delivery"),
  OrderController.getShipperOrders,
);
router.patch(
  "/:orderCode/complete",
  authMiddleware.authenticate,
  authMiddleware.authorizePermission("manage_delivery"),
  upload.single("proof_image"),
  OrderController.completeOrder,
);
router.patch(
  "/:orderCode/fail",
  authMiddleware.authenticate,
  authMiddleware.authorizePermission("manage_delivery"),
  OrderController.failOrder,
);
module.exports = router;
