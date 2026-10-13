const express = require("express");

const router = express.Router();

const attributeController = require("../../controllers/admin/attributeController");

const {
  authenticate,
  authorizePermission,
} = require("../../middleware/authMiddleware");

router.get(
  "/",
  authenticate,
  authorizePermission("manage_products"),
  attributeController.getAttributes,
);
router.post(
  "/",
  authenticate,
  authorizePermission("manage_products"),
  attributeController.createAttribute,
);
router.put(
  "/:id",
  authenticate,
  authorizePermission("manage_products"),
  attributeController.updateAttribute,
);
router.patch(
  "/:id/status",
  authenticate,
  authorizePermission("manage_products"),
  attributeController.updateStatus,
);
module.exports = router;
