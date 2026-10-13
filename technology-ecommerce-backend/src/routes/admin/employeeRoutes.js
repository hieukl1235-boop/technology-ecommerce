const express = require("express");

const {
  getAllEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  updateEmployeeStatus,
  getAllRoles,
  getShippers,
} = require("../../controllers/admin/employeeController");

const router = express.Router();

// Lấy danh sách role
// Đặt trước /:id
router.get("/roles", getAllRoles);

// Lấy tất cả nhân viên
router.get("/", getAllEmployees);
router.get("/ship", getShippers);


// Lấy một nhân viên
router.get("/:id", getEmployeeById);

// Tạo nhân viên + cấp tài khoản
router.post("/", createEmployee);

// Cập nhật nhân viên
router.put("/:id", updateEmployee);

// Khóa / mở tài khoản
router.patch("/:id/status", updateEmployeeStatus);

module.exports = router;
