const express = require("express");

const router = express.Router();

const purchaseReceiptController = require("../../controllers/admin/purchaseReceiptController");


const {
  authenticate,
  authorizePermission,
} = require("../../middleware/authMiddleware");

// Danh sách phiếu nhập
router.get(
  "/",
  authenticate,
  authorizePermission("manage_inventory"),
  purchaseReceiptController.getAllPurchaseReceipts,
);

// Chi tiết phiếu nhập
router.get(
  "/:id",
  authenticate,
  authorizePermission("manage_inventory"),
  purchaseReceiptController.getPurchaseReceiptById,
);

// Tạo phiếu nhập
router.post(
  "/",
  authenticate,
  authorizePermission("manage_inventory"),
  purchaseReceiptController.createPurchaseReceipt,
);
router.patch("/:id/cancel", purchaseReceiptController.cancelPurchaseReceipt);

router.get("/:id/variants", purchaseReceiptController.getVariantsBySupplierId);

module.exports = router;
