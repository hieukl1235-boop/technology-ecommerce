const express = require("express");

const router = express.Router();

const {
  addToCart,
  getCartByUserId,
  updateQuantityByCartItem,
  removeCartItem,
} = require("../../controllers/user/cartController");

const authMiddleware = require("../../middleware/authMiddleware");

router.post("/", authMiddleware.authenticateUser, addToCart);
router.get("/", authMiddleware.authenticateUser, getCartByUserId);
router.patch(
  "/updateQuantity",
  authMiddleware.authenticateUser,
  updateQuantityByCartItem,
);
router.delete("/removeItem", authMiddleware.authenticateUser, removeCartItem);
module.exports = router;
