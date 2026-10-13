const Address = require("../../models/address");

const AddressController = {
  // Lấy danh sách địa chỉ
  async getAddresses(req, res) {
    try {
      const userId = req.user.id; // Lấy từ token đăng nhập (giả lập ID = 1 nếu test)
      const addresses = await Address.getAddressesByUserId(userId);
      res.json({ success: true, addresses });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Lỗi server khi tải địa chỉ",
        error: error.message,
      });
    }
  },

  // Thêm địa chỉ mới
  async addAddress(req, res) {
    try {
      const userId = req.user?.id || 1;
      const {
        recipient_name,
        phone,
        province,
        district,
        ward,
        specific_address,
      } = req.body;

      // Kiểm tra dữ liệu đầu vào cơ bản
      if (
        !recipient_name ||
        !phone ||
        !province ||
        !district ||
        !ward ||
        !specific_address
      ) {
        return res.status(400).json({
          success: false,
          message: "Vui lòng điền đầy đủ thông tin địa chỉ!",
        });
      }

      const newAddress = await Address.createAddress(
        userId,
        recipient_name,
        phone,
        province,
        district,
        ward,
        specific_address,
      );
      res.status(201).json({
        success: true,
        message: "Thêm địa chỉ thành công",
        address: newAddress,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Lỗi server khi thêm địa chỉ",
        error: error.message,
      });
    }
  },

  // Xóa địa chỉ
  async removeAddress(req, res) {
    try {
      const userId = req.user.id;
      const addressId = req.params.id;
      console.log("Đang xóa địa chỉ ID:", addressId, "của User ID:", userId);
      const rowCount = await Address.deleteAddress(addressId, userId);
      if (rowCount == 0) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy địa chỉ hoặc không có quyền xóa!",
        });
      }

      res.json({ success: true, message: "Xóa địa chỉ thành công" });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Lỗi server khi xóa địa chỉ",
        error: error.message,
      });
    }
  },
};

module.exports = AddressController;
