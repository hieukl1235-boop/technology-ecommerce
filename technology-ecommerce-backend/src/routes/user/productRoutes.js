const express = require("express");
const router = express.Router();
const productController = require("../../controllers/user/productControlller");
const authMiddleware = require("../../middleware/authMiddleware");
const productDetailControlle = require("../../controllers/user/Productdetailcontroller"); 
router.get("/", productController.filterProducts);
router.get("/products/:id/detail", productDetailControlle.getProductDetail);
router.get("/products/:id/reviews", productDetailControlle.getProductReviews);
router.delete(
  "/reviews/:id",
  authMiddleware.authenticateUser,
  productDetailControlle.deleteReview,
);

module.exports = router;