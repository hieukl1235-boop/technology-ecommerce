const express = require("express");
const router = express.Router();
const productController = require("../../controllers/user/productControlller");
const authMiddleware = require("../../middleware/authMiddleware");
const productDetailController = require("../../controllers/user/Productdetailcontroller")
router.get("/", productController.filterProducts);
router.get("/products/:id/detail", productDetailController.getProductDetail);
router.get("/products/:id/reviews", productDetailController.getProductReviews);
router.delete(
  "/reviews/:id",
  authMiddleware.authenticateUser,
  productDetailController.deleteReview,
);
router.get("/:id", productController.getProductById);

module.exports = router;