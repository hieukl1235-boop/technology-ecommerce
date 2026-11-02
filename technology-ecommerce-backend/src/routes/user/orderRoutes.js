const express = require("express");
const router = express.Router();
const OrderController = require("../../controllers/user/orderController");
const authMiddleware = require("../../middleware/authMiddleware");

// Nếu bạn có middleware xác thực token (ví dụ: authenticateToken), hãy import vào đây:
// const authenticateToken = require('../middlewares/authMiddleware');

// POST /api/orders
// Nếu có middleware kiểm tra đăng nhập thì thêm vào giữa: router.post('/', authenticateToken, OrderController.placeOrder);
router.post("/", authMiddleware.authenticateUser,OrderController.placeOrder);
router.get("/vnpay_return", OrderController.vnpayReturn);
router.patch("/:orderCode/cancel",authMiddleware.authenticateUser, OrderController.cancelMyOrder);
router.get("/:orderCode", authMiddleware.authenticateUser, OrderController.getOrderDetail);
router.get("/:orderCode/getVariant", OrderController.getVariant);
module.exports = router;
