const express = require("express");
const router = express.Router();
const PaymentController = require("../../controllers/user/paymentController");

router.get("/", PaymentController.getPaymentMethods);

module.exports = router;
