const express = require("express");

const router = express.Router();
const authMiddleware = require("../../middleware/authMiddleware");

const {
  getProfile,
  updateProfile,
  getMyOrders,
  submitReview,
} = require("../../controllers/user/accountController");
const upload = require("../../middleware/upload")

router.get("/profile", authMiddleware.authenticateUser, getProfile);
router.post("/profile", authMiddleware.authenticateUser, updateProfile);
router.get("/orders", authMiddleware.authenticateUser, getMyOrders);
router.post(
  "/reviews",
  authMiddleware.authenticateUser,

  upload.fields(
    [{
    name: "images_review",
    maxCount: 5,
  }]),
  submitReview,
);
module.exports = router;