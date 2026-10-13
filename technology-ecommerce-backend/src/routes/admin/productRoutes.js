const express = require("express");

const router = express.Router();

const productController = require("../../controllers/admin/productController");
const variantController = require("../../controllers/admin/variantController");
const {
  authenticate,
  authorizePermission,
} = require("../../middleware/authMiddleware");

const upload = require("../../middleware/upload");

router.get(
  "/",
  authenticate,
  authorizePermission("manage_products"),
  productController.getProducts,
);
router.get(
  "/variants",
  authenticate,
  authorizePermission("manage_products"),
  variantController.getVariants,
);
router.post(
  "/",
  authenticate,
  authorizePermission("manage_products"),

  upload.fields([
    {
      name: "main_image",
      maxCount: 1,
    },
    {
      name: "variant_images",
      maxCount: 20,
    },
    { name: "gallery_images", maxCount: 10 }, // 👈 thêm
  ]),

  productController.createProduct,
);
// Route lấy chi tiết sản phẩm để đổ lên form edit (Đã có sẵn)
router.get(
  "/:id",
  authenticate,
  authorizePermission("manage_products"),
  productController.getProductById,
);

// 👇 BẠN PHẢI MỞ COMMENT ĐOẠN NÀY RA THÌ NÚT CẬP NHẬT Ở VUE MỚI HOẠT ĐỘNG ĐƯỢC!
router.put(
  "/:id",
  authenticate,
  authorizePermission("manage_products"),
  upload.fields([
    {
      name: "main_image",
      maxCount: 1,
    },
    {
      name: "variant_images",
      maxCount: 20,
    },
    { name: "gallery_images", maxCount: 10 }, // 👈 thêm dòng này
  ]),
  productController.updateProduct,
);

router.patch(
  "/:id/status",
  authenticate,
  authorizePermission("manage_products"),
  productController.updateStatus,
);

module.exports = router;
