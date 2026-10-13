const express = require("express");

const router = express.Router();

const brandController = require("../../controllers/admin/brandController");

const {
    authenticate,
    authorizePermission
} = require("../../middleware/authMiddleware");


// Lấy danh sách
router.get(
    "/",
    brandController.getBrands
);


// Thêm
router.post(
    "/",
    authenticate,
    authorizePermission("manage_brands"),
    brandController.createBrand
);


// Cập nhật
router.put(
    "/:id",
    authenticate,
    authorizePermission("manage_brands"),
    brandController.updateBrand
);


// Khóa / mở khóa
router.patch(
    "/:id/status",
    authenticate,
    authorizePermission("manage_brands"),
    brandController.updateStatus
);


module.exports = router;
