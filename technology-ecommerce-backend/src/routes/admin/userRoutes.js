const express = require("express");
const {
  authenticate,
  authorizePermission,
} = require("../../middleware/authMiddleware");
const {
  getAllUsers,
  getUserById,
  updateUser,
  updateUserStatus,
} = require("../../controllers/admin/userController");

const router = express.Router();

// Lấy tất cả người dùng
router.get("/", authenticate, authorizePermission("manage_users"), getAllUsers);

// Lấy một người dùng
router.get(
  "/:id",
  authenticate,
  authorizePermission("manage_users"),
  getUserById,
);

// Cập nhật người dùng
router.put(
  "/:id",
  authenticate,
  authorizePermission("manage_users"),
  updateUser,
);

// Khóa / mở tài khoản
router.patch(
  "/:id/status",
  authenticate,
  authorizePermission("manage_users"),
  updateUserStatus,
);

module.exports = router;
