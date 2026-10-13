const express = require("express");
const router = express.Router();
const productVariantController = require("../../controllers/user/productVariantController");

router.get("/:productId", productVariantController.getVariantsByProductId);
router.get("/:id/variants", productVariantController.getVariantById);
module.exports = router;