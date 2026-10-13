const express = require("express");
const router = express.Router();
const {
  authenticate,
  authorizePermission,
} = require("../../middleware/authMiddleware");
const VariantSupplierController = require("../../controllers/admin/VariantSupplierController");

// Lấy danh sách nhà cung cấp của 1 biến thể cụ thể
router.get(
  "/:variant_id/suppliers",
  authenticate,
  authorizePermission("manage_products"),
  VariantSupplierController.getSuppliersForVariant,
);

// Gán thêm 1 nhà cung cấp vào biến thể
router.post(
  "/:variant_id/suppliers",
  authenticate,
  authorizePermission("manage_products"),
  VariantSupplierController.assignSupplierToVariant,
);

// Xóa 1 nhà cung cấp khỏi biến thể
router.delete(
  "/:variant_id/suppliers/:supplier_id",
  authenticate,
  authorizePermission("manage_products"),
  VariantSupplierController.removeSupplierFromVariant,
);

module.exports = router;
