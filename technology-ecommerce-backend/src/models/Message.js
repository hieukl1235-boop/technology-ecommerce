const pool = require("../config/db");

class Message {
  // Lưu tin nhắn vào database
  static async create(conversationId, senderId, senderType, content) {
    const result = await pool.query(
      `INSERT INTO messages
         (conversation_id, sender_id, sender_type, content)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
      [conversationId, senderId, senderType, content],
    );

    return result.rows[0];
  }

  // Lấy lịch sử tin nhắn
  static async getByConversation(conversationId) {
    const result = await pool.query(
      `SELECT *
       FROM messages
       WHERE conversation_id = $1
       ORDER BY id ASC`,
      [conversationId],
    );

    return result.rows;
  }
}

module.exports = Message;
