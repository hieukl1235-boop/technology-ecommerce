const pool = require("../config/db");

class Conversation {
  // Tạo cuộc trò chuyện mới
  static async create(userId, title = "Hỗ trợ khách hàng") {
    const result = await pool.query(
      `INSERT INTO conversations (user_id, title, status)
       VALUES ($1, $2, 1)
       RETURNING *`,
      [userId, title],
    );

    return result.rows[0];
  }

  // Tìm cuộc trò chuyện chưa đóng của khách hàng
  static async findActiveByUser(userId) {
    const result = await pool.query(
      `SELECT *
       FROM conversations
       WHERE user_id = $1
         AND status <> 0
       ORDER BY id DESC
       LIMIT 1`,
      [userId],
    );

    return result.rows[0];
  }

  // Lấy danh sách cuộc trò chuyện của khách hàng
  static async getByUser(userId) {
    const result = await pool.query(
      `SELECT *
       FROM conversations
       WHERE user_id = $1
       ORDER BY id DESC`,
      [userId],
    );

    return result.rows;
  }

  // Lấy cuộc trò chuyện đang chờ hoặc do nhân viên này phụ trách
  static async getForEmployee(employeeId) {
    const result = await pool.query(
      `SELECT *
       FROM conversations
       WHERE status <> 0
         AND (employee_id IS NULL OR employee_id = $1)
       ORDER BY id DESC`,
      [employeeId],
    );

    return result.rows;
  }

  // Tìm cuộc trò chuyện theo ID
  static async findById(id) {
    const result = await pool.query(
      `SELECT *
       FROM conversations
       WHERE id = $1`,
      [id],
    );

    return result.rows[0];
  }

  // Nhân viên nhận xử lý cuộc trò chuyện
  static async assignEmployee(conversationId, employeeId) {
    const result = await pool.query(
      `UPDATE conversations
       SET employee_id = $2,
           status = 2
       WHERE id = $1
         AND status = 1
         AND employee_id IS NULL
       RETURNING *`,
      [conversationId, employeeId],
    );

    return result.rows[0];
  }

  // Đóng cuộc trò chuyện
  static async close(conversationId) {
    const result = await pool.query(
      `UPDATE conversations
       SET status = 0
       WHERE id = $1
       RETURNING *`,
      [conversationId],
    );

    return result.rows[0];
  }
}

module.exports = Conversation;
