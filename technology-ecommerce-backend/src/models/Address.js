// models/addressModel.js
const pool = require("../config/db"); // File cấu hình kết nối PostgreSQL của bạn

const AddressModel = {
  // 1. Lấy danh sách địa chỉ của một user dựa vào user_id
  async getAddressesByUserId(userId) {
    const query =
      "SELECT * FROM user_addresses WHERE user_id = $1 ORDER BY id DESC";
    const result = await pool.query(query, [userId]);
    return result.rows; // Trả về mảng các địa chỉ
  },

  // 2. Thêm địa chỉ mới vào bảng addresses
  async createAddress(
    userId,
    recipient_name,
    phone,
    province,
    district,
    ward,
    specific_address,
  ) {
    const query = `
      INSERT INTO user_addresses (user_id, recipient_name, phone, province, district, ward, specific_address) 
      VALUES ($1, $2, $3, $4, $5, $6, $7) 
      RETURNING *
    `;
    const values = [
      userId,
      recipient_name,
      phone,
      province,
      district,
      ward,
      specific_address,
    ];
    const result = await pool.query(query, values);
    return result.rows[0]; // Trả về dòng dữ liệu vừa được thêm vào
  },

  // 3. Xóa địa chỉ theo id và kiểm tra đúng user sở hữu
  async deleteAddress(addressId, userId) {
    const query = "DELETE FROM user_addresses WHERE id = $1 AND user_id = $2";
    const result = await pool.query(query, [addressId, userId]);
    return result.rowCount; // Trả về số dòng bị xóa (nếu > 0 là xóa thành công)
  },
};

module.exports = AddressModel;
