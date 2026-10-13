const User = require("../../models/User");

// [GET] /api/admin/users
// Lấy danh sách người dùng
const getAllUsers = async (req, res) => {
  try {
    const users = await User.getAll();

    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({
      message: "Lỗi lấy danh sách người dùng",
      error: error.message,
    });
  }
};

// [GET] /api/admin/users/:id
// Lấy thông tin một người dùng
const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.getById(id);

    if (!user) {
      return res.status(404).json({
        message: "Không tìm thấy người dùng",
      });
    }

    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({
      message: "Lỗi lấy thông tin người dùng",
      error: error.message,
    });
  }
};

// [PUT] /api/admin/users/:id
// Cập nhật thông tin người dùng
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;

    const { full_name, email, date_of_birth, gender } = req.body;

    // Kiểm tra người dùng có tồn tại không
    const user = await User.getById(id);

    if (!user) {
      return res.status(404).json({
        message: "Không tìm thấy người dùng",
      });
    }

    const updatedUser = await User.update(id, {
      full_name,
      email,
      date_of_birth: date_of_birth || null,
      gender,
    });

    res.status(200).json({
      message: "Cập nhật người dùng thành công",
      user: updatedUser,
    });
  } catch (error) {
    res.status(500).json({
      message: "Lỗi cập nhật người dùng",
      error: error.message,
    });
  }
};

// [PATCH] /api/admin/users/:id/status
// Khóa / mở tài khoản
const updateUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Kiểm tra status
    if (status !== 0 && status !== 1) {
      return res.status(400).json({
        message: "Trạng thái không hợp lệ",
      });
    }

    // Kiểm tra người dùng có tồn tại không
    const user = await User.getById(id);

    if (!user) {
      return res.status(404).json({
        message: "Không tìm thấy người dùng",
      });
    }

    const updatedUser = await User.updateStatus(id, status);

    res.status(200).json({
      message:
        status === 1
          ? "Đã mở tài khoản người dùng"
          : "Đã khóa tài khoản người dùng",
      user: updatedUser,
    });
  } catch (error) {
    res.status(500).json({
      message: "Lỗi cập nhật trạng thái người dùng",
      error: error.message,
    });
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  updateUser,
  updateUserStatus,
};
