const express = require("express");

const router = express.Router();

const categoryController =require("../../controllers/admin/categoryController");

const {
    authenticate,
    authorizePermission
} = require("../../middleware/authMiddleware");


// Lấy danh sách
router.get(
    "/",
    categoryController.getCategories
);


// Thêm
router.post(
    "/",
    authenticate,
    authorizePermission("manage_categories"),
    categoryController.createCategory
);


// Sửa
router.put(
    "/:id",
    authenticate,
    authorizePermission("manage_categories"),
    categoryController.updateCategory
);


// Khóa / mở khóa
router.patch(
    "/:id/status",
    authenticate,
    authorizePermission("manage_categories"),
    categoryController.updateStatus
);


module.exports = router;
