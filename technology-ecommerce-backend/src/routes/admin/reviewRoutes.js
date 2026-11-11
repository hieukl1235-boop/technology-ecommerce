const express = require("express");
const router = express.Router();
const {
  getAllReviews,
  replyToReview,
  deleteReply,
} = require("../../controllers/admin/reviewController");

// Lấy danh sách tất cả đánh giá
router.get("/", getAllReviews);
router.post("/:id/reply", replyToReview);
router.patch("/deleteReply/:id", deleteReply);

module.exports = router;