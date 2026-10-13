const express = require("express");
const router = express.Router();
const orderController = require("../../controllers/admin/orderController");
const upload = require("../../middleware/upload")
const {
  authenticate,
  authorizePermission,
} = require("../../middleware/authMiddleware");
router.get(
  "/",
  authenticate,
  authorizePermission("manage_orders"),
  orderController.getAllOrders,
);
router.patch(
  "/:orderCode/status",
  authenticate,
  authorizePermission("manage_orders"),
  orderController.updateStatus,
);
router.patch(
  "/:orderCode/assign-shipper",
  authenticate,
  authorizePermission("manage_orders"),
  orderController.assignShipper
);

router.patch(
  "/:orderCode/refund",
  authenticate,
  upload.single("refund_image"),
  authorizePermission("manage_orders"),
  orderController.refundOrder,
);


router.patch("/:orderCode/cancel", authenticate, orderController.cancelOrder);

module.exports = router;