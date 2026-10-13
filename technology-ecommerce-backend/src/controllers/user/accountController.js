const User = require('../../models/User');

const getProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.getUserByUserId(userId);

    if (!user) {
        return res.status(404).json({
            message: 'Người dùng không tồn tại',
        });
    }
    res.status(200).json({
        message: 'Lấy thông tin người dùng thành công',
        user: user,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
        message: 'Lỗi server',
    });
  }
};

const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { full_name,date_of_birth, gender } = req.body;
    const updatedUser = await User.updateUserProfile(userId, full_name, date_of_birth, gender);
    res.status(200).json({
      message: "Cập nhật thông tin người dùng thành công",
      user: updatedUser,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Lỗi server",
    });
  }
};

const getMyOrders = async  (req, res) => {
  try {
    // req.user được gán từ middleware xác thực token (JWT)
    const userId = req.user.id || req.user.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Không tìm thấy thông tin định danh người dùng từ token.",
      });
    }

    const orders = await User.getOrdersByUserId(userId);

    return res.status(200).json({
      success: true,
      orders: orders,
    });
  } catch (error) {
    console.error("Lỗi lấy lịch sử đơn hàng của khách hàng:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi server khi tải lịch sử đơn hàng.",
    });
  }
};

const  submitReview =async (req, res)=> {
    try {
      const userId = req.user.id || req.user.userId;
      const { variant_id, rating, title, content } = req.body;
      
      // Lấy danh sách tên file ảnh nếu client upload qua multer (req.files)
      let imageUrls = [];
      if (
        req.files &&
        req.files.images_review &&
        req.files.images_review.length > 0
      ) {
        imageUrls = req.files.images_review.map((file) => file.filename);
      }

      if (!variant_id || !rating) {
        return res.status(400).json({ success: false, message: "Thiếu thông tin biến thể hoặc số sao đánh giá." });
      }

      await User.createReview(
        userId,
        variant_id,
        rating,
        title,
        content,
        imageUrls,
      );

      return res.status(200).json({
        success: true,
        message: "Gửi đánh giá thành công!"
      });
    } catch (error) {
      console.error("Lỗi gửi đánh giá:", error);
      return res.status(500).json({ success: false, message: "Lỗi server khi gửi đánh giá." });
    }
  }

module.exports = {
  getProfile,
  updateProfile,
  getMyOrders,
  submitReview,
};