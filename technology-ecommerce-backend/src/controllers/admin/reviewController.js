const review = require('../../models/Review ');

const getAllReviews = async (req, res) => {
  try {
    const reviews = await review.getAllReviews();
    res.status(200).json(reviews);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

const replyToReview = async (req, res) => {
  const { id } = req.params;
  const { replyContent } = req.body;

  try {
    if (!replyContent || !replyContent.trim()) {
      return res.status(400).json({
        message: "Nội dung phản hồi không được để trống",
      });
    }

    const updatedReview = await review.replyToReview(id, replyContent.trim());

    if (!updatedReview) {
      return res.status(404).json({
        message: "Không tìm thấy đánh giá",
      });
    }

    res.status(200).json({
      message: "Phản hồi đánh giá thành công",
      review: updatedReview,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Lỗi server" });
  }
};

const deleteReply = async (req, res) => {
  const { id } = req.params;
  try {
    const deletedReview = await review.deleteReply(id);
    res.status(200).json({
      message: "Xóa phản hồi đánh giá thành công",
      review: deletedReview,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Lỗi server" });
  }
}

module.exports = {
  getAllReviews,
  replyToReview,
  deleteReply,
};