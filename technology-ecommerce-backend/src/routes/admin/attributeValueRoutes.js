const express = require("express");

const router = express.Router();

const attributeValueController = require("../../controllers/admin/attributeValueController");

const {
  authenticate,
  authorizePermission,
} = require("../../middleware/authMiddleware");

router.get(
  "/",
  authenticate,
  authorizePermission("manage_products"),
  attributeValueController.getAttributeValues,
);
router.post(
  "/",
  authenticate,
  authorizePermission("manage_products"),
  attributeValueController.createAttributeValue,
);
router.put(
  "/:id",
  authenticate,
  authorizePermission("manage_products"),
  attributeValueController.updateAttributeValue,
);
router.patch(
  "/:id/status",
  authenticate,
  authorizePermission("manage_products"),
  attributeValueController.updateStatus,
);
module.exports = router;
