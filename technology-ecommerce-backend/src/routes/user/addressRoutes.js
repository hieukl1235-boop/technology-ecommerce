// routes/addressRoutes.js
const express = require("express");
const router = express.Router();
const AddressController = require("../../controllers/user/addressController");
const authMiddleware = require("../../middleware/authMiddleware");

// Định nghĩa các endpoint (đã gắn vào tiền tố /api/user/addresses)
router.get(
  "/",
  authMiddleware.authenticateUser,
  AddressController.getAddresses,
);
router.post("/", authMiddleware.authenticateUser, AddressController.addAddress);
router.delete(
  "/:id",
  authMiddleware.authenticateUser,
  AddressController.removeAddress,
);

module.exports = router;
