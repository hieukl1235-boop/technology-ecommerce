const express = require("express");
const router = express.Router();
const {
  authenticate,
  authorizePermission,
} = require("../../middleware/authMiddleware");
const SupplierController = require("../../controllers/admin/SupplierController");
// Lấy danh sách tất cả nhà cung cấp đang hoạt động
router.get(
  "/",
  authenticate,
  authorizePermission("manage_suppliers"),
  SupplierController.getAllSuppliers,
);

// Lấy chi tiết 1 nhà cung cấp theo ID
router.get(
  "/:id",
  authenticate,
  authorizePermission("manage_suppliers"),
  SupplierController.getSupplierById,
);

// Thêm mới nhà cung cấp
router.post(
  "/",
  authenticate,
  authorizePermission("manage_suppliers"),
  SupplierController.createSupplier,
);

// Cập nhật thông tin nhà cung cấp
router.put(
  "/:id",
  authenticate,
  authorizePermission("manage_suppliers"),
  SupplierController.updateSupplier,
);

// Cập nhật trạng thái (Khóa/Mở khóa nhà cung cấp)
router.patch(
  "/:id/status",
  authenticate,
  authorizePermission("manage_suppliers"),
  SupplierController.updateSupplierStatus,
);

module.exports = router;
