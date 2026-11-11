const express = require("express");
const upload = require("../../middleware/upload");
const {
  getAllEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  updateEmployeeStatus,
  getAllRoles,
  getShippers,
} = require("../../controllers/admin/employeeController");
const {
  authenticate,
  authorizePermission,
} = require("../../middleware/authMiddleware");
const router = express.Router();

// Lấy danh sách role
router.get("/roles", getAllRoles);

// Lấy tất cả nhân viên
router.get(
  "/",
  authenticate,
  authorizePermission("manage_employees"),
  getAllEmployees,
);
router.get("/ship", getShippers);

router.get(
  "/:id",
  authenticate,
  getEmployeeById,
);

router.post(
  "/",
  authenticate,
  authorizePermission("manage_employees"),
  createEmployee,
);

router.put(
  "/:id",
  authenticate,
  upload.single("avatar"),
  updateEmployee,
);

router.patch(
  "/:id/status",
  authenticate,
  authorizePermission("manage_employees"),
  updateEmployeeStatus,
);

module.exports = router;
