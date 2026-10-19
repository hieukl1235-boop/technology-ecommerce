const pool = require("../config/db");

const Notification = {
  // 1. Tạo thông báo (Dùng chung cho cả tự động cập nhật đơn hàng & admin tạo thủ công)
  async createNotification(
    userId,
    title,
    content,
    type = "order",
    referenceId = null,
  ) {
    const query = `
      INSERT INTO notifications (user_id, title, content, type, reference_id, is_read, created_at)
      VALUES ($1, $2, $3, $4, $5, FALSE, NOW())
      RETURNING *;
    `;
    const result = await pool.query(query, [
      userId,
      title,
      content,
      type,
      referenceId,
    ]);
    return result.rows[0];
  },

  // 2. Lấy danh sách thông báo của user (bao gồm thông báo riêng và thông báo broadcast chung user_id = 0)
  async getNotificationsByUser(userId) {
    const query = `
      SELECT * FROM notifications 
      WHERE user_id = $1 OR user_id = 0 
      ORDER BY created_at DESC 
      LIMIT 30;
    `;
    const result = await pool.query(query, [userId]);
    return result.rows;
  },

  // 3. Đánh dấu một thông báo là đã đọc
  async markAsRead(notificationId) {
    const query = `
      UPDATE notifications 
      SET is_read = TRUE 
      WHERE id = $1 
      RETURNING *;
    `;
    const result = await pool.query(query, [notificationId]);
    return result.rows[0];
  },

  // 4. Đánh dấu tất cả là đã đọc
  async markAllAsRead(userId) {
    const query = `
      UPDATE notifications 
      SET is_read = TRUE 
      WHERE (user_id = $1 OR user_id = 0) AND is_read = FALSE;
    `;
    const result = await pool.query(query, [userId]);
    return result.rowCount;
  },
};

module.exports = Notification;
